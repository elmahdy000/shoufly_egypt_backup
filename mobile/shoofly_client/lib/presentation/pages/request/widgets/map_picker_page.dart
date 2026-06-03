import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart' as loc;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/data/models/location_model.dart';
import 'package:shoofly_core/presentation/blocs/location/location_bloc.dart';

class LocationResult {
  final double latitude;
  final double longitude;
  final String address;
  final GovernorateModel? governorate;
  final CityModel? city;

  LocationResult({
    required this.latitude,
    required this.longitude,
    required this.address,
    this.governorate,
    this.city,
  });
}

class MapPickerPage extends StatefulWidget {
  const MapPickerPage({super.key});

  @override
  State<MapPickerPage> createState() => _MapPickerPageState();
}

class _MapPickerPageState extends State<MapPickerPage>
    with SingleTickerProviderStateMixin {
  static const LatLng _cairoFallback = LatLng(30.0444, 31.2357);

  // Talabat-style clean bright map
  static const String _talabatMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#f8f8f8"}]},
  {"elementType":"labels.icon","stylers":[{"visibility":"off"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"off"}]},
  {"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},
  {"featureType":"administrative.land_parcel","stylers":[{"visibility":"off"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},
  {"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#666666"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#e5f5e0"}]},
  {"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#ffffff"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#e0e0e0"}]},
  {"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},
  {"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"}]},
  {"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#ffd700","lightness":40}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#f0c040"}]},
  {"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},
  {"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#c8e6f5"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]}
]
''';

  final Completer<GoogleMapController> _controller = Completer();
  LatLng _selectedLocation = _cairoFallback;
  LatLng? _lastResolvedLocation;

  // Address parts — displayed separately like Talabat
  String _streetAddress = 'حرّك الخريطة لتحديد مكان التسليم';
  String _districtArea = '';

  bool _isLoadingLocation = true;
  bool _isResolvingAddress = false;
  bool _hasLocationPermission = false;
  bool _isCameraMoving = false;

  // Pin animation
  late AnimationController _pinAnimController;
  late Animation<double> _pinRiseAnim;
  late Animation<double> _shadowScaleAnim;

  Timer? _reverseGeocodeDebounce;

  GovernorateModel? _selectedGovernorate;
  CityModel? _selectedCity;
  String? _pendingGovernorateName;
  String? _pendingCityName;
  bool _hasManuallyChosenGovernorate = false;
  bool _hasManuallyChosenCity = false;

  // Bottom sheet expansion
  bool _sheetExpanded = false;

  @override
  void initState() {
    super.initState();

    _pinAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _pinRiseAnim = Tween<double>(begin: 0, end: -18).animate(
      CurvedAnimation(parent: _pinAnimController, curve: Curves.easeOut),
    );
    _shadowScaleAnim = Tween<double>(begin: 1, end: 0.5).animate(
      CurvedAnimation(parent: _pinAnimController, curve: Curves.easeOut),
    );

    context.read<LocationBloc>().add(LoadGovernorates());
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _reverseGeocodeDebounce?.cancel();
    _pinAnimController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    final location = loc.Location();
    try {
      var serviceEnabled = await location.serviceEnabled();
      if (!serviceEnabled) serviceEnabled = await location.requestService();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() {
          _isLoadingLocation = false;
          _streetAddress = 'حدد مكان التسليم على الخريطة';
        });
        return;
      }

      var perm = await location.hasPermission();
      if (perm == loc.PermissionStatus.denied) {
        perm = await location.requestPermission();
      }

      if (perm != loc.PermissionStatus.granted &&
          perm != loc.PermissionStatus.grantedLimited) {
        if (!mounted) return;
        setState(() {
          _hasLocationPermission = false;
          _isLoadingLocation = false;
          _streetAddress = 'حدد مكان التسليم يدوياً';
        });
        return;
      }

      final locationData = await location.getLocation().timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw Exception('timeout'),
      );

      final lat = locationData.latitude;
      final lng = locationData.longitude;
      if (lat == null || lng == null) throw Exception('null coordinates');

      final latLng = LatLng(lat, lng);
      if (!mounted) return;
      setState(() {
        _hasLocationPermission = true;
        _selectedLocation = latLng;
        _isLoadingLocation = false;
      });

      await _animateTo(latLng, zoom: 16);
      await _getAddressFromLatLng(latLng);
    } catch (e) {
      if (!mounted) return;
      debugPrint('Location error: $e');
      setState(() {
        _isLoadingLocation = false;
        _hasLocationPermission = false;
        _streetAddress = 'حدد مكان التسليم على الخريطة';
      });
    }
  }

  Future<void> _animateTo(LatLng latLng, {double zoom = 15}) async {
    if (!_controller.isCompleted) return;
    final ctrl = await _controller.future;
    await ctrl.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: latLng, zoom: zoom),
      ),
    );
  }

  Future<void> _getAddressFromLatLng(LatLng position) async {
    if (!mounted) return;
    setState(() => _isResolvingAddress = true);
    try {
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (!mounted) return;

      if (placemarks.isEmpty) {
        setState(() {
          _streetAddress = 'لم نتمكن من تحديد العنوان';
          _districtArea = '';
          _isResolvingAddress = false;
        });
        return;
      }

      final place = placemarks.first;

      // Street-level address (like Talabat's first line)
      final street = [place.street, place.name]
          .where((p) => p != null && p.trim().isNotEmpty)
          .map((p) => p!.trim())
          .toSet()
          .join('، ');

      // District/area (like Talabat's second line)
      final district = [
        place.subLocality,
        place.locality,
        place.administrativeArea,
      ]
          .where((p) => p != null && p.trim().isNotEmpty)
          .map((p) => p!.trim())
          .toSet()
          .join('، ');

      setState(() {
        _streetAddress =
            street.isNotEmpty ? street : district.isNotEmpty ? district : 'موقع محدد';
        _districtArea = district.isNotEmpty && street.isNotEmpty ? district : '';
        _isResolvingAddress = false;
      });
      _lastResolvedLocation = position;
      _autoSelectLocationFields(place);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _streetAddress = 'تعذر تحديد العنوان';
        _districtArea = '';
        _isResolvingAddress = false;
      });
    }
  }

  void _onCameraMove(CameraPosition position) {
    _selectedLocation = position.target;
    if (!_isCameraMoving) {
      setState(() => _isCameraMoving = true);
      _pinAnimController.forward();
    }
  }

  void _onCameraIdle() {
    _pinAnimController.reverse();
    setState(() => _isCameraMoving = false);

    _reverseGeocodeDebounce?.cancel();
    _reverseGeocodeDebounce = Timer(const Duration(milliseconds: 400), () {
      if (!mounted || _isSameCoordinate(_lastResolvedLocation, _selectedLocation)) {
        return;
      }
      _getAddressFromLatLng(_selectedLocation);
    });
  }

  bool _isSameCoordinate(LatLng? a, LatLng b) {
    if (a == null) return false;
    return (a.latitude - b.latitude).abs() < 0.00005 &&
        (a.longitude - b.longitude).abs() < 0.00005;
  }

  void _confirmLocation() {
    final fullAddress = _districtArea.isNotEmpty
        ? '$_streetAddress، $_districtArea'
        : _streetAddress;

    Navigator.pop(
      context,
      LocationResult(
        latitude: _selectedLocation.latitude,
        longitude: _selectedLocation.longitude,
        address: fullAddress,
        governorate: _selectedGovernorate,
        city: _selectedCity,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Transparent status bar so map bleeds through
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: BlocListener<LocationBloc, LocationState>(
        listener: (context, state) {
          _applyPendingGovernorateSelection(state);
          _applyPendingCitySelection(state);
        },
        child: Scaffold(
          backgroundColor: Colors.white,
          body: Stack(
            children: [
              // ── Full-screen Map ───────────────────────────────────────
              Positioned.fill(
                child: GoogleMap(
                  style: _talabatMapStyle,
                  initialCameraPosition: const CameraPosition(
                    target: _cairoFallback,
                    zoom: 13,
                  ),
                  onMapCreated: (ctrl) {
                    if (!_controller.isCompleted) _controller.complete(ctrl);
                  },
                  onCameraMove: _onCameraMove,
                  onCameraIdle: _onCameraIdle,
                  myLocationEnabled: _hasLocationPermission,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  mapToolbarEnabled: false,
                  compassEnabled: false,
                  rotateGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  padding: EdgeInsets.only(
                    bottom: MediaQuery.of(context).size.height * 0.36,
                  ),
                ),
              ),

              // ── Center Animated Pin ───────────────────────────────────
              Center(
                child: IgnorePointer(
                  child: AnimatedBuilder(
                    animation: _pinAnimController,
                    builder: (context, child) {
                      return Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Transform.translate(
                            offset: Offset(0, _pinRiseAnim.value),
                            child: _buildMapPin(),
                          ),
                          // Shadow under pin
                          Transform.scale(
                            scale: _shadowScaleAnim.value,
                            child: Container(
                              width: 12,
                              height: 6,
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.18),
                                borderRadius: const BorderRadius.all(
                                    Radius.elliptical(12, 6)),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),

              // ── Top Bar (back btn + label) ────────────────────────────
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Row(
                    children: [
                      // Back button
                      _FloatingCircleButton(
                        icon: Icons.arrow_back_ios_new_rounded,
                        onTap: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 12),
                      // Floating address search pill
                      Expanded(
                        child: _AddressSearchPill(
                          streetAddress: _streetAddress,
                          isResolving: _isResolvingAddress,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── GPS Locate Button ─────────────────────────────────────
              Positioned(
                bottom: MediaQuery.of(context).size.height * 0.37,
                right: 16,
                child: _FloatingCircleButton(
                  icon: LucideIcons.locateFixed,
                  onTap: _getCurrentLocation,
                  color: AppColors.primary,
                  iconColor: Colors.white,
                  size: 52,
                ),
              ),

              // ── Bottom Sheet ──────────────────────────────────────────
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: _BottomSheet(
                  streetAddress: _streetAddress,
                  districtArea: _districtArea,
                  isResolving: _isResolvingAddress,
                  canConfirm: !_isResolvingAddress &&
                      _streetAddress.isNotEmpty &&
                      _selectedGovernorate != null &&
                      _selectedCity != null,
                  selectedGovernorate: _selectedGovernorate,
                  selectedCity: _selectedCity,
                  onConfirm: _confirmLocation,
                  locationState: context.watch<LocationBloc>().state,
                  onGovernorateChanged: (gov) {
                    if (gov == null) return;
                    setState(() {
                      _hasManuallyChosenGovernorate = true;
                      _hasManuallyChosenCity = false;
                      _selectedGovernorate = gov;
                      _selectedCity = null;
                      _pendingGovernorateName = null;
                      _pendingCityName = null;
                    });
                    context.read<LocationBloc>().add(LoadCities(gov.id));
                  },
                  onCityChanged: (city) {
                    if (city == null) return;
                    setState(() {
                      _hasManuallyChosenCity = true;
                      _selectedCity = city;
                      _pendingCityName = null;
                    });
                  },
                ),
              ),

              // ── Loading overlay ───────────────────────────────────────
              if (_isLoadingLocation)
                const Positioned(
                  top: 100,
                  left: 0,
                  right: 0,
                  child: Center(child: _LoadingPill()),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMapPin() {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Pulse ring
        AnimatedBuilder(
          animation: _pinAnimController,
          builder: (context, _) {
            final show = _pinAnimController.value > 0.1;
            return AnimatedOpacity(
              opacity: show ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 150),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
              ),
            );
          },
        ),
        // Pin body
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                LucideIcons.mapPin,
                color: Colors.white,
                size: 22,
              ),
            ),
            // Triangle tip
            CustomPaint(
              size: const Size(16, 10),
              painter: _PinTipPainter(color: AppColors.primary),
            ),
          ],
        ),
      ],
    );
  }

  // ── Location auto-select helpers ────────────────────────────────────

  void _autoSelectLocationFields(Placemark place) {
    if (!_hasManuallyChosenGovernorate) {
      _pendingGovernorateName = place.administrativeArea;
    }
    if (!_hasManuallyChosenCity) {
      _pendingCityName =
          place.locality ?? place.subAdministrativeArea ?? place.subLocality;
    }
    final currentState = context.read<LocationBloc>().state;
    _applyPendingGovernorateSelection(currentState);
    _applyPendingCitySelection(currentState);
  }

  void _applyPendingGovernorateSelection(LocationState state) {
    if (_hasManuallyChosenGovernorate || _pendingGovernorateName == null) return;
    final normalized = _normalize(_pendingGovernorateName!);
    for (final gov in state.governorates) {
      final names = {
        _normalize(gov.name),
        _normalize(gov.nameAr ?? ''),
        ..._govAliases(gov),
      };
      if (names.contains(normalized)) {
        setState(() {
          _selectedGovernorate = gov;
          _selectedCity = null;
          _pendingGovernorateName = null;
        });
        context.read<LocationBloc>().add(LoadCities(gov.id));
        return;
      }
    }
  }

  void _applyPendingCitySelection(LocationState state) {
    if (_hasManuallyChosenCity || _pendingCityName == null || state.cities.isEmpty) {
      return;
    }
    final normalized = _normalize(_pendingCityName!);
    for (final city in state.cities) {
      final names = {
        _normalize(city.name),
        _normalize(city.nameAr ?? ''),
        ..._cityAliases(city),
      };
      if (names.contains(normalized)) {
        setState(() {
          _selectedCity = city;
          _pendingCityName = null;
        });
        return;
      }
    }
    if (_selectedGovernorate != null && state.cities.isNotEmpty) {
      setState(() {
        _selectedCity = state.cities.first;
        _pendingCityName = null;
      });
    }
  }

  String _normalize(String value) => value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'(governorate|city|محافظة|مدينة|ال)'), '')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();

  Set<String> _govAliases(GovernorateModel gov) {
    switch (_normalize(gov.nameAr ?? '')) {
      case 'قاهرة': return {'cairo', 'al qahirah'};
      case 'جيزة': return {'giza', 'gizeh'};
      case 'اسكندرية':
      case 'إسكندرية': return {'alexandria', 'alex'};
      default: return const {};
    }
  }

  Set<String> _cityAliases(CityModel city) {
    switch (_normalize(city.nameAr ?? '')) {
      case 'مدينة نصر': return {'nasr city', 'madinat nasr'};
      case 'مصر جديدة': return {'heliopolis'};
      case 'معادي': return {'maadi', 'el maadi'};
      case 'سادس من اكتوبر':
      case '6 اكتوبر': return {'6th of october', 'october'};
      default: return const {};
    }
  }
}

// ── Custom Widgets ────────────────────────────────────────────────────────────

class _PinTipPainter extends CustomPainter {
  final Color color;
  const _PinTipPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_PinTipPainter oldDelegate) => oldDelegate.color != color;
}

class _FloatingCircleButton extends StatelessWidget {
  const _FloatingCircleButton({
    required this.icon,
    required this.onTap,
    this.color = Colors.white,
    this.iconColor = AppColors.textPrimary,
    this.size = 44,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final Color iconColor;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: 6,
      shadowColor: Colors.black26,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(icon, color: iconColor, size: 20),
        ),
      ),
    );
  }
}

class _AddressSearchPill extends StatelessWidget {
  const _AddressSearchPill({
    required this.streetAddress,
    required this.isResolving,
  });

  final String streetAddress;
  final bool isResolving;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: 6,
      shadowColor: Colors.black.withValues(alpha: 0.15),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Icon(LucideIcons.search, size: 16, color: AppColors.primary),
            const SizedBox(width: 10),
            Expanded(
              child: isResolving
                  ? Row(
                      children: [
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'جاري التحديد...',
                          style: AppTypography.bodySmall
                              .copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    )
                  : Text(
                      streetAddress,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingPill extends StatelessWidget {
  const _LoadingPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
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
            'جاري تحديد موقعك...',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomSheet extends StatelessWidget {
  const _BottomSheet({
    required this.streetAddress,
    required this.districtArea,
    required this.isResolving,
    required this.canConfirm,
    required this.selectedGovernorate,
    required this.selectedCity,
    required this.onConfirm,
    required this.locationState,
    required this.onGovernorateChanged,
    required this.onCityChanged,
  });

  final String streetAddress;
  final String districtArea;
  final bool isResolving;
  final bool canConfirm;
  final GovernorateModel? selectedGovernorate;
  final CityModel? selectedCity;
  final VoidCallback onConfirm;
  final LocationState locationState;
  final ValueChanged<GovernorateModel?> onGovernorateChanged;
  final ValueChanged<CityModel?> onCityChanged;

  @override
  Widget build(BuildContext context) {
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
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
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

              // ── Address display (Talabat-style) ──────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.09),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.mapPin,
                      color: AppColors.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'عنوان التوصيل',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 3),
                        if (isResolving)
                          Row(
                            children: [
                              SizedBox(
                                width: 12,
                                height: 12,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'جاري تحديد العنوان...',
                                style: AppTypography.bodySmall
                                    .copyWith(color: AppColors.textDisabled),
                              ),
                            ],
                          )
                        else ...[
                          Text(
                            streetAddress,
                            style: AppTypography.labelLarge.copyWith(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (districtArea.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(
                              districtArea,
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),
              const Divider(height: 1, color: Color(0xFFF0F0F0)),
              const SizedBox(height: 16),

              // ── Governorate / City dropdowns ──────────────────────
              Row(
                children: [
                  Expanded(
                    child: _CompactDropdown<GovernorateModel>(
                      label: 'المحافظة',
                      value: selectedGovernorate,
                      items: locationState.governorates,
                      isLoading: locationState.isLoading &&
                          locationState.governorates.isEmpty,
                      getLabel: (g) => g.nameAr ?? g.name,
                      onChanged: onGovernorateChanged,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _CompactDropdown<CityModel>(
                      label: 'المدينة',
                      value: selectedCity,
                      items: locationState.cities,
                      isLoading: locationState.isLoading &&
                          selectedGovernorate != null &&
                          locationState.cities.isEmpty,
                      getLabel: (c) => c.nameAr ?? c.name,
                      onChanged:
                          selectedGovernorate == null ? null : onCityChanged,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // ── Confirm button ────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: canConfirm ? onConfirm : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    disabledBackgroundColor: AppColors.surfaceVariant,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: isResolving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (canConfirm) ...[
                              const Icon(LucideIcons.check,
                                  size: 20, color: Colors.white),
                              const SizedBox(width: 10),
                            ],
                            Text(
                              canConfirm
                                  ? 'تأكيد مكان التوصيل'
                                  : 'اختر المحافظة والمدينة',
                              style: AppTypography.labelLarge.copyWith(
                                color: canConfirm
                                    ? Colors.white
                                    : AppColors.textDisabled,
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CompactDropdown<T> extends StatelessWidget {
  const _CompactDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.getLabel,
    required this.isLoading,
    required this.onChanged,
  });

  final String label;
  final T? value;
  final List<T> items;
  final String Function(T) getLabel;
  final bool isLoading;
  final ValueChanged<T?>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value != null
              ? AppColors.primary.withValues(alpha: 0.4)
              : const Color(0xFFE8E8E8),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          isExpanded: true,
          value: items.contains(value) ? value : null,
          isDense: true,
          hint: Text(
            isLoading ? 'جاري...' : label,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textDisabled,
              fontSize: 14,
            ),
          ),
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          icon: Icon(
            LucideIcons.chevronDown,
            size: 14,
            color: value != null ? AppColors.primary : AppColors.textDisabled,
          ),
          items: items
              .map(
                (item) => DropdownMenuItem<T>(
                  value: item,
                  child: Text(
                    getLabel(item),
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(
                      fontSize: 15,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              )
              .toList(),
          onChanged: isLoading ? null : onChanged,
        ),
      ),
    );
  }
}
