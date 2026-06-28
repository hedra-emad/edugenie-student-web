"use client";

import { useState } from "react";
import { useChangePassword } from "@/hooks/useProfile";
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react";
import type { ChangePasswordPayload } from "@/lib/api/profile.api";

export default function ChangePasswordForm() {
  const [form, setForm] = useState<ChangePasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const { mutate, isPending, isError, error } = useChangePassword();

  function validate(): string {
    if (!form.currentPassword) return "Current password is required.";
    if (form.newPassword.length < 8)
      return "New password must be at least 8 characters.";
    if (form.newPassword !== form.confirmPassword)
      return "Passwords do not match.";
    return "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    mutate(form, {
      onSuccess: () => {
        setSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setSuccess(false), 4000);
      },
    });
  }

  const fields: {
    key: keyof ChangePasswordPayload;
    label: string;
    showKey: keyof typeof showPasswords;
    placeholder: string;
  }[] = [
    {
      key: "currentPassword",
      label: "Current Password",
      showKey: "current",
      placeholder: "Enter current password",
    },
    {
      key: "newPassword",
      label: "New Password",
      showKey: "new",
      placeholder: "Min. 8 characters",
    },
    {
      key: "confirmPassword",
      label: "Confirm New Password",
      showKey: "confirm",
      placeholder: "Repeat new password",
    },
  ];

  return (
    <div className="border border-slate-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Lock size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Change Password
        </h3>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                        rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Password changed successfully.
          </p>
        </div>
      )}

      {/* API Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        </div>
      )}

      {/* Validation Error */}
      {fieldError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-amber-700">{fieldError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
              {field.label}
            </label>
            <div className="relative">
              <input
                type={showPasswords[field.showKey] ? "text" : "password"}
                value={form[field.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full pr-10 pl-3 py-2.5 rounded-lg
                           border border-slate-200 bg-white
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-[#3B1892]/20
                           focus:border-[#3B1892]
                           transition-colors duration-150"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    [field.showKey]: !prev[field.showKey],
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                           hover:text-slate-600 transition-colors"
                aria-label={
                  showPasswords[field.showKey] ? "Hide password" : "Show password"
                }
              >
                {showPasswords[field.showKey] ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </button>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2
                     bg-[#3B1892] hover:bg-[#5B3DB8]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     text-white text-sm font-semibold
                     py-2.5 rounded-lg
                     transition-colors duration-150"
        >
          {isPending && <Loader2 size={15} className="animate-spin" />}
          {isPending ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
