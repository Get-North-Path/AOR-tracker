import type { CohortStats, GlobalMilestonePace, UserProfile } from "./types";
import { MILESTONE_DEFS } from "./constants";
import { daysSinceAor as calcDaysSinceAor } from "./ppr-estimate";
import { milestoneEstimatesFromPace, milestoneIsLogged } from "./milestone-gap-estimates";

export type IntelligenceStatus = "Ahead" | "Normal" | "Watch" | "Delayed";
export type IntelligenceConfidence = "High" | "Moderate" | "Low";

export type SmartInsight = {
  status: {
    label: IntelligenceStatus;
    color: string; // e.g. text-green-500
    icon: string; // e.g. 🟢
    message: string;
  };
  confidence: IntelligenceConfidence;
  expectedWindow: string;
  alert: string | null;
};

function determineStatus(
  days: number,
  p25: number,
  p75: number,
  p90: number,
  median: number
): SmartInsight["status"] {
  // If we don't have enough cohort data, default to Normal
  if (!median || median <= 0) {
    return {
      label: "Normal",
      color: "text-green-500",
      icon: "🟢",
      message: "Your application is progressing within normal expected times.",
    };
  }

  // Smooth out differences. A buffer of 5 days prevents jitter.
  const buffer = 5;

  if (days < p25 - buffer) {
    return {
      label: "Ahead",
      color: "text-green-500",
      icon: "🟢",
      message: "You are progressing faster than most similar applicants.",
    };
  } else if (days <= p75 + buffer) {
    return {
      label: "Normal",
      color: "text-green-500",
      icon: "🟢",
      message: "You're progressing close to similar applicants.",
    };
  } else if (days <= p90) {
    return {
      label: "Watch",
      color: "text-yellow-500",
      icon: "🟡",
      message: "Your timeline is slightly longer than average, but within normal limits.",
    };
  } else {
    return {
      label: "Delayed",
      color: "text-red-500",
      icon: "🔴",
      message: "Your application is taking longer than most similar applicants.",
    };
  }
}

function determineConfidence(cohort: CohortStats): IntelligenceConfidence {
  const n = cohort.n_verified ?? 0;
  const completionRate = cohort.completion_rate ?? 0;

  if (n >= 50 && completionRate >= 0.2) {
    return "High";
  } else if (n >= 15) {
    return "Moderate";
  } else {
    return "Low";
  }
}

function determineNextMilestoneWindow(
  profile: Pick<UserProfile, "milestones" | "aorDate">,
  pace: GlobalMilestonePace | null
): string {
  if (!profile.aorDate) return "N/A";

  // Find the next unlogged milestone in chronological order
  let nextKey: string | null = null;
  for (const def of MILESTONE_DEFS) {
    if (def.key === "aor") continue;
    if (!milestoneIsLogged(profile, def.key)) {
      nextKey = def.key;
      break;
    }
  }

  if (!nextKey) return "All tracked milestones completed!";

  if (!pace || pace.total_avg_days_to_ecopr <= 0) {
    return "Insufficient data to estimate next milestone.";
  }

  const cumDays = pace.cumulative_avg_days[nextKey as keyof typeof pace.cumulative_avg_days];
  if (cumDays !== undefined && cumDays > 0) {
    const daysElapsed = calcDaysSinceAor(profile.aorDate);
    const daysRemaining = cumDays - daysElapsed;
    
    if (daysRemaining <= 0) {
      return "Any day now";
    }
    // Create a smooth range (e.g., 20-35 days)
    const lower = Math.max(0, daysRemaining - 7);
    const upper = daysRemaining + 14;
    return `${lower}-${upper} days`;
  }

  return "Estimating...";
}

function determineAlert(
  profile: Pick<UserProfile, "milestones" | "aorDate">,
  cohort: CohortStats,
  pace: GlobalMilestonePace | null
): string | null {
  const days = calcDaysSinceAor(profile.aorDate);
  const bioLogged = milestoneIsLogged(profile, "biometrics");
  const medLogged = milestoneIsLogged(profile, "medical");
  
  if (!bioLogged && pace && pace.cumulative_avg_days["biometrics"]) {
    const avgBioDays = pace.cumulative_avg_days["biometrics"];
    if (days > avgBioDays + 14) {
      return "Biometrics are taking longer than the community average.";
    }
  }

  if (medLogged && pace && pace.cumulative_avg_days["medical"]) {
    const aorDateStr = profile.milestones["aor"]?.date;
    const medDateStr = profile.milestones["medical"]?.date;
    if (aorDateStr && medDateStr) {
      const aDate = new Date(`${aorDateStr}T12:00:00`);
      const mDate = new Date(`${medDateStr}T12:00:00`);
      const diff = Math.round((mDate.getTime() - aDate.getTime()) / 86400000);
      const avgMedDays = pace.cumulative_avg_days["medical"];
      if (diff < avgMedDays - 14) {
        return "Medical passed earlier than average for your stream!";
      }
    }
  }

  if (cohort.weekly_delta && cohort.weekly_delta >= 0.05) {
    return "PPR trend is accelerating for your cohort this week.";
  }

  // Fallback benign alert
  return "Your timeline remains within expected community trends.";
}

export function buildSmartInsight(
  profile: Pick<UserProfile, "milestones" | "aorDate">,
  cohort: CohortStats,
  pace: GlobalMilestonePace | null
): SmartInsight {
  const days = calcDaysSinceAor(profile.aorDate);
  const p25 = cohort.p25_days ?? cohort.median_days_to_ppr;
  const p75 = cohort.p75_days ?? cohort.median_days_to_ppr;
  const p90 = cohort.p90_days ?? p75 + 30; // Fallback if missing
  const median = cohort.median_days_to_ppr;

  const status = determineStatus(days, p25, p75, p90, median);
  const confidence = determineConfidence(cohort);
  const expectedWindow = determineNextMilestoneWindow(profile, pace);
  const alert = determineAlert(profile, cohort, pace);

  return {
    status,
    confidence,
    expectedWindow,
    alert,
  };
}
