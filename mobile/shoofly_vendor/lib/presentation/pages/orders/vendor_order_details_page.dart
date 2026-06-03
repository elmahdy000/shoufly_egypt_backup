import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shoofly_core/presentation/pages/chat/chat_page.dart';

import '../home/widgets/submit_bid_modal.dart';

class VendorOrderDetailsPage extends StatelessWidget {
  final Request request;
  const VendorOrderDetailsPage({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    final hasLocation = request.latitude != null && request.longitude != null;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: ModernAppBar(
        title: 'تفاصيل الطلب',
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: 'طلب شوفلي #${request.id}\n${request.title}\n\n${request.description}'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم نسخ تفاصيل الطلب لمشاركتها', style: TextStyle(fontFamily: 'Cairo')), backgroundColor: AppColors.success),
              );
            },
            icon: const Icon(Icons.share_rounded, size: 20),
          ),
          IconButton(
            onPressed: () => _showMoreOptions(context),
            icon: const Icon(Icons.more_vert_rounded, size: 20),
          ),
          const SizedBox(width: 8),
        ],
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(
            LucideIcons.arrowRight,
            color: Theme.of(context).appBarTheme.foregroundColor,
            size: 22,
          ),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildImageHeader(context),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: AppAnimations.staggeredList(
                    staggerDelay: const Duration(milliseconds: 50),
                    children: [
                      _buildMainDetails(context),
                      const SizedBox(height: 16),
                      _buildDescriptionSection(context),
                      const SizedBox(height: 16),
                      _buildClientCard(context),
                      const SizedBox(height: 16),
                      if (hasLocation) _buildMapCard(context),
                      const SizedBox(height: 100), // Space for bottom button
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (request.status == RequestStatus.OPEN_FOR_BIDDING || 
              request.status == RequestStatus.BIDS_RECEIVED)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildBottomAction(context),
            ),
        ],
      ),
    );
  }

  Widget _buildImageHeader(BuildContext context) {
    if (request.images.isEmpty) {
      return Container(
        height: 200,
        width: double.infinity,
        color: AppColors.surfaceVariant.withOpacity(0.5),
        child: const Icon(LucideIcons.package, size: 64, color: AppColors.textDisabled),
      );
    }

    return SizedBox(
      height: 300,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: request.images.length,
            itemBuilder: (context, index) => Image.network(
              request.images[index],
              fit: BoxFit.cover,
              width: double.infinity,
            ),
          ),
          Positioned(
            bottom: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '1/${request.images.length}',
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                request.categoryNameAr ?? 'عام',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            _buildStatusBadge(request.status),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          request.title,
          style: AppTypography.h3.copyWith(fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(LucideIcons.clock, size: 14, color: AppColors.textDisabled),
            const SizedBox(width: 6),
            Text(
              'نُشر منذ قليل', // Should use a proper timeago formatter
              style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
            ),
            const Spacer(),
            Text(
              '#${request.id}',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textDisabled,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDescriptionSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'وصف الطلب',
          style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderColor),
          ),
          child: Text(
            request.description,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildClientCard(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 4, bottom: 12),
          child: Text(
            'معلومات الطلب',
            style: AppTypography.labelLarge.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ModernCard(
          padding: const EdgeInsets.all(20),
          borderRadius: 24,
          elevation: 0,
          borderColor: Theme.of(context).dividerColor,
          backgroundColor: Theme.of(context).cardTheme.color,
          child: Column(
            children: [
              _buildInfoRow(
                context,
                LucideIcons.user,
                'العميل',
                'عميل شوفلي #${request.userId}',
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),
              _buildInfoRow(
                context,
                LucideIcons.mapPin,
                'العنوان',
                request.address ?? 'غير محدد',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: AppColors.textSecondary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textDisabled,
                ),
              ),
              Text(
                value,
                style: AppTypography.labelLarge.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMapCard(BuildContext context) {
    return ModernCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      elevation: 0,
      borderColor: AppColors.borderColor,
      backgroundColor: Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.mapPin, color: Colors.red, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'موقع التوصيل',
                  style: AppTypography.labelMedium.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  request.address ?? 'القاهرة، مصر',
                  style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: _launchMap,
            child: const Text('الخريطة', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomAction(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: ModernButton(
              text: 'تقديم عرض سعر',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => SubmitBidModal(request: request),
                );
              },
            ),
          ),
          const SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(LucideIcons.messageCircle, color: AppColors.primary),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatPage(
                      partnerId: request.userId,
                      partnerName: 'عميل شوفلي #${request.userId}',
                      requestId: request.id,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(RequestStatus status) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _statusText(status),
        style: AppTypography.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Color _statusColor(RequestStatus status) {
    switch (status) {
      case RequestStatus.OPEN_FOR_BIDDING:
        return AppColors.info;
      case RequestStatus.BIDS_RECEIVED:
        return AppColors.primary;
      case RequestStatus.OFFERS_FORWARDED:
        return AppColors.primary;
      case RequestStatus.ORDER_PAID_PENDING_DELIVERY:
        return AppColors.success;
      case RequestStatus.CLOSED_SUCCESS:
        return AppColors.success;
      case RequestStatus.CLOSED_CANCELLED:
        return AppColors.error;
      case RequestStatus.REJECTED:
        return AppColors.error;
      case RequestStatus.PENDING_ADMIN_REVISION:
        return AppColors.warning;
    }
  }

  String _statusText(RequestStatus status) {
    switch (status) {
      case RequestStatus.OPEN_FOR_BIDDING:
        return 'متاح للعروض';
      case RequestStatus.BIDS_RECEIVED:
        return 'وصلت عروض';
      case RequestStatus.OFFERS_FORWARDED:
        return 'العروض مرسلة';
      case RequestStatus.ORDER_PAID_PENDING_DELIVERY:
        return 'مدفوع';
      case RequestStatus.CLOSED_SUCCESS:
        return 'مكتمل';
      case RequestStatus.CLOSED_CANCELLED:
        return 'ملغي';
      case RequestStatus.REJECTED:
        return 'مرفوض';
      case RequestStatus.PENDING_ADMIN_REVISION:
        return 'قيد المراجعة';
    }
  }

  Future<void> _launchMap() async {
    final url =
        'https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showMoreOptions(BuildContext context) {
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
          children: [
            ListTile(
              leading: const Icon(Icons.favorite_border_rounded),
              title: const Text('إضافة إلى المفضلة'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تمت الإضافة إلى المفضلة بنجاح', style: TextStyle(fontFamily: 'Cairo')), backgroundColor: AppColors.primary),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.report_gmailerrorred_rounded, color: AppColors.error),
              title: const Text('إبلاغ عن هذا الطلب', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
                _showReportDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }
  void _showReportDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('إبلاغ عن الطلب', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('ما هي المشكلة في هذا الطلب؟', style: TextStyle(fontFamily: 'Cairo')),
            const SizedBox(height: 16),
            TextField(
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'اكتب تفاصيل البلاغ هنا...',
                hintStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء', style: TextStyle(fontFamily: 'Cairo')),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم إرسال البلاغ للإدارة لمراجعته', style: TextStyle(fontFamily: 'Cairo')), backgroundColor: AppColors.success),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('إرسال البلاغ', style: TextStyle(fontFamily: 'Cairo')),
          ),
        ],
      ),
    );
  }
}
