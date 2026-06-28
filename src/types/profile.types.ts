export type UserLevel = "beginner" | "intermediate" | "advanced";
export type UserRole = "student" | "instructor" | "admin";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** URL returned by the server after avatar upload */
  avatar?: string;
  /** Legacy field — some endpoints return `photo` */
  photo?: string;
  role: UserRole;
  level: UserLevel;
  bio?: string;
  skills: string[];
  interests: string[];
  profileViews: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive";
  lastLoginAt: string;
  lastLoginDevice: string;
  lastLoginLocation: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export type ProfileUpdatePayload = Partial<
  Pick<UserProfile, "firstName" | "lastName" | "level" | "skills" | "interests">
>;

/** Alias kept for backwards-compat with any existing references */
export type UpdateProfilePayload = ProfileUpdatePayload;

export interface EnrolledCourse {
  courseId: string;
  title: string;
  thumbnail: string;
  progressPercent: number; // 0–100
  enrolledAt: string;      // ISO string
}