import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';
import 'package:shoofly_core/domain/entities/vendor_profile.dart';
import 'package:intl/intl.dart';

class VendorProfilePage extends StatelessWidget {
  const VendorProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: const ModernAppBar(title: 'الملف الشخصي'),
      body: BlocBuilder<VendorBloc, VendorState>(
        builder: (context, state) {
          final profile = state.vendorProfile;

          if (state.isLoading && profile == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (profile == null) {
            return const Center(child: Text('لا تتوفر بيانات الملف الشخصي'));
          }

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: AppAnimations.staggeredList(
              staggerDelay: const Duration(milliseconds: 50),
              children: [
                _buildProfileHeader(context, profile),
                const SizedBox(height: 24),
                _buildStatsGrid(context, profile.stats),
                const SizedBox(height: 32),
                _buildSectionTitle('إعدادات الحساب'),
                const SizedBox(height: 12),
                _buildMenuItem(
                  context,
                  icon: LucideIcons.user,
                  title: 'تعديل البيانات الشخصية',
                  subtitle: 'الاسم، رقم الهاتف، البريد الإلكتروني',
                  onTap: () => _showEditProfileSheet(context, profile),
                ),
                _buildMenuItem(
                  context,
                  icon: LucideIcons.lock,
                  title: 'كلمة المرور والأمان',
                  subtitle: 'تغيير كلمة المرور، التحقق بخطوتين',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('سيتم إضافة صفحة تغيير كلمة المرور قريباً', style: TextStyle(fontFamily: 'Cairo'))),
                    );
                  },
                ),
                _buildMenuItem(
                  context,
                  icon: LucideIcons.bell,
                  title: 'الإشعارات',
                  subtitle: 'إعدادات التنبيهات والرسائل',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('الإشعارات مفعلة وتعمل بشكل سليم', style: TextStyle(fontFamily: 'Cairo')), backgroundColor: AppColors.success),
                    );
                  },
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('أخرى'),
                const SizedBox(height: 12),
                _buildMenuItem(
                  context,
                  icon: Icons.help_outline_rounded,
                  title: 'مركز المساعدة',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('جاري تحويلك لمركز المساعدة...', style: TextStyle(fontFamily: 'Cairo'))),
                    );
                  },
                ),
                _buildMenuItem(
                  context,
                  icon: LucideIcons.info,
                  title: 'عن التطبيق',
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'شوفلي - تطبيق الموردين',
                      applicationVersion: '1.0.0',
                      applicationIcon: const Icon(LucideIcons.store, size: 40, color: AppColors.primary),
                      children: [
                        const SizedBox(height: 16),
                        const Text('تطبيق شوفلي للموردين ومقدمي الخدمات. يتيح لك استقبال طلبات العملاء وتقديم أفضل العروض وزيادة مبيعاتك بكل سهولة.', style: TextStyle(fontFamily: 'Cairo', height: 1.5)),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 32),
                _buildLogoutButton(context),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, VendorProfile profile) {
    final name = profile.fullName;
    final email = profile.email;
    final rating = profile.rating;

    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 2),
              ),
              child: const Icon(LucideIcons.user, size: 50, color: AppColors.primary),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.camera, size: 14, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              name,
              style: AppTypography.h3.copyWith(fontWeight: FontWeight.w900),
            ),
            if (profile.isVerified) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.check, size: 10, color: Colors.white),
              ),
            ],
          ],
        ),
        Text(
          email,
          style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.star, size: 14, color: Colors.amber),
                  const SizedBox(width: 4),
                  Text(
                    rating.toStringAsFixed(1),
                    style: AppTypography.labelSmall.copyWith(
                      color: Colors.amber[800],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'تقييم المورد',
              style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsGrid(BuildContext context, Map<String, dynamic> stats) {
    final overview = stats['overview'] as Map<String, dynamic>? ?? {};
    final totalBids = overview['totalBids']?.toString() ?? '0';
    final selectedBids = overview['selectedBids']?.toString() ?? '0';

    return Row(
      children: [
        Expanded(
          child: _buildMiniStatCard(
            context,
            'إجمالي العروض',
            totalBids,
            LucideIcons.handCoins,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMiniStatCard(
            context,
            'طلبات منفذة',
            selectedBids,
            Icons.check_circle_rounded,
            AppColors.success,
          ),
        ),
      ],
    );
  }

  Widget _buildMiniStatCard(BuildContext context, String label, String value, IconData icon, Color color) {
    return ModernCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      backgroundColor: Colors.white,
      borderColor: AppColors.borderColor,
      elevation: 0,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900, fontSize: 20),
          ),
          Text(
            label,
            style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ModernCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderColor: AppColors.borderColor,
        elevation: 0,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.textPrimary, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.labelMedium.copyWith(fontWeight: FontWeight.w700),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle,
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled, fontSize: 13),
                    ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronLeft, color: AppColors.textDisabled, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return ModernButton(
      text: 'تسجيل الخروج',
      icon: LucideIcons.logOut,
      backgroundColor: AppColors.error.withOpacity(0.1),
      textColor: AppColors.error,
      onPressed: () => _showLogoutDialog(context),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('تسجيل الخروج', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('هل أنت متأكد أنك تريد تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AuthBloc>().add(LogoutRequested());
            },
            child: const Text('خروج', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showEditProfileSheet(BuildContext context, VendorProfile profile) {
    final nameController = TextEditingController(text: profile.fullName);
    final phoneController = TextEditingController(text: profile.phone);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'تعديل البيانات الشخصية',
              style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              'قم بتحديث بياناتك للظهور بشكل أفضل للعملاء',
              style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 32),
            ModernTextField(
              controller: nameController,
              label: 'الاسم الكامل',
              hint: 'أدخل اسمك بالكامل',
              prefixIcon: LucideIcons.user,
            ),
            const SizedBox(height: 20),
            ModernTextField(
              controller: phoneController,
              label: 'رقم الهاتف',
              hint: 'أدخل رقم هاتفك',
              prefixIcon: LucideIcons.phone,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 32),
            ModernButton(
              text: 'حفظ التعديلات',
              onPressed: () {
                context.read<VendorBloc>().add(
                  UpdateVendorProfileEvent(
                    fullName: nameController.text,
                    phone: phoneController.text,
                  ),
                );
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
