import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';
import 'package:shoofly_core/presentation/widgets/empty_state.dart';
import '../widgets/submit_bid_modal.dart';
import '../../orders/vendor_order_details_page.dart';
import '../../profile/vendor_profile_page.dart';
import '../widgets/location_filter_sheet.dart';
import '../../requests/vendor_requests_map_page.dart';
import 'package:shoofly_core/core/widgets/shimmer_placeholder.dart';

class DashboardTab extends StatefulWidget {
  final ValueChanged<int> onNavigate;

  const DashboardTab({super.key, required this.onNavigate});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  int? _governorateId;
  int? _cityId;
  bool _isOnline = true;

  void _showFilter() async {
    final result = await showModalBottomSheet<Map<String, int?>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LocationFilterSheet(
        initialGovernorateId: _governorateId,
        initialCityId: _cityId,
      ),
    );

    if (result != null) {
      setState(() {
        _governorateId = result['governorateId'];
        _cityId = result['cityId'];
      });
      _loadData(context);
    }
  }

  void _loadData(BuildContext context) {
    context.read<VendorBloc>().add(LoadOpenRequests(
      governorateId: _governorateId,
      cityId: _cityId,
    ));
    context.read<VendorBloc>().add(LoadVendorProfile());
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _loadData(context),
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildHeader(context),
          _buildStatsSection(),
          _buildQuickActionsSection(context),
          _buildSectionTitle('طلبات متاحة للتسعير'),
          _buildRequestsSection(),
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return SliverToBoxAdapter(
      child: BlocBuilder<VendorBloc, VendorState>(
        builder: (context, state) {
          final profile = state.vendorProfile;
          final vendorName = profile?.fullName ?? '...';

          return Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              color: Theme.of(context).appBarTheme.backgroundColor,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildProfileAvatar(context),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'أهلاً بك،',
                            style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
                          ),
                          Text(
                            vendorName,
                            style: AppTypography.h4.copyWith(fontWeight: FontWeight.w900),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    _buildOnlineToggle(),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: _showFilter,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.borderColor),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.mapPin, size: 18, color: AppColors.primary),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _cityId != null ? 'تصفية حسب المدينة' : (_governorateId != null ? 'تصفية حسب المحافظة' : 'جميع المواقع'),
                                  style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(LucideIcons.chevronDown, size: 14, color: AppColors.textDisabled),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    _buildActionIcon(
                      Icons.filter_list_rounded,
                      onTap: _showFilter,
                      hasBadge: _governorateId != null,
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileAvatar(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const VendorProfilePage()),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary.withOpacity(0.1)),
        ),
        child: const Icon(
          LucideIcons.user,
          color: AppColors.primary,
          size: 22,
        ),
      ),
    );
  }

  Widget _buildOnlineToggle() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: _isOnline 
          ? AppColors.success.withOpacity(0.1)
          : AppColors.textDisabled.withOpacity(0.1),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: _isOnline 
            ? AppColors.success.withOpacity(0.2)
            : AppColors.textDisabled.withOpacity(0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_isOnline)
            Padding(
              padding: const EdgeInsets.only(right: 8, left: 4),
              child: Text(
                'متصل',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          GestureDetector(
            onTap: () {
              setState(() => _isOnline = !_isOnline);
              context.read<VendorBloc>().add(UpdateOnlineStatusEvent(_isOnline));
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 36,
              height: 22,
              decoration: BoxDecoration(
                color: _isOnline ? AppColors.success : AppColors.textDisabled,
                borderRadius: BorderRadius.circular(15),
              ),
              child: AnimatedAlign(
                duration: const Duration(milliseconds: 300),
                alignment: _isOnline ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  width: 18,
                  height: 18,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
          if (!_isOnline)
            Padding(
              padding: const EdgeInsets.only(left: 8, right: 4),
              child: Text(
                'مغلق',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.textDisabled,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActionIcon(IconData icon, {VoidCallback? onTap, bool hasBadge = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 20),
          ),
          if (hasBadge)
            Positioned(
              top: -2,
              right: -2,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
      sliver: SliverToBoxAdapter(
        child: Text(
          title,
          style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      sliver: BlocBuilder<VendorBloc, VendorState>(
        builder: (context, state) {
          final statsMap = state.vendorProfile?.stats ?? const {};
          final overview = statsMap['overview'] as Map<String, dynamic>? ?? const {};
          final metrics = statsMap['metrics'] as Map<String, dynamic>? ?? const {};

          final revenue = double.tryParse(overview['totalRevenue']?.toString() ?? '') ?? 0.0;
          final totalBids = int.tryParse(overview['totalBids']?.toString() ?? '') ?? 0;
          final selectedBids = int.tryParse(overview['selectedBids']?.toString() ?? '') ?? 0;
          final winRate = metrics['winRate']?.toString() ?? '0';

          return SliverToBoxAdapter(
            child: Column(
              children: [
                // Revenue Card (Large)
                _buildPremiumStatCard(
                  context,
                  'إجمالي الأرباح',
                  '${revenue.toStringAsFixed(0)} ج.م',
                  Icons.account_balance_wallet_rounded,
                  [AppColors.primary, const Color(0xFF6366F1)],
                  onTap: () => widget.onNavigate(3),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildGlassStatCard(
                        context,
                        'العروض',
                        '$totalBids',
                        Icons.handshake_rounded,
                        Colors.orange,
                        onTap: () => widget.onNavigate(2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildGlassStatCard(
                        context,
                        'الطلبات',
                        '$selectedBids',
                        Icons.check_circle_rounded,
                        AppColors.success,
                        onTap: () => widget.onNavigate(1),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildGlassStatCard(
                        context,
                        'النجاح',
                        '$winRate%',
                        Icons.trending_up_rounded,
                        Colors.purple,
                        onTap: () => widget.onNavigate(2),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPremiumStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    List<Color> gradient, {
    VoidCallback? onTap,
  }) {
    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.all(24),
      borderRadius: 24,
      backgroundColor: Colors.white,
      borderColor: AppColors.borderColor,
      elevation: 0,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textDisabled,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: AppTypography.h3.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronLeft, color: AppColors.textDisabled, size: 20),
        ],
      ),
    );
  }

  Widget _buildGlassStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color, {
    VoidCallback? onTap,
  }) {
    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      backgroundColor: Colors.white,
      borderColor: AppColors.borderColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTypography.labelLarge.copyWith(
              fontWeight: FontWeight.w900,
              fontSize: 18,
            ),
          ),
          Text(
            label,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textDisabled,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'الوصول السريع',
              style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                _buildQuickActionCard(
                  context: context,
                  title: 'خريطة الطلبات',
                  icon: LucideIcons.map,
                  color: const Color(0xFF6366F1),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => VendorRequestsMapPage()),
                    );
                  },
                ),
                _buildQuickActionCard(
                  context: context,
                  title: 'البحث عن طلب',
                  icon: LucideIcons.search,
                  color: Colors.orange,
                  onTap: () => widget.onNavigate(1),
                ),
                _buildQuickActionCard(
                  context: context,
                  title: 'المحفظة',
                  icon: LucideIcons.wallet,
                  color: AppColors.success,
                  onTap: () => widget.onNavigate(3),
                ),
                _buildQuickActionCard(
                  context: context,
                  title: 'الدعم الفني',
                  icon: LucideIcons.headset,
                  color: Colors.purple,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('جاري تحويلك لمركز الدعم الفني...', style: TextStyle(fontFamily: 'Cairo'))),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({
    required BuildContext context,
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      borderRadius: 20,
      backgroundColor: Colors.white,
      borderColor: AppColors.borderColor,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildSimpleStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    VoidCallback? onTap,
  }) {
    return ModernCard(
      onTap: onTap,
      padding: const EdgeInsets.all(12),
      borderRadius: 16,
      elevation: 0,
      borderColor: Theme.of(context).dividerColor,
      backgroundColor: Theme.of(context).cardTheme.color,
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary.withOpacity(0.6), size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                Text(
                  label,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textDisabled,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            LucideIcons.chevronLeft,
            color: AppColors.textDisabled,
            size: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildRequestsSection() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: BlocBuilder<VendorBloc, VendorState>(
        builder: (context, state) {
          if (state.isLoading && state.openRequests.isEmpty) {
            return SliverPadding(
              padding: const EdgeInsets.only(bottom: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ShimmerPlaceholder.card(height: 120, borderRadius: 24),
                  ),
                  childCount: 3,
                ),
              ),
            );
          }

          if (state.openRequests.isNotEmpty) {
            return SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildCompactRequestCard(
                    context,
                    state.openRequests[index],
                  ),
                ),
                childCount:
                    state.openRequests.length > 5 ? 5 : state.openRequests.length,
              ),
            );
          }

          if (state.error != null && state.openRequests.isEmpty) {
            return SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    children: [
                      const Icon(
                        LucideIcons.wifiOff,
                        color: AppColors.error,
                        size: 40,
                      ),
                      const SizedBox(height: 16),
                      Text(state.error!, textAlign: TextAlign.center),
                      TextButton(
                        onPressed: () => _loadData(context),
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: EmptyState(
                icon: LucideIcons.search,
                title: 'لا توجد طلبات متاحة حالياً',
                subtitle: 'سيصلك إشعار عند وجود طلبات جديدة',
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCompactRequestCard(BuildContext context, Request request) {
    return ModernCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 24,
      elevation: 0,
      borderColor: AppColors.borderColor,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VendorOrderDetailsPage(request: request),
          ),
        );
      },
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 64,
                  height: 64,
                  child: request.images.isNotEmpty
                    ? AppImage(
                        imageUrl: request.images.first,
                        width: 64,
                        height: 64,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: AppColors.surfaceVariant.withOpacity(0.4),
                        child: const Icon(LucideIcons.package, color: AppColors.textDisabled, size: 24),
                      ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            request.categoryNameAr ?? 'عام',
                            style: AppTypography.labelSmall.copyWith(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Text(
                          _formatTimeAgo(request.createdAt),
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.textDisabled,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      request.title,
                      style: AppTypography.labelLarge.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      request.description,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(LucideIcons.mapPin, size: 14, color: AppColors.textDisabled),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  request.address ?? 'القاهرة',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              ModernButton(
                text: 'سعر الآن',
                fullWidth: false,
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                borderRadius: 12,
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (_) => SubmitBidModal(request: request),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} ساعة';
    return '${date.day}/${date.month}';
  }
}
