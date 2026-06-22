/**
 * Seed data and types for the "dashboard-new" preview page.
 *
 * This is a parallel implementation of `/dashboard`, scoped under
 * `(marketing)/dashboard-new` so the team can iterate on the new UI without
 * disturbing the production dashboard.
 *
 * NOTE: every field below is currently static / dummy data lifted from
 * `samples/aortrack-dashboard.html`. When this design is promoted, swap each
 * source for the real values exposed by `DashboardContext`:
 *
 *   - profile, days, median, pct                  → ctx.profile / ctx.days …
 *   - cohort bars, histogram, dot-map, compare    → ctx.cohort / ctx.cohortDisplay
 *   - PPR window                                  → ctx.ppr
 *   - shareUrl                                    → ctx.shareUrl
 *
 * Look for `TODO(dashboard-new):` markers throughout the components.
 */

import type { ReactNode } from "react";

/* ───────────────────────────── PROFILE / IDENTITY ────────────────────── */

export type DnProfile = {
  applicantId: string;
  stream: string;
  typeLabel: string;
  province: string;
  aorDateLabel: string;
  cohortLabel: string;
};

export const DN_PROFILE: DnProfile = {
  applicantId: "#4821",
  stream: "CEC",
  typeLabel: "Inland",
  province: "Ontario",
  aorDateLabel: "Feb 20, 2026",
  cohortLabel: "Feb 2026 · CEC · Inland",
};

/* ───────────────────────────── HERO STATS ────────────────────────────── */

export type DnHeroStats = {
  /** Animated days-since-AOR counter target. */
  daysSinceAor: number;
  typicalWait: { value: string; note: string };
  queuePosition: { value: string; note: string; tone: "good" | "warn" };
  expectedApproval: { value: string; note: string };
};

export const DN_HERO_STATS: DnHeroStats = {
  daysSinceAor: 70,
  typicalWait: {
    value: "184 days",
    note: "Based on real data from people like you",
  },
  queuePosition: {
    value: "Top of the list",
    note: "0 people with the same profile ahead of you",
    tone: "good",
  },
  expectedApproval: {
    value: "Aug – Oct 2026",
    note: "Not guaranteed   estimate only",
  },
};

/* ───────────────────────────── INFO CARDS ──────────────────────────── */

export type DnInfoCard = {
  id: string;
  label: string;
  tooltip: string;
  value: string;
  valueTone?: "teal" | "default";
  note: string;
  explain: string;
};

export const DN_INFO_CARDS: DnInfoCard[] = [
  {
    id: "journey",
    label: "How far along you are",
    tooltip:
      "We compare how many days have passed vs how long it typically takes for people with your profile.",
    value: "38%",
    valueTone: "teal",
    note: "of the typical journey complete",
    explain:
      "You've passed 38% of the typical timeline. Most people in your group finish their journey in about 184 days   you're on Day 70.",
  },
  {
    id: "cohort-ppr",
    label: "Approvals in your group so far",
    tooltip:
      "This shows what percentage of people who applied at the same time as you have already received their permanent residence approval.",
    value: "0%",
    note: "of your group has been approved yet",
    explain:
      "Nobody in your group has received final approval yet. This is normal   you're all early in the process. Check back weekly for updates.",
  },
  {
    id: "weekly-ppr",
    label: "Approval happening this week",
    tooltip:
      "Number of people across all groups who received their final PR approval this week.",
    value: "18",
    valueTone: "teal",
    note: "people approved across all groups this week",
    explain:
      "Great news   approvals are picking up! 38% more than last week. This suggests IRCC is processing files faster.",
  },
];

/* ───────────────────────────── JOURNEY PROGRESS ──────────────────────── */

export type DnJourneyStat = {
  label: string;
  value: string;
  sub: string;
  tone?: "green" | "amber" | "default";
};

export type DnJourneyProgress = {
  title: string;
  /** Animated progress fill width %. */
  progressPct: number;
  startLabel: string;
  endLabel: string;
  centerLabel: string;
  stats: [DnJourneyStat, DnJourneyStat, DnJourneyStat, DnJourneyStat];
};

