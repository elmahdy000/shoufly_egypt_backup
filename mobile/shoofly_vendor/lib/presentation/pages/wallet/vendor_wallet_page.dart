import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/di/injection.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/features/vendor/data/vendor_service.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';
import 'package:shoofly_core/core/widgets/shimmer_placeholder.dart';
import 'package:shoofly_core/domain/entities/vendor_transaction.dart';
import 'package:shoofly_core/presentation/widgets/empty_state.dart';
import 'package:shoofly_core/presentation/widgets/modern_charts.dart';

class VendorWalletPage extends StatefulWidget {
  const VendorWalletPage({super.key});

  @override
  State<VendorWalletPage> createState() => _VendorWalletPageState();
}

class _VendorWalletPageState extends State<VendorWalletPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadData() {
    context.read<VendorBloc>().add(LoadVendorProfile());
    context.read<VendorBloc>().add(LoadVendorTransactions());
  }

  Future<void> _refresh() async {
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: ModernAppBar(
        title: 'المحفظة والأرباح',
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
      ),
      body: BlocConsumer<VendorBloc, VendorState>(
        listener: (context, state) {
          if (state.withdrawalSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم إرسال طلب السحب بنجاح'),
                backgroundColor: AppColors.success,
              ),
            );
            _refresh();
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.vendorTransactions.isEmpty && state.vendorProfile == null) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  ShimmerPlaceholder.card(height: 180, borderRadius: 28),
                  const SizedBox(height: 24),
                  ShimmerPlaceholder.card(height: 200, borderRadius: 24),
                  const SizedBox(height: 24),
                  ShimmerPlaceholder.list(count: 4, height: 80, spacing: 12),
                ],
              ),
            );
          }

          if (state.error != null && state.vendorTransactions.isEmpty && state.vendorProfile == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      LucideIcons.circleAlert,
                      color: AppColors.error,
                      size: 44,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      state.error!,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyMedium,
                    ),
                    TextButton(
                      onPressed: _refresh,
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            );
          }

          final profile = state.vendorProfile;
          final walletBalance = profile?.walletBalance ?? 0.0;
          final stats = profile?.stats ?? {};
          final overview = stats['overview'] as Map<String, dynamic>? ?? {};
          final totalRevenue = double.tryParse(overview['totalRevenue']?.toString() ?? '') ?? 0.0;

          final filteredTransactions = state.vendorTransactions.where((t) {
            final query = _searchQuery.toLowerCase();
            return _transactionTitle(t.type).toLowerCase().contains(query) ||
                (t.description?.toLowerCase().contains(query) ?? false) ||
                t.type.toLowerCase().contains(query);
          }).toList();

          return RefreshIndicator(
            onRefresh: _refresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      AppAnimations.fadeIn(child: _buildBalanceCard(walletBalance, totalRevenue)),
                      const SizedBox(height: 24),
                      AppAnimations.fadeIn(child: _buildEarningsSummary(state.vendorTransactions)),
                      const SizedBox(height: 24),
                      ModernButton(
                        text: 'طلب سحب أرباح',
                        icon: Icons.north_east_rounded,
                        isLoading: state.isLoading,
                        onPressed: walletBalance >= 50
                            ? () => _showWithdrawalSheet(walletBalance)
                            : null,
                      ),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'آخر العمليات',
                            style: AppTypography.h4.copyWith(fontWeight: FontWeight.w700),
                          ),
                          if (state.vendorTransactions.isNotEmpty)
                            IconButton(
                              onPressed: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (context) => _buildSearchSheet(),
                                );
                              },
                              icon: const Icon(LucideIcons.search, size: 20),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ]),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: _buildSliverTransactionsList(filteredTransactions),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showWithdrawalSheet(double maxBalance) {
    final amountController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color ?? Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.textDisabled.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'طلب سحب أرباح',
                    style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'الرصيد المتاح: ${maxBalance.toStringAsFixed(2)} ج.م',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ModernTextField(
                    label: 'المبلغ المطلوب سحبه (ج.م)',
                    hint: 'أدخل المبلغ (الحد الأدنى 50 ج.م)',
                    controller: amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    prefixIcon: Icons.payments_rounded,
                  ),
                  const SizedBox(height: 24),
                  ModernButton(
                    text: 'تأكيد طلب السحب',
                    isLoading: isSubmitting,
                    onPressed: () async {
                      final amount = double.tryParse(amountController.text.trim());
                      if (amount == null || amount < 50) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('الحد الأدنى للسحب هو 50 ج.م'),
                            backgroundColor: AppColors.error,
                          ),
                        );
                        return;
                      }
                      if (amount > maxBalance) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('المبلغ أكبر من الرصيد المتاح'),
                            backgroundColor: AppColors.error,
                          ),
                        );
                        return;
                      }
                      setSheetState(() => isSubmitting = true);
                      try {
                        await sl<VendorService>().requestWithdrawal(amount);
                        if (mounted) {
                          Navigator.pop(sheetContext);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('تم إرسال طلب السحب بنجاح'),
                              backgroundColor: AppColors.success,
                            ),
                          );
                          _refresh();
                        }
                      } catch (e) {
                        setSheetState(() => isSubmitting = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('فشل طلب السحب: ${e.toString()}'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      }
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBalanceCard(double walletBalance, double totalRevenue) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.borderColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الرصيد المتاح',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textDisabled,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${walletBalance.toStringAsFixed(2)} ج.م',
                      style: AppTypography.h1.copyWith(
                        color: AppColors.primary,
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.account_balance_wallet_rounded, color: AppColors.primary, size: 24),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'إجمالي الأرباح المحققة',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    '${totalRevenue.toStringAsFixed(2)} ج.م',
                    style: AppTypography.labelMedium.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
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

  Widget _buildTrendIndicator(bool isUp) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isUp ? LucideIcons.trendingUp : LucideIcons.trendingDown,
          color: isUp ? AppColors.success : AppColors.error,
          size: 14,
        ),
        const SizedBox(width: 4),
        Text(
          isUp ? '+12%' : '-5%',
          style: AppTypography.labelSmall.copyWith(
            color: isUp ? AppColors.success : AppColors.error,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsSummary(List<VendorTransaction> transactions) {
    final days = ['سبت', 'أحد', 'اثني', 'ثلاث', 'أربع', 'خميس', 'جمعة'];
    final data = [400.0, 700.0, 550.0, 900.0, 1200.0, 850.0, 600.0];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'ملخص الأرباح',
              style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'آخر 7 أيام',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ModernCard(
          padding: const EdgeInsets.fromLTRB(16, 32, 16, 20),
          borderRadius: 24,
          child: ModernBarChart(
            data: data,
            labels: days,
            height: 160,
          ),
        ),
      ],
    );
  }

  Widget _buildSliverTransactionsList(List<VendorTransaction> transactions) {
    if (transactions.isEmpty) {
      return SliverToBoxAdapter(
        child: EmptyState(
          icon: LucideIcons.receiptText,
          title: 'لا توجد عمليات حالياً',
          subtitle: 'سيتم تسجيل أي أرباح أو سحوبات هنا',
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final tx = transactions[index];
          final amount = tx.amount;
          final createdAt = tx.createdAt;
          final type = tx.type;

          final isCredit = amount >= 0;
          final iconColor = isCredit ? AppColors.success : AppColors.error;
          final txIcon = isCredit ? LucideIcons.arrowDownLeft : LucideIcons.arrowUpRight;

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ModernCard(
              padding: const EdgeInsets.all(16),
              borderRadius: 20,
              elevation: 0,
              borderColor: Theme.of(context).dividerColor,
              backgroundColor: Theme.of(context).cardTheme.color,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: iconColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(txIcon, color: iconColor, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _transactionTitle(type),
                          style: AppTypography.labelLarge.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          DateFormat(
                            'd MMMM yyyy - h:mm a',
                            'ar',
                          ).format(createdAt),
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.textDisabled,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${isCredit ? '+' : ''}${amount.toStringAsFixed(0)} ج.م',
                    style: AppTypography.labelLarge.copyWith(
                      color: iconColor,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        childCount: transactions.length,
      ),
    );
  }

  String _transactionTitle(String type) {
    switch (type) {
      case 'VENDOR_PAYOUT':
        return 'أرباح طلب';
      case 'REFUND_TO_VENDOR':
        return 'استرداد للمورد';
      case 'WITHDRAWAL':
        return 'سحب أرباح';
      case 'SETTLEMENT':
        return 'تسوية';
      default:
        return 'عملية مالية';
    }
  }

  double _toDouble(dynamic value) {
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  Widget _buildSearchSheet() {
    return StatefulBuilder(
      builder: (context, setSheetState) {
        return Container(
          padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).viewInsets.bottom + 32),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                    color: AppColors.textDisabled.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'البحث في العمليات',
                style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              ModernTextField(
                label: 'كلمة البحث',
                hint: 'مثلاً: سحب، شحن، طلب...',
                controller: _searchController,
                onChanged: (val) {
                  setState(() => _searchQuery = val);
                },
                prefixIcon: LucideIcons.search,
              ),
              const SizedBox(height: 24),
              ModernButton(
                text: 'إغلاق',
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }
}
