import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';

class ShooflyBottomNavItem {
  final IconData icon;
  final String label;

  const ShooflyBottomNavItem({
    required this.icon,
    required this.label,
  });
}

class ShooflyBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<ShooflyBottomNavItem> items;
  
  // Customization constants as per user request
  final double totalHeight = 100;
  final double bodyHeight = 80;
  final double horizontalMargin = 20;
  final double bottomMargin = 16;
  final double borderRadius = 32;
  final double activeCircleSize = 58;
  final double inactiveIconSize = 22;
  final double activeIconSize = 26;

  const ShooflyBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  }) : assert(items.length >= 2 && items.length <= 5);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        height: totalHeight,
        width: double.infinity,
        margin: EdgeInsets.only(bottom: bottomMargin),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double width = constraints.maxWidth - (horizontalMargin * 2);
            final double itemWidth = width / items.length;
            
            // Calculate active circle position
            // In RTL, the index logic is inverted for position
            final bool isRtl = Directionality.of(context) == TextDirection.rtl;
            final double activePosition = isRtl 
                ? (items.length - 1 - currentIndex) * itemWidth
                : currentIndex * itemWidth;

            return Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                // Navbar Body
                Container(
                  width: width,
                  height: bodyHeight,
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardTheme.color,
                    borderRadius: BorderRadius.circular(borderRadius),
                    border: Border.all(color: AppColors.borderColor, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.shadow.withValues(alpha: 0.06),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: List.generate(items.length, (index) {
                      final isSelected = currentIndex == index;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            if (!isSelected) {
                              HapticFeedback.lightImpact();
                              onTap(index);
                            }
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Semantics(
                            label: items[index].label,
                            selected: isSelected,
                            button: true,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                // Inactive icon slot
                                SizedBox(
                                  height: 44,
                                  child: Center(
                                    child: AnimatedOpacity(
                                      duration: const Duration(milliseconds: 250),
                                      opacity: isSelected ? 0.0 : 1.0,
                                      child: Icon(
                                        items[index].icon,
                                        color: AppColors.textDisabled,
                                        size: inactiveIconSize,
                                      ),
                                    ),
                                  ),
                                ),
                                // Label
                                Text(
                                  items[index].label,
                                  style: AppTypography.labelSmall.copyWith(
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                // Active indicator dot
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  width: isSelected ? 4 : 0,
                                  height: isSelected ? 4 : 0,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(height: 8),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),

                // Floating Active Circle
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.elasticOut,
                  left: activePosition + horizontalMargin + (itemWidth - activeCircleSize) / 2,
                  bottom: bodyHeight - (activeCircleSize / 1.6),
                  child: IgnorePointer(
                    child: Container(
                      width: activeCircleSize,
                      height: activeCircleSize,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.22),
                            blurRadius: 15,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Center(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                          child: Icon(
                            items[currentIndex].icon,
                            key: ValueKey('active_icon_$currentIndex'),
                            color: Colors.white,
                            size: activeIconSize,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}