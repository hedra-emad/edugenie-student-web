"use client";

import { motion } from "framer-motion";

export default function DotsLoader() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
