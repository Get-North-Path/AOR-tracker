import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSmartInsight } from "./smart-cohort-intelligence";
import type { CohortStats, GlobalMilestonePace, UserProfile } from "./types";

function createMockCohort(overrides: Partial<CohortStats> = {}): CohortStats {
  return {
    cohortKey: "mock",
    median_days_to_ppr: 200,
    p25_days: 150,
    p75_days: 250,
    p90_days: 280,
    n_verified: 100,
    completion_rate: 0.5,
    last_updated: new Date().toISOString(),
    per_milestone_n: {},
    dist: [],
    pulseWeekly: [],
    stream_medians: [],
    ...overrides,
  };
}

describe("Smart Cohort Intelligence", () => {
  it("handles empty/missing median gracefully", () => {
    const profile = { aorDate: "2024-01-01", milestones: {} } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    const cohort = createMockCohort({ median_days_to_ppr: 0, p25_days: 0, p75_days: 0 });
    const insight = buildSmartInsight(profile, cohort, null);

    assert.equal(insight.status.label, "Normal");
    assert.equal(insight.confidence, "High"); // based on n_verified=100
  });

  it("identifies ahead of cohort (early)", () => {
    const today = new Date();
    today.setDate(today.getDate() - 100); // 100 days ago
    const aorDate = today.toISOString().slice(0, 10);
    const profile = { aorDate, milestones: { aor: { date: aorDate, updatedAt: null } } } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    const cohort = createMockCohort();
    const insight = buildSmartInsight(profile, cohort, null);

    assert.equal(insight.status.label, "Ahead");
  });

  it("identifies normal progression", () => {
    const today = new Date();
    today.setDate(today.getDate() - 200); // 200 days ago, exactly median
    const aorDate = today.toISOString().slice(0, 10);
    const profile = { aorDate, milestones: { aor: { date: aorDate, updatedAt: null } } } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    const cohort = createMockCohort();
    const insight = buildSmartInsight(profile, cohort, null);

    assert.equal(insight.status.label, "Normal");
  });

  it("identifies delayed progression (late)", () => {
    const today = new Date();
    today.setDate(today.getDate() - 300); // 300 days ago, past p90
    const aorDate = today.toISOString().slice(0, 10);
    const profile = { aorDate, milestones: { aor: { date: aorDate, updatedAt: null } } } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    const cohort = createMockCohort();
    const insight = buildSmartInsight(profile, cohort, null);

    assert.equal(insight.status.label, "Delayed");
  });

  it("handles small cohorts with low confidence", () => {
    const today = new Date();
    today.setDate(today.getDate() - 200);
    const aorDate = today.toISOString().slice(0, 10);
    const profile = { aorDate, milestones: { aor: { date: aorDate, updatedAt: null } } } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    const cohort = createMockCohort({ n_verified: 5 });
    const insight = buildSmartInsight(profile, cohort, null);

    assert.equal(insight.confidence, "Low");
  });

  it("generates an expected progress window if pace is provided", () => {
    const today = new Date();
    today.setDate(today.getDate() - 10);
    const aorDate = today.toISOString().slice(0, 10);
    const profile = { aorDate, milestones: { aor: { date: aorDate, updatedAt: null } } } as unknown as Pick<UserProfile, "aorDate" | "milestones">;
    
    const pace: GlobalMilestonePace = {
      computed_at: "2024-01-01",
      total_avg_days_to_ecopr: 200,
      segment_avg_days: { biometrics: 30 },
      cumulative_avg_days: { biometrics: 30 },
      segment_n: {},
      profiles_scanned: 100,
      seeded_profiles: 100,
    };

    const insight = buildSmartInsight(profile, createMockCohort(), pace);
    
    // biometrics avg is 30, we are at day 10, so 20 days remaining. 
    // formula is (days - 7) to (days + 14) -> 13-34 days
    assert.equal(insight.expectedWindow, "13-34 days");
  });
});
