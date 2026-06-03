import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/domain/entities/bid.dart';
import 'package:shoofly_core/presentation/blocs/request/request_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shoofly_core/presentation/pages/chat/chat_page.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import 'delivery_tracking_page.dart';

class RequestDetailsPage extends StatefulWidget {
  final Request request;

  const RequestDetailsPage({super.key, required this.request});

  @override
  State<RequestDetailsPage> createState() => _RequestDetailsPageState();
}

class _RequestDetailsPageState extends State<RequestDetailsPage> {
  late Request _currentRequest;
  int _rating = 5;
  final _commentController = TextEditingController();
  bool _isReviewSubmitted = false;
  bool _isSubmittingReview = false;

  @override
  void initState() {
    super.initState();
    _currentRequest = widget.request;
    context.read<RequestBloc>().add(LoadRequestDetails(_currentRequest.id));
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RequestBloc, RequestState>(
      listener: (context, state) {
        if (state is RequestDetailsLoaded) {
          setState(() => _currentRequest = state.request);
        } else if (state is RequestPaymentRedirect) {
          launchUrl(Uri.parse(state.redirectUrl), mode: LaunchMode.externalApplication);
        } else if (state is RequestActionSuccess) {
          final isReviewSuccess = state.message.contains('تقييم');
          if (isReviewSuccess) {
            setState(() {
              _isReviewSubmitted = true;
              _isSubmittingReview = false;
            });
          }
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: AppColors.success));
          if (!isReviewSuccess) {
            Navigator.pop(context);
          }
        } else if (state is RequestError) {
          if (_isSubmittingReview) {
            setState(() => _isSubmittingReview = false);
          }
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: Colors.red));
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: CustomScrollView(
            slivers: [
              _buildAppBar(context),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRequestInfo(),
                    if (_currentRequest.status == RequestStatus.ORDER_PAID_PENDING_DELIVERY)
                      _buildPaymentSuccessInfo(),
                    if (_currentRequest.status == RequestStatus.CLOSED_SUCCESS && !_isReviewSubmitted)
                      _buildReviewSection(),
                    const SizedBox(height: 24),
                    _buildBidsHeader(),
                    _buildBidsList(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _buildBottomActions(),
        );
      },
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const CircleAvatar(
          backgroundColor: Colors.white24,
          child: Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (_currentRequest.images.isNotEmpty)
              PageView.builder(
                itemCount: _currentRequest.images.length,
                itemBuilder: (context, index) {
                  return AppImage(
                    imageUrl: AppConfig.getImageUrl(_currentRequest.images[index]),
                    fit: BoxFit.cover,
                    errorWidget: Container(
                      color: AppColors.surfaceVariant,
                      child: const Center(
                        child: Icon(LucideIcons.imageOff, color: AppColors.textDisabled, size: 48),
                      ),
                    ),
                  );
                },
              )
            else
              Container(
                color: AppColors.surfaceVariant,
                child: const Center(child: Icon(LucideIcons.image, color: AppColors.textDisabled, size: 48)),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black.withValues(alpha: 0.3), Colors.transparent, Colors.black.withValues(alpha: 0.5)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestInfo() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatusBadge(_currentRequest.status),
              Text('${_currentRequest.createdAt.day}/${_currentRequest.createdAt.month}/${_currentRequest.createdAt.year}', style: AppTypography.labelSmall),
            ],
          ),
          const SizedBox(height: 16),
          Text(_currentRequest.title, style: AppTypography.h2),
          const SizedBox(height: 12),
          Text(_currentRequest.description, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.5)),
          const SizedBox(height: 20),
          const Divider(height: 1, color: AppColors.surfaceVariant),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(LucideIcons.mapPin, color: AppColors.textDisabled, size: 18),
              const SizedBox(width: 8),
              Text(_currentRequest.address ?? 'القاهرة، مصر', style: AppTypography.bodySmall),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSuccessInfo() {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(LucideIcons.check, color: AppColors.success, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'تم الدفع بنجاح. وريد العرض جاهز للتسليم.',
                  style: AppTypography.labelLarge.copyWith(color: AppColors.success),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'استخدم كود الـ QR عند الاستلام لتأكيد العملية للمورد.',
            style: AppTypography.bodySmall.copyWith(color: AppColors.success),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: _currentRequest.qrCode != null && _currentRequest.qrCode!.isNotEmpty
                ? QrImageView(
                    data: _currentRequest.qrCode!,
                    version: QrVersions.auto,
                    size: 200.0,
                  )
                : const Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator(),
                  ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => DeliveryTrackingPage(request: _currentRequest),
                  ),
                );
              },
              icon: const Icon(LucideIcons.map),
              label: const Text('تتبع مكان المندوب على الخريطة'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBidsHeader() {
    final bidCount = _currentRequest.bids?.length ?? 0;
    final bidLabel = bidCount == 0
        ? 'لا توجد عروض بعد'
        : bidCount == 1
            ? 'عرض واحد'
            : '$bidCount عروض';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('العروض المستلمة', style: AppTypography.h3.copyWith(fontSize: 20)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(bidLabel, style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildBidsList() {
    final bids = _currentRequest.bids ?? [];
    if (bids.isEmpty) {
      return const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('في انتظار أول العروض...')));
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: bids.length,
      itemBuilder: (context, index) => _buildBidCard(context, bids[index]),
    );
  }

  Widget _buildBidCard(BuildContext context, Bid bid) {
    bool isSelected = bid.status == BidStatus.SELECTED || bid.status == BidStatus.ACCEPTED_BY_CLIENT;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary.withValues(alpha: 0.02) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isSelected ? AppColors.primary : AppColors.surfaceVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.primary.withValues(alpha: 0.05),
                child: const Icon(LucideIcons.shieldCheck, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bid.vendorName.isNotEmpty ? bid.vendorName : 'مورد #${bid.vendorId}',
                      style: AppTypography.labelLarge,
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          bid.vendorRating > 0
                              ? 'تقييم ${bid.vendorRating.toStringAsFixed(1)}'
                              : 'مورد جديد',
                          style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${bid.price} ج.م', style: AppTypography.h3.copyWith(color: AppColors.primary)),
                  Text(bid.duration, style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(bid.notes, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          if (_currentRequest.status == RequestStatus.BIDS_RECEIVED || _currentRequest.status == RequestStatus.OFFERS_FORWARDED || _currentRequest.status == RequestStatus.ORDER_PAID_PENDING_DELIVERY)
            if (!isSelected)
              Padding(
                padding: const EdgeInsets.only(top: 20),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.read<RequestBloc>().add(SelectBidEvent(_currentRequest.id, bid.id)),
                    child: const Text('قبول العرض'),
                  ),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatPage(
                                partnerId: bid.vendorId,
                                partnerName: bid.vendorName.isNotEmpty
                                    ? bid.vendorName
                                    : 'مورد #${bid.vendorId}',
                                requestId: _currentRequest.id,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(LucideIcons.messageSquare, size: 18),
                        label: const Text('تحدث مع المورد'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: AppColors.primary),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  Widget? _buildBottomActions() {
    if (_currentRequest.status == RequestStatus.OFFERS_FORWARDED && _currentRequest.selectedBidId != null) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.surfaceVariant))),
        child: ElevatedButton(
          onPressed: () => context.read<RequestBloc>().add(PayRequestEvent(_currentRequest.id)),
          style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 56)),
          child: const Text('دفع وتأكيد الطلب'),
        ),
      );
    }
    
    if (_currentRequest.status == RequestStatus.ORDER_PAID_PENDING_DELIVERY) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.surfaceVariant))),
        child: ElevatedButton(
          onPressed: () => context.read<RequestBloc>().add(ConfirmReceiptEvent(_currentRequest.id)),
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, minimumSize: const Size(double.infinity, 56)),
          child: const Text('تأكيد الاستلام النهائي'),
        ),
      );
    }
    
    return null;
  }

  Widget _buildReviewSection() {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary.withValues(alpha: 0.05), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.partyPopper, color: AppColors.primary, size: 40),
          const SizedBox(height: 16),
          Text('تم استلام طلبك بنجاح!', style: AppTypography.h3),
          const SizedBox(height: 8),
          Text(
            'رأيك يهمنا جداً، إيه رأيك في جودة الخدمة والمورد؟',
            style: AppTypography.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              return IconButton(
                onPressed: () => setState(() => _rating = index + 1),
                icon: Icon(
                  index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: Colors.amber,
                  size: 40,
                ),
              );
            }),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'اكتب تجربتك هنا (اختياري)...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppColors.surfaceVariant),
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isSubmittingReview
                ? null
                : () {
                    setState(() => _isSubmittingReview = true);
                    context.read<RequestBloc>().add(SubmitReviewEvent(
                      requestId: _currentRequest.id,
                      rating: _rating,
                      comment: _commentController.text.trim(),
                    ));
                  },
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text('إرسال التقييم'),
          ),
        ],
      ),
    );
  }


  Widget _buildStatusBadge(RequestStatus status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.displayName,
        style: AppTypography.labelSmall.copyWith(color: status.color, fontWeight: FontWeight.bold),
      ),
    );
  }
}
