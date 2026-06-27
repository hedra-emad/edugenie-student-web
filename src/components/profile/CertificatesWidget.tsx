import { Award } from "lucide-react";

interface Certificate {
  id: string;
  courseName: string;
  earnedAt: string;
}

interface Props {
  certificates?: Certificate[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function CertificatesWidget({ certificates = [] }: Props) {
  const isEmpty = certificates.length === 0;

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
            {certificates.map((cert) => (
              <li key={cert.id} className="flex items-start gap-2">
                <Award
                  size={16}
                  className="text-[#3B1892] mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{cert.courseName}</p>
                  <time className="text-xs text-slate-400">{formatDate(cert.earnedAt)}</time>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-3 text-xs font-medium text-[#3B1892] hover:underline"
          >
            View All
          </button>
        </>
      )}
    </section>
  );
}
