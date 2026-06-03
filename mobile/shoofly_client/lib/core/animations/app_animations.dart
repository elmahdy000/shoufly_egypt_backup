import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Custom animations for the app
class AppAnimations {
  // Fade in animation
  static Widget fadeIn({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 500),
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: duration,
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: child,
        );
      },
      child: child,
    );
  }

  // Slide in from bottom animation
  static Widget slideInFromBottom({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 600),
  }) {
    return TweenAnimationBuilder<Offset>(
      tween: Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: value,
          child: child,
        );
      },
      child: child,
    );
  }

  // Scale animation
  static Widget scaleIn({
    required Widget child,
    Duration delay = Duration.zero,
    Duration duration = const Duration(milliseconds: 400),
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.8, end: 1.0),
      duration: duration,
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: child,
    );
  }

  // Staggered list animation
  static Widget staggeredList({
    required List<Widget> children,
    Duration staggerDelay = const Duration(milliseconds: 100),
  }) {
    return Column(
      children: children.asMap().entries.map((entry) {
        final index = entry.key;
        final child = entry.value;
        return slideInFromBottom(
          delay: staggerDelay * index,
          child: child,
        );
      }).toList(),
    );
  }

  // Pulse animation for loading states
  static Widget pulse({
    required Widget child,
    Duration duration = const Duration(milliseconds: 1500),
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 1.0, end: 1.1),
      duration: duration,
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: child,
    );
  }

  // Shimmer loading effect
  static Widget shimmer({
    required Widget child,
    required bool isLoading,
  }) {
    if (!isLoading) return child;

    return ShaderMask(
      shaderCallback: (bounds) {
        return LinearGradient(
          colors: [
            Colors.white.withValues(alpha: 0.1),
            Colors.white.withValues(alpha: 0.3),
            Colors.white.withValues(alpha: 0.1),
          ],
          stops: const [0.1, 0.5, 0.9],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ).createShader(bounds);
      },
      child: child,
    );
  }

  // Bounce animation for buttons
  static Widget bounceOnTap({
    required Widget child,
    required VoidCallback onTap,
    Duration duration = const Duration(milliseconds: 150),
  }) {
    return GestureDetector(
      onTap: onTap,
      child: TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 1.0, end: 0.95),
        duration: duration,
        curve: Curves.easeInOut,
        builder: (context, value, child) {
          return Transform.scale(
            scale: value,
            child: child,
          );
        },
        child: child,
      ),
    );
  }
}

/// Enhanced loading states with animations
class AnimatedLoadingState extends StatelessWidget {
  final String? message;

  const AnimatedLoadingState({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AppAnimations.pulse(
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.refresh_rounded,
                color: AppColors.primary,
                size: 30,
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (message != null)
            AppAnimations.fadeIn(
              delay: const Duration(milliseconds: 200),
              child: Text(
                message!,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 16,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Enhanced empty state with animations
class AnimatedEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const AnimatedEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AppAnimations.staggeredList(
        children: [
          AppAnimations.scaleIn(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: AppColors.textDisabled,
                size: 40,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 24),
            action!,
          ],
        ],
      ),
    );
  }
}
