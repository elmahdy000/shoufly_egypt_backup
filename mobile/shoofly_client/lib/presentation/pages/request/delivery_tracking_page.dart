import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/presentation/blocs/tracking/tracking_bloc.dart';
import 'package:shoofly_core/core/di/injection.dart';
import 'package:url_launcher/url_launcher.dart';
import '../discover/cubit/requests_map_cubit.dart' show kTalabatMapStyle;

class DeliveryTrackingPage extends StatefulWidget {
  final Request request;
  const DeliveryTrackingPage({super.key, required this.request});

  @override
  State<DeliveryTrackingPage> createState() => _DeliveryTrackingPageState();
}

class _DeliveryTrackingPageState extends State<DeliveryTrackingPage>
    with SingleTickerProviderStateMixin {
  final Completer<GoogleMapController> _controller = Completer();

  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};

  // Pulse animation for the delivery agent marker
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _onMapCreated(GoogleMapController controller) async {
    if (!_controller.isCompleted) {
      _controller.complete(controller);
    }
  }

  void _updateMapElements(LatLng deliveryPos, LatLng destinationPos) {
    setState(() {
      _markers = {
        // Destination — orange pin (where the client is)
        Marker(
          markerId: const MarkerId('destination'),
          position: destinationPos,
          infoWindow: const InfoWindow(title: 'موقع التسليم'),
          icon: BitmapDescriptor.defaultMarkerWithHue(20), // warm orange
        ),
        // Rider — blue pin
        Marker(
          markerId: const MarkerId('delivery'),
          position: deliveryPos,
          infoWindow: const InfoWindow(title: 'المندوب'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
      };
    });

    _fetchRoutePolylines(deliveryPos, destinationPos);
    _moveCameraToFitBoth(deliveryPos, destinationPos);
  }

  Future<void> _fetchRoutePolylines(LatLng deliveryPos, LatLng destinationPos) async {
    const String apiKey = 'AIzaSyDN-UrO0TkaBjN75hsU31yW6746o5nPsfk';
    final url = 'https://maps.googleapis.com/maps/api/directions/json'
        '?origin=${deliveryPos.latitude},${deliveryPos.longitude}'
        '&destination=${destinationPos.latitude},${destinationPos.longitude}'
        '&key=$apiKey';

    try {
      final dio = Dio();
      final response = await dio.get(url);
      if (response.statusCode == 200 && response.data != null) {
        final routes = response.data['routes'] as List;
        if (routes.isNotEmpty) {
          final pointsStr = routes[0]['overview_polyline']['points'] as String;
          final decodedPoints = _decodePolyline(pointsStr);
          
          if (mounted) {
            setState(() {
              _polylines = {
                Polyline(
                  polylineId: const PolylineId('route'),
                  points: decodedPoints,
                  color: AppColors.primary,
                  width: 5,
                ),
              };
            });
            return;
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching directions: $e');
    }

    // Fallback to straight dashed line if request fails
    if (mounted) {
      setState(() {
        _polylines = {
          Polyline(
            polylineId: const PolylineId('route'),
            points: [deliveryPos, destinationPos],
            color: AppColors.primary,
            width: 4,
            patterns: [
              PatternItem.dash(20),
              PatternItem.gap(8),
            ],
          ),
        };
      });
    }
  }

  List<LatLng> _decodePolyline(String encoded) {
    List<LatLng> points = [];
    int index = 0, len = encoded.length;
    int lat = 0, lng = 0;

    while (index < len) {
      int b, shift = 0, result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.add(LatLng(lat / 1E5, lng / 1E5));
    }
    return points;
  }

  Future<void> _moveCameraToFitBoth(LatLng a, LatLng b) async {
    if (!_controller.isCompleted) return;
    final ctrl = await _controller.future;
    final bounds = LatLngBounds(
      southwest: LatLng(
        a.latitude < b.latitude ? a.latitude : b.latitude,
        a.longitude < b.longitude ? a.longitude : b.longitude,
      ),
      northeast: LatLng(
        a.latitude > b.latitude ? a.latitude : b.latitude,
        a.longitude > b.longitude ? a.longitude : b.longitude,
      ),
    );
    ctrl.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 100),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Immersive — transparent status bar like Talabat
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));

    final destination = LatLng(
      widget.request.latitude ?? 30.0444,
      widget.request.longitude ?? 31.2357,
    );

    return BlocProvider(
      create: (context) =>
          sl<TrackingBloc>()..add(StartTracking(widget.request.id)),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          backgroundColor: Colors.white,
          body: BlocConsumer<TrackingBloc, TrackingState>(
            listener: (context, state) {
              if (state is TrackingActive) {
                _updateMapElements(
                  LatLng(
                    state.currentTracking.latitude,
                    state.currentTracking.longitude,
                  ),
                  destination,
                );
              }
            },
            builder: (context, state) {
              return Stack(
                children: [
                  // ── Full-screen map ──────────────────────────────────
                  Positioned.fill(
                    child: GoogleMap(
                      style: kTalabatMapStyle,
                      initialCameraPosition: CameraPosition(
                        target: destination,
                        zoom: 14,
                      ),
                      onMapCreated: _onMapCreated,
                      markers: _markers,
                      polylines: _polylines,
                      myLocationEnabled: true,
                      myLocationButtonEnabled: false,
                      zoomControlsEnabled: false,
                      mapToolbarEnabled: false,
                      compassEnabled: false,
                      rotateGesturesEnabled: false,
                      tiltGesturesEnabled: false,
                      // Leave room for the bottom card
                      padding: EdgeInsets.only(
                        bottom: MediaQuery.of(context).size.height * 0.38,
                      ),
                    ),
                  ),

                  // ── Loading shimmer overlay ──────────────────────────
                  if (state is TrackingLoading)
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 72,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 16,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'جاري تحديد موقع المندوب...',
                                style: AppTypography.labelSmall.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // ── Floating back button ─────────────────────────────
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      child: Row(
                        children: [
                          _TrackingCircleButton(
                            icon: Icons.arrow_back_ios_new_rounded,
                            onTap: () => Navigator.pop(context),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AnimatedBuilder(
                                  animation: _pulseAnim,
                                  builder: (_, __) => Transform.scale(
                                    scale: _pulseAnim.value,
                                    child: Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(
                                        color: AppColors.success,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'تتبع مباشر',
                                  style: AppTypography.labelSmall.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Bottom tracking card ─────────────────────────────
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: _TrackingBottomCard(
                      state: state,
                      request: widget.request,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

// ── Bottom Card ───────────────────────────────────────────────────────────────

class _TrackingBottomCard extends StatelessWidget {
  const _TrackingBottomCard({
    required this.state,
    required this.request,
  });

  final TrackingState state;
  final Request request;

  String get _statusText {
    if (state is TrackingActive) {
      return _mapStatusLabel((state as TrackingActive).currentTracking.status);
    }
    return 'جاري تحديد موقع المندوب...';
  }

  String get _eta {
    if (state is TrackingActive) return 'الوصول خلال ~12 دقيقة';
    return 'جاري حساب الوقت...';
  }

  double get _progressValue {
    if (state is! TrackingActive) return 0.0;
    switch ((state as TrackingActive).currentTracking.status) {
      case 'ORDER_PLACED': return 0.15;
      case 'VENDOR_PREPARING': return 0.30;
      case 'READY_FOR_PICKUP': return 0.50;
      case 'OUT_FOR_DELIVERY': return 0.65;
      case 'IN_TRANSIT': return 0.80;
      case 'DELIVERED': return 1.0;
      default: return 0.4;
    }
  }

  static String _mapStatusLabel(String status) {
    switch (status) {
      case 'ORDER_PLACED': return 'تم استلام الطلب';
      case 'VENDOR_PREPARING': return 'المورد يجهز طلبك';
      case 'READY_FOR_PICKUP': return 'الطلب جاهز للاستلام';
      case 'OUT_FOR_DELIVERY': return 'المندوب استلم طلبك';
      case 'IN_TRANSIT': return 'المندوب في الطريق إليك';
      case 'DELIVERED': return 'تم التسليم بنجاح 🎉';
      default: return 'المندوب قادم';
    }
  }

  @override
  Widget build(BuildContext context) {
    final riderName =
        request.deliveryAgent?.fullName ?? 'مندوب شوفلي';
    final riderPhone = request.deliveryAgent?.phone ?? '';
    final isDelivered = state is TrackingActive &&
        (state as TrackingActive).currentTracking.status == 'DELIVERED';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 24,
            offset: Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0E0E0),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // ── Rider row ───────────────────────────────────────────
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: isDelivered
                          ? AppColors.success.withValues(alpha: 0.1)
                          : AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isDelivered ? Icons.check_circle_rounded : LucideIcons.truck,
                      color: isDelivered ? AppColors.success : AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _statusText,
                          style: AppTypography.labelLarge.copyWith(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _eta,
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (riderPhone.isNotEmpty)
                    _TrackingCircleButton(
                      icon: LucideIcons.phone,
                      color: AppColors.success.withValues(alpha: 0.12),
                      iconColor: AppColors.success,
                      onTap: () => launchUrl(Uri.parse('tel:$riderPhone')),
                    ),
                ],
              ),

              const SizedBox(height: 18),

              // ── Progress bar ─────────────────────────────────────────
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: _progressValue,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFF0F0F0),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDelivered ? AppColors.success : AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    riderName,
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'طلب #${request.id}',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.textDisabled,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(height: 1, color: Color(0xFFF0F0F0)),
              const SizedBox(height: 14),

              // ── Delivery address ─────────────────────────────────────
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      LucideIcons.mapPin,
                      color: AppColors.primary,
                      size: 17,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'عنوان التسليم',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          request.address ?? 'الموقع المحدد على الخريطة',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Reusable floating circle button ──────────────────────────────────────────

class _TrackingCircleButton extends StatelessWidget {
  const _TrackingCircleButton({
    required this.icon,
    required this.onTap,
    this.color = Colors.white,
    this.iconColor = AppColors.textPrimary,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: color == Colors.white ? 6 : 0,
      shadowColor: Colors.black26,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(icon, color: iconColor, size: 20),
        ),
      ),
    );
  }
}
