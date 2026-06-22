"use client";

/**
 * Adapters that derive the v2 dashboard view-models from the live
 * `DashboardContext` shape. Each function returns the prop value expected by
 * a single v2 section component (HeroBar, Rings, PprBar, Timeline, etc.).
 *
 * Keeping these here (vs inside the section components) means:
 *   - The section components stay framework-agnostic and props-driven, so
 *     the seed preview and live dashboard share one implementation.
 *   - All cohort-stats → UI math lives in one place   easy to audit when
 *     swapping the data pipeline (e.g. once histogram bucket sizes change).
 *
 * Naming follows the seed structure (`Dn*`) so the v2 components don't need
 * to learn anything new.
 */

import type { DashboardContextValue } from "@/components/dashboard/DashboardContext";
import { fmtDate } from "@/lib/format";
import {
  cohortKeyFromProfile,
  humanizeCohortKey,
  normalizeStreamLabel,
  streamGroupForStats,
} from "@/lib/cohort";
import { classifyHistBarTone } from "@/lib/cohort-histogram";
import { daysBetween, milestoneDate } from "@/lib/cohort-algorithm-v2";
import type { MilestoneDefRow } from "@/lib/cohort-dynamic";
import type { MilestoneKey, UserProfile } from "@/lib/types";
import { applicantIdFromEmail, timelineRowsFromProfile } from "@/lib/share-timeline-vm";
import type {
  DnCohortBar,
  DnDotMap,
  DnHeroStats,
  DnHistBar,
  DnInfoCard,
  DnJourneyProgress,
  DnProfile,
  DnStreamRow,
  DnTimelineRow,
  SidebarItem,
  SidebarSections,
  DnAnomalyAlert,
} from "./data";

/* ─── PROFILE / IDENTITY ────────────────────────────────────────────── */

export function profileVM(email: string, profile: UserProfile): DnProfile {
  return {
    applicantId: applicantIdFromEmail(email),
    stream: normalizeStreamLabel(profile.stream) || " ",
    typeLabel: profile.type || " ",
    province: profile.province || " ",
    aorDateLabel: fmtDate(profile.aorDate) || "Not set",
    cohortLabel: humanizeCohortKey(cohortKeyFromProfile(profile)),
  };
}

/* ─── HERO STATS ────────────────────────────────────────────────────── */

export function heroStatsVM(
  ctx: Pick<
    DashboardContextValue,
    | "days"
    | "median"
    | "journeyDays"
    | "journeyFromSeededPace"
    | "ppr"
    | "queueAhead"
  >,
): DnHeroStats {
  const { days, median, journeyDays, journeyFromSeededPace, ppr, queueAhead } =
    ctx;
  const atTop = queueAhead === 0;
  const journey = journeyDays > 0 ? journeyDays : null;
  const cohortMed = median > 0 ? median : null;

  return {
    daysSinceAor: days,
    typicalWait: {
      value: journey != null ? `${journey} days` : " ",
      note:
        journey != null
          ? journeyFromSeededPace
            ? "Typical AOR → eCOPR from community milestone timing (matches your timeline)"
            : "v2.0 recency-weighted median (survival bias corrected)"
          : "Timeline and journey estimates appear once cohort data is synced",
    },
    queuePosition: {
      value: atTop ? "Top of the list" : `${queueAhead} ahead`,
      note: atTop
        ? "No one in your cohort with an earlier AOR is still waiting on eCOPR"
        : `${queueAhead} applicant${queueAhead === 1 ? "" : "s"} with an earlier AOR still waiting on eCOPR`,
      tone: atTop ? "good" : queueAhead <= 5 ? "good" : "warn",
    },
    expectedApproval: {
      value: ppr?.windowLabel ?? " ",
      note: ppr?.limitedData
        ? journeyFromSeededPace
          ? "Early estimate   limited milestone timing data"
          : "Early estimate   limited cohort data"
        : journeyFromSeededPace
          ? "Typical eCOPR month from community milestone timing (matches your timeline)"
          : "v2.0 cohort P25–P75 window   not guaranteed",
    },
  };
}

