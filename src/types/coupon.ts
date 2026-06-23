// src/types/coupon.ts

export interface CouponValidationRequest {
  code: string; // 1–100 characters
}

export interface CouponValidationResponse {
  valid: boolean;
  discountAmount: number; // server-calculated discount in the cart's currency
  updatedTotal: number; // total after discount
  message?: string; // rejection reason when valid=false
}
