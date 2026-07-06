"use client";

import Link from "next/link";
import { Award, Download } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PROXY = process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";

export default function MyCertificates() {
  const { data: certificates = [], isLoading } = useCertificates();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-14 text-center">
        <Award size={32} className="text-slate-300" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">
          No certificates yet
        </p>
        <p className="max-w-xs text-xs text-slate-400">
          Finish all lessons and pass every quiz in a course to earn a
          verifiable certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B1892]/10">
              <Award size={20} className="text-[#3B1892]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {cert.courseTitle}
              </p>
              <p className="text-xs text-slate-400">
                Issued {formatDate(cert.issuedAt)}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                {cert.certificateNumber}
              </p>
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            <Link
              href={`/certificate/${cert.id}`}
              className="flex-1 rounded-lg border border-[#3B1892] px-3 py-1.5 text-center text-xs font-semibold text-[#3B1892] transition-colors hover:bg-[#3B1892]/5"
            >
              View
            </Link>
            <a
              href={`${PROXY}/certificates/${cert.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3B1892] px-3 py-1.5 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Download size={13} aria-hidden="true" />
              PDF
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
