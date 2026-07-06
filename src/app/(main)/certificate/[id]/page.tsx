import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { fetchCertificateById } from "@/lib/api/certificates";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Certificate — EduGenie" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get("jwt")?.value ?? "";
  if (!token) redirect("/login");

  const cert = await fetchCertificateById(id, token);
  if (!cert) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const verifyUrl = `${proto}://${host}/verify/${cert.verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });

  const pdfUrl = `/api/proxy/certificates/${cert.id}/pdf`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Action bar — not part of the printed certificate */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/profile?tab=certificates"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back to certificates
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/verify/${cert.verificationCode}`}
            className="rounded-lg border border-[#1E1B4B]/20 px-4 py-2 text-sm font-semibold text-[#1E1B4B] hover:bg-[#1E1B4B]/5"
          >
            Verify
          </Link>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#1E1B4B] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Download PDF
          </a>
        </div>
      </div>

      {/* ── The certificate ── */}
      <article className="cert-frame relative mx-auto aspect-[842/595] w-full overflow-hidden bg-white">
        {/* double frame — matches PDF: outer indigo @16pt, inner blue @24pt */}
        <div className="pointer-events-none absolute inset-[1.9%] border-[1.4px] border-[#1E1B4B]" />
        <div className="pointer-events-none absolute inset-[2.85%] border-[0.6px] border-[#2563EB]" />

        <div className="relative flex h-full flex-col px-[7%] py-[6%]">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/LOGO-EDUGENIE.jpeg"
              alt="EduGenie"
              className="h-[clamp(34px,6cqw,60px)] w-auto"
            />
            <p className="whitespace-nowrap pt-3 text-right text-[clamp(8px,1.35cqw,11px)] font-bold uppercase tracking-[0.22em] text-[#6B6480]">
              Certificate of Completion
            </p>
          </header>
          <div className="mt-[3%] h-px w-full bg-[#E2E0EF]" />

          {/* Body */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[clamp(8px,1.4cqw,10px)] font-bold uppercase tracking-[0.2em] text-[#6B6480]">
              This certificate is proudly presented to
            </p>
            <h1 className="mt-[2.5%] font-serif text-[clamp(24px,6cqw,44px)] font-bold leading-tight text-[#1E1B4B]">
              {cert.studentName}
            </h1>
            <span className="mt-[1.5%] block h-[3px] w-[130px] bg-[#B7952E]" />
            <p className="mt-[3%] text-[clamp(10px,1.7cqw,12px)] text-[#6B6480]">
              for successfully completing the online course
            </p>
            <h2 className="mt-[1.5%] font-serif text-[clamp(16px,3.6cqw,26px)] font-bold text-[#2563EB]">
              {cert.courseTitle}
            </h2>
            <p className="mt-[2.5%] text-[clamp(9px,1.5cqw,11px)] text-[#6B6480]">
              Instructor: {cert.instructorName}
              <span className="mx-4 text-[#B7952E]">•</span>
              Issued {formatDate(cert.issuedAt)}
            </p>
          </div>

          {/* Footer */}
          <footer className="flex items-end justify-between gap-4">
            {/* Verified seal */}
            <div className="shrink-0">
              <div className="relative flex h-[clamp(56px,11cqw,84px)] w-[clamp(56px,11cqw,84px)] items-center justify-center rounded-full border-2 border-[#B7952E]">
                <div className="absolute inset-[6px] rounded-full border border-[#B7952E]/70" />
                <div className="flex flex-col items-center leading-none text-[#B7952E]">
                  <span className="text-[clamp(5px,0.9cqw,7px)] font-bold tracking-wide">
                    EDUGENIE
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="my-[3px] h-[clamp(12px,2.4cqw,20px)] w-[clamp(12px,2.4cqw,20px)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[clamp(5px,1cqw,8px)] font-bold tracking-wide">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Credential */}
            <div className="min-w-0 flex-1 self-center px-[3%]">
              <p className="text-[clamp(7px,1.2cqw,8px)] font-bold uppercase tracking-[0.12em] text-[#6B6480]">
                Certificate No.
              </p>
              <p className="font-mono text-[clamp(9px,1.6cqw,12px)] font-bold text-[#1E1B4B]">
                {cert.certificateNumber}
              </p>
              <p className="mt-1 text-[clamp(7px,1.2cqw,8px)] text-[#6B6480]">
                Verify authenticity at
              </p>
              <p className="break-all text-[clamp(7px,1.2cqw,8px)] text-[#2563EB]">
                {verifyUrl}
              </p>
            </div>

            {/* QR */}
            <div className="shrink-0 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Verification QR code"
                className="h-[clamp(56px,11cqw,84px)] w-[clamp(56px,11cqw,84px)]"
              />
              <p className="mt-1 text-[clamp(6px,1cqw,7px)] text-[#6B6480]">
                Scan to verify
              </p>
            </div>
          </footer>
        </div>
      </article>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cert-frame { container-type: inline-size; box-shadow: 0 10px 40px rgba(30,27,75,0.12); }
            @media print {
              @page { size: landscape; margin: 0; }
              body { background: #fff; }
              .cert-frame { box-shadow: none; }
            }
          `,
        }}
      />
    </div>
  );
}
