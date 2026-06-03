import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/utils/toasts.dart';
import 'package:shoofly_core/domain/entities/category.dart';
import 'package:shoofly_core/presentation/blocs/auth/auth_bloc.dart';
import 'package:shoofly_core/presentation/blocs/brand/brand_bloc.dart';
import 'package:shoofly_core/presentation/blocs/category/category_bloc.dart';
import 'package:shoofly_core/presentation/blocs/notification/notification_bloc.dart';
import 'package:shoofly_core/presentation/blocs/request/request_bloc.dart';
import 'package:shoofly_core/presentation/blocs/wallet/wallet_bloc.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../notification/notification_page.dart';
import '../offers/offers_page.dart';
import '../profile/profile_page.dart';
import '../notification/notification_detail_page.dart';
import '../request/create_request_page.dart';
import '../request/my_requests_page.dart';
import 'package:shoofly_core/core/utils/request_utils.dart';
import '../wallet/wallet_page.dart';
import 'package:shoofly_core/core/utils/category_utils.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'categories_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
      context.read<NotificationBloc>().add(StartNotificationStream());
    });
  }

  void _loadData() {
    context.read<CategoryBloc>().add(LoadCategories());
    context.read<RequestBloc>().add(LoadMyRequests());
    context.read<WalletBloc>().add(LoadWalletBalance());
    // تحميل الماركات عند بدء التطبيق
    final brandState = context.read<BrandBloc>().state;
    if (brandState is BrandInitial || brandState is BrandError) {
      context.read<BrandBloc>().add(const LoadBrands());
    }
  }

  void _openCreateRequest({ImageSource? imageSource}) {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(
        page: CreateRequestPage(initialImageSource: imageSource),
      ),
    );
  }

  void _openCategories() {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(page: const CategoriesPage()),
    );
  }

  void _openNotifications() {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(page: const NotificationPage()),
    );
  }

  void _openWallet() {
    Navigator.push(
      context,
      AppPageTransitions.slideTransition(page: const WalletPage()),
    );
  }

  void _switchToOffers() => setState(() => _selectedIndex = 1);

  void _switchToRequests() => setState(() => _selectedIndex = 2);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      extendBody: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      drawer: _buildPremiumDrawer(),
      body: BlocListener<NotificationBloc, NotificationState>(
        listener: (context, state) {
          if (state is NotificationsUpdated &&
              state.latestNotification != null) {
            final n = state.latestNotification!;
            // Only show toast for relevant business notifications
            if (n.isBidNotification || n.isStatusChange || n.isMessage || 
               (n.type == 'general' && n.message != null)) {
              AppToasts.showNotification(
                context,
                title: n.title,
                message: n.message,
                onTap: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => NotificationDetailPage(notification: n),
                    ),
                  );
                  
                  if (result == 'VIEW_REQUEST') {
                    _switchToRequests();
                  }
                },
              );
            }
          }
        },
        child: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _selectedIndex,
            children: [
              _buildHomeContent(),
              const OffersPage(embedded: true),
              const MyRequestsPage(embedded: true),
              const ProfilePage(embedded: true),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _ShooflyFloatingNav(
        currentIndex: _selectedIndex,
        onTabSelected: (index) => setState(() => _selectedIndex = index),
        onCreatePressed: () => _openCreateRequest(),
      ),
    );
  }

  Widget _buildPremiumDrawer() {
    return Drawer(
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          _buildDrawerHeader(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              children: [
                _DrawerItem(
                  icon: LucideIcons.user,
                  label: 'الملف الشخصي',
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, AppPageTransitions.slideTransition(page: const ProfilePage()));
                  },
                ),
                _DrawerItem(
                  icon: LucideIcons.wallet,
                  label: 'محفظة شوفلي',
                  onTap: () {
                    Navigator.pop(context);
                    _openWallet();
                  },
                ),
                _DrawerItem(
                  icon: LucideIcons.history,
                  label: 'سجل الطلبات',
                  onTap: () {
                    Navigator.pop(context);
                    _switchToRequests();
                  },
                ),
                const Divider(height: 32, color: AppColors.surfaceVariant),
                _DrawerItem(
                  icon: LucideIcons.settings,
                  label: 'الإعدادات',
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('سيتم تفعيل الإعدادات قريباً', style: TextStyle(fontFamily: 'Cairo'))),
                    );
                  },
                ),
                _DrawerItem(
                  icon: LucideIcons.messageSquare,
                  label: 'مركز المساعدة',
                  onTap: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('جاري تحويلك لمركز المساعدة...', style: TextStyle(fontFamily: 'Cairo'))),
                    );
                  },
                ),
                _DrawerItem(
                  icon: LucideIcons.info,
                  label: 'عن شوفلي',
                  onTap: () {
                    Navigator.pop(context);
                    showAboutDialog(
                      context: context,
                      applicationName: 'شوفلي - تطبيق العملاء',
                      applicationVersion: '1.0.0',
                      applicationIcon: const Icon(LucideIcons.shoppingCart, size: 40, color: AppColors.primary),
                      children: [
                        const SizedBox(height: 16),
                        const Text('تطبيق شوفلي يسهل عليك طلب أي منتج أو خدمة بضغطة زر وتلقي أفضل العروض من الموردين.', style: TextStyle(fontFamily: 'Cairo', height: 1.5)),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: ModernButton(
              text: 'تسجيل الخروج',
              isOutlined: true,
              borderColor: AppColors.error.withValues(alpha: 0.3),
              textColor: AppColors.error,
              icon: LucideIcons.logOut,
              onPressed: () {
                context.read<AuthBloc>().add(LogoutRequested());
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerHeader() {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is Authenticated ? state.user : null;
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 64, 24, 32),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.05),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(32),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(LucideIcons.user, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 18),
              Text(
                user?.fullName ?? 'مستخدم شوفلي',
                style: AppTypography.h3.copyWith(fontSize: 22, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                user?.phone ?? user?.email ?? '',
                style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHomeContent() {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final userName = state is Authenticated
            ? state.user.fullName.split(' ').first
            : 'أهلاً';

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => _loadData(),
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(20, 20, 20, 118),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildPremiumHeader(userName),
                      const SizedBox(height: 18),
                      _buildRequestHero(),
                      const SizedBox(height: 14),
                      _buildHomeShortcuts(),
                      const SizedBox(height: 24),
                      _buildSectionHeader(
                        'ابدأ من قسم',
                        actionText: 'كل الفئات',
                        onAction: _openCategories,
                      ),
                      const SizedBox(height: 12),
                      _buildCategoriesStrip(),
                      const SizedBox(height: 24),
                      _buildSectionHeader(
                        'طلباتك الجارية',
                        actionText: 'عرض الطلبات',
                        onAction: _switchToRequests,
                      ),
                      const SizedBox(height: 12),
                      _buildActiveRequestsPreview(),
                      const SizedBox(height: 24),
                      _buildOffersWaitingCard(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPremiumHeader(String name) {
    return Row(
      children: [
        _HeaderIconButton(
          icon: LucideIcons.menu,
          onTap: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'صباح الخير، $name',
                style: AppTypography.h3.copyWith(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'اكتب اللي محتاجه وسيب الموردين يبعتوا عروضهم.',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
        BlocBuilder<NotificationBloc, NotificationState>(
          builder: (context, state) {
            final unreadCount = state is NotificationsUpdated
                ? state.unreadCount
                : 0;
            return _HeaderIconButton(
              icon: LucideIcons.bell,
              badgeCount: unreadCount,
              onTap: _openNotifications,
            );
          },
        ),
      ],
    );
  }

  Widget _buildRequestHero() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'جديد',
                  style: AppTypography.labelSmall.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'طلب في أقل من دقيقة',
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'محتاج إيه النهاردة؟',
            style: AppTypography.h1.copyWith(
              color: AppColors.textPrimary,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'ارفع صورة لطلبك أو اكتبه بالتفصيل، وسيب الباقي علينا هنوصلك بأفضل الموردين في مصر.',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              height: 1.6,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _PrimaryActionButton(
                  icon: LucideIcons.camera,
                  label: 'صوّر الطلب',
                  onTap: () => _openCreateRequest(imageSource: ImageSource.camera),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SecondaryActionButton(
                  icon: LucideIcons.pencilLine,
                  label: 'اكتب تفاصيل',
                  onTap: () => _openCreateRequest(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHomeShortcuts() {
    return Row(
      children: [
        Expanded(
          child: _CompactShortcutCard(
            icon: LucideIcons.search,
            title: 'ابحث في الفئات',
            subtitle: 'اختار القسم المناسب',
            onTap: _openCategories,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: BlocBuilder<WalletBloc, WalletState>(
            builder: (context, state) {
              final balance = state is WalletLoaded
                  ? '${state.wallet.balance.toStringAsFixed(0)} ج.م'
                  : 'المحفظة';
              return _CompactShortcutCard(
                icon: LucideIcons.wallet,
                title: balance,
                subtitle: 'رصيدك ومدفوعاتك',
                onTap: _openWallet,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(
    String title, {
    String? actionText,
    VoidCallback? onAction,
  }) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: AppTypography.h3.copyWith(
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        if (actionText != null && onAction != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              visualDensity: VisualDensity.compact,
            ),
            child: Text(
              actionText,
              style: AppTypography.labelMedium.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCategoriesStrip() {
    return BlocBuilder<CategoryBloc, CategoryState>(
      builder: (context, state) {
        if (state is CategoryLoading) {
          return SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 5,
              separatorBuilder: (context, index) => const SizedBox(width: 10),
              itemBuilder: (context, index) => const SkeletonLoading(
                width: 86,
                height: 92,
                borderRadius: 18,
              ),
            ),
          );
        }

        if (state is! CategoriesLoaded || state.categories.isEmpty) {
          return _SoftInfoCard(
            icon: LucideIcons.layoutGrid,
            title: 'الفئات غير متاحة حالياً',
            subtitle: 'اسحب للتحديث أو جرّب بعد لحظات.',
            onTap: _loadData,
          );
        }

        final categories = state.categories.take(8).toList();
        return SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: categories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final category = categories[index];
              return _CategoryChipCard(
                category: category,
                icon: category.iconData,
                onTap: _openCategories,
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildActiveRequestsPreview() {
    return BlocBuilder<RequestBloc, RequestState>(
      buildWhen: (previous, current) =>
          current is RequestLoaded ||
          current is ActiveRequestsLoaded ||
          current is RequestListLoading ||
          current is RequestError ||
          current is RequestInitial ||
          current is RequestLoading,
      builder: (context, state) {
        if (state is RequestLoading || state is RequestListLoading) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: _cardDecoration(),
            child: Column(
              children: [
                _buildRequestSkeleton(),
                const SizedBox(height: 14),
                _buildRequestSkeleton(),
              ],
            ),
          );
        }

        if (state is RequestError) {
          return _SoftInfoCard(
            icon: LucideIcons.triangleAlert,
            title: 'تعذر تحميل الطلبات',
            subtitle: state.message,
            onTap: _loadData,
          );
        }

        if (state is! RequestLoaded && state is! ActiveRequestsLoaded) {
          return const SizedBox.shrink();
        }

        final allRequests = state is ActiveRequestsLoaded
            ? state.requests
            : (state as RequestLoaded).requests;
        final activeRequests = allRequests
            .where((request) => request.status.isActive)
            .take(2)
            .toList();

        if (activeRequests.isEmpty) {
          return _SoftInfoCard(
            icon: LucideIcons.clipboardList,
            title: 'لا توجد طلبات جارية',
            subtitle: 'ابدأ طلب جديد وسيظهر هنا بمجرد إرساله.',
            actionText: 'إنشاء طلب',
            onTap: () => _openCreateRequest(),
          );
        }

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: _cardDecoration(),
          child: Column(
            children: [
              for (var i = 0; i < activeRequests.length; i++) ...[
                _RequestPreviewTile(
                  title: activeRequests[i].title,
                  status: activeRequests[i].status.displayName,
                  statusColor: activeRequests[i].status.color,
                  onTap: _switchToRequests,
                ),
                if (i != activeRequests.length - 1)
                  const Divider(height: 18, color: AppColors.surfaceVariant),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildOffersWaitingCard() {
    return _SoftInfoCard(
      icon: LucideIcons.tags,
      title: 'مستني عروض الموردين؟',
      subtitle: 'أي عروض جديدة هتظهر في تبويب العروض، وتقدر تقارن قبل القبول.',
      actionText: 'العروض',
      onTap: _switchToOffers,
    );
  }

  Widget _buildRequestSkeleton() {
    return Row(
      children: const [
        SkeletonLoading.circle(diameter: 44),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLoading(width: 150, height: 14),
              SizedBox(height: 8),
              SkeletonLoading(width: 86, height: 12),
            ],
          ),
        ),
      ],
    );
  }





  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(
        color: AppColors.surfaceVariant.withValues(alpha: 0.7),
      ),
      boxShadow: [
        BoxShadow(
          color: AppColors.shadow.withValues(alpha: 0.05),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(
        label,
        style: AppTypography.labelLarge.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: const Icon(LucideIcons.chevronLeft, size: 16, color: AppColors.textDisabled),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
    );
  }
}

class _ShooflyFloatingNav extends StatelessWidget {
  const _ShooflyFloatingNav({
    required this.currentIndex,
    required this.onTabSelected,
    required this.onCreatePressed,
  });

  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onCreatePressed;

  static const _items = [
    _NavItem(icon: LucideIcons.house, label: 'الرئيسية', index: 0),
    _NavItem(icon: LucideIcons.tags, label: 'العروض', index: 1),
    _NavItem(icon: LucideIcons.clipboardList, label: 'طلباتي', index: 2),
    _NavItem(icon: LucideIcons.user, label: 'حسابي', index: 3),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(18, 0, 18, 12),
      child: SizedBox(
        height: 84,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            Container(
              height: 68,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(35),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _FloatingNavItem(
                    item: _items[0],
                    isActive: currentIndex == 0,
                    onTap: onTabSelected,
                  ),
                  _FloatingNavItem(
                    item: _items[1],
                    isActive: currentIndex == 1,
                    onTap: onTabSelected,
                  ),
                  const SizedBox(width: 72),
                  _FloatingNavItem(
                    item: _items[2],
                    isActive: currentIndex == 2,
                    onTap: onTabSelected,
                  ),
                  _FloatingNavItem(
                    item: _items[3],
                    isActive: currentIndex == 3,
                    onTap: onTabSelected,
                  ),
                ],
              ),
            ),
            Positioned(
              top: 0,
              child: GestureDetector(
                onTap: onCreatePressed,
                child: Container(
                  width: 66,
                  height: 66,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Theme.of(context).cardTheme.color!, width: 5),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.32),
                        blurRadius: 22,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    LucideIcons.plus,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FloatingNavItem extends StatelessWidget {
  const _FloatingNavItem({
    required this.item,
    required this.isActive,
    required this.onTap,
  });

  final _NavItem item;
  final bool isActive;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => onTap(item.index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          height: 48,
          decoration: BoxDecoration(
            color: isActive
                ? AppColors.primary.withValues(alpha: 0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                item.icon,
                size: 20,
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 180),
                style: AppTypography.labelSmall.copyWith(
                  fontSize: 12,
                  color: isActive ? AppColors.primary : AppColors.textSecondary,
                  fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
                  height: 1,
                ),
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.index,
  });

  final IconData icon;
  final String label;
  final int index;
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: AppColors.surfaceVariant.withValues(alpha: 0.7),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow.withValues(alpha: 0.05),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 21),
            if (badgeCount > 0)
              PositionedDirectional(
                top: 7,
                end: 7,
                child: Container(
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: Colors.white, width: 1.2),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    badgeCount > 99 ? '99+' : badgeCount.toString(),
                    style: AppTypography.labelSmall.copyWith(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  const _PrimaryActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppAnimations.pulse(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: 54,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.22),
                blurRadius: 14,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 19),
              const SizedBox(width: 7),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.labelMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SecondaryActionButton extends StatelessWidget {
  const _SecondaryActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppAnimations.bounceOnTap(
      onTap: onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primary, size: 18),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactShortcutCard extends StatelessWidget {
  const _CompactShortcutCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.surfaceVariant.withValues(alpha: 0.7),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.primary, size: 19),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelMedium.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChipCard extends StatelessWidget {
  const _CategoryChipCard({
    required this.category,
    required this.icon,
    required this.onTap,
  });

  final Category category;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 88,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.surfaceVariant.withValues(alpha: 0.7),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(icon, color: AppColors.primary, size: 21),
            ),
            const SizedBox(height: 8),
            Text(
              category.nameAr ?? category.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: AppTypography.labelSmall.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestPreviewTile extends StatelessWidget {
  const _RequestPreviewTile({
    required this.title,
    required this.status,
    required this.statusColor,
    required this.onTap,
  });

  final String title;
  final String status;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Icon(
                LucideIcons.package,
                color: AppColors.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelLarge.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      status,
                      style: AppTypography.labelSmall.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronLeft,
              color: AppColors.textDisabled,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}

class _SoftInfoCard extends StatelessWidget {
  const _SoftInfoCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.actionText,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? actionText;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: AppColors.surfaceVariant.withValues(alpha: 0.7),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: AppColors.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelLarge.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            if (actionText != null) ...[
              const SizedBox(width: 8),
              Text(
                actionText!,
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
