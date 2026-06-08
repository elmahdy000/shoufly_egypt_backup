import { z } from 'zod';

export const ApproveRequestSchema = z.object({
  requestId: z.coerce.number().int().positive(),
});

export type ApproveRequestInput = z.infer<typeof ApproveRequestSchema>;

export const RejectRequestSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  reason: z.string().optional(),
});

export type RejectRequestInput = z.infer<typeof RejectRequestSchema>;

export const ForwardOfferSchema = z.object({
  bidId: z.coerce.number().int().positive(),
});

export type ForwardOfferInput = z.infer<typeof ForwardOfferSchema>;

export const ReviewRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

export type ReviewRequestInput = z.infer<typeof ReviewRequestSchema>;

export const RequestRouteParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const BidRouteParamSchema = z.object({
  bidId: z.coerce.number().int().positive(),
});

export const AdminUserRoleEnum = z.enum(['CLIENT', 'VENDOR', 'ADMIN', 'DELIVERY']);
export const AdminRequestStatusEnum = z.enum([
  'PENDING_ADMIN_REVISION',
  'OPEN_FOR_BIDDING',
  'BIDS_RECEIVED',
  'OFFERS_FORWARDED',
  'ORDER_PAID_PENDING_DELIVERY',
  'CLOSED_SUCCESS',
  'CLOSED_CANCELLED',
  'REJECTED',
]);
