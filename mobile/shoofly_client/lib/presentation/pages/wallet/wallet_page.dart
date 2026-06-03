import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/wallet_transaction.dart';
import 'package:shoofly_core/presentation/blocs/wallet/wallet_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'transaction_history_page.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  final TextEditingController _amountController = TextEditingController();

  static const _minDeposit = 50.0;
  static const _quickAmounts = [100.0, 200.0, 500.0, 1000.0];

  @override
  void initState() {
    super.initState();
    // Auto-load balance + recent transactions whenever the page opens
    context.read<WalletBloc>().add(LoadWalletBalance());
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  void _showTopUpModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (modalContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 24,
                left: 24,
                right: 24,
                top: 32,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  Text('شحن المحفظة', style: AppTypography.h3),
                  const SizedBox(height: 6),
                  Text(
                    'الحد الأدنى للشحن $_minDeposit ج.م',
                    style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 20),
                  // Quick-select amounts
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _quickAmounts.map((amount) {
                      final isSelected = _amountController.text == amount.toInt().toString();
                      return GestureDetector(
                        onTap: () {
                          setSheetState(() {
                            _amountController.text = amount.toInt().toString();
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.primary.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${amount.toInt()} ج.م',
                            style: AppTypography.labelSmall.copyWith(
                              color: isSelected ? Colors.white : AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setSheetState(() {}),
                    decoration: InputDecoration(
                      hintText: 'أو أدخل مبلغاً آخر',
                      suffixText: 'ج.م',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final amount = double.tryParse(_amountController.text.trim());
                        if (amount == null || amount < _minDeposit) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('الحد الأدنى للشحن هو ${_minDeposit.toInt()} ج.م'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                          return;
                        }
                        Navigator.pop(modalContext);
                        context.read<WalletBloc>().add(TopUpWallet(amount));
                      },
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(0, 56),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('المتابعة للدفع'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('المحفظة', style: AppTypography.h3),
        centerTitle: true,
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        foregroundColor: Theme.of(context).appBarTheme.foregroundColor,
        elevation: 0,
      ),
      body: BlocConsumer<WalletBloc, WalletState>(
        listener: (context, state) async {
          if (state is WalletTopUpRedirect) {
            final url = Uri.parse(state.redirectUrl);
            if (await canLaunchUrl(url)) {
              await launchUrl(url, mode: LaunchMode.externalApplication);
            } else {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('لا يمكن فتح رابط الدفع')),
                );
              }
            }
          } else if (state is WalletError) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.message)),
              );
            }
          }
        },
        builder: (context, state) {
          double balance = 0.0;
          bool isLoading = state is WalletLoading;

          List<WalletTransaction> recentTransactions = const [];
          if (state is WalletLoaded) {
            balance = state.wallet.balance;
            recentTransactions = state.recentTransactions;
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<WalletBloc>().add(LoadWalletBalance());
            },
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                // Balance Card
                Container(
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
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('الرصيد المتاح', style: AppTypography.labelLarge.copyWith(color: Colors.white.withValues(alpha: 0.9))),
                          const Icon(LucideIcons.wallet, color: Colors.white, size: 24),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (isLoading)
                        const CircularProgressIndicator(color: Colors.white)
                      else
                        Text(
                          '${balance.toStringAsFixed(2)} ج.م',
                          style: AppTypography.h1.copyWith(color: Colors.white, fontSize: 38),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Actions
                Row(
                  children: [
                    Expanded(
                      child: _buildActionCard(
                        icon: Icons.add_circle_outline_rounded,
                        label: 'شحن الرصيد',
                        onTap: () => _showTopUpModal(context),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildActionCard(
                        icon: Icons.history_rounded,
                        label: 'سجل العمليات',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const TransactionHistoryPage(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 40),

                // Recent transactions header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('آخر العمليات', style: AppTypography.h3),
                    if (recentTransactions.isNotEmpty)
                      TextButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const TransactionHistoryPage()),
                        ),
                        child: Text(
                          'عرض الكل',
                          style: AppTypography.labelSmall.copyWith(color: AppColors.primary),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),

                if (isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (recentTransactions.isEmpty)
                  Center(
                    child: Column(
                      children: [
                        const SizedBox(height: 40),
                        Icon(LucideIcons.fileClock, color: AppColors.textDisabled, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          'لا توجد عمليات سابقة',
                          style: AppTypography.bodyMedium.copyWith(color: AppColors.textDisabled),
                        ),
                      ],
                    ),
                  )
                else
                  ...recentTransactions.map((tx) => _buildRecentTransactionRow(tx)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecentTransactionRow(WalletTransaction tx) {
    final isIncoming = tx.type == TransactionType.CREDIT || tx.type == TransactionType.TOP_UP;
    final amountColor = isIncoming ? AppColors.success : AppColors.error;
    final icon = isIncoming ? LucideIcons.arrowDownLeft : LucideIcons.arrowUpRight;
    final typeLabel = switch (tx.type) {
      TransactionType.TOP_UP => 'شحن محفظة',
      TransactionType.CREDIT => 'استرداد',
      TransactionType.PAYMENT => 'دفع طلب',
      _ => 'عملية',
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerTheme.color!.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: amountColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: amountColor, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(typeLabel, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700)),
                if (tx.description != null && tx.description!.isNotEmpty)
                  Text(
                    tx.description!,
                    style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isIncoming ? '+' : '-'}${tx.amount.toStringAsFixed(2)} ج.م',
                style: AppTypography.labelLarge.copyWith(color: amountColor, fontWeight: FontWeight.w800),
              ),
              Text(
                _formatRelativeDate(tx.createdAt),
                style: AppTypography.labelSmall.copyWith(color: AppColors.textDisabled, fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateDay = DateTime(date.year, date.month, date.day);
    if (dateDay == today) {
      return 'اليوم ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
    if (today.difference(dateDay).inDays == 1) {
      return 'أمس';
    }
    return '${date.day}/${date.month}/${date.year}';
  }

  Widget _buildActionCard({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).dividerTheme.color!),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primary, size: 28),
            ),
            const SizedBox(height: 12),
            Text(label, style: AppTypography.labelLarge),
          ],
        ),
      ),
    );
  }
}
