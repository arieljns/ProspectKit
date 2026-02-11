"use client";

import { motion } from "motion/react";

const pulse = {
  initial: { opacity: 0.5 },
  animate: { opacity: [0.5, 1, 0.5] },
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
};

export function DiscoverCompaniesSkeleton() {
  const nodes = [
    { id: "n1", x: "14%", y: "20%", label: "FinTech", count: "12" },
    { id: "n2", x: "38%", y: "12%", label: "AI/ML", count: "9" },
    { id: "n3", x: "66%", y: "18%", label: "DevTools", count: "7" },
    { id: "n4", x: "25%", y: "62%", label: "SaaS", count: "18" },
    { id: "n5", x: "54%", y: "56%", label: "Data", count: "11" },
    { id: "n6", x: "78%", y: "66%", label: "Health", count: "6" },
  ];

  const edges = [
    { from: [14, 20], to: [38, 12] },
    { from: [38, 12], to: [66, 18] },
    { from: [14, 20], to: [25, 62] },
    { from: [38, 12], to: [54, 56] },
    { from: [66, 18], to: [78, 66] },
    { from: [25, 62], to: [54, 56] },
    { from: [54, 56], to: [78, 66] },
  ];

  return (
    <div className="relative mx-auto mt-10 w-[90%] rounded-2xl border border-gray-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Account signal map</p>
        <span className="rounded bg-blue-100 px-2 py-1 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Discover Companies
        </span>
      </div>
      <div className="relative h-52 overflow-hidden rounded-xl border border-gray-200 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.12),transparent_45%)] dark:border-neutral-700">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {edges.map((edge, index) => (
            <motion.line
              key={`${edge.from.join("-")}-${edge.to.join("-")}`}
              x1={`${edge.from[0]}%`}
              y1={`${edge.from[1]}%`}
              x2={`${edge.to[0]}%`}
              y2={`${edge.to[1]}%`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300 dark:text-neutral-700"
              strokeDasharray="7 7"
              initial={{ strokeDashoffset: 14, opacity: 0.4 }}
              animate={{ strokeDashoffset: [14, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.2, delay: index * 0.15, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </svg>

        <motion.div
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/40"
          animate={{ scale: [0.8, 1.2], opacity: [0.7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />

        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className="absolute"
            style={{ left: node.x, top: node.y }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-md border border-gray-300 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/90">
              <p className="text-[10px] font-medium text-gray-700 dark:text-neutral-200">
                {node.label}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                {node.count} accounts
              </p>
            </div>
          </motion.div>
        ))}

        <motion.div
          {...pulse}
          className="absolute right-3 bottom-3 rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Generate report + Find contacts
        </motion.div>
      </div>
    </div>
  );
}

export function ManageLeadsSkeleton() {
  return (
    <div className="relative mx-auto mt-10 w-[90%] rounded-2xl border border-gray-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Lead workbench</p>
        <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Manage Leads
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 space-y-2">
          <motion.div
            {...pulse}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <p className="text-xs font-medium text-gray-700 dark:text-neutral-200">
              Maya Chen · Sales Lead
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400">
              SignalWorks · Status: Contacted · Priority: High
            </p>
          </motion.div>
          <div className="space-y-1.5">
            {[
              { label: "Industry match", width: "88%" },
              { label: "Company need", width: "92%" },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-[10px] text-gray-500 dark:text-neutral-400">
                  <span>{item.label}</span>
                  <span>{item.width}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.width }}
                    transition={{ duration: 0.9, delay: 0.2 + index * 0.12 }}
                    className="bg-brand h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(var(--color-brand)_0_72%,rgba(209,213,219,0.5)_72%_100%)]" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "conic-gradient(transparent 0 80%, rgba(255,255,255,0.8) 80% 86%, transparent 86% 100%)" }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700 dark:bg-neutral-900 dark:text-neutral-200">
              89
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-500 dark:text-neutral-400">
            Composite lead score
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-[10px] text-gray-500 dark:text-neutral-400">
          Outreach draft
        </p>
        <p className="mt-1 text-[10px] text-gray-600 dark:text-neutral-300">
          Noticed your team is hiring first SDRs. We can help keep qualification
          and messaging in one workflow.
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, delay: dot * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PipelineAnalyticsSkeleton() {
  const stats = [
    { label: "Total Leads", value: "124" },
    { label: "A-grade", value: "38" },
    { label: "Contacted", value: "72%" },
    { label: "Qualified", value: "26%" },
  ];

  const stages = [
    { stage: "Leads", width: "100%", count: "124" },
    { stage: "Contacted", width: "72%", count: "89" },
    { stage: "Responded", width: "41%", count: "51" },
    { stage: "Qualified", width: "26%", count: "32" },
  ];

  return (
    <div className="relative mx-auto mt-8 w-full max-w-5xl px-2 pb-4 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700/60 dark:bg-neutral-900">
        <p className="mb-4 text-[11px] font-medium tracking-wide text-gray-400 uppercase dark:text-neutral-500">
          Pipeline flow
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-0 border-b border-gray-100 pb-4 dark:border-neutral-800">
          {stats.map((item, i) => (
            <motion.div
              key={item.label}
              {...pulse}
              className={`${i > 0 ? "border-l border-gray-100 pl-4 dark:border-neutral-800" : ""}`}
            >
              <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-neutral-100">
                {item.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bar chart + Line chart side by side */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Horizontal bar chart */}
          <div className="space-y-3 md:col-span-3">
            {stages.map((item, index) => (
              <div key={item.stage} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-right text-[10px] text-gray-400 dark:text-neutral-500">
                  {item.stage}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.width }}
                    transition={{ duration: 1.1, delay: 0.2 + index * 0.15 }}
                    className="from-brand to-brand/50 h-full rounded-full bg-gradient-to-r"
                  />
                </div>
                <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-gray-400 dark:text-neutral-500">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Leads over time */}
          <div className="flex flex-col justify-between md:col-span-2 md:border-l md:border-gray-100 md:pl-4 md:dark:border-neutral-800">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400 dark:text-neutral-500">
              <span>Leads over time</span>
              <span>30d</span>
            </div>
            <svg viewBox="0 0 200 56" className="w-full" style={{ aspectRatio: "200/56" }}>
              {/* Area fill */}
              <motion.path
                d="M0 44 C 20 38, 36 40, 56 30 C 72 22, 88 30, 104 20 C 120 12, 140 24, 158 16 C 172 10, 186 18, 200 8 L200 56 L0 56 Z"
                fill="var(--color-brand)"
                opacity="0.06"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.06 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              {/* Line */}
              <motion.path
                d="M0 44 C 20 38, 36 40, 56 30 C 72 22, 88 30, 104 20 C 120 12, 140 24, 158 16 C 172 10, 186 18, 200 8"
                fill="none"
                stroke="var(--color-brand)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.6 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
              {/* Dot following the curve */}
              <circle r="2.5" fill="var(--color-brand)" opacity="0.9">
                <animateMotion
                  dur="2.8s"
                  repeatCount="indefinite"
                  path="M0 44 C 20 38, 36 40, 56 30 C 72 22, 88 30, 104 20 C 120 12, 140 24, 158 16 C 172 10, 186 18, 200 8"
                />
              </circle>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
