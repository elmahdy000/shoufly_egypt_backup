import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/di/injection.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/features/vendor/data/vendor_service.dart';

class VendorNotificationsPage extends StatefulWidget {
  const VendorNotificationsPage({super.key});

  @override
  State<VendorNotificationsPage> createState() =>
      _VendorNotificationsPageState();
}

class _VendorNotificationsPageState extends State<VendorNotificationsPage> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = sl<VendorService>().getNotifications();
  }

  Future<void> _refresh() async {
    final future = sl<VendorService>().getNotifications();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: ModernAppBar(
        title: 'الإشعارات',
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.wifiOff,
                        color: AppColors.error,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'تعذّر تحميل الإشعارات',
                      style: AppTypography.labelLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      snapshot.error.toString(),
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 20),
                    ModernButton(
                      text: 'إعادة المحاولة',
                      fullWidth: false,
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      onPressed: _refresh,
                    ),
                  ],
                ),
              ),
            );
          }

          final notifications = snapshot.data ?? const [];

          if (notifications.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.bellOff,
                        color: AppColors.primary,
                        size: 48,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'لا توجد إشعارات حالياً',
                      style: AppTypography.labelLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'ستصلك إشعارات عند وصول طلبات أو تحديثات جديدة',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item =
                    notifications[index] as Map<String, dynamic>? ?? const {};
                return _buildNotificationCard(item);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> item) {
    final isRead = item['isRead'] == true;
    final createdAt = DateTime.tryParse(item['createdAt']?.toString() ?? '');
    final type = item['type']?.toString() ?? '';

    final iconData = _iconForType(type);
    final iconColor = _colorForType(type);

    return ModernCard(
      onTap: () async {
        final id = int.tryParse(item['id']?.toString() ?? '');
        if (id != null && !isRead) {
          await sl<VendorService>().markNotificationRead(id);
          await _refresh();
        }
      },
      elevation: 0,
      borderColor: isRead
          ? Theme.of(context).dividerColor
          : AppColors.primary.withOpacity(0.25),
      backgroundColor: isRead
          ? Theme.of(context).cardTheme.color
          : AppColors.primary.withOpacity(0.04),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(iconData, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['title']?.toString() ?? 'إشعار',
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item['message']?.toString() ?? '',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                if (createdAt != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    DateFormat('d MMMM yyyy - h:mm a', 'ar').format(createdAt),
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textDisabled,
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (!isRead) ...[
            const SizedBox(width: 8),
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 4),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'NEW_REQUEST':
        return LucideIcons.packagePlus;
      case 'BID_SELECTED':
        return LucideIcons.circleCheck;
      case 'BID_REJECTED':
        return LucideIcons.circleX;
      case 'ORDER_PAID':
        return LucideIcons.creditCard;
      case 'ORDER_DELIVERED':
        return LucideIcons.packageCheck;
      case 'WITHDRAWAL_APPROVED':
        return LucideIcons.wallet;
      case 'WITHDRAWAL_REJECTED':
        return LucideIcons.walletMinimal;
      case 'SYSTEM':
        return LucideIcons.info;
      default:
        return LucideIcons.bell;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'NEW_REQUEST':
        return AppColors.info;
      case 'BID_SELECTED':
      case 'ORDER_DELIVERED':
        return AppColors.success;
      case 'BID_REJECTED':
      case 'WITHDRAWAL_REJECTED':
        return AppColors.error;
      case 'ORDER_PAID':
      case 'WITHDRAWAL_APPROVED':
        return AppColors.success;
      case 'SYSTEM':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }
}
