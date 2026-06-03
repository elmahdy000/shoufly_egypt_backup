import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_core/presentation/blocs/theme/theme_bloc.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _loadUserData();
  }

  void _loadUserData() {
    final state = context.read<AuthBloc>().state;
    if (state is Authenticated) {
      _nameController.text = state.user.fullName;
      _emailController.text = state.user.email;
      _phoneController.text = state.user.phone ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم تحديث البيانات بنجاح'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showLogoutConfirmation() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ModernCard(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        borderRadius: 32,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.logOut, size: 32, color: AppColors.error),
            ),
            const SizedBox(height: 24),
            Text('تسجيل الخروج', style: AppTypography.h3),
            const SizedBox(height: 12),
            Text(
              'هل أنت متأكد من رغبتك في تسجيل الخروج من تطبيق شوفلي؟',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: ModernButton(
                    text: 'إلغاء',
                    isOutlined: true,
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ModernButton(
                    text: 'خروج',
                    backgroundColor: AppColors.error,
                    onPressed: () {
                      Navigator.pop(context);
                      context.read<AuthBloc>().add(LogoutRequested());
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is Authenticated ? state.user : null;
        
        return Scaffold(
          body: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildSliverAppBar(),
              SliverToBoxAdapter(
                child: user == null
                  ? const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
                  : Padding(
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            _buildProfileHeader(user),
                            const SizedBox(height: 32),
                            _buildInfoSection(),
                            const SizedBox(height: 24),
                            _buildSettingsSection(),
                            const SizedBox(height: 40),
                          ],
                        ),
                      ),
                    ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          'حسابي',
          style: AppTypography.h3.copyWith(color: AppColors.textPrimary),
        ),
        centerTitle: true,
      ),
      automaticallyImplyLeading: !widget.embedded,
      leading: widget.embedded
          ? null
          : IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
              onPressed: () => Navigator.pop(context),
            ),
      actions: [
        if (!_isEditing)
          IconButton(
            icon: const Icon(LucideIcons.userPen, color: AppColors.primary, size: 22),
            onPressed: () => setState(() => _isEditing = true),
          )
        else
          IconButton(
            icon: const Icon(LucideIcons.check, color: AppColors.success, size: 24),
            onPressed: _saveProfile,
          ),
        const SizedBox(width: 12),
      ],
    );
  }

  Widget _buildProfileHeader(dynamic user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 4),
                ),
                child: CircleAvatar(
                  radius: 45,
                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                  child: Text(
                    user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : '?',
                    style: AppTypography.h1.copyWith(color: Colors.white, fontSize: 34),
                  ),
                ),
              ),
              if (_isEditing)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const Icon(LucideIcons.camera, size: 16, color: AppColors.primary),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(user.fullName, style: AppTypography.h3.copyWith(color: Colors.white)),
          const SizedBox(height: 4),
          Text(
            user.email,
            style: AppTypography.bodyMedium.copyWith(color: Colors.white.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection() {
    return ModernCard(
      padding: const EdgeInsets.all(24),
      borderRadius: 24,
      elevation: 0,
      borderColor: AppColors.surfaceVariant.withValues(alpha: 0.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow(LucideIcons.user, 'الاسم', _nameController, _isEditing),
          const Divider(height: 32),
          _buildInfoRow(LucideIcons.mail, 'البريد', _emailController, false),
          const Divider(height: 32),
          _buildInfoRow(LucideIcons.phone, 'الجوال', _phoneController, _isEditing),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, TextEditingController controller, bool enabled) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
              if (enabled)
                TextField(
                  controller: controller,
                  style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 4),
                    border: InputBorder.none,
                  ),
                )
              else
                Text(controller.text, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
          child: Text('الإعدادات', style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900)),
        ),
        ModernCard(
          padding: EdgeInsets.zero,
          borderRadius: 24,
          elevation: 0,
          borderColor: AppColors.surfaceVariant.withValues(alpha: 0.5),
          child: Column(
            children: [
              _buildSettingTile(LucideIcons.shieldCheck, 'الأمان والخصوصية', () {}),
              const Divider(height: 1),
              _buildSettingTile(LucideIcons.mapPin, 'عناويني المحفوظة', () {}),
              const Divider(height: 1),
              BlocBuilder<ThemeBloc, ThemeState>(
                builder: (context, state) {
                  final isDark = state.themeMode == ThemeMode.dark;
                  return _buildSettingTile(
                    isDark ? LucideIcons.moon : LucideIcons.sun,
                    'الوضع الليلي',
                    () {},
                    trailing: Switch(
                      value: isDark,
                      onChanged: (val) {
                        context.read<ThemeBloc>().add(ThemeChanged(val ? ThemeMode.dark : ThemeMode.light));
                      },
                      activeThumbColor: AppColors.primary,
                    ),
                  );
                },
              ),
              const Divider(height: 1),
              _buildSettingTile(LucideIcons.logOut, 'تسجيل الخروج', _showLogoutConfirmation, color: AppColors.error),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingTile(IconData icon, String title, VoidCallback onTap, {Widget? trailing, Color? color}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Icon(icon, color: color ?? AppColors.textPrimary, size: 22),
      title: Text(title, style: AppTypography.labelLarge.copyWith(color: color, fontWeight: FontWeight.w600)),
      trailing: trailing ?? const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textDisabled),
    );
  }
}
