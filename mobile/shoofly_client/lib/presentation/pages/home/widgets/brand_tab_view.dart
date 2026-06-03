import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/domain/entities/brand.dart';
import 'package:shoofly_core/presentation/blocs/brand/brand_bloc.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class BrandTabView extends StatefulWidget {
  const BrandTabView({super.key});

  @override
  State<BrandTabView> createState() => _BrandTabViewState();
}

class _BrandTabViewState extends State<BrandTabView>
    with AutomaticKeepAliveClientMixin {
  final TextEditingController _brandSearchController = TextEditingController();
  String _brandQuery = '';

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    // تحميل الماركات فور فتح الـ tab لو لم يتم تحميلها بعد
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final state = context.read<BrandBloc>().state;
      if (state is BrandInitial || state is BrandError) {
        context.read<BrandBloc>().add(const LoadBrands());
      }
    });
  }

  @override
  void dispose() {
    _brandSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<BrandBloc, BrandState>(
      builder: (context, state) {
        if (state is BrandLoading) {
          return _buildBrandsSkeleton();
        }
        if (state is BrandsLoaded) {
          final brands = _filterBrands(state.brands, _brandQuery);
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                child: _buildSearchField(
                  controller: _brandSearchController,
                  hint: 'ابحث عن ماركة معينة...',
                  onChanged: (value) => setState(() => _brandQuery = value.trim()),
                ),
              ),
              Expanded(
                child: brands.isEmpty
                    ? _buildEmptyState(
                        icon: LucideIcons.building2,
                        title: 'لا توجد ماركات مطابقة',
                        subtitle: 'جرّب اسم ماركة مختلف أو امسح البحث.',
                      )
                    : LayoutBuilder(
                        builder: (context, constraints) {
                          final crossAxisCount = constraints.maxWidth >= 520 ? 4 : 3;
                          return GridView.builder(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.all(16),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: crossAxisCount,
                              childAspectRatio: 0.84,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                            ),
                            itemCount: brands.length,
                            itemBuilder: (context, index) => _buildBrandCard(brands[index]),
                          );
                        },
                      ),
              ),
            ],
          );
        }
        if (state is BrandError) {
          return _buildErrorState(state.message);
        }
        return _buildEmptyState(
          icon: LucideIcons.building2,
          title: 'لا توجد ماركات حالياً',
          subtitle: 'هنعرض الماركات المتاحة أول ما البيانات توصل.',
        );
      },
    );
  }

  List<Brand> _filterBrands(List<Brand> brands, String query) {
    if (query.isEmpty) return brands;
    final normalized = query.toLowerCase();
    return brands.where((brand) {
      return '${brand.name} ${brand.slug} ${brand.type}'.toLowerCase().contains(normalized);
    }).toList();
  }

  Widget _buildBrandCard(Brand brand) {
    final logoUrl = _resolveImageUrl(brand.logo);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.surfaceVariant.withValues(alpha: 0.75)),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 54,
            height: 54,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(16),
            ),
              child: logoUrl == null
                ? const Icon(LucideIcons.building2, color: AppColors.textDisabled, size: 30)
                : ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: AppImage(
                      imageUrl: AppConfig.getImageUrl(brand.logo),
                      fit: BoxFit.contain,
                      errorWidget: const Icon(LucideIcons.building2, color: AppColors.textDisabled, size: 30),
                    ),
                  ),
          ),
          const SizedBox(height: 10),
          Text(
            brand.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, height: 1.2),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField({
    required TextEditingController controller,
    required String hint,
    required ValueChanged<String> onChanged,
  }) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(LucideIcons.search, size: 20, color: AppColors.textDisabled),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textDisabled),
                onPressed: () {
                  controller.clear();
                  onChanged('');
                },
              ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.surfaceVariant),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.triangleAlert, color: AppColors.error, size: 42),
              const SizedBox(height: 12),
              Text('تعذر تحميل البيانات', style: AppTypography.h3.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(
                message,
                style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 18),
              ElevatedButton.icon(
                onPressed: () {
                  context.read<BrandBloc>().add(const LoadBrands());
                },
                icon: const Icon(LucideIcons.refreshCw, size: 18),
                label: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String title, required String subtitle}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(icon, color: AppColors.primary, size: 34),
            ),
            const SizedBox(height: 16),
            Text(title, style: AppTypography.h3.copyWith(fontSize: 20), textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBrandsSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 9,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.84,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
      ),
      itemBuilder: (context, index) => _skeletonBox(borderRadius: 18),
    );
  }

  Widget _skeletonBox({double? height, double borderRadius = 16}) {
    return SkeletonLoading(
      width: double.infinity,
      height: height ?? double.infinity,
      borderRadius: borderRadius,
    );
  }
  String? _resolveImageUrl(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final trimmed = value.trim();
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('/')) return '${AppConfig.apiBaseUrl}$trimmed';
    return null;
  }
}
