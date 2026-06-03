import 'package:flutter/material.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/animations/app_animations.dart' as anim;
import 'login_page.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'اطلب اللي نفسك فيه',
      description: 'صور طلبك، حدد مكانك، وسيب الباقي علينا. هنوصل طلبك لأكبر شبكة موردين في مصر.',
      image: 'shoofly_onboarding_order_1777155240976.png',
      color: AppColors.primary,
    ),
    OnboardingData(
      title: 'قارن العروض ووفر',
      description: 'هيوصلك عروض أسعار مختلفة من موردين معتمدين. اختار الأنسب ليك ووفر فلوسك.',
      image: 'shoofly_onboarding_compare_1777155256941.png',
      color: AppColors.primary,
    ),
    OnboardingData(
      title: 'تتبع طلبك لحظة بلحظة',
      description: 'خليك مطمن وتابع المندوب وهو جاي لك في الطريق على الخريطة مباشرة.',
      image: 'shoofly_onboarding_track_1777155275063.png',
      color: AppColors.primary,
    ),
  ];

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: _pages.length,
            itemBuilder: (context, index) {
              return _buildPage(_pages[index]);
            },
          ),
          
          // Top Skip Button
          Positioned(
            top: 60,
            left: 20,
            child: TextButton(
              onPressed: _finishOnboarding,
              child: Text(
                'تخطي',
                style: AppTypography.labelLarge.copyWith(color: AppColors.textDisabled),
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 60,
            left: 30,
            right: 30,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Indicators
                Row(
                  children: List.generate(
                    _pages.length,
                    (index) => _buildIndicator(index == _currentPage),
                  ),
                ),
                
                // Next Button
                GestureDetector(
                  onTap: _nextPage,
                  child: anim.AppAnimations.scaleIn(
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: _pages[_currentPage].color,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Icon(
                        _currentPage == _pages.length - 1 
                          ? Icons.check_rounded 
                          : Icons.arrow_forward_ios_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIndicator(bool isActive) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(right: 8),
      height: 8,
      width: isActive ? 30 : 8,
      decoration: BoxDecoration(
        color: isActive ? _pages[_currentPage].color : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }

  Widget _buildPage(OnboardingData data) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          anim.AppAnimations.scaleIn(
            duration: const Duration(milliseconds: 800),
            child: Container(
              height: 320,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(40),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: Image.network(
                  // In a real app, these would be local assets
                  'https://raw.githubusercontent.com/Engel-AI/shoofly-assets/main/${data.image}',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Icon(
                    Icons.image_rounded, 
                    size: 100, 
                    color: data.color.withValues(alpha: 0.2)
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 60),
          anim.AppAnimations.slideInFromBottom(
            duration: const Duration(milliseconds: 600),
            child: Text(
              data.title,
              style: AppTypography.h1.copyWith(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 20),
          anim.AppAnimations.slideInFromBottom(
            delay: const Duration(milliseconds: 200),
            duration: const Duration(milliseconds: 600),
            child: Text(
              data.description,
              style: AppTypography.bodyLarge.copyWith(
                color: AppColors.textSecondary,
                height: 1.6,
                fontSize: 19,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final String image;
  final Color color;

  OnboardingData({
    required this.title,
    required this.description,
    required this.image,
    required this.color,
  });
}
