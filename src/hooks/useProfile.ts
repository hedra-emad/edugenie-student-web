import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, uploadAvatar, changePassword } from "@/lib/api/profile.api";
import type { ProfileUpdatePayload, UserProfile } from "@/types/profile.types";

export function useProfile(token: string, initialData?: UserProfile) {
  return useQuery<UserProfile>({
    queryKey: ["profile", token],
    queryFn: () => fetchProfile(token).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
    initialData,
  });
}

export function useUpdateProfile(token: string) {
  const qc = useQueryClient();

  return useMutation<
    UserProfile,
    Error,
    ProfileUpdatePayload,
    { prev: UserProfile | undefined }
  >({
    mutationFn: (payload: ProfileUpdatePayload) =>
      updateProfile(token, payload).then((r) => r.data),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["profile", token] });
      const prev = qc.getQueryData<UserProfile>(["profile", token]);
      qc.setQueryData<UserProfile>(["profile", token], (old) =>
        old ? { ...old, ...payload } : old
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<UserProfile>(["profile", token], ctx.prev);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["profile", token] });
    },
  });
}

export function useUploadAvatar(token: string) {
  const qc = useQueryClient();

  return useMutation<
    UserProfile,
    Error,
    File,
    { prev: UserProfile | undefined }
  >({
    mutationFn: (file: File) =>
      uploadAvatar(token, file).then((r) => r.data),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["profile", token] });
      const prev = qc.getQueryData<UserProfile>(["profile", token]);
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<UserProfile>(["profile", token], ctx.prev);
      }
    },

    onSuccess: (data) => {
      qc.setQueryData<UserProfile>(["profile", token], data);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["profile", token] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
