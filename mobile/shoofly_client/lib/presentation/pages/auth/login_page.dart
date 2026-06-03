import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_client/core/theme/app_colors.dart';
import 'package:shoofly_client/core/theme/app_typography.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_client/presentation/pages/auth/register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              
              // Animated Brand Header
              Center(
                child: Column(
                  children: [
                    AppAnimations.scaleIn(
                      child: Hero(
                        tag: 'app_logo',
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 40),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    AppAnimations.fadeIn(
                      delay: const Duration(milliseconds: 200),
                      child: Text(
                        'مرحباً بك مجدداً',
                        style: AppTypography.h2.copyWith(fontSize: 30, fontWeight: FontWeight.w900),
                      ),
                    ),
                    const SizedBox(height: 8),
                    AppAnimations.fadeIn(
                      delay: const Duration(milliseconds: 300),
                      child: Text(
                        'سجل دخولك للوصول لأفضل الموردين في مصر',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),

              // Login Tabs with Animation
              AppAnimations.fadeIn(
                delay: const Duration(milliseconds: 400),
                child: _buildModernTabs(),
              ),
              
              const SizedBox(height: 32),

              // Form Section with Staggered Animation
              AppAnimations.slideInFromBottom(
                delay: const Duration(milliseconds: 500),
                child: _buildFormFields(),
              ),
              
              AppAnimations.fadeIn(
                delay: const Duration(milliseconds: 600),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('سيتم تفعيل ميزة استعادة كلمة المرور قريباً', style: TextStyle(fontFamily: 'Cairo'))),
                      );
                    },
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: Text(
                      'نسيت كلمة المرور؟',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.primary,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),
              
              // Action Button
              AppAnimations.slideInFromBottom(
                delay: const Duration(milliseconds: 700),
                child: _buildSubmitButton(),
              ),
              
              const SizedBox(height: 32),
              
              // Social Login
              AppAnimations.fadeIn(
                delay: const Duration(milliseconds: 800),
                child: _buildDivider(),
              ),
              const SizedBox(height: 24),
              AppAnimations.fadeIn(
                delay: const Duration(milliseconds: 900),
                child: _buildGoogleButton(),
              ),
              
              const SizedBox(height: 40),
              AppAnimations.fadeIn(
                delay: const Duration(milliseconds: 1000),
                child: _buildSignupLink(),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernTabs() {
    return Container(
      height: 54,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: TabBar(
        controller: _tabController,
        dividerColor: Colors.transparent,
        indicatorSize: TabBarIndicatorSize.tab,
        labelPadding: EdgeInsets.zero,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.textSecondary,
        labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w800, fontSize: 17),
        tabs: const [
          Tab(text: 'رقم الهاتف'),
          Tab(text: 'البريد الإلكتروني'),
        ],
      ),
    );
  }

  Widget _buildFormFields() {
    return Column(
      children: [
        SizedBox(
          height: 120,
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildInputField(
                controller: _phoneController,
                label: 'رقم الهاتف',
                hint: '01xxxxxxxxx',
                icon: LucideIcons.phone,
                keyboardType: TextInputType.phone,
              ),
              _buildInputField(
                controller: _emailController,
                label: 'البريد الإلكتروني',
                hint: 'example@mail.com',
                icon: LucideIcons.mail,
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _passwordController,
          label: 'كلمة المرور',
          hint: '••••••••',
          icon: LucideIcons.lock,
          isPassword: true,
          suffixIcon: IconButton(
            icon: Icon(
              _isPasswordVisible ? LucideIcons.eye : LucideIcons.eyeOff,
              size: 20,
              color: AppColors.textDisabled,
            ),
            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
          ),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 4, bottom: 8),
          child: Text(
            label,
            style: AppTypography.labelLarge.copyWith(fontSize: 16, fontWeight: FontWeight.w800),
          ),
        ),
        TextField(
          controller: controller,
          obscureText: isPassword && !_isPasswordVisible,
          keyboardType: keyboardType,
          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20, color: AppColors.primary.withValues(alpha: 0.6)),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message, style: const TextStyle(fontWeight: FontWeight.bold)),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.all(20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state is AuthLoading;
        return Container(
          width: double.infinity,
          height: 64,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              if (!isLoading)
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: ElevatedButton(
            onPressed: isLoading
                ? null
                : () {
                    final email = _tabController.index == 1 ? _emailController.text : _phoneController.text;
                    context.read<AuthBloc>().add(
                          LoginSubmitted(
                            email: email.trim(),
                            password: _passwordController.text,
                          ),
                        );
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.6),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: isLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                  )
                : const Text(
                    'دخول للنظام',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFFE2E8F0), thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            'أو المتابعة من خلال',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textDisabled,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const Expanded(child: Divider(color: Color(0xFFE2E8F0), thickness: 1)),
      ],
    );
  }

  Widget _buildGoogleButton() {
    return OutlinedButton(
      onPressed: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تسجيل الدخول بواسطة جوجل سيكون متاحاً في التحديث القادم', style: TextStyle(fontFamily: 'Cairo'))),
        );
      },
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 64),
        side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.network(
            'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
            height: 24,
            errorBuilder: (context, error, stackTrace) => const Icon(Icons.language, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Text(
            'حساب جوجل',
            style: AppTypography.labelLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignupLink() {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'ليس لديك حساب؟',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                AppPageTransitions.slideTransition(page: RegisterPage()),
              );
            },
            child: Text(
              'أنشئ حسابك الآن',
              style: AppTypography.labelLarge.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w900,
                fontSize: 17,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
