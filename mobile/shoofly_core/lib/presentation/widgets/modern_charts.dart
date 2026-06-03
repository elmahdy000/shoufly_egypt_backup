import 'package:flutter/material.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';

class ModernBarChart extends StatelessWidget {
  final List<double> data;
  final List<String> labels;
  final double height;
  final Color? barColor;

  const ModernBarChart({
    super.key,
    required this.data,
    required this.labels,
    this.height = 200,
    this.barColor,
  });

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();

    final maxVal = data.reduce((a, b) => a > b ? a : b);
    final displayMax = maxVal == 0 ? 1.0 : maxVal * 1.2;

    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(data.length, (index) {
          final value = data[index];
          final percentage = value / displayMax;
          final label = labels[index];

          return Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: percentage),
                      duration: Duration(milliseconds: 800 + (index * 100)),
                      curve: Curves.easeOutQuart,
                      builder: (context, val, child) {
                        return Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                (barColor ?? AppColors.primary).withOpacity(0.8),
                                (barColor ?? AppColors.primary).withOpacity(0.1),
                              ],
                            ),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(12),
                              bottom: Radius.circular(4),
                            ),
                          ),
                          height: (height - 40) * val,
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: AppTypography.bodySmall.copyWith(
                    fontSize: 12,
                    color: AppColors.textDisabled,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
