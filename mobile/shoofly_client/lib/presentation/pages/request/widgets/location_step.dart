import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'map_picker_page.dart';

class LocationStep extends StatelessWidget {
  final LocationResult? selectedLocation;
  final TextEditingController phoneController;
  final Function(LocationResult) onLocationChanged;

  const LocationStep({
    super.key,
    required this.selectedLocation,
    required this.phoneController,
    required this.onLocationChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('مكان التوصيل', style: AppTypography.h2.copyWith(
            fontSize: 28,
            color: theme.textTheme.titleLarge?.color,
          )),
          const SizedBox(height: 8),
          Text(
            'فين تحب نستلم أو نسلم الطلب؟', 
            style: AppTypography.bodyMedium.copyWith(color: theme.textTheme.bodyMedium?.color),
          ),
          const SizedBox(height: 40),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.surfaceVariant.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                GestureDetector(
                  onTap: () async {
                    final result = await Navigator.push<LocationResult>(
                      context,
                      AppPageTransitions.slideTransition(
                        page: const MapPickerPage(),
                      ),
                    );
                    if (result != null) {
                      onLocationChanged(result);
                    }
                  },
                  child: _buildLocationOption(
                    context,
                    LucideIcons.mapPin,
                    'موقع التسليم',
                    selectedLocation != null
                        ? '${selectedLocation!.governorate?.nameAr ?? ''} - ${selectedLocation!.city?.nameAr ?? ''}\n${selectedLocation!.address}'
                        : 'اضغط لتحديد العنوان والمحافظة من الخريطة',
                    selectedLocation != null,
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Divider(height: 1, color: AppColors.surfaceVariant),
                ),
                _buildPhoneInput(context),
              ],
            ),
          ),

          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.info,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'سيتم إرسال طلبك إلى أكثر من 50 مورد معتمد في منطقتك.',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationOption(
      BuildContext context, IconData icon, String title, String subtitle, bool isSelected) {
    final theme = Theme.of(context);
    
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.1)
                : AppColors.surfaceVariant.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(
            icon,
            color: isSelected ? AppColors.primary : theme.textTheme.bodyLarge?.color,
            size: 20,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.labelLarge.copyWith(color: theme.textTheme.titleMedium?.color)),
              Text(
                subtitle,
                style: AppTypography.bodySmall.copyWith(
                  color: isSelected ? AppColors.primary : AppColors.textDisabled,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const Icon(
          LucideIcons.chevronLeft,
          color: AppColors.textDisabled,
          size: 18,
        ),
      ],
    );
  }

  Widget _buildPhoneInput(BuildContext context) {
    final theme = Theme.of(context);
    
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(
            LucideIcons.phone,
            color: theme.textTheme.bodyLarge?.color,
            size: 20,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('رقم تليفون للتواصل', style: AppTypography.labelLarge.copyWith(color: theme.textTheme.titleMedium?.color)),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                style: AppTypography.labelMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.textTheme.bodyLarge?.color,
                ),
                decoration: const InputDecoration(
                  hintText: '01xxxxxxxxx',
                  hintStyle: TextStyle(color: AppColors.textDisabled),
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 8),
                  border: InputBorder.none,
                  prefixIcon: Padding(
                    padding: EdgeInsetsDirectional.only(end: 8),
                    child: Text('🇪🇬', style: TextStyle(fontSize: 20)),
                  ),
                  prefixIconConstraints: BoxConstraints(
                    minWidth: 0,
                    minHeight: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
