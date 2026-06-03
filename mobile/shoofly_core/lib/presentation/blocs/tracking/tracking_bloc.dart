import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../domain/entities/delivery_tracking.dart';
import '../../../domain/repositories/request_repository.dart';
import '../../../domain/entities/request.dart';

// Events
abstract class TrackingEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class StartTracking extends TrackingEvent {
  final int requestId;
  StartTracking(this.requestId);
}

class StopTracking extends TrackingEvent {}

class UpdateLocation extends TrackingEvent {
  final DeliveryTracking tracking;
  UpdateLocation(this.tracking);
}

// State
abstract class TrackingState extends Equatable {
  @override
  List<Object?> get props => [];
}

class TrackingInitial extends TrackingState {}
class TrackingLoading extends TrackingState {}
class TrackingActive extends TrackingState {
  final DeliveryTracking currentTracking;
  final List<DeliveryTracking> history;

  TrackingActive({required this.currentTracking, required this.history});

  @override
  List<Object?> get props => [currentTracking, history];
}
class TrackingError extends TrackingState {
  final String message;
  TrackingError(this.message);
}

// Bloc
class TrackingBloc extends Bloc<TrackingEvent, TrackingState> {
  final RequestRepository repository;
  Timer? _pollingTimer;

  TrackingBloc({required this.repository}) : super(TrackingInitial()) {
    on<StartTracking>((event, emit) async {
      _pollingTimer?.cancel();
      
      if (state is! TrackingActive) emit(TrackingLoading());
      
      await _fetchTracking(event.requestId, emit);

      _pollingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
        final result = await repository.getRequestDetails(event.requestId);
        result.fold(
          (failure) => null, // Ignore polling errors
          (request) {
            if (request.deliveryTracking != null && request.deliveryTracking!.isNotEmpty) {
              add(UpdateLocation(request.deliveryTracking!.first));
            }
          },
        );
      });
    });

    on<StopTracking>((event, emit) {
      _pollingTimer?.cancel();
      emit(TrackingInitial());
    });

    on<UpdateLocation>((event, emit) {
      if (state is TrackingActive) {
        final activeState = state as TrackingActive;
        
        // 🚀 Optimization: Skip emission if location coordinates haven't changed
        final isSameLocation = activeState.currentTracking.latitude == event.tracking.latitude &&
                               activeState.currentTracking.longitude == event.tracking.longitude;
                               
        if (isSameLocation) return;

        emit(TrackingActive(
          currentTracking: event.tracking,
          history: [event.tracking, ...activeState.history],
        ));
      } else {
        emit(TrackingActive(currentTracking: event.tracking, history: [event.tracking]));
      }
    });
  }

  Future<void> _fetchTracking(int requestId, Emitter<TrackingState> emit) async {
    try {
      final result = await repository.getRequestDetails(requestId);
      result.fold(
        (failure) => emit(TrackingError(failure.message)),
        (request) {
          if (request.deliveryTracking != null && request.deliveryTracking!.isNotEmpty) {
            final latest = request.deliveryTracking!.first;
            emit(TrackingActive(currentTracking: latest, history: request.deliveryTracking!));
          }
        },
      );
    } catch (e) {
      emit(TrackingError(e.toString()));
    }
  }

  @override
  Future<void> close() {
    _pollingTimer?.cancel();
    return super.close();
  }
}
