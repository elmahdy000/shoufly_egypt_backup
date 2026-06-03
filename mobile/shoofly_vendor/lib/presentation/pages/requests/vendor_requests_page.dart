import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';

import '../home/widgets/submit_bid_modal.dart';
import 'package:shoofly_core/core/widgets/shimmer_placeholder.dart';
import '../orders/vendor_order_details_page.dart';
import 'vendor_requests_map_page.dart';

class VendorRequestsPage extends StatefulWidget {
  const VendorRequestsPage({super.key});

  @override
  State<VendorRequestsPage> createState() => _VendorRequestsPageState();
}

class _VendorRequestsPageState extends State<VendorRequestsPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int? _selectedCategoryId;
  String _sortBy = 'NEWEST';
  
  // Cache for filtered results to avoid redundant computations
  List<Request> _cachedFilteredRequests = [];
  List<Request>? _lastSourceList;
  String? _lastQuery;
  int? _lastCatId;
  String? _lastSort;

  @override
  void initState() {
    super.initState();
    context.read<VendorBloc>().add(const LoadOpenRequests());
  }

  List<Request> useMemoizedFilteredRequests(List<Request> source, String query, int? catId, String sort) {
    if (source == _lastSourceList && query == _lastQuery && catId == _lastCatId && sort == _lastSort) {
      return _cachedFilteredRequests;
    }

    _lastSourceList = source;
    _lastQuery = query;
    _lastCatId = catId;
    _lastSort = sort;

    var list = source.where((r) {
      final queryMatches = query.isEmpty || 
          r.title.toLowerCase().contains(query.toLowerCase()) ||
          r.description.toLowerCase().contains(query.toLowerCase());
      
      final categoryMatches = catId == null || r.categoryId == catId;
      return queryMatches && categoryMatches;
    }).toList();

    if (sort == 'NEWEST') {
      list.sort((a, b) => b.id.compareTo(a.id));
    } else if (sort == 'TITLE') {
      list.sort((a, b) => a.title.compareTo(b.title));
    }

    _cachedFilteredRequests = list;
    return list;
  }

  Timer? _debounce;
  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _searchQuery = query);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: ModernAppBar(
        title: 'الطلبات المتاحة',
        actions: [
          _buildActionIcon(
            Icons.map_outlined,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => VendorRequestsMapPage()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          _buildSearchSection(),
          _buildFilterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async =>
                  context.read<VendorBloc>().add(const LoadOpenRequests()),
              child: BlocBuilder<VendorBloc, VendorState>(
                builder: (context, state) {
                  if (state.isLoading && state.openRequests.isEmpty) {
                    return ShimmerPlaceholder.list(
                      count: 5,
                      height: 180,
                      padding: const EdgeInsets.all(20),
                      spacing: 20,
                    );
                  }

                  // 🚀 Optimization: Filter and Sort only when necessary
                  final filteredRequests = useMemoizedFilteredRequests(
                    state.openRequests,
                    _searchQuery,
                    _selectedCategoryId,
                    _sortBy,
                  );

                  if (filteredRequests.isNotEmpty) {
                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                      physics: const AlwaysScrollableScrollPhysics(
                        parent: BouncingScrollPhysics(),
                      ),
                      cacheExtent: 500, // Pre-cache items for smoother scrolling
                      itemCount: filteredRequests.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 20),
                      itemBuilder: (context, index) {
                        return RepaintBoundary(
                          child: _buildRequestCard(context, filteredRequests[index]),
                        );
                      },
                    );
                  }

            if (state.error != null && state.openRequests.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.wifiOff, size: 48, color: AppColors.textDisabled),
                      const SizedBox(height: 16),
                      Text(
                        state.error!,
                        textAlign: TextAlign.center,
                        style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 20),
                      ModernButton(
                        text: 'إعادة المحاولة',
                        icon: LucideIcons.refreshCw,
                        fullWidth: false,
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        onPressed: () => context.read<VendorBloc>().add(const LoadOpenRequests()),
                      ),
                    ],
                  ),
                ),
              );
            }

            return Center(
              child: AppAnimations.scaleIn(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.searchX,
                        size: 48,
                        color: AppColors.textDisabled,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'لا توجد طلبات جديدة حالياً',
                      style: AppTypography.h4.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'سيتم إشعارك فور توفر طلبات جديدة',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textDisabled,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    ),
  ],
),
);
}

  Widget _buildActionIcon(IconData icon, {required VoidCallback onTap}) {
    return IconButton(
      onPressed: onTap,
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: AppColors.textPrimary, size: 20),
      ),
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      decoration: BoxDecoration(
        color: Theme.of(context).appBarTheme.backgroundColor,
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderColor),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'ابحث عن طلبات...',
                  hintStyle: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
                  icon: const Icon(LucideIcons.search, size: 20, color: AppColors.textDisabled),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          _buildActionIcon(
            LucideIcons.arrowUpDown,
            onTap: _showSortOptions,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).appBarTheme.backgroundColor,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          _buildCategoryChip('الكل', null),
          _buildCategoryChip('قطع غيار', 1),
          _buildCategoryChip('إطارات', 2),
          _buildCategoryChip('زيوت', 3),
          _buildCategoryChip('بطاريات', 4),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, int? id) {
    final isSelected = _selectedCategoryId == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedCategoryId = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(left: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderColor,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.bodySmall.copyWith(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ترتيب الطلبات',
              style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 20),
            _buildSortOption('الأحدث أولاً', 'NEWEST', Icons.access_time_rounded),
            _buildSortOption('حسب الاسم', 'TITLE', Icons.sort_by_alpha_rounded),
          ],
        ),
      ),
    );
  }

  Widget _buildSortOption(String label, String value, IconData icon) {
    final isSelected = _sortBy == value;
    return ListTile(
      onTap: () {
        setState(() => _sortBy = value);
        Navigator.pop(context);
      },
      leading: Icon(icon, color: isSelected ? AppColors.primary : AppColors.textDisabled),
      title: Text(
        label,
        style: AppTypography.labelLarge.copyWith(
          color: isSelected ? AppColors.primary : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Widget _buildRequestCard(BuildContext context, Request request) {
    return ModernCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VendorOrderDetailsPage(request: request),
          ),
        );
      },
      padding: const EdgeInsets.all(24),
      borderRadius: 20,
      elevation: 0,
      borderColor: Theme.of(context).dividerColor,
      backgroundColor: Theme.of(context).cardTheme.color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  LucideIcons.package,
                  color: AppColors.textSecondary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.title,
                      style: AppTypography.labelLarge.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'منذ قليل • #${request.id}',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textDisabled,
                      ),
                    ),
                  ],
                ),
              ),
              ModernChip(
                label: 'نشط',
                selected: true,
                backgroundColor: AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            request.description,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 28),
          Row(
            children: [
              const Icon(
                LucideIcons.mapPin,
                size: 16,
                color: AppColors.textDisabled,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  request.address ?? 'القاهرة، مصر',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ModernButton(
                text: 'تقديم عرض سعر',
                fullWidth: false,
                height: 44,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => SubmitBidModal(request: request),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
