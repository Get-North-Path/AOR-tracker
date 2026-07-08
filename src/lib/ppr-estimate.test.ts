import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GlobalMilestonePace } from "@/lib/types";
import {
  estimateEcoprFromSeededPace,
  resolveApprovalEstimate,
} from "@/lib/ppr-estimate";

const pace: GlobalMilestonePace = {
  computed_at: "2026-01-01T00:00:00.000Z",
  segment_avg_days: {
    biometrics: 63,
    background: 26,
    medical: 2,
    p1: 59,
    p2: 6,
    ecopr: 13,
  },
  segment_n: {
    biometrics: 353,
    background: 172,
    medical: 277,
    p1: 276,
    p2: 270,
    ecopr: 158,
  },
  cumulative_avg_days: {
    biometrics: 63,
    background: 89,
    medical: 91,
    p1: 150,
    p2: 156,
    ecopr: 169,
  },
  total_avg_days_to_ecopr: 169,
  profiles_scanned: 500,
  seeded_profiles: 200,
};

describe("resolveApprovalEstimate", () => {
  it("uses seeded eCOPR month (not cohort P25–P75) when pace exists", () => {
    const est = resolveApprovalEstimate("2026-04-03", {
      cohortKey: "cec|on|2026-04",
      median_days_to_ppr: 65,
      p25_days: 50,
      p75_days: 80,
      n_verified: 100,
      n_eligible: 100,
      completion_rate: 0.5,
      weekly_delta: 0.1,
      last_updated: new Date().toISOString(),
      stream_medians: [],
      per_milestone_n: {},
      dist: [],
      pulseWeekly: []
    }, pace);

    assert.equal(est.windowLabel, "Sep 2026");
    assert.notEqual(est.windowLabel, "May–Jun 2026");
  });

  it("estimateEcoprFromSeededPace matches AOR + total_avg_days_to_ecopr", () => {
    const est = estimateEcoprFromSeededPace("2026-04-03", pace);
    assert.equal(est.windowLabel, "Sep 2026");
  });
});
