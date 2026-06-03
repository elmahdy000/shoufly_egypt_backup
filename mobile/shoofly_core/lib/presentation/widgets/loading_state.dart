import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/animations/app_animations.dart';

class LoadingState extends StatelessWidget {
  final String? message;
  final bool isFullScreen;
  final Color? indicatorColor;

  const LoadingState({
    super.key,
    this.message,
    this.isFullScreen = false,
    this.indicatorColor,
  });

  @override
  Widget build(BuildContext context) {
    final content = SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 54,
                height: 54,
                child: CircularProgressIndicator(
                  color: indicatorColor ?? AppColors.primary,
                  strokeWidth: 2.5,
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: (indicatorColor ?? AppColors.primary).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.flash_on_rounded, // Premium spark icon
                  color: indicatorColor ?? AppColors.primary,
                  size: 20,
                ),
              ),
            ],
          ),
          if (message != null) ...[
            const SizedBox(height: 20),
            Text(
              message!,
              style: AppTypography.labelLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              "لحظات والبيانات تكون عندك...",
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );

    if (isFullScreen) {
      return Scaffold(
        backgroundColor: Colors.white.withValues(alpha: 0.98),
        body: Center(child: AppAnimations.fadeIn(child: content)),
      );
    }

    return Center(child: AppAnimations.fadeIn(child: content));
  }
}

class SkeletonLoading extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoading({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  const SkeletonLoading.circle({
    super.key,
    required double diameter,
  })  : width = diameter,
        height = diameter,
        borderRadius = 1000;

  @override
  Widget build(BuildContext context) {
    return AppAnimations.shimmer(
      isLoading: true,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ListSkeletonLoading extends StatelessWidget {
  final int itemCount;
  final EdgeInsets padding;

  const ListSkeletonLoading({
    super.key,
    this.itemCount = 5,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: padding,
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderColor),
        ),
        child: Row(
          children: [
            const SkeletonLoading.circle(diameter: 48),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonLoading(width: 150, height: 16),
                  const SizedBox(height: 8),
                  const SkeletonLoading(width: 100, height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
