"use client";
// src/app/(main)/checkout/[courseId]/_components/PaymobIframe.tsx

import { useState } from "react";

interface PaymobIframeProps {
  clientSecret: string;
}

export default function PaymobIframe({ clientSecret }: PaymobIframeProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // TODO: verify the exact Paymob unified checkout URL with your Paymob dashboard settings
  const src = `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(clientSecret)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <p className="text-[14px] font-bold text-slate-800">Complete your payment</p>
        <p className="text-[12px] text-slate-400 mt-0.5">
          You will be redirected after payment
        </p>
      </div>

      {/* Iframe container */}
      <div className="relative" style={{ height: 600 }}>
        {/* Loading spinner overlay — hidden once iframe fires onLoad */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
            <svg
              className="animate-spin w-8 h-8 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-[12.5px] text-slate-400">Loading payment form…</p>
          </div>
        )}

        <iframe
          src={src}
          title="Paymob Payment"
          width="100%"
          height="600"
          onLoad={() => setIsLoaded(true)}
          className="block border-0"
          allow="payment"
        />
      </div>
    </div>
  );
}