export const DN_JOURNEY_PROGRESS: DnJourneyProgress = {
  title: "Where you are on your journey",
  progressPct: 34.8,
  startLabel: "Start   Mar 4, 2026 (Day 0)",
  endLabel: "Median finish   Sep 30, 2026 (Day 210)",
  centerLabel: "You are here   Day 73 of 210   34.8% through your journey",
  stats: [
    {
      label: "Waited",
      value: "73 days",
      sub: "since AOR",
      tone: "green",
    },
    {
      label: "Remaining",
      value: "~137 days",
      sub: "to median",
      tone: "amber",
    },
    {
      label: "Journey",
      value: "34.8%",
      sub: "73 ÷ 210 × 100",
      tone: "default",
    },
    {
      label: "Queue",
      value: "Top",
      sub: "0 ahead of you",
      tone: "default",
    },
  ],
};

/* ───────────────────────────── TIMELINE ──────────────────────────────── */

export type DnTimelineState = "done" | "now" | "wait" | "final";

export type DnTimelineBadge =
  | { kind: "verified"; label: string }
  | { kind: "pending"; label: string }
  | { kind: "estimate"; label: string };

export type DnTimelineRow = {
  /** Stable key, also used to address the inline edit panel. */
  key: string;
  state: DnTimelineState;
  name: string;
  desc: string;
  badge?: DnTimelineBadge;
  /** Right column. Either a concrete date+day, or "Not yet". */
  date?: { date: string; day: string };
  pending?: boolean;
  /** Whether this row has an inline "Edit" / "+ Add date" affordance. */
  edit?:
    | {
        label: string;
        /** Field label shown above the date input. */
        fieldLabel: string;
        /** Initial date value (yyyy-mm-dd). */
        initial?: string;
        /** Override Save button text (e.g. "Save & contribute to community"). */
        saveLabel?: string;
        /** If true, the panel is opened from the right column (date column). */
        fromDate?: boolean;
      }
    | undefined;
};

export const DN_TIMELINE: DnTimelineRow[] = [
  {
    key: "aor",
    state: "done",
    name: "AOR   Acknowledgement of Receipt",
    desc: "Your application entered the IRCC processing queue.",
    badge: { kind: "verified", label: "Verified" },
    date: { date: "Feb 20, 2026", day: "Day 0" },
  },
  {
    key: "bio",
    state: "done",
    name: "Biometrics Confirmed",
    desc: "Your biometrics verified in the IRCC system.",
    badge: { kind: "pending", label: "Pending review" },
    date: { date: "Mar 22, 2026", day: "Day 30" },
    edit: {
      label: "Edit",
      fieldLabel: "Biometrics Date",
      initial: "2026-03-22",
      fromDate: true,
    },
  },
  {
    key: "bgc",
    state: "now",
    name: "Background Check",
    desc: "Security and criminal background checks underway.",
    badge: {
      kind: "estimate",
      label: "Est. Day 58–90 · 341 cohort members at this stage",
    },
    pending: true,
    edit: {
      label: "Add date",
      fieldLabel: "Background Check Start Date",
      saveLabel: "Save & contribute to community",
    },
  },
  {
    key: "med",
    state: "wait",
    name: "Medical Results",
    desc: "IRCC reviewing your medical examination results.",
    badge: {
      kind: "estimate",
      label: "Est. Day 75–110 · 298 cohort members past this",
    },
    pending: true,
    edit: { label: "Add date", fieldLabel: "Medical Results Date" },
  },
  {
    key: "p1",
    state: "wait",
    name: "P1   PR Portal (first invitation)",
    desc:
      "IRCC invites you to confirm you are in Canada and complete the first Permanent Residence Portal tasks.",
    badge: {
      kind: "estimate",
      label: "Est. after medical · varies by stream",
    },
    pending: true,
    edit: { label: "Add date", fieldLabel: "P1 (portal first invitation) Date" },
  },
  {
    key: "p2",
    state: "wait",
    name: "P2   PR Portal (photo & address)",
    desc:
      "Submit your portrait photo and Canadian mailing address for your PR card in the portal.",
    badge: {
      kind: "estimate",
      label: "Est. after P1 · when IRCC requests portal step 2",
    },
    pending: true,
    edit: { label: "Add date", fieldLabel: "P2 (portal photo & address) Date" },
  },
  {
    key: "ecopr",
    state: "final",
    name: "eCOPR issued",
    desc:
      "Electronic Confirmation of Permanent Residence   formal PR grant; proof of status until your PR card arrives.",
    badge: {
      kind: "estimate",
      label: "Est. Aug–Oct 2026 · P25–P75 · cohort completion",
    },
    pending: true,
  },
];

