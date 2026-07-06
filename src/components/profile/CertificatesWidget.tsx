import Link from "next/link";
import { Award } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Certificate } from "@/lib/api/certificates";

interface Props {
  certificates?: Certificate[];
  onViewAll?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function CertificatesWidget({
  certificates = [],
  onViewAll,
}: Props) {
  const isEmpty = certificates.length === 0;
  const preview = certificates.slice(0, 3);

  return (
    <section
      className="bg-white border border-slate-200 rounded-xl p-4"
      aria-labelledby="certificates-heading"
    >
      <h3
        id="certificates-heading"
        className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3"
      >
        Certificates
      </h3>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center py-4 gap-2">
          <Award size={24} className="text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-400">No certificates yet</p>
          <p className="text-xs text-slate-400">Complete a course to earn one</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {preview.map((cert) => (
              <li key={cert.id}>
                <Link
                  href={`/certificate/${cert.id}`}
                  className="flex items-start gap-2 rounded-md -mx-1 px-1 py-1 hover:bg-slate-50"
                >
                  <Award
                    size={16}
                    className="text-[#3B1892] mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {cert.courseTitle}
                    </p>
                    <time className="text-xs text-slate-400">
                      {formatDate(cert.issuedAt)}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {onViewAll && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-3 text-xs"
              onClick={onViewAll}
            >
              View All
            </Button>
          )}
        </>
      )}
    </section>
  );
}
