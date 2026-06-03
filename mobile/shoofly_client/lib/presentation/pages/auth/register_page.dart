import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/user.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _agreeToTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Text(
                  'إنشاء حساب جديد',
                  style: AppTypography.h2.copyWith(fontSize: 30, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Text(
                  'انضم لآلاف الموردين والعملاء في شوفلي وابدأ رحلتك الآن.',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.4),
                ),
                
                const SizedBox(height: 40),

                // Full Name
                _buildInputField(
                  controller: _nameController,
                  label: 'الاسم بالكامل',
                  hint: 'أدخل اسمك الثلاثي',
                  icon: LucideIcons.user,
                  validator: (value) => value == null || value.isEmpty ? 'يرجى إدخال الاسم' : null,
                ),
                const SizedBox(height: 20),

                // Email
                _buildInputField(
                  controller: _emailController,
                  label: 'البريد الإلكتروني',
                  hint: 'example@mail.com',
                  icon: LucideIcons.mail,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) => value == null || !value.contains('@') ? 'بريد إلكتروني غير صالح' : null,
                ),
                const SizedBox(height: 20),

                // Password
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
                  validator: (value) => value != null && value.length < 8 ? 'كلمة المرور قصيرة جداً' : null,
                ),
                const SizedBox(height: 20),

                // Confirm Password
                _buildInputField(
                  controller: _confirmPasswordController,
                  label: 'تأكيد كلمة المرور',
                  hint: '••••••••',
                  icon: Icons.check_circle_outline_rounded,
                  isPassword: true,
                  validator: (value) => value != _passwordController.text ? 'كلمات المرور غير متطابقة' : null,
                ),

                const SizedBox(height: 24),

                // Terms & Conditions
                Row(
                  children: [
                    SizedBox(
                      height: 24,
                      width: 24,
                      child: Checkbox(
                        value: _agreeToTerms,
                        onChanged: (val) => setState(() => _agreeToTerms = val ?? false),
                        activeColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _agreeToTerms = !_agreeToTerms),
                        child: RichText(
                          text: TextSpan(
                            text: 'أوافق على ',
                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, fontSize: 15),
                            children: [
                              TextSpan(
                                text: 'الشروط والأحكام وسياسة الخصوصية',
                                style: AppTypography.labelLarge.copyWith(color: AppColors.primary, fontSize: 15),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 40),

                // Register Button
                _buildRegisterButton(),

                const SizedBox(height: 32),
                
                // Login Link
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'لديك حساب بالفعل؟',
                        style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text(
                          'سجل دخولك',
                          style: AppTypography.labelLarge.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
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
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.labelLarge.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: isPassword && !_isPasswordVisible,
          keyboardType: keyboardType,
          style: AppTypography.bodyMedium,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20, color: AppColors.textDisabled),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: AppColors.background,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.surfaceVariant),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.surfaceVariant),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterButton() {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      },
      builder: (context, state) {
        return SizedBox(
          width: double.infinity,
          height: 58,
          child: ElevatedButton(
            onPressed: state is AuthLoading || !_agreeToTerms
                ? null
                : () {
                    if (_formKey.currentState?.validate() ?? false) {
                      context.read<AuthBloc>().add(
                            RegisterSubmitted(
                              fullName: _nameController.text,
                              email: _emailController.text,
                              password: _passwordController.text,
                              role: UserRole.CLIENT,
                            ),
                          );
                    }
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
            ),
            child: state is AuthLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('إنشاء حساب', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ),
        );
      },
    );
  }
}
