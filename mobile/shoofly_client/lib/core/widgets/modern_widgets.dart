import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../animations/app_animations.dart';

/// Enhanced card widget with modern design
class ModernCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final double? elevation;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final BoxBorder? border;

  const ModernCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.elevation,
    this.backgroundColor,
    this.borderRadius,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        border: border ?? Border.all(
          color: AppColors.surfaceVariant.withValues(alpha: 0.5),
          width: 1,
        ),
        boxShadow: elevation != null && elevation! > 0
            ? [
                BoxShadow(
                  color: AppColors.shadow.withValues(alpha: 0.08),
                  blurRadius: elevation! * 4,
                  offset: Offset(0, elevation! * 2),
                ),
              ]
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return AppAnimations.bounceOnTap(
        onTap: onTap!,
        child: card,
      );
    }

    return card;
  }
}

/// Enhanced button with multiple styles
class ModernButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final bool isFullWidth;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? textColor;
  final double? height;
  final BorderRadius? borderRadius;

  const ModernButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.isFullWidth = true,
    this.icon,
    this.backgroundColor,
    this.textColor,
    this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final buttonHeight = height ?? 56.0;
    final bgColor = backgroundColor ?? AppColors.primary;
    final txtColor = textColor ?? (isOutlined ? bgColor : Colors.white);

    Widget buttonContent = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(txtColor),
            ),
          ),
          const SizedBox(width: 12),
        ] else if (icon != null) ...[
          Icon(icon, color: txtColor, size: 20),
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: AppTypography.labelLarge.copyWith(
            color: txtColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );

    final button = Container(
      width: isFullWidth ? double.infinity : null,
      height: buttonHeight,
      decoration: BoxDecoration(
        color: isOutlined ? Colors.transparent : bgColor,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        border: isOutlined
            ? Border.all(color: bgColor, width: 2)
            : null,
        boxShadow: !isOutlined
            ? [
                BoxShadow(
                  color: bgColor.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: borderRadius ?? BorderRadius.circular(16),
          child: Center(child: buttonContent),
        ),
      ),
    );

    return isLoading
        ? button
        : AppAnimations.bounceOnTap(
            onTap: onPressed ?? () {},
            child: button,
          );
  }
}

/// Enhanced text field with modern design
class ModernTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixTap;
  final bool obscureText;
  final TextInputType? keyboardType;
  final int? maxLines;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final bool enabled;
  final String? initialValue;

  const ModernTextField({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixTap,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
    this.enabled = true,
    this.initialValue,
  });

  @override
  State<ModernTextField> createState() => _ModernTextFieldState();
}

class _ModernTextFieldState extends State<ModernTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.labelText != null) ...[
          Text(
            widget.labelText!,
            style: AppTypography.labelMedium.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
        ],
        Container(
          decoration: BoxDecoration(
            color: widget.enabled ? Colors.white : AppColors.surfaceVariant.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.surfaceVariant.withValues(alpha: 0.5),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadow.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextFormField(
            controller: widget.controller,
            initialValue: widget.initialValue,
            obscureText: _obscureText,
            keyboardType: widget.keyboardType,
            maxLines: widget.maxLines,
            enabled: widget.enabled,
            validator: widget.validator,
            onChanged: widget.onChanged,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textPrimary,
            ),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: AppTypography.bodyMedium.copyWith(
                color: AppColors.textDisabled,
              ),
              prefixIcon: widget.prefixIcon != null
                  ? Icon(
                      widget.prefixIcon,
                      color: AppColors.textSecondary,
                      size: 20,
                    )
                  : null,
              suffixIcon: widget.suffixIcon != null || widget.obscureText
                  ? IconButton(
                      icon: Icon(
                        widget.obscureText
                            ? (_obscureText ? LucideIcons.eyeOff : LucideIcons.eye)
                            : widget.suffixIcon!,
                        color: AppColors.textSecondary,
                        size: 20,
                      ),
                      onPressed: widget.obscureText
                          ? () => setState(() => _obscureText = !_obscureText)
                          : widget.onSuffixTap,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Enhanced chip widget
class ModernChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onSelected;
  final Color? selectedColor;
  final Color? unselectedColor;
  final IconData? icon;

  const ModernChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onSelected,
    this.selectedColor,
    this.unselectedColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = selected
        ? (selectedColor ?? AppColors.primary)
        : (unselectedColor ?? AppColors.surfaceVariant);
    final textColor = selected ? Colors.white : AppColors.textPrimary;

    return AppAnimations.bounceOnTap(
      onTap: onSelected ?? () {},
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: bgColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, color: textColor, size: 16),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: textColor,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Enhanced bottom navigation bar
class ModernBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final List<BottomNavItem> items;

  const ModernBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isSelected = index == currentIndex;

            return Expanded(
              child: AppAnimations.bounceOnTap(
                onTap: () => onTap(index),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        item.icon,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                        size: isSelected ? 24 : 22,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: AppTypography.labelSmall.copyWith(
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class BottomNavItem {
  final IconData icon;
  final String label;

  const BottomNavItem({
    required this.icon,
    required this.label,
  });
}

/// Enhanced app bar
class ModernAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool showBackButton;
  final Color? backgroundColor;
  final double? elevation;

  const ModernAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.showBackButton = true,
    this.backgroundColor,
    this.elevation,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor ?? Colors.white,
      elevation: elevation ?? 0,
      automaticallyImplyLeading: false,
      title: Text(
        title,
        style: AppTypography.h3.copyWith(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: true,
      leading: showBackButton
          ? AppAnimations.bounceOnTap(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.arrowLeft,
                  color: AppColors.textPrimary,
                ),
              ),
            )
          : leading,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}