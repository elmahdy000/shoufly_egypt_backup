import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';
import 'package:shoofly_core/core/errors/failures.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/domain/repositories/request_repository.dart';

// Shared Talabat-style bright clean map style
const String kTalabatMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#f8f8f8"}]},
  {"elementType":"labels.icon","stylers":[{"visibility":"off"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"off"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},
  {"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#666666"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#e5f5e0"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#ffffff"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#e0e0e0"}]},
  {"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},
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

// --- State ---
abstract class RequestsMapState extends Equatable {
  final Set<Marker> markers;
  final LatLng currentLocation;
  final bool isInitialLoading;

  const RequestsMapState({
    this.markers = const {},
    this.currentLocation = const LatLng(30.5877, 31.5020),
    this.isInitialLoading = false,
  });

  @override
  List<Object?> get props => [markers, currentLocation, isInitialLoading];
}

class RequestsMapInitial extends RequestsMapState {
  const RequestsMapInitial() : super(isInitialLoading: true);
}

class RequestsMapLoading extends RequestsMapState {
  const RequestsMapLoading({
    super.markers,
    super.currentLocation,
  }) : super(isInitialLoading: false);
}

class RequestsMapPermissionDenied extends RequestsMapState {
  const RequestsMapPermissionDenied({
    super.markers,
    super.currentLocation,
  });
}

class RequestsMapLoaded extends RequestsMapState {
  final List<Request> allRequests;
  final List<Request> visibleRequests;
  final Request? selectedRequest;
  final int? activeCategoryFilter;
  final RequestStatus? activeStatusFilter;
  final String searchQuery;

  const RequestsMapLoaded({
    required this.allRequests,
    required this.visibleRequests,
    this.selectedRequest,
    super.currentLocation,
    this.activeCategoryFilter,
    this.activeStatusFilter,
    this.searchQuery = '',
    required super.markers,
  });

  RequestsMapLoaded copyWith({
    List<Request>? allRequests,
    List<Request>? visibleRequests,
    Request? selectedRequest,
    LatLng? currentLocation,
    int? activeCategoryFilter,
    RequestStatus? activeStatusFilter,
    String? searchQuery,
    Set<Marker>? markers,
    bool clearSelection = false,
  }) {
    return RequestsMapLoaded(
      allRequests: allRequests ?? this.allRequests,
      visibleRequests: visibleRequests ?? this.visibleRequests,
      selectedRequest: clearSelection ? null : (selectedRequest ?? this.selectedRequest),
      currentLocation: currentLocation ?? this.currentLocation,
      activeCategoryFilter: activeCategoryFilter ?? this.activeCategoryFilter,
      activeStatusFilter: activeStatusFilter ?? this.activeStatusFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      markers: markers ?? this.markers,
    );
  }

  @override
  List<Object?> get props => [
        ...super.props,
        allRequests,
        visibleRequests,
        selectedRequest,
        activeCategoryFilter,
        activeStatusFilter,
        searchQuery,
      ];
}

class RequestsMapEmpty extends RequestsMapState {
  final String message;
  const RequestsMapEmpty({
    required this.message,
    super.markers,
    super.currentLocation,
  });

  @override
  List<Object?> get props => [...super.props, message];
}

class RequestsMapError extends RequestsMapState {
  final String message;
  const RequestsMapError({
    required this.message,
    super.markers,
    super.currentLocation,
  });

  @override
  List<Object?> get props => [...super.props, message];
}

// --- Cubit ---
class RequestsMapCubit extends Cubit<RequestsMapState> {
  final RequestRepository repository;
  final Location _locationService = Location();
  GoogleMapController? _mapController;
  bool _isMapCreated = false;

  RequestsMapCubit({required this.repository}) : super(const RequestsMapInitial());

  void onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    _isMapCreated = true;
  }

  Future<void> loadRequestsForMap({bool isRefresh = false}) async {
    if (isClosed) return;

    if (isRefresh) {
      emit(RequestsMapLoading(
        markers: state.markers,
        currentLocation: state.currentLocation,
      ));
    }

    // 1. Check Permissions
    final hasPermission = await _checkPermissions();
    if (!hasPermission) {
      if (!isClosed) emit(RequestsMapPermissionDenied(markers: state.markers, currentLocation: state.currentLocation));
      return;
    }

    // 2. Get Location (Concurrent with fetching requests)
    final locationFuture = _safeGetLocation();
    final requestsFuture = repository.getActiveRequests(limit: 100);

    final results = await Future.wait([locationFuture, requestsFuture]);
    if (isClosed) return;

    final location = results[0] as LatLng?;
    final requestsResult = results[1] as Either<Failure, List<Request>>;

    requestsResult.fold(
      (failure) => emit(RequestsMapError(
        message: 'فشل في تحميل الطلبات',
        markers: state.markers,
        currentLocation: location ?? state.currentLocation,
      )),
      (requests) {
        if (requests.isEmpty) {
          emit(RequestsMapEmpty(
            message: 'لا توجد طلبات متاحة في منطقتك حالياً.',
            currentLocation: location ?? state.currentLocation,
          ));
        } else {
          final markers = _buildMarkers(requests, null);
          emit(RequestsMapLoaded(
            allRequests: requests,
            visibleRequests: requests,
            currentLocation: location ?? state.currentLocation,
            markers: markers,
          ));
          
          if (location != null && _isMapCreated) {
            _animateTo(location);
          }
        }
      },
    );
  }

  Future<LatLng?> _safeGetLocation() async {
    try {
      final locData = await _locationService.getLocation().timeout(const Duration(seconds: 5));
      if (locData.latitude != null && locData.longitude != null) {
        return LatLng(locData.latitude!, locData.longitude!);
      }
    } catch (_) {}
    return null;
  }

  Future<bool> _checkPermissions() async {
    try {
      bool serviceEnabled = await _locationService.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _locationService.requestService();
        if (!serviceEnabled) return false;
      }

      PermissionStatus permissionGranted = await _locationService.hasPermission();
      if (permissionGranted == PermissionStatus.denied) {
        permissionGranted = await _locationService.requestPermission();
        if (permissionGranted != PermissionStatus.granted) return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  void selectRequest(Request request) {
    if (isClosed) return;
    if (state is RequestsMapLoaded) {
      final s = state as RequestsMapLoaded;
      if (s.selectedRequest?.id == request.id) return;

      final markers = _buildMarkers(s.visibleRequests, request.id);
      emit(s.copyWith(selectedRequest: request, markers: markers));
      
      if (request.latitude != null && request.longitude != null) {
        _animateTo(LatLng(request.latitude!, request.longitude!));
      }
    }
  }

  void clearSelectedRequest() {
    if (isClosed) return;
    if (state is RequestsMapLoaded) {
      final s = state as RequestsMapLoaded;
      if (s.selectedRequest == null) return;

      final markers = _buildMarkers(s.visibleRequests, null);
      emit(s.copyWith(clearSelection: true, markers: markers));
    }
  }

  void applySearch(String query) {
    if (isClosed) return;
    if (state is RequestsMapLoaded) {
      final s = state as RequestsMapLoaded;
      final filtered = s.allRequests.where((r) {
        final matchesQuery = r.title.toLowerCase().contains(query.toLowerCase()) ||
            r.description.toLowerCase().contains(query.toLowerCase());
        return matchesQuery;
      }).toList();
      
      final markers = _buildMarkers(filtered, s.selectedRequest?.id);
      emit(s.copyWith(
        visibleRequests: filtered,
        searchQuery: query,
        markers: markers,
      ));
    }
  }

  void applyCategoryFilter(int? categoryId) {
    if (isClosed) return;
    if (state is RequestsMapLoaded) {
      final s = state as RequestsMapLoaded;
      final filtered = s.allRequests.where((r) {
        if (categoryId == null) return true;
        return r.categoryId == categoryId;
      }).toList();

      final markers = _buildMarkers(filtered, s.selectedRequest?.id);
      emit(s.copyWith(
        visibleRequests: filtered,
        activeCategoryFilter: categoryId,
        markers: markers,
      ));
    }
  }

  void refreshRequests() => loadRequestsForMap(isRefresh: true);

  Future<void> getCurrentLocation() async {
    if (isClosed) return;
    final location = await _safeGetLocation();
    if (location != null && !isClosed) {
      _animateTo(location);
      if (state is RequestsMapLoaded) {
        emit((state as RequestsMapLoaded).copyWith(currentLocation: location));
      }
    }
  }

  Set<Marker> _buildMarkers(List<Request> requests, int? selectedId) {
    return requests
        .where((r) => r.latitude != null && r.longitude != null)
        .map((r) {
      final isSelected = r.id == selectedId;
      return Marker(
        markerId: MarkerId(r.id.toString()),
        position: LatLng(r.latitude!, r.longitude!),
        icon: isSelected
            ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure)
            : BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        onTap: () => selectRequest(r),
        zIndexInt: isSelected ? 1 : 0,
      );
    }).toSet();
  }

  void _animateTo(LatLng position) {
    if (!_isMapCreated || _mapController == null) return;
    try {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: position, zoom: 14.5),
        ),
      );
    } catch (_) {}
  }

  @override
  Future<void> close() {
    _mapController = null;
    return super.close();
  }
}
