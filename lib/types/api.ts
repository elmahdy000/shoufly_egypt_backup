export type RequestStatus =
  | "PENDING_ADMIN_REVISION"
  | "OPEN_FOR_BIDDING"
  | "BIDS_RECEIVED"
  | "OFFERS_FORWARDED"
  | "ORDER_PAID_PENDING_DELIVERY"
  | "CLOSED_SUCCESS"
  | "CLOSED_CANCELLED"
  | "REJECTED";

export type BidStatus =
  | "PENDING"
  | "SELECTED"
  | "ACCEPTED_BY_CLIENT"
  | "REJECTED";
export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApiRequestSummary = {
  id: number;
  title: string;
  description: string;
  status: RequestStatus;
  address: string;
  clientId?: number;
  selectedBidId?: number | null;
  budget?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiRequestDetails = ApiRequestSummary & {
  categoryId?: number;
  category?: { id: number, name: string };
  brand?: { id: number, name: string };
  latitude?: number;
  longitude?: number;
  deliveryPhone?: string;
  notes?: string | null;
  bids?: ApiBid[];
  selectedBid?: ApiBid | null; // Populated when client accepts a bid
  images?: Array<{ id: number; filePath: string; fileName: string }>;
  qrCode?: string | null;
  review?: {
    rating: number;
    comment: string | null;
    createdAt: string;
  };
};

export type ApiBid = {
  id: number;
  requestId: number;
  description: string;
  netPrice: number;
  clientPrice?: number;
  status: BidStatus;
  vendorId?: number;
  createdAt?: string;
  updatedAt?: string;
  vendor?: {
    id: number;
    fullName: string;
    email: string;
  };
  aiScore?: number;
  aiRecommendation?: string;
};

export type ApiDeliveryEntry = {
  id: number;
  requestId: number;
  status: string;
  note?: string | null;
  locationText?: string | null;
  createdAt: string;
};

export type ApiDeliveryTimeline = {
  requestId: number;
  requestStatus: string;
  qrCode: string | null;
  currentDeliveryStatus: string | null;
  timeline: ApiDeliveryEntry[];
};

export type ApiTransaction = {
  id: number;
  userId: number;
  requestId?: number | null;
  type: string;
  amount: number;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    role: "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY";
  };
  request?: {
    id: number;
    title: string;
    status: RequestStatus;
  } | null;
};

export type ApiNotification = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId?: number | null;
};

export type ApiWithdrawal = {
  id: number;
  vendorId: number;
  amount: number;
  status: WithdrawalStatus;
  reviewedById?: number | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    fullName: string;
    email: string;
  };
  reviewedBy?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
};

export type ApiUserSummary = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY";
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
};

export type ApiPaymentResult = {
  redirectUrl?: string;
  request?: {
    id: number;
    status: RequestStatus;
  };
  wallet?: {
    balance: number;
  };
};

export type ApiDeliveryConfirmResult = {
  request?: {
    id: number;
    status: RequestStatus;
  };
};