export const DN_TIMELINE_NOTE =
  "Estimates from 1,240 community-verified submissions · CEC · Feb 2026 · Updated May 3, 2026";

/* ───────────────────────────── COHORT BARS ───────────────────────────── */

export type DnCohortBarFill = "g" | "b" | "a" | "r";

export type DnCohortBar = {
  name: string;
  /** Renderable name (lets us add icons inline). */
  nameNode?: ReactNode;
  countLabel: string;
  pct: number;
  fill: DnCohortBarFill;
  note?: string;
};

export const DN_COHORT_BARS: DnCohortBar[] = [
  {
    name: "AOR Received",
    countLabel: "1,240 / 1,240 (100%)",
    pct: 100,
    fill: "g",
  },
  {
    name: "BIL Received",
    countLabel: "1,108 / 1,240 (89%)",
    pct: 89,
    fill: "b",
    note: "Median: Day 14 after AOR",
  },
  { name: "Biometrics", countLabel: "974 / 1,240 (79%)", pct: 79, fill: "b" },
  {
    name: "Background Check",
    countLabel: "681 / 1,240 (55%)",
    pct: 55,
    fill: "a",
  },
  {
    name: "Medical Passed",
    countLabel: "544 / 1,240 (44%)",
    pct: 44,
    fill: "a",
  },
  {
    name: "P1   PR Portal (first)",
    countLabel: "312 / 1,240 (25%)",
    pct: 25,
    fill: "a",
  },
  {
    name: "P2   PR Portal (photo & address)",
    countLabel: "198 / 1,240 (16%)",
    pct: 16,
    fill: "a",
  },
  {
    name: "eCOPR issued",
    countLabel: "482 / 1,240 (39%)",
    pct: 39,
    fill: "r",
    note: "Median: Day 184 to eCOPR · Fastest: Day 142 · Slowest tracked: Day 231",
  },
];

/* ───────────────────────────── HISTOGRAM ─────────────────────────────── */

export type DnHistBar = {
  label: string;
  value: number;
  /** n=cohort, h=your-window, y=your-position. */
  type: "n" | "h" | "y";
};

export const DN_HIST: DnHistBar[] = [
  { label: "<150d", value: 18, type: "n" },
  { label: "155d", value: 34, type: "n" },
  { label: "162d", value: 52, type: "n" },
  { label: "170d", value: 88, type: "n" },
  { label: "178d", value: 96, type: "n" },
  { label: "186d", value: 80, type: "h" },
  { label: "194d", value: 62, type: "h" },
  { label: "202d", value: 42, type: "h" },
  { label: "210d", value: 28, type: "y" },
  { label: ">220d", value: 12, type: "n" },
];

/* ───────────────────────────── DOT MAP ───────────────────────────────── */

export type DnDotMap = {
  total: number;
  pprUpTo: number;
  midUpTo: number;
  /** Index (0-based) of the "you" dot inside the grid. */
  youIndex: number;
};

export const DN_DOT_MAP: DnDotMap = {
  total: 500,
  pprUpTo: 194,
  midUpTo: 339, // ppr (194) + mid (145)
  youIndex: 210,
};

/* ───────────────────────────── STREAM COMPARE ────────────────────────── */

