import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyCertificate } from "@/lib/api/certificates";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Certificate — EduGenie",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await verifyCertificate(code);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-[#3B1892]"
        >
          EduGenie
        </Link>

        {result.valid ? (
          <>
            <CheckCircle2
              size={48}
              className="mx-auto mt-6 text-green-600"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Certificate verified
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              This is a genuine EduGenie certificate.
            </p>

            <dl className="mt-6 space-y-3 text-left">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Awarded to
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {result.studentName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Course
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {result.courseTitle}
                </dd>
              </div>
              {result.instructorName && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Instructor
                  </dt>
                  <dd className="text-sm text-slate-700">
                    {result.instructorName}
                  </dd>
                </div>
              )}
              {result.issuedAt && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Issued
                  </dt>
                  <dd className="text-sm text-slate-700">
                    {formatDate(result.issuedAt)}
                  </dd>
                </div>
              )}
              {result.certificateNumber && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Certificate No.
                  </dt>
                  <dd className="font-mono text-xs text-slate-500">
                    {result.certificateNumber}
                  </dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <>
            <XCircle
              size={48}
              className="mx-auto mt-6 text-red-500"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Certificate not found
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              We couldn&apos;t verify a certificate with this code. It may be
              invalid or the link may be incomplete.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
