import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'package:shoofly_core/domain/entities/bid.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/presentation/blocs/request/request_bloc.dart';
import 'package:shoofly_core/presentation/widgets/empty_state.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';
import '../request/request_details_page.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<RequestBloc>().add(LoadMyRequests());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('العروض', style: AppTypography.h3.copyWith(fontWeight: FontWeight.w900)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: !widget.embedded,
        leading: widget.embedded
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
                onPressed: () => Navigator.pop(context),
              ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(16),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: Colors.white,
              unselectedLabelColor: AppColors.textSecondary,
              indicatorSize: TabBarIndicatorSize.tab,
              indicator: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: AppColors.primary,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              dividerColor: Colors.transparent,
              labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900),
              unselectedLabelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w500),
              tabs: const [
                Tab(text: 'عروض جديدة'),
                Tab(text: 'عروض مقبولة'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNewOffersTab(),
          _buildAcceptedOffersTab(),
        ],
      ),
    );
  }

  Widget _buildNewOffersTab() {
    return BlocBuilder<RequestBloc, RequestState>(
      buildWhen: (previous, current) =>
          current is RequestLoaded ||
          current is RequestListLoading ||
          current is RequestError ||
          current is RequestInitial,
      builder: (context, state) {
        if (state is RequestLoading || state is RequestListLoading) {
          return const ListSkeletonLoading(padding: EdgeInsets.all(24));
        } else if (state is RequestLoaded) {
          final requestsWithBids = state.requests.where((r) {
            if (r.status == RequestStatus.BIDS_RECEIVED) {
              return true;
            }

            return r.bids != null &&
                r.bids!.isNotEmpty &&
                r.status == RequestStatus.OPEN_FOR_BIDDING;
          }).toList();

          if (requestsWithBids.isEmpty) {
            return const EmptyState(
              icon: LucideIcons.tags,
              title: 'لا توجد عروض جديدة',
              subtitle: 'طلباتك الحالية لا تحتوي على عروض بعد. انتظر قليلاً!',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
            physics: const BouncingScrollPhysics(),
            itemCount: requestsWithBids.length,
            itemBuilder: (context, index) {
              return _buildRequestOffersCard(requestsWithBids[index]);
            },
          );
        } else if (state is RequestError) {
          return EmptyState(
            icon: LucideIcons.triangleAlert,
            title: 'خطأ في التحميل',
            subtitle: state.message,
          );
        }
        return const LoadingState(message: 'جاري التحميل...');
      },
    );
  }

  Widget _buildAcceptedOffersTab() {
    return BlocBuilder<RequestBloc, RequestState>(
      buildWhen: (previous, current) =>
          current is RequestLoaded ||
          current is RequestListLoading ||
          current is RequestError ||
          current is RequestInitial,
      builder: (context, state) {
        if (state is RequestLoading || state is RequestListLoading) {
          return const ListSkeletonLoading(padding: EdgeInsets.all(24));
        } else if (state is RequestLoaded) {
          final requestsWithAcceptedBids = state.requests.where((r) => 
            r.selectedBidId != null || r.status == RequestStatus.OFFERS_FORWARDED || 
            r.status == RequestStatus.ORDER_PAID_PENDING_DELIVERY
          ).toList();

          if (requestsWithAcceptedBids.isEmpty) {
            return const EmptyState(
              icon: LucideIcons.circleCheck,
              title: 'لا توجد عروض مقبولة',
              subtitle: 'لم تقم بقبول أي عروض بعد. استعرض العروض الجديدة!',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
            physics: const BouncingScrollPhysics(),
            itemCount: requestsWithAcceptedBids.length,
            itemBuilder: (context, index) {
              final request = requestsWithAcceptedBids[index];
              final bids = request.bids;
              final selectedBid = bids == null || bids.isEmpty
                  ? null
                  : bids.firstWhere(
                      (b) => b.id == request.selectedBidId,
                      orElse: () => bids.first,
                    );
              return _buildAcceptedOfferCard(request, selectedBid);
            },
          );
        }
        return const LoadingState(message: 'جاري التحميل...');
      },
    );
  }

  Widget _buildRequestOffersCard(Request request) {
    final bids = request.bids ?? [];
    final lowestBid = bids.isNotEmpty 
      ? bids.reduce((a, b) => a.price < b.price ? a : b)
      : null;

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 20),
      padding: EdgeInsets.zero,
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                _buildImagePreview(request),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(request.title, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${bids.length} عروض وصلت',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (lowestBid != null)
            _buildLowestBidBadge(lowestBid),
          
          Padding(
            padding: const EdgeInsets.all(20),
            child: ModernButton(
              text: 'استعرض كل العروض',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => RequestDetailsPage(request: request),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview(Request request) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: request.images.isNotEmpty
        ? ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AppImage(
              imageUrl: AppConfig.getImageUrl(request.images[0]),
              fit: BoxFit.cover,
              errorWidget: const Icon(LucideIcons.package),
            ),
          )
        : const Icon(LucideIcons.package, color: AppColors.textDisabled),
    );
  }

  Widget _buildLowestBidBadge(Bid lowestBid) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.trophy, color: AppColors.success, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('أفضل سعر متوفر', style: AppTypography.bodySmall.copyWith(color: AppColors.success)),
                Text('${lowestBid.price.toStringAsFixed(0)} ج.م', style: AppTypography.h3.copyWith(color: AppColors.success, fontSize: 24)),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronLeft, color: AppColors.success, size: 18),
        ],
      ),
    );
  }

  Widget _buildAcceptedOfferCard(Request request, Bid? selectedBid) {
    return ModernCard(
      margin: const EdgeInsets.only(bottom: 20),
      padding: EdgeInsets.zero,
      borderRadius: 24,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.circleCheckBig, color: AppColors.success, size: 16),
                const SizedBox(width: 8),
                Text('تم قبول العرض', style: AppTypography.labelMedium.copyWith(color: AppColors.success, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildImagePreview(request),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(request.title, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w900)),
                          const SizedBox(height: 4),
                          _buildStatusLabel(request.status),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (selectedBid != null)
                  _buildPriceInfo(selectedBid),
                const SizedBox(height: 20),
                _buildActionForStatus(request),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceInfo(Bid bid) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('المبلغ المتفق عليه', style: AppTypography.bodySmall),
              Text('${bid.price.toStringAsFixed(0)} ج.م', style: AppTypography.h3.copyWith(color: AppColors.primary)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('التوصيل خلال', style: AppTypography.bodySmall),
              Text(bid.duration, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusLabel(RequestStatus status) {
    return Text(
      status == RequestStatus.ORDER_PAID_PENDING_DELIVERY ? 'قيد التوصيل' : 'تم الاختيار',
      style: AppTypography.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildActionForStatus(Request request) {
    if (request.status == RequestStatus.OFFERS_FORWARDED) {
      return ModernButton(
        text: 'الدفع الآن',
        icon: LucideIcons.creditCard,
        onPressed: () => context.read<RequestBloc>().add(PayRequestEvent(request.id)),
      );
    }
    if (request.status == RequestStatus.ORDER_PAID_PENDING_DELIVERY) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(16)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.truck, color: AppColors.success, size: 20),
            const SizedBox(width: 8),
            Text('جاري التوصيل إليك', style: AppTypography.labelLarge.copyWith(color: AppColors.success, fontWeight: FontWeight.w900)),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
