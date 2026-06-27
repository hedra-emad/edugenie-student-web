"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useEnrollments } from "@/hooks/useEnrollments";
import type { UserProfile } from "@/types/profile.types";
import type { ProfileUpdatePayload } from "@/types/profile.types";
import ProfileHeader from "./ProfileHeader";
import ProfileStatsStrip from "./ProfileStatsStrip";
import LevelSelector from "./LevelSelector";
import TagsEditor from "./TagsEditor";
import MyLearning from "./MyLearning";
import CertificatesWidget from "./CertificatesWidget";
import AccountInfoWidget from "./AccountInfoWidget";
import ChangePasswordForm from "./ChangePasswordForm";

type MainTab = "learning" | "security";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Props {
  initialProfile: UserProfile;
  token: string;
}

export default function ProfileClient({ initialProfile, token }: Props) {
  const { data: profile } = useProfile(token, initialProfile);
  const updateMutation = useUpdateProfile(token);
  const avatarMutation = useUploadAvatar(token);
  const { data: enrollments = [] } = useEnrollments();
  const [activeTab, setActiveTab] = useState<MainTab>("learning");

  if (!profile) return null;

  function handleFieldSave(field: keyof ProfileUpdatePayload, value: string) {
    updateMutation.mutate({ [field]: value } as ProfileUpdatePayload);
  }

  return (
    <div>
      {/* ── Profile Header ── */}
      <ProfileHeader
        profile={profile}
        isUploading={avatarMutation.isPending}
        onAvatarSelect={(file) => avatarMutation.mutate(file)}
        onFieldSave={handleFieldSave}
      />

      {/* ── Stats Strip ── */}
      <ProfileStatsStrip profile={profile} enrolledCount={enrollments.length} />

      {/* ── Page Body ── */}
      <motion.div
        className="max-w-5xl mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main Column ── */}
          <main className="flex-1 min-w-0 space-y-10">
            {/* Page-level tab bar */}
            <div className="flex gap-6 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("learning")}
                className={`pb-3 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "learning"
                    ? "border-b-2 border-[#3B1892] text-[#3B1892] -mb-px"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                My Learning
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`pb-3 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "security"
                    ? "border-b-2 border-[#3B1892] text-[#3B1892] -mb-px"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Security
              </button>
            </div>

            {activeTab === "learning" && (
              <motion.div variants={itemVariants}>
                <MyLearning />
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div variants={itemVariants} className="max-w-md">
                <ChangePasswordForm />
              </motion.div>
            )}
          </main>

          {/* ── Sidebar ── */}
          <aside
            className="w-full lg:w-[300px] shrink-0 space-y-4 lg:sticky lg:top-6 lg:self-start"
            aria-label="Profile sidebar"
          >
            {/* Level Selector */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Level
              </h3>
              <LevelSelector
                value={profile.level}
                onChange={(level) => updateMutation.mutate({ level })}
                isPending={updateMutation.isPending}
              />
            </motion.div>

            {/* Skills */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Skills
              </h3>
              <TagsEditor
                tags={profile.skills}
                field="skills"
                label="Skills"
                onChange={(skills) => updateMutation.mutate({ skills })}
                isPending={updateMutation.isPending}
              />
            </motion.div>

            {/* Interests */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Interests
              </h3>
              <TagsEditor
                tags={profile.interests}
                field="interests"
                label="Interests"
                onChange={(interests) => updateMutation.mutate({ interests })}
                isPending={updateMutation.isPending}
              />
            </motion.div>

            {/* Certificates */}
            <motion.div variants={itemVariants}>
              <CertificatesWidget />
            </motion.div>

            {/* Account Info */}
            <motion.div variants={itemVariants}>
              <AccountInfoWidget profile={profile} />
            </motion.div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