/* ─── RINGS ─────────────────────────────────────────────────────────── */

export function infoCardsVM(
  ctx: Pick<
    DashboardContextValue,
    "pct" | "days" | "journeyDays" | "journeyFromSeededPace" | "cohort"
  >,
): DnInfoCard[] {
  const cohortPct = Math.round((ctx.cohort.completion_rate ?? 0) * 100);
  const pw = ctx.cohort.pulseWeekly ?? [];
  const thisWeek = pw[pw.length - 1] ?? 0;
  const lastWeek = pw[pw.length - 2] ?? 0;
  const weeklyDelta =
    lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : Math.round((ctx.cohort.weekly_delta ?? 0) * 100);

  const journeyExplain =
    ctx.journeyDays > 0
      ? ctx.journeyFromSeededPace
        ? `You've passed ${ctx.pct}% of the typical timeline. Community milestone timing suggests a full journey of about ${ctx.journeyDays} days from AOR   you're on Day ${ctx.days}.`
        : `You've passed ${ctx.pct}% of the typical timeline. Most people in your group finish in about ${ctx.journeyDays} days   you're on Day ${ctx.days}.`
      : `You're on Day ${ctx.days}. Journey length appears once cohort or milestone timing data is available.`;

  const cohortExplain =
    cohortPct === 0
      ? "Nobody in your group has received final approval yet. This is normal   you're all early in the process. Check back weekly for updates."
      : `${cohortPct}% of your group has received final approval. Check back weekly for updates as more people complete their journey.`;

  const weeklyExplain =
    weeklyDelta > 0
      ? `Great news   approvals are picking up! ${weeklyDelta}% more than last week. This suggests IRCC is processing files faster.`
      : weeklyDelta < 0
        ? `Approvals slowed slightly this week   ${Math.abs(weeklyDelta)}% fewer than last week. Weekly counts often fluctuate.`
        : "Approval volume is steady compared to last week. Check back for updates as the week progresses.";

  return [
    {
      id: "journey",
      label: "How far along you are",
      tooltip:
        "We compare how many days have passed vs how long it typically takes for people with your profile.",
      value: `${ctx.pct}%`,
      valueTone: "teal",
      note: "of the typical journey complete",
      explain: journeyExplain,
    },
    {
      id: "cohort-ppr",
      label: "Approvals in your group so far",
      tooltip:
        "This shows what percentage of people who applied at the same time as you have already received their permanent residence approval.",
      value: `${cohortPct}%`,
      note: "of your group has been approved yet",
      explain: cohortExplain,
    },
    {
      id: "weekly-ppr",
      label: "Approval happening this week",
      tooltip:
        "Number of people across all groups who received their final PR approval this week.",
      value: String(thisWeek),
      valueTone: "teal",
      note: "people approved across all groups this week",
      explain: weeklyExplain,
    },
  ];
}

/* ─── PPR WINDOW ────────────────────────────────────────────────────── */

function addDaysToIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function journeyProgressVM(
  ctx: Pick<
    DashboardContextValue,
    | "days"
    | "journeyDays"
    | "journeyFromSeededPace"
    | "profile"
    | "queueAhead"
  >,
): DnJourneyProgress {
  const { days, journeyDays, journeyFromSeededPace, profile, queueAhead } = ctx;
  const aorIso = profile.aorDate?.trim();
  const aorLabel = fmtDate(aorIso) || "AOR pending";
  const med = journeyDays > 0 ? journeyDays : null;
  const remaining = med != null ? Math.max(0, med - days) : null;
  const progressPct =
    med != null
      ? Math.min(100, Math.round((days / med) * 1000) / 10)
      : 0;
  const pctDisplay =
    med != null
      ? (Math.round((days / med) * 1000) / 10).toFixed(1)
      : " ";

  const finishLabel =
    med != null && aorIso ? fmtDate(addDaysToIso(aorIso, med)) : null;
  const finishPrefix = journeyFromSeededPace ? "Typical finish" : "Median finish";

  const startLabel = aorIso
    ? `Start   ${aorLabel} (Day 0)`
    : `Start   ${aorLabel}`;

  const endLabel =
    med != null && finishLabel
      ? `${finishPrefix}   ${finishLabel} (Day ${med})`
      : med != null
        ? `${finishPrefix}   Day ${med}`
        : "Typical finish   pending data";

  const centerLabel =
    med != null
      ? `You are here   Day ${days} of ${med}   ${pctDisplay}% through your journey`
      : `You are here   Day ${days}   journey length pending`;

  const atTop = queueAhead === 0;

  return {
    title: "Where you are on your journey",
    progressPct,
    startLabel,
    endLabel,
    centerLabel,
    stats: [
      {
        label: "Waited",
        value: `${days} days`,
        sub: "since AOR",
        tone: "green",
      },
      {
        label: "Remaining",
        value: remaining != null ? `~${remaining} days` : " ",
        sub: journeyFromSeededPace ? "to typical eCOPR" : "to median",
        tone: "amber",
      },
      {
        label: "Journey",
        value: med != null ? `${pctDisplay}%` : " ",
        sub: med != null ? `${days} ÷ ${med} × 100` : "pending",
        tone: "default",
      },
      {
        label: "Queue",
        value: atTop ? "Top" : `${queueAhead} ahead`,
        sub: atTop
          ? "0 ahead of you"
          : `${queueAhead} with earlier AOR still waiting`,
        tone: "default",
      },
    ],
  };
}

/* ─── TIMELINE ──────────────────────────────────────────────────────── */

export function timelineRowsVM(
  defs: MilestoneDefRow[],
  profile: UserProfile,
): DnTimelineRow[] {
  return timelineRowsFromProfile(defs, profile, { includeEdit: true });
}

/* ─── COHORT BARS ───────────────────────────────────────────────────── */

const BAR_FILL_BY_KEY: Record<MilestoneKey, "g" | "b" | "a" | "r"> = {
  aor: "g",
  biometrics: "b",
  background: "a",
  medical: "a",
  p1: "a",
  p2: "a",
  ecopr: "r",
};

export function cohortBarsVM(
  ctx: Pick<DashboardContextValue, "cohortDisplay" | "cohortTotal">,
  defs: MilestoneDefRow[],
): DnCohortBar[] {
  const total = ctx.cohortTotal || 1;
  return defs.map((d) => {
    const n = ctx.cohortDisplay.per_milestone_n?.[d.key] ?? 0;
    const pct = Math.round((n / total) * 100);
    return {
      name: d.label,
      countLabel: `${n} / ${total} (${pct}%)`,
      pct,
      fill: BAR_FILL_BY_KEY[d.key],
    };
  });
}

/* ─── HISTOGRAM ─────────────────────────────────────────────────────── */

function userEcoprDays(
  profile: DashboardContextValue["profile"],
): number | null {
  const aor = profile.aorDate?.trim() || milestoneDate(profile.milestones, "aor");
  const ecopr = milestoneDate(profile.milestones, "ecopr");
  if (!aor || !ecopr) return null;
  const d = daysBetween(aor, ecopr);
  return Number.isNaN(d) ? null : d;
}

export function histVM(
  ctx: Pick<DashboardContextValue, "cohort" | "profile">,
): DnHistBar[] {
  const p25 = ctx.cohort.p25_days;
  const p75 = ctx.cohort.p75_days;
  const ecoprDays = userEcoprDays(ctx.profile);
  return ctx.cohort.dist.map((r) => ({
    label: r.range,
    value: r.count,
    type: classifyHistBarTone(r.range, ecoprDays, p25, p75),
  }));
}

