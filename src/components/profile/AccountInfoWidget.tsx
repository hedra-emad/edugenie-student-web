import { Calendar, Clock, MapPin, Monitor } from "lucide-react";
import type { UserProfile } from "@/types/profile.types";

interface Props {
  profile: UserProfile;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export default function AccountInfoWidget({ profile }: Props) {
  const showLocation =
    !!profile.lastLoginLocation &&
    !profile.lastLoginLocation.toLowerCase().includes("unknown") &&
    !profile.lastLoginLocation.toLowerCase().includes("local");

  const showDevice =
    !!profile.lastLoginDevice &&
    !profile.lastLoginDevice.toLowerCase().includes("unknown");

  return (
    <section
      className="bg-white border border-slate-200 rounded-xl p-4"
      aria-labelledby="account-info-heading"
    >
      <h3
        id="account-info-heading"
        className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3"
      >
        Account
      </h3>

      <ul className="space-y-3">
        {/* Member since — always shown */}
        <li className="flex items-start gap-2.5">
          <span className="text-slate-400 mt-0.5 shrink-0">
            <Calendar size={14} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Member since</p>
            <p className="text-sm text-slate-600 truncate">
              {formatDate(profile.createdAt)}
            </p>
          </div>
        </li>

        {/* Last login — always shown */}
        <li className="flex items-start gap-2.5">
          <span className="text-slate-400 mt-0.5 shrink-0">
            <Clock size={14} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Last login</p>
            <p className="text-sm text-slate-600 truncate">
              {relativeDate(profile.lastLoginAt)}
            </p>
          </div>
        </li>

        {/* Location — hidden when unknown / local */}
        {showLocation && (
          <li className="flex items-start gap-2.5">
            <span className="text-slate-400 mt-0.5 shrink-0">
              <MapPin size={14} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Location</p>
              <p
                className="text-sm text-slate-600 truncate"
                title={profile.lastLoginLocation!}
              >
                {profile.lastLoginLocation}
              </p>
            </div>
          </li>
        )}

        {/* Device — hidden when unknown */}
        {showDevice && (
          <li className="flex items-start gap-2.5">
            <span className="text-slate-400 mt-0.5 shrink-0">
              <Monitor size={14} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Device</p>
              <p
                className="text-sm text-slate-600 truncate"
                title={profile.lastLoginDevice!}
              >
                {profile.lastLoginDevice}
              </p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}
