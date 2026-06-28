"use client";

import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Award, User } from "lucide-react";

type ActivityType = "enrolled" | "completed" | "certificate" | "profile";

interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  relativeTime: string;
}

const ICON_MAP: Record<ActivityType, React.ReactNode> = {
  enrolled: <BookOpen size={16} aria-hidden="true" />,
  completed: <CheckCircle size={16} aria-hidden="true" />,
  certificate: <Award size={16} aria-hidden="true" />,
  profile: <User size={16} aria-hidden="true" />,
};

/** Placeholder data — replace with real API data when endpoint is available */
const PLACEHOLDER_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "profile",
    text: "Updated your profile",
    relativeTime: "Just now",
  },
];

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
  activities?: ActivityItem[];
}

export default function RecentActivity({ activities = PLACEHOLDER_ACTIVITIES }: Props) {
  return (
    <section aria-labelledby="recent-activity-heading">
      <h2
        id="recent-activity-heading"
        className="text-lg font-semibold text-slate-900 mb-4"
      >
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">
          No recent activity
        </p>
      ) : (
        <motion.ol
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative space-y-0"
          aria-label="Recent activity timeline"
        >
          {/* Vertical timeline line */}
          <span
            className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-200"
            aria-hidden="true"
          />

          {activities.map((item) => (
            <motion.li
              key={item.id}
              variants={itemVariants}
              className="relative flex items-start gap-4 pl-10 pb-6 last:pb-0"
            >
              {/* Icon dot */}
              <span
                className="absolute left-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-[#3B1892]"
                aria-hidden="true"
              >
                {ICON_MAP[item.type]}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-slate-700">{item.text}</p>
                <time className="text-xs text-slate-400 mt-0.5">
                  {item.relativeTime}
                </time>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </section>
  );
}
