"use client";

import { motion } from "motion/react";

export function DesignYourWorkflowSkeleton() {
  return (
    <div className="mx-auto mt-10 w-[90%] space-y-4">
      <motion.div
        className="rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs text-gray-500">List Setup</p>
        <p className="mt-2 text-sm font-medium">ICP: B2B SaaS • 1-200 employees</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-4">
        {["Companies", "Contacts"].map((item, idx) => (
          <motion.div
            key={item}
            className="rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.1 }}
          >
            <p className="text-xs text-gray-500">{item}</p>
            <div className="mt-3 h-2 w-full rounded bg-gray-200 dark:bg-neutral-700" />
            <div className="mt-2 h-2 w-4/5 rounded bg-gray-200 dark:bg-neutral-700" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ConnectYourTooklsSkeleton() {
  return (
    <div className="mx-auto mt-8 grid w-[90%] grid-cols-2 gap-4">
      <motion.div
        className="rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs text-gray-500">Lead Feed</p>
        <p className="mt-2 text-sm font-medium">42 new targets imported</p>
      </motion.div>
      <motion.div
        className="rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <p className="text-xs text-gray-500">Outreach Queue</p>
        <p className="mt-2 text-sm font-medium">18 messages ready for review</p>
      </motion.div>
      <div className="col-span-2 rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        {[70, 58, 82].map((w, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${w}%` }}
            transition={{ duration: 0.8, delay: i * 0.12 }}
            className="mt-2 h-2 rounded bg-neutral-300 dark:bg-neutral-600"
          />
        ))}
      </div>
    </div>
  );
}

export function DeployAndScaleSkeleton() {
  const rows = [
    "Step 1: Build target list",
    "Step 2: Score lead fit",
    "Step 3: Generate outreach",
    "Step 4: Track replies",
    "Step 5: Mark qualified",
  ];

  return (
    <div className="mx-auto mt-8 w-[90%] rounded-xl border border-gray-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      {rows.map((row, idx) => (
        <motion.div
          key={row}
          className="mt-2 flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-xs dark:bg-neutral-800"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
        >
          <span>{row}</span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Ready
          </span>
        </motion.div>
      ))}
    </div>
  );
}