export function histSubtitleVM(
  ctx: Pick<DashboardContextValue, "cohort">,
): string {
  const n =
    ctx.cohort.dist.reduce((s, r) => s + (r.count ?? 0), 0) ||
    ctx.cohort.n_completed ||
    0;
  const total = ctx.cohort.n_verified;
  if (n === 0) {
    return `${total} applicants in cohort · no eCOPR completions logged yet`;
  }
  return `${n} eCOPR completion${n === 1 ? "" : "s"} of ${total} applicants · your position highlighted`;
}

/* ─── DOT MAP ───────────────────────────────────────────────────────── */

export function dotMapVM(
  ctx: Pick<
    DashboardContextValue,
    | "cohortTotal"
    | "days"
    | "journeyDays"
    | "median"
    | "cohortDataSparse"
    | "cohort"
  >,
): DnDotMap {
  // We render at most 500 dots to keep the SVG cheap. When the cohort is
  // smaller we render the actual count so the legend remains accurate.
  const total = Math.min(Math.max(ctx.cohortTotal, 1), 500);
  const completionPct = ctx.cohort.completion_rate ?? 0;
  const pprUpTo = Math.round(total * completionPct);
  const midUpTo = Math.min(total, pprUpTo + Math.round(total * 0.3));
  const youIndex = Math.min(
    total - 1,
    Math.max(
      0,
      Math.round((ctx.days / Math.max(ctx.journeyDays || ctx.median, 1)) * total),
    ),
  );
  return { total, pprUpTo, midUpTo, youIndex };
}

/* ─── STREAM COMPARE ────────────────────────────────────────────────── */

export function streamCompareVM(
  ctx: Pick<DashboardContextValue, "cohort" | "profile">,
): DnStreamRow[] {
  const medians = ctx.cohort.stream_medians;
  if (medians.length === 0) return [];

  const userGroup = streamGroupForStats(ctx.profile.stream);
  const byGroup = new Map<string, { name: string; median: number }>();
  for (const s of medians) {
    const group = streamGroupForStats(s.name);
    const label =
      group === "CEC"
        ? "CEC"
        : group === "FSW"
          ? "FSW General"
          : group === "PNP"
            ? "PNP"
            : s.name;
    const existing = byGroup.get(group);
    if (!existing || s.median < existing.median) {
      byGroup.set(group, { name: label, median: s.median });
    }
  }
  const rows = [...byGroup.values()];
  if (rows.length === 0) return [];

  const max = Math.max(...rows.map((s) => s.median), 1);
  const fastest = rows.reduce(
    (acc, cur) => (cur.median < acc.median ? cur : acc),
    rows[0],
  );

  return rows.map((s) => {
    const group = streamGroupForStats(s.name);
    const isYou = group === userGroup;
    const variant: DnStreamRow["variant"] = isYou
      ? "you"
      : s.name === fastest.name
        ? "fastest"
        : "neutral";
    return {
      name: s.name,
      days: `${s.median}d`,
      fillPct: Math.round((s.median / max) * 95),
      variant,
    };
  });
}

/* ─── SIDEBAR SECTIONS ──────────────────────────────────────────────── */

/**
 * Produce the four sidebar sections for the live dashboard.
 *
 * The Dashboard section uses in-page anchor links (`#tl-sec`, `#cohort-sec`,
 * `#share-sec`)   when the user is on `/dashboard` these scroll smoothly;
 * on sub-routes (`/dashboard/share`, `/dashboard/stats`) they navigate to
 * `/dashboard#…`. The Share section links to the two real sub-routes
 * (`/dashboard/stats`, `/dashboard/share`).
 *
 * `pathname` is used to flag the active item for `/dashboard/stats` and
 * `/dashboard/share` in the Share section. On `/dashboard`, the "Dashboard"
 * row highlights are driven by scroll-spy in `DashboardShellV2`, not here.
 */
