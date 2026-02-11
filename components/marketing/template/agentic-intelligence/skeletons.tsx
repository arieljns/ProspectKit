"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3Icon,
  BriefcaseIcon,
  LightbulbIcon,
  NewspaperIcon,
  ScanSearchIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

const pulse = {
  initial: { opacity: 0.5 },
  animate: { opacity: [0.5, 1, 0.5] },
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
};

export function DiscoverCompaniesSkeleton() {
  const items: ResearchSection[] = [
    {
      title: "Executive Summary",
      icon: <ScanSearchIcon className="size-4 text-blue-600" />,
      className:
        "border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-300/15 dark:bg-blue-500/10 dark:text-blue-300",
      description:
        "Overview, key strengths, key challenges, and current market position for the target account.",
      tags: ["Overview", "Strengths", "Challenges", "Market position"],
    },
    {
      title: "Products & Services",
      icon: <BriefcaseIcon className="size-4 text-emerald-600" />,
      className:
        "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-300/15 dark:bg-emerald-500/10 dark:text-emerald-300",
      description:
        "Core offerings with categories and notes reps can reuse for outreach personalization.",
      tags: ["Offerings", "Category", "Use case", "Context"],
    },
    {
      title: "Market Analysis",
      icon: <BarChart3Icon className="size-4 text-violet-600" />,
      className:
        "border border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-300/15 dark:bg-violet-500/10 dark:text-violet-300",
      description:
        "Target market, competitors, and size signal to support qualification and messaging angle.",
      tags: ["Target market", "Competitors", "Market size", "Positioning"],
    },
    {
      title: "Business Opportunities",
      icon: <LightbulbIcon className="size-4 text-amber-600" />,
      className:
        "border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-300/15 dark:bg-amber-500/10 dark:text-amber-300",
      description:
        "Potential opportunities identified from public data that can shape call openers and hypothesis.",
      tags: ["Pain points", "Timing", "Triggers", "Angle ideas"],
    },
    {
      title: "Recent News",
      icon: <NewspaperIcon className="size-4 text-neutral-600" />,
      className:
        "border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-300/15 dark:bg-neutral-500/10 dark:text-neutral-300",
      description:
        "Latest company updates and announcements to keep account research fresh and relevant.",
      tags: ["Announcements", "Funding", "Hiring", "Momentum"],
    },
  ];

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = items[selectedIndex];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSelectedIndex((index) => (index + 1) % items.length);
    }, 2200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [items.length]);

  return (
    <div className="mx-auto mt-10 w-[90%]">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {items.map((item, idx) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className={cn(
              "relative flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] transition duration-200",
              "opacity-60 hover:opacity-100",
              selectedIndex === idx && "opacity-100",
              item.className,
            )}
          >
            {selectedIndex === idx ? (
              <motion.span
                layoutId="report-selected-chip"
                className="absolute inset-0 rounded-md shadow-inner ring-1 ring-black/5 dark:ring-white/10"
              />
            ) : null}
            <span className="relative z-10">{item.icon}</span>
            <span className="relative z-10">{item.title}</span>
          </button>
        ))}
      </div>
      <div className="relative mx-auto h-[16rem] w-full max-w-sm rounded-t-3xl border border-gray-200 bg-neutral-100 p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        <ResearchSectionCard
          title={selected.title}
          icon={selected.icon}
          description={selected.description}
          tags={selected.tags}
          className={selected.className}
        />
      </div>
    </div>
  );
}

type ResearchSection = {
  title: string;
  icon: ReactNode;
  className: string;
  description: string;
  tags: string[];
};

