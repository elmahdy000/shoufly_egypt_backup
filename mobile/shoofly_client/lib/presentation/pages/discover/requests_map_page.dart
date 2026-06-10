import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shoofly_core/core/di/injection.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/repositories/request_repository.dart';
import 'cubit/requests_map_cubit.dart';
import 'widgets/map_search_header.dart';
import 'widgets/map_floating_buttons.dart';
import 'widgets/requests_bottom_sheet.dart';
import 'widgets/request_preview_card.dart';
import 'widgets/map_empty_state.dart';
import 'widgets/map_permission_state.dart';

class RequestsMapPage extends StatelessWidget {
  const RequestsMapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => RequestsMapCubit(
        repository: sl<RequestRepository>(),
      )..loadRequestsForMap(),
      child: const RequestsMapView(),
    );
  }
}

class RequestsMapView extends StatelessWidget {
  const RequestsMapView({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        body: Stack(
          children: [
            // 1. Stable Base Map Layer (Always rendered)
            const _MapLayer(),

            // 2. Overlays Layer (Loading, Empty, Permission, Error)
            const _OverlaysLayer(),

            // 3. Top UI Layer (Search & Filters)
            const Positioned(
              top: 54,
              left: 20,
              right: 20,
              child: MapSearchHeader(),
            ),

            // 4. Floating Buttons Layer
            const Positioned(
              bottom: 120,
              right: 16,
              child: MapFloatingButtons(),
            ),

            // 5. Selected Request Preview Card Overlay
            const Positioned(
              bottom: 30,
              left: 20,
              right: 20,
              child: RequestPreviewCardOverlay(),
            ),

            // 6. Draggable Bottom Sheet for List
            const RequestsBottomSheet(),
          ],
        ),
      ),
    );
  }
}

class _MapLayer extends StatelessWidget {
  const _MapLayer();

  @override
  Widget build(BuildContext context) {
    // Only rebuild markers and camera position, not the GoogleMap widget itself if possible.
    return BlocBuilder<RequestsMapCubit, RequestsMapState>(
      buildWhen: (prev, curr) => 
        prev.markers != curr.markers || 
        prev.currentLocation != curr.currentLocation,
      builder: (context, state) {
        return GoogleMap(
          style: kTalabatMapStyle,
          initialCameraPosition: CameraPosition(
            target: state.currentLocation,
            zoom: 12,
          ),
          markers: state.markers,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
          compassEnabled: false,
          onMapCreated: (controller) {
            context.read<RequestsMapCubit>().onMapCreated(controller);
          },
          onTap: (_) => context.read<RequestsMapCubit>().clearSelectedRequest(),
        );
      },
    );
  }
}

class _OverlaysLayer extends StatelessWidget {
  const _OverlaysLayer();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RequestsMapCubit, RequestsMapState>(
      builder: (context, state) {
        if (state.isInitialLoading) {
          return _buildFullscreenOverlay(
            child: const CircularProgressIndicator(color: AppColors.primary),
          );
        }
        
        if (state is RequestsMapLoading) {
          return Positioned(
            top: 140,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 12),
                    Text('جاري التحديث...', style: AppTypography.bodySmall),
                  ],
                ),
              ),
            ),
          );
        }

        if (state is RequestsMapPermissionDenied) {
          return _buildFullscreenOverlay(child: const MapPermissionState());
        }

        if (state is RequestsMapEmpty) {
          return _buildFullscreenOverlay(
            child: MapEmptyState(message: state.message),
          );
        }

        if (state is RequestsMapError) {
          return _buildFullscreenOverlay(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    style: AppTypography.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.read<RequestsMapCubit>().refreshRequests(),
                    child: const Text('إعادة المحاولة'),
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

  Widget _buildFullscreenOverlay({required Widget child}) {
    return Container(
      color: Colors.black.withValues(alpha: 0.05),
      child: Center(child: child),
    );
  }
}

class RequestPreviewCardOverlay extends StatelessWidget {
  const RequestPreviewCardOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RequestsMapCubit, RequestsMapState>(
      builder: (context, state) {
        if (state is RequestsMapLoaded && state.selectedRequest != null) {
          return RequestPreviewCard(request: state.selectedRequest!);
        }
        return const SizedBox.shrink();
      },
    );
  }
}
