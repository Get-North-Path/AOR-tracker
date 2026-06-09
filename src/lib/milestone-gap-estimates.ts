import {
  daysBetween,
  milestoneDate,
} from "@/lib/cohort-algorithm-v2";
import type { GlobalMilestonePace, MilestoneKey, UserProfile } from "@/lib/types";

export const MILESTONE_PACE_DOC_ID = "global_seeded" as const;

/** Minimum seeded profiles with both segment dates to show an estimate. */
export const MIN_SEGMENT_N = 5;

export const MILESTONE_SEGMENT_ORDER: {
  prev: MilestoneKey | "aor";
  key: MilestoneKey;
}[] = [
  { prev: "aor", key: "biometrics" },
  { prev: "biometrics", key: "background" },
  { prev: "background", key: "medical" },
  { prev: "medical", key: "p1" },
  { prev: "p1", key: "p2" },
  { prev: "p2", key: "ecopr" },
];

const TIMELINE_ORDER: MilestoneKey[] = [
  "aor",
  "biometrics",
  "background",
  "medical",
  "p1",
  "p2",
  "ecopr",
];

export type ProfileForMilestonePace = {
  aorDate?: string;
  milestones?: Record<string, { date?: string | null }>;
  seededData?: boolean;
};

function dateForMilestone(
  p: ProfileForMilestonePace,
  key: MilestoneKey | "aor",
): string {
  if (key === "aor") {
    return p.aorDate?.trim() || milestoneDate(p.milestones, "aor");
  }
  return milestoneDate(p.milestones, key);
}

/**
 * Median segment gap (rounded). Processing-time gaps are right-skewed   a few
 * stuck applicants (e.g. long background checks) drag a mean upward and inflate
 * the "typical" estimate for everyone. The median is robust to those outliers,
 * matching the percentile approach the cohort engine already uses
 * (`weightedPercentile` in cohort-algorithm-v2.ts).
 */
function medianRounded(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;
  return Math.round(med);
}

/**
 * Median inter-milestone gaps from seeded profiles only (global table).
 * Inspired by aortrack-backend milestone pace spec.
 *
 * Note: the result keys (`segment_avg_days`, `cumulative_avg_days`,
 * `total_avg_days_to_ecopr`) retain their `_avg_` names for back-compat with
 * already-persisted `milestone_pace` docs; the values are now medians, not means.
 */
export function computeGlobalSeededMilestonePace(
  profiles: ProfileForMilestonePace[],
): GlobalMilestonePace {
  const seeded = profiles.filter((p) => p.seededData === true);
  const segment_avg_days: Partial<Record<MilestoneKey, number>> = {};
  const segment_n: Partial<Record<MilestoneKey, number>> = {};

  for (const { prev, key } of MILESTONE_SEGMENT_ORDER) {
    const gaps: number[] = [];
    for (const p of seeded) {
      const prevDate = dateForMilestone(p, prev);
      const keyDate = dateForMilestone(p, key);
      if (!prevDate || !keyDate) continue;
      const gap = daysBetween(prevDate, keyDate);
      if (Number.isNaN(gap) || gap < 0) continue;
      gaps.push(gap);
    }
    segment_n[key] = gaps.length;
    if (gaps.length >= MIN_SEGMENT_N) {
      segment_avg_days[key] = medianRounded(gaps);
    }
  }

  const cumulative_avg_days: Partial<Record<MilestoneKey, number>> = {};
  let running = 0;
  let paceComplete = true;

  for (const { key } of MILESTONE_SEGMENT_ORDER) {
    const seg = segment_avg_days[key];
    if (seg == null || seg <= 0) {
      paceComplete = false;
      break;
    }
    running += seg;
    cumulative_avg_days[key] = running;
  }

  return {
    computed_at: new Date().toISOString(),
    segment_avg_days,
    segment_n,
    cumulative_avg_days,
    total_avg_days_to_ecopr: paceComplete ? running : 0,
    profiles_scanned: profiles.length,
    seeded_profiles: seeded.length,
  };
}

