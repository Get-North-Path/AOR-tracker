import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeMilestoneDefsForCohort } from "./cohort-dynamic";
import {
  computeGlobalSeededMilestonePace,
  estimatedIsoForMilestone,
  MILESTONE_SEGMENT_ORDER,
} from "./milestone-gap-estimates";
import type { ProfileForMilestonePace } from "./milestone-gap-estimates";
import type { GlobalMilestonePace } from "./types";

function profile(
  gaps: Partial<
    Record<
      | "biometrics"
      | "background"
      | "medical"
      | "p1"
      | "p2"
      | "ecopr",
      number
    >
  >,
  seeded = true,
): ProfileForMilestonePace {
  const aor = "2025-01-01";
  const add = (base: string, days: number) => {
    const d = new Date(`${base}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  let cursor = aor;
  const milestones: Record<string, { date: string }> = { aor: { date: aor } };
  const order = [
    "biometrics",
    "background",
    "medical",
    "p1",
    "p2",
    "ecopr",
  ] as const;
  for (const key of order) {
    const gap = gaps[key];
    if (gap == null) continue;
    cursor = add(cursor, gap);
    milestones[key] = { date: cursor };
  }
  return { aorDate: aor, milestones, seededData: seeded };
}

describe("computeGlobalSeededMilestonePace", () => {
  it("aggregates segment gaps and sums to eCOPR total", () => {
    const pace = computeGlobalSeededMilestonePace([
      profile({
        biometrics: 20,
        background: 30,
        medical: 40,
        p1: 10,
        p2: 10,
        ecopr: 50,
      }),
      profile({
        biometrics: 40,
        background: 50,
        medical: 60,
        p1: 30,
        p2: 30,
        ecopr: 70,
      }),
      profile({
        biometrics: 30,
        background: 40,
        medical: 50,
        p1: 20,
        p2: 20,
        ecopr: 60,
      }),
      profile({
        biometrics: 28,
        background: 32,
        medical: 45,
        p1: 20,
        p2: 15,
        ecopr: 40,
      }),
      profile({
        biometrics: 32,
        background: 28,
        medical: 43,
        p1: 22,
        p2: 17,
        ecopr: 42,
      }),
    ]);

    assert.equal(pace.seeded_profiles, 5);
    assert.equal(pace.segment_avg_days.biometrics, 30);

    let sum = 0;
    for (const { key } of MILESTONE_SEGMENT_ORDER) {
      sum += pace.segment_avg_days[key] ?? 0;
    }
    assert.equal(pace.total_avg_days_to_ecopr, sum);
    assert.equal(pace.cumulative_avg_days.ecopr, sum);
  });

  it("uses the median so a single extreme outlier does not inflate the estimate", () => {
    // Four typical ~30d biometrics gaps plus one stuck 400d applicant.
    const pace = computeGlobalSeededMilestonePace([
      profile({ biometrics: 30 }),
      profile({ biometrics: 28 }),
      profile({ biometrics: 30 }),
      profile({ biometrics: 32 }),
      profile({ biometrics: 400 }),
    ]);

    // A mean would be (30+28+30+32+400)/5 = 104; the median stays at 30.
    assert.equal(pace.segment_n.biometrics, 5);
    assert.equal(pace.segment_avg_days.biometrics, 30);
  });
});

describe("estimatedIsoForMilestone", () => {
  it("uses cumulative days from AOR even when later milestones are logged", () => {
    const pace = computeGlobalSeededMilestonePace([
      profile({
        biometrics: 10,
        background: 20,
        medical: 30,
        p1: 10,
        p2: 10,
        ecopr: 20,
      }),
      profile({
        biometrics: 10,
        background: 20,
        medical: 30,
        p1: 10,
        p2: 10,
        ecopr: 20,
      }),
      profile({
        biometrics: 10,
        background: 20,
        medical: 30,
        p1: 10,
        p2: 10,
        ecopr: 20,
      }),
      profile({
        biometrics: 10,
        background: 20,
        medical: 30,
        p1: 10,
        p2: 10,
        ecopr: 20,
      }),
      profile({
        biometrics: 10,
        background: 20,
        medical: 30,
        p1: 10,
        p2: 10,
        ecopr: 20,
      }),
    ]);

    const partial = {
      aorDate: "2026-03-20",
      milestones: {
        aor: { date: "2026-03-20", updatedAt: null },
        biometrics: { date: "2026-03-21", updatedAt: null },
        background: { date: null, updatedAt: null },
        medical: { date: "2026-05-22", updatedAt: null },
        p1: { date: "2026-05-24", updatedAt: null },
        p2: { date: null, updatedAt: null },
        ecopr: { date: null, updatedAt: null },
      },
    };

    const aor = "2026-03-20";
    const p2 = estimatedIsoForMilestone("p2", aor, pace, partial);
    const ecopr = estimatedIsoForMilestone("ecopr", aor, pace, partial);
    assert.equal(p2?.daysAfterAor, pace.cumulative_avg_days.p2);
    assert.equal(ecopr?.daysAfterAor, pace.cumulative_avg_days.ecopr);
    assert.ok(p2?.iso);
    assert.ok(ecopr?.iso);
    assert.ok(p2.iso < ecopr.iso);
  });
});

/** Pace shaped like a successful cohort sync with 600 seeded profiles. */
function seededPace600(): GlobalMilestonePace {
  return {
    computed_at: "2026-05-20T13:29:14.014Z",
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
    profiles_scanned: 600,
    seeded_profiles: 600,
  };
}

describe("mergeMilestoneDefsForCohort", () => {
  it("keeps pending estimates after user logs biometrics (no blocked cascade)", () => {
    const pace = seededPace600();
    const defs = mergeMilestoneDefsForCohort("2026-03-01", pace, {
      aorDate: "2026-03-01",
      milestones: {
        aor: { date: "2026-03-01", updatedAt: null },
        biometrics: { date: "2026-03-15", updatedAt: null },
        background: { date: null, updatedAt: null },
        medical: { date: null, updatedAt: null },
        p1: { date: null, updatedAt: null },
        p2: { date: null, updatedAt: null },
        ecopr: { date: null, updatedAt: null },
      },
    });

    const bio = defs.find((d) => d.key === "biometrics")!;
    assert.ok(bio.desc.includes("biometrics"), "completed step keeps catalog desc");
    assert.equal(bio.est, "Mar 15, 2026");

    const bg = defs.find((d) => d.key === "background")!;
    assert.ok(bg.est.startsWith("~"), `background est should be projected, got ${bg.est}`);
    assert.ok(!bg.desc.includes("run cohort sync"));

    const ecopr = defs.find((d) => d.key === "ecopr")!;
    assert.ok(ecopr.est.startsWith("~"), `ecopr est should be projected, got ${ecopr.est}`);
  });
});
