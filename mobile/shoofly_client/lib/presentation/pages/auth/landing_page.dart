import 'package:flutter/material.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_client/core/theme/app_colors.dart';
import 'package:shoofly_client/core/theme/app_typography.dart';
import 'package:shoofly_client/presentation/pages/auth/login_page.dart';
import 'package:shoofly_client/presentation/pages/auth/onboarding_page.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Premium Background Gradient
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).scaffoldBackgroundColor,
                  Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.8),
                  Theme.of(context).cardTheme.color ?? Colors.white,
                ],
              ),
            ),
          ),

          // Abstract background shapes for premium look
          Positioned(
            top: -100,
            right: -100,
            child: _buildCircle(400, AppColors.primary.withValues(alpha: 0.03)),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: _buildCircle(300, AppColors.primary.withValues(alpha: 0.05)),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40),
              child: Column(
                children: [
                  const Spacer(),
                  
                  // Logo Section with Animation
                  AppAnimations.scaleIn(
                    duration: const Duration(milliseconds: 800),
                    child: Hero(
                      tag: 'app_logo',
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              blurRadius: 30,
                              offset: const Offset(0, 15),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppColors.primary, Color(0xFF6366F1)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: const Icon(
                              Icons.bolt_rounded,
                              size: 60,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  
                  // Text Content with Staggered Animations
                  AppAnimations.slideInFromBottom(
                    duration: const Duration(milliseconds: 600),
                    child: Text(
                      'شوفلي مصر',
                      style: AppTypography.h1.copyWith(
                        fontSize: 38,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  AppAnimations.slideInFromBottom(
                    delay: const Duration(milliseconds: 200),
                    duration: const Duration(milliseconds: 600),
                    child: Text(
                      'أول منصة ذكية تربطك بأفضل الموردين في مصر.\nاطلب، قارن، ووفر في ثواني.',
                      style: AppTypography.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.6,
                        fontSize: 19,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // Action Buttons
                  AppAnimations.fadeIn(
                    delay: const Duration(milliseconds: 600),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildMainButton(
                          context,
                          'ابدأ رحلتك الآن',
                          () => _navigateToOnboarding(context),
                        ),
                        const SizedBox(height: 16),
                        _buildSecondaryButton(
                          context,
                          'تسجيل الدخول',
                          () => _navigateToLogin(context),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Footer
                  AppAnimations.fadeIn(
                    delay: const Duration(milliseconds: 1000),
                    child: Text(
                      'بإنضمامك إلينا أنت توافق على الشروط والأحكام',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textDisabled,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildMainButton(BuildContext context, String text, VoidCallback onTap) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildSecondaryButton(BuildContext context, String text, VoidCallback onTap) {
    return SizedBox(
      height: 64,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Theme.of(context).dividerTheme.color ?? AppColors.surfaceVariant, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          foregroundColor: Theme.of(context).textTheme.bodyLarge?.color,
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  void _navigateToLogin(BuildContext context) {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(page: const LoginPage()),
    );
  }

  void _navigateToOnboarding(BuildContext context) {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(page: const OnboardingPage()),
    );
  }
}
