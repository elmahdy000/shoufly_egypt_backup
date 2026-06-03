import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/presentation/blocs/vendor/vendor_bloc.dart';
import 'package:shoofly_core/domain/entities/request.dart';

class SubmitBidModal extends StatefulWidget {
  final Request request;
  const SubmitBidModal({super.key, required this.request});

  @override
  State<SubmitBidModal> createState() => _SubmitBidModalState();
}

class _SubmitBidModalState extends State<SubmitBidModal> {
  final _priceController = TextEditingController();
  final _durationController = TextEditingController();
  final _descriptionController = TextEditingController();

  /// Guards the listener so it only reacts to OUR submission, not stale state
  /// from a previous modal opening.
  bool _submitted = false;

  @override
  void dispose() {
    _priceController.dispose();
    _durationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<VendorBloc, VendorState>(
      listener: (context, state) {
        if (!_submitted) return;
        if (state.lastSubmittedBid != null && !state.isLoading) {
          _submitted = false;
          // Capture messenger before pop so we don't use a dead context
          final messenger = ScaffoldMessenger.of(context);
          Navigator.pop(context);
          messenger.showSnackBar(SnackBar(
            content: const Text('تم تقديم العرض بنجاح!', style: TextStyle(fontFamily: 'Cairo')),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ));
        } else if (state.error != null && !state.isLoading) {
          _submitted = false;
          _showSnackBar(state.error!, isError: true);
        }
      },
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(28),
          ),
          child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تقديم عرض سعر', style: AppTypography.h3.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              
              // Request Summary Card - No Gradient
              ModernCard(
                backgroundColor: AppColors.surfaceVariant,
                borderRadius: 20,
                elevation: 0,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(LucideIcons.package, color: AppColors.textSecondary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.request.title, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold)),
                          Text('طلب رقم #${widget.request.id}', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              AppAnimations.staggeredList(
                staggerDelay: const Duration(milliseconds: 50),
                children: [
                  ModernTextField(
                    label: 'السعر النهائي (ج.م)',
                    hint: 'مثال: ٥٠٠',
                    controller: _priceController,
                    prefixIcon: LucideIcons.banknote,
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 20),
                  ModernTextField(
                    label: 'مدة التوصيل / التنفيذ',
                    hint: 'مثال: خلال ساعتين',
                    controller: _durationController,
                    prefixIcon: LucideIcons.clock,
                  ),
                  const SizedBox(height: 20),
                  ModernTextField(
                    label: 'وصف العرض (اختياري)',
                    hint: 'أضف ملاحظاتك للعميل هنا...',
                    controller: _descriptionController,
                    prefixIcon: LucideIcons.fileText,
                    maxLines: 3,
                  ),
                  const SizedBox(height: 12),
                  _buildQuickTemplates(),
                  const SizedBox(height: 32),
                  BlocBuilder<VendorBloc, VendorState>(
                    builder: (context, state) {
                      return ModernButton(
                        text: 'إرسال العرض الآن',
                        isLoading: state.isLoading,
                        backgroundColor: AppColors.primary,
                        onPressed: _submit,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickTemplates() {
    final templates = [
      'المنتج متوفر تسليم فوري',
      'بضاعة أصلية ١٠٠٪',
      'بضمان الوكيل المعتمد',
      'سعر خاص للكميات',
      'توصيل سريع جداً',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ردود سريعة',
          style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: templates.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(left: 8),
                child: ModernChip(
                  label: templates[index],
                  onTap: () {
                    setState(() {
                      if (_descriptionController.text.isEmpty) {
                        _descriptionController.text = templates[index];
                      } else {
                        _descriptionController.text += ' • ${templates[index]}';
                      }
                    });
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showSnackBar(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontFamily: 'Cairo')),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _submit() {
    final priceStr = _priceController.text.trim();
    final duration = _durationController.text.trim();
    final description = _descriptionController.text.trim();

    if (priceStr.isEmpty) {
      _showSnackBar('من فضلك أدخل السعر', isError: true);
      return;
    }

    final price = double.tryParse(priceStr);
    if (price == null || price <= 0) {
      _showSnackBar('من فضلك أدخل سعراً صحيحاً', isError: true);
      return;
    }

    if (duration.isEmpty) {
      _showSnackBar('من فضلك أدخل مدة التوصيل', isError: true);
      return;
    }

    _submitted = true;
    context.read<VendorBloc>().add(SubmitBidEvent(
      requestId: widget.request.id,
      price: price,
      duration: duration,
      description: description,
    ));
  }
}
