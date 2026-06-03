import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/request.dart';

class RequestPreviewCard extends StatelessWidget {
  final Request request;

  const RequestPreviewCard({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildThumbnail(),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildStatusChip(),
                const SizedBox(height: 4),
                Text(
                  request.title,
                  style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  request.description,
                  style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                _buildActionRow(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThumbnail() {
    final imageUrl = request.images.isNotEmpty ? AppConfig.getImageUrl(request.images.first) : '';
    
    return Container(
      width: 90,
      height: 100,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
        image: imageUrl.isNotEmpty
            ? DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover)
            : null,
      ),
      child: imageUrl.isEmpty
          ? Icon(
              LucideIcons.package,
              color: AppColors.primary,
              size: 32,
            )
          : null,
    );
  }

  Widget _buildStatusChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'متاح للمزايدة',
        style: AppTypography.labelSmall.copyWith(
          color: AppColors.primary,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildActionRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.mapPin, color: AppColors.textDisabled, size: 14),
            const SizedBox(width: 4),
            Text(
              request.address?.split(',').first ?? 'مصر',
              style: AppTypography.bodySmall.copyWith(fontSize: 13),
            ),
          ],
        ),
        ElevatedButton(
          onPressed: () {
            // Future: Navigate to request details
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minimumSize: Size.zero,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: const Text('التفاصيل', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