export type DnStreamRow = {
  name: string;
  days: string;
  fillPct: number;
  /** Either the user's stream or a comparator. */
  variant: "neutral" | "you" | "fastest";
};

export const DN_STREAM_COMPARE: DnStreamRow[] = [
  { name: "CEC", days: "184d", fillPct: 72, variant: "you" },
  { name: "FSW General", days: "198d", fillPct: 77, variant: "neutral" },
  { name: "PNP", days: "216d", fillPct: 84, variant: "neutral" },
];

/* ───────────────────────────── SHARE ─────────────────────────────────── */

export type DnShare = {
  shareUrl: string;
  shareUrlDisplay: string;
  githubUrl: string;
};

export const DN_SHARE: DnShare = {
  shareUrl: "https://track.getnorthpath.com/t/hopeful-maple-cec-general-feb2026",
  shareUrlDisplay: "track.getnorthpath.com/t/hopeful-maple-cec-general-feb2026",
  githubUrl: "https://github.com/Get-North-Path/AOR-tracker",
};

/* ───────────────────────────── CONSULTING CTA ────────────────────────── */

export const DN_CONSULTING_CTA = {
  heading: "Need more than tracking?",
  sub:
    "GetNorthPath consultants manage your full PR application   ITA strategy through PPR submission. $299 CAD, AI-powered forms, expert review.",
  ctaLabel: "Book Free Consultation",
  href: "https://www.getnorthpath.com/contact?utm_source=dashboard",
};

/* ───────────────────────────── SIDEBAR ───────────────────────────────── */

export type SidebarIconKey =
  | "overview"
  | "timeline"
  | "cohort"
  | "feed"
  | "stats"
  | "plus"
  | "share"
  | "email"
  | "trash";

export type SidebarItem = {
  key: string;
  label: string;
  icon: SidebarIconKey;
  href?: string;
  active?: boolean;
  badge?: string;
  badgeTone?: "red";
  kind?: "danger";
};

export type SidebarSections = {
  dashboard: SidebarItem[];
  community: SidebarItem[];
  share: SidebarItem[];
  profile: SidebarItem[];
};

/** Section labels + items in the new sidebar. */
export const DN_SIDEBAR: SidebarSections = {
  dashboard: [
    {
      key: "overview",
      label: "Overview",
      icon: "overview",
      href: "#top",
    },
    {
      key: "timeline",
      label: "My Timeline",
      icon: "timeline",
      href: "#tl-sec",
    },
    {
      key: "cohort",
      label: "My Cohort",
      icon: "cohort",
      href: "#cohort-sec",
      badge: "1,240",
    },
  ],
  community: [
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
      href: "#",
    },
  ],
  /**
   * Share section mirrors the pair of links present in the current
   * `/dashboard` sidebar (`Processing Stats` immediately followed by
   * `Share Timeline`). The order matches the production sidebar so users
   * upgrading from the old design see the same grouping.
   *
   * `Processing Stats` keeps living at `/dashboard/stats` for now   the new
   * page-level Share section is reached via the `#share-sec` anchor.
   */
  share: [
    {
      key: "share-stats",
      label: "Processing Stats",
      icon: "stats",
      href: "/dashboard/stats",
    },
    {
      key: "share-link",
      label: "Share Timeline",
      icon: "share",
      /** Anchors to the on-page Share section. */
      href: "#share-sec",
    },
  ],
  profile: [
    {
      key: "add-email",
      label: "Add Email",
      icon: "email",
      href: "/profile/add-email",
    },
    {
      key: "delete",
      label: "Delete My Data",
      icon: "trash",
      kind: "danger",
    },
  ],
};

/* ─────────────────────── NO-EMAIL WARNING (sidebar) ──────────────────── */

export const DN_NO_EMAIL_WARN = {
  body: "No email on file.",
  linkLabel: "Add email",
  linkHref: "/profile/add-email",
  trailing: "to resume from any device.",
};

export type DnAnomalyAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
};