const ResearchSectionCard = ({
  title,
  icon,
  description,
  tags,
  className,
}: ResearchSection) => {
  return (
    <motion.div
      key={title}
      className="flex h-full flex-col gap-4 rounded-2xl border border-black/5 bg-white p-3 ring-1 ring-black/5 dark:border-white/10 dark:bg-neutral-900 dark:ring-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
            className,
          )}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {icon}
        </motion.div>
        <motion.p
          className="text-sm font-semibold text-neutral-800 dark:text-neutral-100"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.05 }}
        >
          {title}
        </motion.p>
      </div>

      <div>
        <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {tags.map((tag, idx) => (
          <motion.div
            key={`${tag}-${idx}`}
            className="rounded-sm border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + idx * 0.05 }}
          >
            {tag}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export function ManageLeadsSkeleton() {
  const leads: LeadWorkbenchItem[] = [
    {
      name: "Maya Chen",
      title: "Head of Revenue",
      company: "SignalWorks",
      status: "Contacted",
      score: 89,
      priority: "High",
      nextStep: "Send pricing-angle follow-up",
      draft:
        "Noticed you are building your first SDR pod. ProspectKit can keep list building, scoring, and message drafts in one workflow without adding another heavy tool.",
      signals: [
        { label: "ICP fit", value: 92 },
        { label: "Buying timing", value: 84 },
        { label: "Intent", value: 78 },
      ],
    },
    {
      name: "Rafael Ortiz",
      title: "VP Sales",
      company: "Northlane",
      status: "New",
      score: 81,
      priority: "Medium",
      nextStep: "Generate first-touch opener",
      draft:
        "Saw your team posting for outbound roles while expanding upmarket. We can help prioritize who to contact first and draft tailored outreach faster.",
      signals: [
        { label: "ICP fit", value: 86 },
        { label: "Buying timing", value: 72 },
        { label: "Intent", value: 69 },
      ],
    },
    {
      name: "Jules Morgan",
      title: "Growth Lead",
      company: "StackRiver",
      status: "Responded",
      score: 93,
      priority: "High",
      nextStep: "Prep tailored discovery notes",
      draft:
        "Your recent product launch suggests active pipeline expansion. ProspectKit can enrich account context and keep outreach personalized as volume grows.",
      signals: [
        { label: "ICP fit", value: 95 },
        { label: "Buying timing", value: 90 },
        { label: "Intent", value: 88 },
      ],
    },
  ];

  const [activeLeadIndex, setActiveLeadIndex] = useState(0);
  const activeLead = leads[activeLeadIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLeadIndex((index) => (index + 1) % leads.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [leads.length]);

  return (
    <div className="relative mx-auto mt-10 w-[92%] rounded-2xl border border-gray-300 bg-white/95 p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Manage leads workspace</p>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            12 queued
          </span>
          <span className="rounded-md border border-emerald-200 bg-emerald-100 px-1.5 py-1 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-900/30 dark:text-emerald-300">
            4 hot leads
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          {leads.map((lead, index) => {
            const isActive = index === activeLeadIndex;
            return (
              <button
                key={`${lead.name}-${lead.company}`}
                type="button"
                onClick={() => setActiveLeadIndex(index)}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left transition",
                  "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600",
                  isActive &&
                    "border-brand/40 bg-brand/5 ring-1 ring-brand/25 dark:border-brand/40 dark:bg-brand/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-neutral-100">
                      {lead.name}
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-neutral-400">
                      {lead.company}
                    </p>
                  </div>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-neutral-900 dark:text-neutral-300">
                    {lead.score}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeLead.name}
          className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800 md:col-span-8"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-neutral-100">
                {activeLead.name} · {activeLead.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                {activeLead.company}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="rounded bg-gray-200/70 px-1.5 py-0.5 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">
                {activeLead.status}
              </span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {activeLead.priority}
              </span>
            </div>
          </div>

          <div className="mt-2 rounded-md border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-neutral-400">
              <span>Composite lead score</span>
              <span className="font-semibold text-gray-700 dark:text-neutral-200">{activeLead.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activeLead.score}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="bg-brand h-full rounded-full"
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {activeLead.signals.map((signal, index) => (
              <div
                key={signal.label}
                className="rounded-md border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">{signal.label}</p>
                <p className="mb-1 text-[11px] font-medium text-gray-700 dark:text-neutral-200">{signal.value}%</p>
                <div className="h-1 rounded-full bg-gray-100 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.value}%` }}
                    transition={{ duration: 0.45, delay: 0.05 * index }}
                    className="bg-brand/80 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="text-[10px] text-gray-500 dark:text-neutral-400">Outreach draft</p>
            <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-gray-600 dark:text-neutral-300">
              {activeLead.draft}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 dark:text-neutral-400">
                Next: {activeLead.nextStep}
              </span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1, delay: dot * 0.18, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

type LeadWorkbenchItem = {
  name: string;
  title: string;
  company: string;
  status: string;
  score: number;
  priority: string;
  nextStep: string;
  draft: string;
  signals: { label: string; value: number }[];
};

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
