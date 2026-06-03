import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';

class ImageStep extends StatelessWidget {
  final List<Map<String, dynamic>> uploadedImages;
  final bool isUploading;
  final VoidCallback onAddImage;
  final Function(int) onDeleteImage;
  final VoidCallback onSkip;

  const ImageStep({
    super.key,
    required this.uploadedImages,
    required this.isUploading,
    required this.onAddImage,
    required this.onDeleteImage,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'إيه اللي بتدور عليه؟',
            style: AppTypography.h2.copyWith(
              fontSize: 28,
              color: theme.textTheme.titleLarge?.color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'ارفع صورة للمنتج أو الخدمة عشان نسهل على الموردين فهم طلبك.',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.textTheme.bodyMedium?.color,
            ),
          ),
          const SizedBox(height: 40),
          _buildUploadArea(context),
          const SizedBox(height: 32),
          if (uploadedImages.isNotEmpty || isUploading) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'صور الطلب (${uploadedImages.length}/5)',
                  style: AppTypography.labelLarge.copyWith(color: theme.textTheme.titleMedium?.color),
                ),
                if (uploadedImages.length < 5)
                  TextButton.icon(
                    onPressed: isUploading ? null : onAddImage,
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('إضافة'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.primary),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: uploadedImages.length + (isUploading ? 1 : 0),
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  if (index >= uploadedImages.length) {
                    return _buildUploadingPreviewCard(context);
                  }
                  return _buildImageCard(context, index);
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
          Center(
            child: TextButton(
              onPressed: isUploading ? null : onSkip,
              child: Text(
                'تخطي وإضافة تفاصيل نصية فقط',
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.textDisabled,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadArea(BuildContext context) {
    final theme = Theme.of(context);
    
    return AbsorbPointer(
      absorbing: isUploading,
      child: GestureDetector(
        onTap: onAddImage,
        child: Stack(
          children: [
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.02),
                    AppColors.primary.withValues(alpha: 0.08),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  width: 1.5,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Icon(
                      isUploading
                          ? LucideIcons.loader
                          : LucideIcons.imagePlus,
                      color: AppColors.primary,
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    isUploading
                        ? 'جاري تجهيز الصورة...'
                        : 'إضافة صور مميزة لطلبك',
                    style: AppTypography.labelLarge.copyWith(
                      color: theme.textTheme.titleMedium?.color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isUploading
                        ? 'بنرفع الصورة ونجهز المعاينة حالاً.'
                        : 'صور أكتر = عروض أسعار أدق',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textDisabled,
                    ),
                  ),
                ],
              ),
            ),
            if (isUploading)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    color: theme.cardColor.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: const Center(
                    child: SizedBox(
                      width: 30,
                      height: 30,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.8,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageCard(BuildContext context, int index) {
    final theme = Theme.of(context);
    
    return Container(
      width: 120,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.network(
              AppConfig.getImageUrl(
                uploadedImages[index]['filePath']?.toString(),
              ),
              width: 120,
              height: 120,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  width: 120,
                  height: 120,
                  color: theme.cardColor,
                  alignment: Alignment.center,
                  child: const CircularProgressIndicator(strokeWidth: 2),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 120,
                  height: 120,
                  color: theme.cardColor,
                  alignment: Alignment.center,
                  child: const Icon(
                    LucideIcons.imageOff,
                    color: AppColors.textDisabled,
                    size: 28,
                  ),
                );
              },
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: () => onDeleteImage(index),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadingPreviewCard(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      width: 120,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 2.4,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'جاري الرفع',
            textAlign: TextAlign.center,
            style: AppTypography.labelSmall.copyWith(
              color: theme.textTheme.bodyLarge?.color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
