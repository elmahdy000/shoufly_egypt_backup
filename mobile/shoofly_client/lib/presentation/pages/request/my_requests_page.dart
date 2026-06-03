import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shoofly_core/core/config/app_config.dart';
import 'package:shoofly_core/core/theme/app_colors.dart';
import 'package:shoofly_core/core/theme/app_typography.dart';
import 'package:shoofly_core/core/widgets/app_image.dart';
import 'package:shoofly_core/domain/entities/request.dart';
import 'package:shoofly_core/presentation/blocs/request/request_bloc.dart';
import 'package:shoofly_core/presentation/widgets/empty_state.dart';
import 'package:shoofly_core/presentation/widgets/loading_state.dart';
import 'package:shoofly_core/core/animations/app_animations.dart';
import 'package:shoofly_core/core/widgets/modern_widgets.dart';
import 'create_request_page.dart';
import 'request_details_page.dart';

class MyRequestsPage extends StatelessWidget {
  const MyRequestsPage({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: embedded ? null : ModernAppBar(
        title: 'طلباتي',
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        top: embedded,
        bottom: false,
        child: BlocBuilder<RequestBloc, RequestState>(
          buildWhen: (previous, current) =>
              current is RequestLoaded ||
              current is RequestListLoading ||
              current is RequestError ||
              current is RequestInitial,
          builder: (context, state) {
            if (state is RequestLoading || state is RequestListLoading) {
              return const ListSkeletonLoading(padding: EdgeInsets.all(20));
            } else if (state is RequestLoaded) {
              if (state.requests.isEmpty) {
                return EmptyState.noOrders(
                  subtitle: 'ابدأ الآن واطلب أي منتج أو خدمة تهمك.',
                  onActionPressed: () => _showCreateRequest(context),
                  actionLabel: 'طلب جديد',
                );
              }
              return RefreshIndicator(
                onRefresh: () async =>
                    context.read<RequestBloc>().add(LoadMyRequests()),
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                  itemCount: state.requests.length,
                  physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                  itemBuilder: (context, index) {
                    final request = state.requests[index];
                    return AppAnimations.slideInFromBottom(
                      delay: Duration(milliseconds: 50 * index),
                      child: _buildRequestCard(context, request),
                    );
                  },
                ),
              );
            } else if (state is RequestError) {
              return EmptyState.error(
                subtitle: state.message,
                onActionPressed: () => context.read<RequestBloc>().add(LoadMyRequests()),
                actionLabel: 'إعادة المحاولة',
              );
            }
            return const LoadingState(message: 'جاري التحميل...');
          },
        ),
      ),
    );
  }

  void _showCreateRequest(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreateRequestPage()),
    );
  }

  Widget _buildRequestCard(BuildContext context, Request request) {
    return ModernCard(
      margin: const EdgeInsets.only(bottom: 20),
      padding: EdgeInsets.zero,
      borderRadius: 24,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RequestDetailsPage(request: request),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Status and Category
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge(request.status),
                if (request.categoryNameAr != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      request.categoryNameAr!,
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image or Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: request.images.isNotEmpty
                        ? AppImage(
                            imageUrl: AppConfig.getImageUrl(request.images[0]),
                            fit: BoxFit.cover,
                          )
                        : const Icon(LucideIcons.package, color: AppColors.textDisabled, size: 28),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Title and Description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.title,
                        style: AppTypography.h4.copyWith(height: 1.1),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        request.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Footer info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant.withValues(alpha: 0.2),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.calendar, color: AppColors.textDisabled, size: 14),
                const SizedBox(width: 6),
                Text(
                  _formatDate(request.createdAt),
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textDisabled, fontSize: 12),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.messageSquare, color: AppColors.primary, size: 14),
                      const SizedBox(width: 8),
                      Text(
                        request.bids != null && request.bids!.isNotEmpty
                            ? '${request.bids!.length} عروض وصلت'
                            : 'في انتظار العروض',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(RequestStatus status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: status.color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status.displayName,
            style: AppTypography.labelSmall.copyWith(
              color: status.color,
              fontWeight: FontWeight.w900,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