export function sidebarSectionsVM({
  pathname,
  cohortTotal,
  hasEmail,
}: {
  pathname: string | null;
  cohortTotal: number;
  hasEmail: boolean;
}): SidebarSections {
  const onDashboard = pathname === "/dashboard";
  const onStats = pathname === "/dashboard/stats";
  const onShare = pathname === "/dashboard/share";

  const anchor = (frag: string) =>
    onDashboard ? frag : `/dashboard${frag}`;

  const dashboard: SidebarItem[] = [
    {
      key: "overview",
      label: "Overview",
      icon: "overview",
      href: anchor("#top"),
      /* `active` for dashboard items on `/dashboard` is driven by scroll-spy
         in `DashboardShellV2` so the highlight follows the visible section. */
    },
    {
      key: "timeline",
      label: "My Timeline",
      icon: "timeline",
      href: anchor("#tl-sec"),
    },
    {
      key: "cohort",
      label: "My Cohort",
      icon: "cohort",
      href: anchor("#cohort-sec"),
      badge: cohortTotal > 0 ? cohortTotal.toLocaleString() : undefined,
    },
  ];

  const community: SidebarItem[] = [
    {
      key: "feed",
      label: "Community Feed",
      icon: "feed",
      href: "/community",
    },
    {
      key: "feedback",
      label: "Give Feedback",
      icon: "plus",
      href: "https://github.com/Get-North-Path/AOR-tracker/issues/new/choose",
    },
  ];

  const share: SidebarItem[] = [
    {
      key: "share-stats",
      label: "Processing Stats",
      icon: "stats",
      href: "/dashboard/stats",
      active: onStats,
    },
    {
      key: "share-link",
      label: "Share Timeline",
      icon: "share",
      href: "/dashboard/share",
      active: onShare,
    },
  ];

  const profile: SidebarItem[] = [
    ...(hasEmail
      ? []
      : [
          {
            key: "add-email",
            label: "Add Email",
            icon: "email" as const,
            href: "/profile/add-email",
          },
        ]),
    {
      key: "delete",
      label: "Delete My Data",
      icon: "trash" as const,
      kind: "danger" as const,
    },
  ];

  return { dashboard, community, share, profile };
}

export function anomalyAlertsVM(
  ctx: Pick<DashboardContextValue, "cohort" | "cohortTotal">
): DnAnomalyAlert[] {
  const alerts: DnAnomalyAlert[] = [];

  // Determine weekly delta with existing weekly_delta priority, pulseWeekly fallback
  let weeklyDelta = 0;
  let hasWeeklyDelta = false;

  if (ctx.cohort.weekly_delta !== undefined && ctx.cohort.weekly_delta !== null) {
    weeklyDelta = Math.round(ctx.cohort.weekly_delta * 100);
    hasWeeklyDelta = true;
  } else {
    const weekly = ctx.cohort.pulseWeekly ?? [];
    if (weekly.length >= 2) {
      const current = weekly[weekly.length - 1];
      const previous = weekly[weekly.length - 2];
      if (previous > 0) {
        weeklyDelta = Math.round(((current - previous) / previous) * 100);
        hasWeeklyDelta = true;
      }
    }
  }

  if (hasWeeklyDelta) {
    if (weeklyDelta < -30) {
      alerts.push({
        id: "approval-drop",
        title: "Approval slowdown detected",
        description: `${Math.abs(weeklyDelta)}% fewer approvals than last week.`,
        severity: "warning",
      });
    } else if (weeklyDelta > 50) {
      alerts.push({
        id: "approval-spike",
        title: "Approval surge detected",
        description: `${weeklyDelta}% more approvals than last week.`,
        severity: "info",
      });
    }
  }

  if (
    (ctx.cohort.n_verified ?? 0) > 500 &&
    (ctx.cohort.n_completed ?? 0) < 20
  ) {
    alerts.push({
      id: "backlog",
      title: "Potential processing backlog",
      description: "Large cohort size with unusually low completion rate.",
      severity: "critical",
    });
  }

  return alerts;
}

