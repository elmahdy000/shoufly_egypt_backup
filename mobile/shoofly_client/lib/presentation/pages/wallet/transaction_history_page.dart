import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/wallet_transaction.dart';
import 'package:shoofly_core/presentation/blocs/wallet/wallet_bloc.dart';
import 'package:shoofly_core/presentation/widgets/empty_state.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';

class TransactionHistoryPage extends StatefulWidget {
  const TransactionHistoryPage({super.key});

  @override
  State<TransactionHistoryPage> createState() => _TransactionHistoryPageState();
}

class _TransactionHistoryPageState extends State<TransactionHistoryPage> {
  @override
  void initState() {
    super.initState();
    // Load transactions when page opens
    context.read<WalletBloc>().add(LoadWalletTransactions());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('سجل العمليات', style: AppTypography.h3),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: BlocBuilder<WalletBloc, WalletState>(
        builder: (context, state) {
          if (state is WalletLoading) {
            return const ListSkeletonLoading(padding: EdgeInsets.all(20));
          } else if (state is WalletTransactionsLoaded) {
            if (state.transactions.isEmpty) {
              return EmptyState.noOrders(
                title: 'لا توجد عمليات',
                subtitle: 'لم تقم بأي عمليات مالية بعد. ابدأ بشحن محفظتك!',
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<WalletBloc>().add(LoadWalletTransactions());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: state.transactions.length,
                itemBuilder: (context, index) {
                  final transaction = state.transactions[index];
                  return _buildTransactionCard(transaction);
                },
              ),
            );
          } else if (state is WalletError) {
            return EmptyState.error(
              subtitle: state.message,
              onActionPressed: () => context.read<WalletBloc>().add(LoadWalletTransactions()),
              actionLabel: 'إعادة المحاولة',
            );
          }
          return const LoadingState(message: 'جاري التحميل...');
        },
      ),
    );
  }

  Widget _buildTransactionCard(WalletTransaction transaction) {
    final isCredit = transaction.type == TransactionType.CREDIT;
    final isPayment = transaction.type == TransactionType.PAYMENT;
    final isTopUp = transaction.type == TransactionType.TOP_UP;
    
    Color amountColor;
    IconData icon;
    String typeLabel;
    
    if (isCredit || isTopUp) {
      amountColor = AppColors.success;
      icon = LucideIcons.arrowDownLeft;
      typeLabel = isTopUp ? 'شحن محفظة' : 'استرداد';
    } else if (isPayment) {
      amountColor = AppColors.error;
      icon = LucideIcons.arrowUpRight;
      typeLabel = 'دفع طلب';
    } else {
      amountColor = AppColors.textPrimary;
      icon = LucideIcons.minus;
      typeLabel = 'عملية';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Transaction Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: amountColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: amountColor, size: 20),
          ),
          const SizedBox(width: 16),
          
          // Transaction Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      typeLabel,
                      style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${isCredit || isTopUp ? '+' : '-'} ${transaction.amount.toStringAsFixed(2)} ج.م',
                      style: AppTypography.labelLarge.copyWith(
                        color: amountColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (transaction.description != null && transaction.description!.isNotEmpty)
                  Text(
                    transaction.description!,
                    style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      LucideIcons.calendar,
                      size: 12,
                      color: AppColors.textDisabled,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(transaction.createdAt),
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.textDisabled,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Status badge
                    if (transaction.status != null)
                      _buildTransactionStatusBadge(transaction.status!),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionStatusBadge(TransactionStatus status) {
    Color color;
    String text;
    
    switch (status) {
      case TransactionStatus.COMPLETED:
        color = AppColors.success;
        text = 'مكتمل';
        break;
      case TransactionStatus.PENDING:
        color = AppColors.warning;
        text = 'قيد المعالجة';
        break;
      case TransactionStatus.FAILED:
        color = AppColors.error;
        text = 'فاشل';
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: AppTypography.labelSmall.copyWith(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCompare = DateTime(date.year, date.month, date.day);
    
    if (dateToCompare == today) {
      return 'اليوم ${_formatTime(date)}';
    } else if (dateToCompare == yesterday) {
      return 'أمس ${_formatTime(date)}';
    } else {
      return '${date.day}/${date.month}/${date.year} ${_formatTime(date)}';
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
