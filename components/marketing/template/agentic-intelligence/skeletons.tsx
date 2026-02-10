"use client";

import { motion } from "motion/react";
import { IconBlock } from "../common/icon-block";
import { LogoSVG } from "../logo";

const pulse = {
  initial: { opacity: 0.4 },
  animate: { opacity: [0.4, 1, 0.4] },
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};

export function LLMModelSelectorSkeleton() {
  return (
    <div className="relative mx-auto mt-10 w-[86%] rounded-2xl border border-gray-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-xs text-gray-500">Scoring profile</p>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {["ICP match", "Buying signal", "Contact role"].map((row) => (
          <motion.div
            key={row}
            {...pulse}
            className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-xs dark:bg-neutral-800"
          >
            <span>{row}</span>
            <span className="font-medium">Active</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TextToWorkflowBuilderSkeleton() {
  return (
    <div className="relative mx-auto mt-10 w-[86%] rounded-2xl border border-gray-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-xs text-gray-500">Outreach draft</p>
      <div className="mt-3 rounded-md bg-gray-100 p-3 text-xs leading-relaxed dark:bg-neutral-800">
        Hi Alex, noticed your team is hiring its first outbound rep. We built
        Orbit SDR to keep list building and outreach lean without the overhead.
      </div>
      <div className="mt-3 flex items-center justify-end">
        <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Ready to send
        </span>
      </div>
    </div>
  );
}

export function NativeToolsIntegrationSkeleton() {
  return (
    <div className="relative mx-auto mt-8 flex w-full items-center justify-center gap-4 px-2 pb-4 sm:px-6">
      <IconBlock icon={<LogoSVG className="size-5" />} />
      <motion.div
        className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700"
        {...pulse}
      />
      <div className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900">
        Contact data
      </div>
      <motion.div
        className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700"
        {...pulse}
      />
      <div className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900">
        Message queue
      </div>
    </div>
  );
}