export function addDaysIso(aorDate: string, days: number): string {
  const target = new Date(`${aorDate.slice(0, 10)}T12:00:00`);
  target.setDate(target.getDate() + days);
  return target.toISOString().slice(0, 10);
}

export function formatEstDateFromAor(aorDate: string, daysAfter: number): string {
  return new Date(`${addDaysIso(aorDate, daysAfter)}T12:00:00`).toLocaleDateString(
    "en-CA",
    { month: "short", day: "numeric", year: "numeric" },
  );
}

/**
 * Estimate ISO date for one pending milestone: AOR + cumulative seeded average only.
 * Logged milestone dates are not used in the calculation (display-only on the timeline).
 */
export function estimatedIsoForMilestone(
  targetKey: MilestoneKey,
  aorDate: string,
  pace: GlobalMilestonePace,
  profile?: Pick<UserProfile, "milestones" | "aorDate">,
): { iso: string; daysAfterAor: number } | null {
  if (targetKey === "aor" || !pace.total_avg_days_to_ecopr) return null;
  if (profile && milestoneIsLogged(profile, targetKey)) return null;

  const cum = pace.cumulative_avg_days[targetKey];
  if (cum == null) return null;
  return {
    iso: addDaysIso(aorDate, cum),
    daysAfterAor: cum,
  };
}

export type MilestoneEstimateRow = {
  estLabel: string;
  desc: string;
  available: boolean;
};

/** True when the applicant has already logged this milestone (not an estimate target). */
export function milestoneIsLogged(
  profile: Pick<UserProfile, "milestones" | "aorDate"> | undefined,
  key: MilestoneKey,
): boolean {
  if (!profile) return false;
  if (key === "aor") {
    return !!(
      profile.aorDate?.trim() || milestoneDate(profile.milestones, "aor")
    );
  }
  return !!profile.milestones[key]?.date?.trim();
}

export function milestoneEstimatesFromPace(
  aorDate: string,
  pace: GlobalMilestonePace | null,
  profile?: Pick<UserProfile, "milestones" | "aorDate">,
): Partial<Record<MilestoneKey, MilestoneEstimateRow>> {
  const out: Partial<Record<MilestoneKey, MilestoneEstimateRow>> = {};
  if (!pace || pace.total_avg_days_to_ecopr <= 0) return out;

  for (const key of TIMELINE_ORDER) {
    if (key === "aor") continue;
    if (milestoneIsLogged(profile, key)) continue;

    const row = estimatedIsoForMilestone(key, aorDate, pace, profile);
    const n = pace.segment_n[key] ?? 0;
    if (!row) {
      out[key] = {
        estLabel: " ",
        desc: `Not enough community milestone dates for this step (need at least ${MIN_SEGMENT_N} paired timelines).`,
        available: false,
      };
      continue;
    }
    out[key] = {
      estLabel: `~${formatEstDateFromAor(aorDate, row.daysAfterAor)}`,
      desc: `Typical ~${row.daysAfterAor}d after AOR (median gaps from ${n} profiles on AOR Track).`,
      available: true,
    };
  }

  return out;
}

export function milestonePaceFilter(): { paceKey: string } {
  return { paceKey: MILESTONE_PACE_DOC_ID };
}

export function parseMilestonePaceDoc(
  doc: Record<string, unknown> | null | undefined,
): GlobalMilestonePace | null {
  if (!doc) return null;
  const total = doc.total_avg_days_to_ecopr;
  if (typeof total !== "number" || total <= 0) return null;
  return {
    computed_at: String(doc.computed_at ?? ""),
    segment_avg_days: (doc.segment_avg_days ?? {}) as Partial<
      Record<MilestoneKey, number>
    >,
    segment_n: (doc.segment_n ?? {}) as Partial<Record<MilestoneKey, number>>,
    cumulative_avg_days: (doc.cumulative_avg_days ?? {}) as Partial<
      Record<MilestoneKey, number>
    >,
    total_avg_days_to_ecopr: total,
    profiles_scanned: Number(doc.profiles_scanned ?? 0),
    seeded_profiles: Number(doc.seeded_profiles ?? 0),
  };
}
