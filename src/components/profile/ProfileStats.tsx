import type { UserProfile } from "@/types/profile.types";

interface Props {
  profile: UserProfile;
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProfileStats({ profile }: Props) {
  const stats = [
    {
      icon: <CalendarIcon />,
      label: "Member since",
      value: formatDate(profile.createdAt),
    },
    {
      icon: <ClockIcon />,
      label: "Last login",
      value: formatDate(profile.lastLoginAt),
    },
    {
      icon: <EyeIcon />,
      label: "Profile views",
      value: profile.profileViews.toString(),
    },
  ];

  return (
    <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Account info
      </p>
      {stats.map(({ icon, label, value }) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            {icon}
            <span>{label}</span>
          </div>
          <span className="text-sm font-medium text-gray-800 text-right">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}