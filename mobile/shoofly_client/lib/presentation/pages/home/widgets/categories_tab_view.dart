import 'package:flutter/material.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart' show AppPageTransitions;
import 'package:shoofly_core/domain/entities/category.dart';
import 'package:shoofly_core/presentation/blocs/category/category_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'package:shoofly_core/core/utils/category_utils.dart';
import '../../request/create_request_page.dart';

class CategoriesTabView extends StatefulWidget {
  const CategoriesTabView({super.key});

  @override
  State<CategoriesTabView> createState() => _CategoriesTabViewState();
}

class _CategoriesTabViewState extends State<CategoriesTabView>
    with AutomaticKeepAliveClientMixin {
  final TextEditingController _categorySearchController = TextEditingController();
  int _selectedMainCategory = 0;
  String _categoryQuery = '';

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    // تحميل الفئات تلقائياً لو لم تتحمل بعد
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final state = context.read<CategoryBloc>().state;
      if (state is CategoryInitial || state is CategoryError) {
        context.read<CategoryBloc>().add(LoadCategories());
      }
    });
  }

  @override
  void dispose() {
    _categorySearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<CategoryBloc, CategoryState>(
      builder: (context, state) {
        if (state is CategoryLoading) {
          return _buildCategoriesSkeleton();
        }
        if (state is CategoriesLoaded) {
          return _buildContent(state.categories);
        }
        // عرض البيانات القديمة مع رسالة خطأ بسيطة عند فشل الـ refresh
        if (state is CategoriesRefreshError) {
          return _buildContent(state.categories, refreshError: state.message);
        }
        if (state is CategoryError) {
          return _buildErrorState(state.message);
        }
        return _buildCategoriesSkeleton();
      },
    );
  }

  Widget _buildContent(List<Category> categories, {String? refreshError}) {
    final filteredCategories = _filterCategories(categories, _categoryQuery);
    if (_selectedMainCategory >= filteredCategories.length) {
      _selectedMainCategory = 0;
    }

    return Column(
      children: [
        if (refreshError != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppColors.error.withValues(alpha: 0.08),
            child: Row(
              children: [
                const Icon(LucideIcons.wifiOff, size: 15, color: AppColors.error),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    refreshError,
                    style: AppTypography.bodySmall.copyWith(color: AppColors.error, fontSize: 14),
                  ),
                ),
                TextButton(
                  onPressed: () => context.read<CategoryBloc>().add(RefreshCategories()),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    visualDensity: VisualDensity.compact,
                  ),
                  child: Text('تحديث', style: AppTypography.labelSmall.copyWith(color: AppColors.error, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          child: _buildSearchField(
            controller: _categorySearchController,
            hint: 'ابحث عن فئة أو خدمة...',
            onChanged: (value) => setState(() {
              _categoryQuery = value.trim();
              _selectedMainCategory = 0;
            }),
          ),
        ),
        Expanded(
          child: filteredCategories.isEmpty
              ? _buildEmptyState(
                  icon: LucideIcons.search,
                  title: 'مفيش نتائج مطابقة',
                  subtitle: 'جرّب كلمة أبسط أو امسح البحث.',
                )
              : Row(
                  children: [
                    _buildCategoriesSidebar(filteredCategories),
                    Expanded(
                      child: _buildSubcategoriesPanel(
                        filteredCategories[_selectedMainCategory],
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  List<Category> _filterCategories(List<Category> categories, String query) {
    if (query.isEmpty) return categories;
    final normalized = query.toLowerCase();
    return categories.where((category) {
      final inParent = '${category.name} ${category.slug}'.toLowerCase().contains(normalized);
      final inChildren = (category.subcategories ?? []).any((sub) {
        return '${sub.name} ${sub.slug}'.toLowerCase().contains(normalized);
      });
      return inParent || inChildren;
    }).toList();
  }

  Widget _buildCategoriesSidebar(List<Category> categories) {
    return Container(
      width: 100,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          right: BorderSide(
            color: AppColors.surfaceVariant.withValues(alpha: 0.4),
            width: 1,
          ),
        ),
      ),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final isSelected = _selectedMainCategory == index;
          return InkWell(
            onTap: () => setState(() => _selectedMainCategory = index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary.withValues(alpha: 0.06) : Colors.transparent,
                border: Border(
                  left: BorderSide(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    width: 3.5,
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedScale(
                    scale: isSelected ? 1.15 : 1.0,
                    duration: const Duration(milliseconds: 250),
                    child: Icon(
                      category.iconData,
                      color: isSelected ? AppColors.primary : AppColors.textDisabled,
                      size: 26,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    category.name,
                    textAlign: TextAlign.center,
                    style: AppTypography.labelSmall.copyWith(
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.w500,
                      fontSize: 13,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSubcategoriesPanel(Category selectedCategory) {
    final subcategories = selectedCategory.subcategories ?? const <Category>[];
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth >= 520 ? 3 : 2;
        return Container(
          color: AppColors.background,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      selectedCategory.iconData,
                      color: AppColors.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(selectedCategory.name, style: AppTypography.h3.copyWith(fontSize: 19)),
                        const SizedBox(height: 2),
                        Text(
                          selectedCategory.hintText,
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (subcategories.isEmpty)
                Expanded(
                  child: _buildEmptyState(
                    icon: LucideIcons.package,
                    title: 'لا توجد أقسام فرعية حالياً',
                    subtitle: 'تقدر تبدأ طلب عام من القسم الرئيسي قريباً.',
                  ),
                )
              else
                Expanded(
                  child: GridView.builder(
                    physics: const BouncingScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      childAspectRatio: 0.88,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                    ),
                    itemCount: subcategories.length,
                    itemBuilder: (context, index) => _buildSubCategoryCard(subcategories[index]),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubCategoryCard(Category subcategory) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          AppPageTransitions.slideTransition(
            page: CreateRequestPage(initialCategory: subcategory),
          ),
        );
      },
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: AppColors.surfaceVariant.withValues(alpha: 0.5),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                subcategory.iconData,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            const Spacer(),
            Text(
              subcategory.name,
              style: AppTypography.labelLarge.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              subcategory.hintText,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontSize: 12,
                height: 1.1,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
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
                onPressed: () => context.read<CategoryBloc>().add(LoadCategories()),
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

  Widget _buildCategoriesSkeleton() {
    return Row(
      children: [
        Container(
          width: 112,
          color: Colors.white,
          padding: const EdgeInsets.all(10),
          child: Column(
            children: List.generate(6, (index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _skeletonBox(height: 82, borderRadius: 14),
              );
            }),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: GridView.builder(
              itemCount: 6,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.88,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemBuilder: (context, index) => _skeletonBox(borderRadius: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _skeletonBox({double? height, double borderRadius = 16}) {
    return SkeletonLoading(
      width: double.infinity,
      height: height ?? double.infinity,
      borderRadius: borderRadius,
    );
  }
}


