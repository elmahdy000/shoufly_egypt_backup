import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/features/notifications/data/notification_stream_service.dart' as notification_service;
import 'package:shoofly_core/presentation/blocs/notification/notification_bloc.dart';
import 'notification_detail_page.dart';

class NotificationPage extends StatelessWidget {
  const NotificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('الإشعارات', style: AppTypography.h3),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: BlocBuilder<NotificationBloc, NotificationState>(
        builder: (context, state) {
          if (state is NotificationsUpdated) {
            if (state.notifications.isEmpty) {
              return _buildEmptyState();
            }
            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: state.notifications.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildNotificationCard(
                  context,
                  state.notifications[index],
                );
              },
            );
          }
          if (state is NotificationStreamError) {
            return _buildErrorState(context, state.message);
          }
          return _buildEmptyState();
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.bellOff, color: AppColors.textDisabled, size: 80),
          const SizedBox(height: 24),
          Text('لا توجد إشعارات حالياً', style: AppTypography.h3.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LucideIcons.wifiOff,
              color: AppColors.textDisabled,
              size: 72,
            ),
            const SizedBox(height: 20),
            Text(
              'تعذر تحميل الإشعارات',
              style: AppTypography.h3.copyWith(color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                context.read<NotificationBloc>().add(StartNotificationStream());
              },
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationCard(
    BuildContext context,
    notification_service.NotificationEvent notification,
  ) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        if (!notification.isRead) {
          context.read<NotificationBloc>().add(MarkAsRead(notification.id));
        }
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => NotificationDetailPage(notification: notification),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: notification.isRead ? Colors.white : AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: notification.isRead ? AppColors.surfaceVariant : AppColors.primary.withValues(alpha: 0.1)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _getTypeColor(notification.type).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(_getTypeIcon(notification.type), color: _getTypeColor(notification.type), size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(notification.message ?? '', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Text(_formatDate(notification.createdAt), style: AppTypography.labelSmall.copyWith(color: AppColors.textDisabled, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'NEW_BID':
        return LucideIcons.gavel;
      case 'REQUEST_ACCEPTED':
        return Icons.check_circle_rounded;
      case 'PAYMENT_RECEIVED':
        return LucideIcons.wallet;
      default:
        return LucideIcons.info;
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'NEW_BID':
        return AppColors.primary;
      case 'REQUEST_ACCEPTED':
        return AppColors.success;
      case 'PAYMENT_RECEIVED':
        return AppColors.info;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} ساعة';
    return '${date.day}/${date.month}/${date.year}';
  }
}
