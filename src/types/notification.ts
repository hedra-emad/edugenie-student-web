export type NotificationType =
  | 'COURSE_APPROVED'
  | 'COURSE_REJECTED'
  | 'COURSE_SUBMITTED_FOR_REVIEW'
  | 'NEW_ENROLLMENT'
  | 'NEW_REVIEW'
  | 'LOW_RATING'
  | 'PURCHASE_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_EARNED'
  | 'REPORT_RESOLVED'
  | 'EARNING_RECORDED'
  | 'CONTENT_REMOVED'
  | 'INACTIVITY_REMINDER'
  | 'NEW_CONTENT_PUBLISHED'
  | 'GOAL_MILESTONE'
  | 'NEW_LOGIN_ATTEMPT'
  | 'WEEKLY_SUMMARY'
  | 'MONTHLY_SUMMARY'
  | 'MILESTONE_REACHED';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
}
