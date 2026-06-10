import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import '../home/widgets/submit_bid_modal.dart';
import '../orders/vendor_order_details_page.dart';
import 'vendor_requests_map_cubit.dart';

class VendorRequestsMapPage extends StatelessWidget {
  const VendorRequestsMapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => VendorRequestsMapCubit()..loadRequests(),
      child: const VendorRequestsMapView(),
    );
  }
}

class VendorRequestsMapView extends StatelessWidget {
  const VendorRequestsMapView({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Stack(
          children: [
            // 1. Map Layer (StatefulWidget — stays alive across rebuilds)
            const _MapLayer(),

            // 2. Header Layer
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 20,
              right: 20,
              child: _buildHeader(context),
            ),

            // 3. Selection Layer (Preview Card)
            const Positioned(
              bottom: 40,
              left: 20,
              right: 20,
              child: _RequestPreviewOverlay(),
            ),

            // 4. Loading Overlay
            BlocBuilder<VendorRequestsMapCubit, VendorRequestsMapState>(
              buildWhen: (prev, curr) => prev.isLoading != curr.isLoading,
              builder: (context, state) {
                if (state.isLoading) {
                  return Container(
                    color: Colors.black.withOpacity(0.05),
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),

            // 5. No-coords fallback list button
            BlocBuilder<VendorRequestsMapCubit, VendorRequestsMapState>(
              buildWhen: (prev, curr) => prev.isLoading != curr.isLoading,
              builder: (context, state) {
                if (state.isLoading) return const SizedBox.shrink();
                if (state is VendorRequestsMapLoaded &&
                    state.allRequests.isNotEmpty &&
                    state.markers.isEmpty) {
                  return Positioned(
                    bottom: 40,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: _buildListFallbackButton(
                          context, state.allRequests),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: IconButton(
            icon: const Icon(LucideIcons.arrowRight, size: 22),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: BlocBuilder<VendorRequestsMapCubit, VendorRequestsMapState>(
              buildWhen: (prev, curr) =>
                  (prev is VendorRequestsMapLoaded) !=
                  (curr is VendorRequestsMapLoaded),
              builder: (context, state) {
                final count = state is VendorRequestsMapLoaded
                    ? state.allRequests.length
                    : 0;
                return Row(
                  children: [
                    const Icon(LucideIcons.mapPin,
                        size: 20, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Text(
                      count > 0
                          ? '$count طلب متاح في المنطقة'
                          : 'ابحث في الخريطة...',
                      style: AppTypography.bodySmall
                          .copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildListFallbackButton(
      BuildContext context, List<Request> requests) {
    return GestureDetector(
      onTap: () => _showRequestListSheet(context, requests),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.list, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Text(
              'عرض ${requests.length} طلب كقائمة',
              style: AppTypography.labelLarge.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRequestListSheet(BuildContext context, List<Request> requests) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<VendorRequestsMapCubit>(),
        child: _RequestListSheet(requests: requests),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// StatefulWidget: keeps GoogleMap alive across BLoC rebuilds
// ─────────────────────────────────────────────
class _MapLayer extends StatefulWidget {
  const _MapLayer();

  @override
  State<_MapLayer> createState() => _MapLayerState();
}

class _MapLayerState extends State<_MapLayer> {
  GoogleMapController? _controller;
  Set<Marker> _currentMarkers = {};
  static const _zagazig = LatLng(30.5877, 31.5020);
  LatLng _lastAnimatedLoc = _zagazig;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<VendorRequestsMapCubit, VendorRequestsMapState>(
      listenWhen: (prev, curr) =>
          prev.markers != curr.markers ||
          prev.currentLocation != curr.currentLocation,
      listener: (context, state) {
        // 🚀 Optimization: Update markers without recreating the map
        setState(() => _currentMarkers = state.markers);

        // 🚀 Optimization: Only animate camera if position changed significantly (> 50m approx)
        if (_controller != null && state.currentLocation != _zagazig) {
          final latDiff = (state.currentLocation.latitude - _lastAnimatedLoc.latitude).abs();
          final lngDiff = (state.currentLocation.longitude - _lastAnimatedLoc.longitude).abs();
          
          if (latDiff > 0.0005 || lngDiff > 0.0005) {
            _lastAnimatedLoc = state.currentLocation;
            _controller!.animateCamera(
              CameraUpdate.newLatLng(state.currentLocation),
            );
          }
        }
      },
      child: GoogleMap(
        initialCameraPosition: const CameraPosition(
          target: _zagazig,
          zoom: 12,
        ),
        markers: _currentMarkers,
        myLocationEnabled: true,
        myLocationButtonEnabled: false,
        zoomControlsEnabled: false,
        mapToolbarEnabled: false,
        onMapCreated: (controller) {
          _controller = controller;
          context.read<VendorRequestsMapCubit>().onMapCreated(controller);
        },
        onTap: (_) =>
            context.read<VendorRequestsMapCubit>().clearSelectedRequest(),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Selected request preview overlay
// ─────────────────────────────────────────────
class _RequestPreviewOverlay extends StatelessWidget {
  const _RequestPreviewOverlay();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<VendorRequestsMapCubit, VendorRequestsMapState>(
      builder: (context, state) {
        if (state is VendorRequestsMapLoaded && state.selectedRequest != null) {
          final request = state.selectedRequest!;
          return AppAnimations.slideInFromBottom(
            child: ModernCard(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => VendorOrderDetailsPage(request: request),
                  ),
                );
              },
              padding: const EdgeInsets.all(16),
              borderRadius: 24,
              elevation: 8,
              backgroundColor: Colors.white,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 60,
                          height: 60,
                          child: request.images.isNotEmpty
                              ? AppImage(
                                  imageUrl: request.images.first,
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                )
                              : Container(
                                  color: AppColors.surfaceVariant,
                                  child: const Icon(LucideIcons.package,
                                      color: AppColors.textDisabled),
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              request.title,
                              style: AppTypography.labelLarge
                                  .copyWith(fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              request.address ?? 'موقع غير محدد',
                              style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.textSecondary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ModernButton(
                          text: 'تقديم عرض',
                          height: 40,
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (_) =>
                                  SubmitBidModal(request: request),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: IconButton(
                          icon: const Icon(LucideIcons.eye, size: 20),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    VendorOrderDetailsPage(request: request),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }
}

// ─────────────────────────────────────────────
// Fallback list sheet (shown when no coords exist)
// ─────────────────────────────────────────────
class _RequestListSheet extends StatelessWidget {
  final List<Request> requests;
  const _RequestListSheet({required this.requests});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      'الطلبات المتاحة',
                      style: AppTypography.h4
                          .copyWith(fontWeight: FontWeight.w800),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${requests.length} طلب',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
                  itemCount: requests.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final req = requests[index];
                    return _RequestListTile(request: req);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RequestListTile extends StatelessWidget {
  final Request request;
  const _RequestListTile({required this.request});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VendorOrderDetailsPage(request: request),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.borderColor),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 52,
                height: 52,
                child: request.images.isNotEmpty
                    ? AppImage(
                        imageUrl: request.images.first,
                        width: 52,
                        height: 52,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: AppColors.surfaceVariant,
                        child: const Icon(LucideIcons.package,
                            color: AppColors.textDisabled, size: 20),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    request.title,
                    style: AppTypography.labelLarge
                        .copyWith(fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    request.address ?? 'القاهرة، مصر',
                    style: AppTypography.bodySmall
                        .copyWith(color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '#${request.id} • ${request.categoryNameAr ?? 'عام'}',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textDisabled,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(LucideIcons.handCoins,
                  color: AppColors.primary, size: 20),
              onPressed: () {
                Navigator.pop(context);
                showDialog(
                  context: context,
                  builder: (_) => SubmitBidModal(request: request),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
