"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import ActionToast, { type ToastAction } from "@/components/ui/ActionToast";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/hooks/useProfile";
import { useEnrollments } from "@/hooks/useEnrollments";
import type { UserProfile } from "@/types/profile.types";
import type { ProfileUpdatePayload } from "@/types/profile.types";
import ProfileHeader from "./ProfileHeader";
import AvatarCropperModal from "./AvatarCropperModal";
import ProfileStatsStrip from "./ProfileStatsStrip";
import LevelSelector from "./LevelSelector";
import TagsEditor from "./TagsEditor";
import MyLearning from "./MyLearning";
import MyRoadmaps from "./MyRoadmaps";
import MyCertificates from "./MyCertificates";
import CertificatesWidget from "./CertificatesWidget";
import AccountInfoWidget from "./AccountInfoWidget";
import ChangePasswordForm from "./ChangePasswordForm";
import { useCertificates } from "@/hooks/useCertificates";

type MainTab = "learning" | "roadmaps" | "certificates" | "security";

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
  const router = useRouter();
  const { data: profile } = useProfile(token, initialProfile);
  const updateMutation = useUpdateProfile(token);
  const avatarMutation = useUploadAvatar(token);
  const deleteAvatarMutation = useDeleteAvatar(token);
  const { data: enrollments = [] } = useEnrollments();
  const { data: certificates = [] } = useCertificates();
  const [activeTab, setActiveTab] = useState<MainTab>("learning");

  // The certificate-earned email links to ?tab=certificates — honor it on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "certificates") setActiveTab("certificates");
  }, []);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    message: string;
    action?: ToastAction;
  } | null>(null);

  if (!profile) return null;

  function handleFieldSave(field: keyof ProfileUpdatePayload, value: string) {
    updateMutation.mutate({ [field]: value } as ProfileUpdatePayload);
  }

  // Picking a file opens the cropper; only the cropped result is uploaded.
  function handleAvatarSelect(file: File) {
    setCropFile(file);
  }

  function uploadCroppedAvatar(file: File) {
    setCropFile(null);
    avatarMutation.mutate(file, {
      onSuccess: () => {
        // Re-run server components (HeaderServer refetches the profile) so the
        // nav avatar updates immediately — no logout/login needed.
        router.refresh();
        setToast({ kind: "success", message: "Profile picture updated." });
      },
      onError: () => {
        setToast({
          kind: "error",
          message: "Couldn’t update your picture. Please try again.",
          action: { label: "Retry", onClick: () => uploadCroppedAvatar(file) },
        });
      },
    });
  }

  function performAvatarDelete() {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => {
        router.refresh();
        setToast({ kind: "success", message: "Profile picture removed." });
      },
      onError: () => {
        setToast({
          kind: "error",
          message: "Couldn’t remove your picture. Please try again.",
          action: { label: "Retry", onClick: performAvatarDelete },
        });
      },
    });
  }

  function confirmAvatarDelete() {
    setConfirmDelete(false);
    performAvatarDelete();
  }

  return (
    <div>
      {/* ── Profile Header ── */}
      <ProfileHeader
        profile={profile}
        isUploading={avatarMutation.isPending}
        isDeletingAvatar={deleteAvatarMutation.isPending}
        onAvatarSelect={handleAvatarSelect}
        onAvatarDelete={() => setConfirmDelete(true)}
        onFieldSave={handleFieldSave}
      />

      {/* ── Stats Strip ── */}
      <ProfileStatsStrip
        profile={profile}
        enrolledCount={enrollments.length}
        certCount={certificates.length}
      />

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
                onClick={() => setActiveTab("roadmaps")}
                className={`pb-3 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "roadmaps"
                    ? "border-b-2 border-[#3B1892] text-[#3B1892] -mb-px"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Roadmaps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("certificates")}
                className={`pb-3 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "certificates"
                    ? "border-b-2 border-[#3B1892] text-[#3B1892] -mb-px"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Certificates
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

            {activeTab === "roadmaps" && (
              <motion.div variants={itemVariants}>
                <MyRoadmaps />
              </motion.div>
            )}

            {activeTab === "certificates" && (
              <motion.div variants={itemVariants}>
                <MyCertificates />
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
              <CertificatesWidget
                certificates={certificates}
                onViewAll={() => setActiveTab("certificates")}
              />
            </motion.div>

            {/* Account Info */}
            <motion.div variants={itemVariants}>
              <AccountInfoWidget profile={profile} />
            </motion.div>
          </aside>
        </div>
      </motion.div>

      {/* Crop before upload */}
      {cropFile && (
        <AvatarCropperModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onCropped={uploadCroppedAvatar}
        />
      )}

      {/* Remove-avatar confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-avatar-title"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="remove-avatar-title"
              className="text-base font-bold text-slate-900"
            >
              Remove profile picture?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This deletes your current photo from your account. You can upload a
              new one anytime.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={deleteAvatarMutation.isPending}
                onClick={confirmAvatarDelete}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Immediate action feedback */}
      {toast && (
        <ActionToast
          kind={toast.kind}
          message={toast.message}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
