import type { Db } from "mongodb";
import { cohortKeyFromProfile, normalizeStreamLabel } from "@/lib/cohort";
import {
  getLatestStoredMedian,
  insertCalibration,
  resolveCutoffForSync,
} from "@/lib/cohort-calibration";
import {
  ALGORITHM_VERSION,
  computeCohortDistribution,
  computeGlobalDistribution,
  computeP1Percentiles,
  milestoneDate,
  STATS_MILESTONE_KEYS,
  type ProfileForStats,
} from "@/lib/cohort-algorithm-v2";
import { buildHistogramFromDays } from "@/lib/cohort-histogram";
import {
  computeGlobalSeededMilestonePace,
  milestonePaceFilter,
} from "@/lib/milestone-gap-estimates";
import type { MilestoneKey } from "@/lib/types";

function profileFieldsFromDoc(doc: Record<string, unknown>): ProfileForStats & {
  stream: string;
  type: string;
  province: string;
  cohortKey?: string;
} {
  const m = doc.milestones as Record<string, { date?: string | null }> | undefined;
  return {
    aorDate: (doc.aorDate as string)?.trim() ?? "",
    stream: normalizeStreamLabel((doc.stream as string) ?? "CEC"),
    type: (doc.type as string) ?? "Inland",
    province: (doc.province as string) ?? "Other",
    milestones: m ?? {},
    cohortKey: doc.cohortKey as string | undefined,
  };
}

function toProfileForStats(
  p: ProfileForStats & { stream: string; type: string },
): ProfileForStats {
  return { aorDate: p.aorDate, milestones: p.milestones };
}

export async function reconcileProfileCohortKeys(db: Db): Promise<number> {
  const col = db.collection("profiles");
  const cursor = col.find(
    {},
    {
      projection: {
        cohortKey: 1,
        milestones: 1,
        aorDate: 1,
        stream: 1,
        type: 1,
        province: 1,
      },
    },
  );
  let updated = 0;
  for await (const doc of cursor) {
    const rec = doc as Record<string, unknown>;
    const p = profileFieldsFromDoc(rec);
    const nextKey = cohortKeyFromProfile(p);
    const $set: Record<string, unknown> = {};
    if (rec.cohortKey !== nextKey) $set.cohortKey = nextKey;
    if (rec.stream !== p.stream) $set.stream = p.stream;
    if (Object.keys($set).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set });
      updated++;
    }
  }
  return updated;
}

function aggregateOneCohort(
  cohortKey: string,
  cohortProfiles: (ProfileForStats & { stream: string; type: string })[],
  cutoffIso: string,
  p1Global: ReturnType<typeof computeP1Percentiles>,
): Record<string, unknown> {
  const distResult = computeCohortDistribution(
    cohortProfiles.map(toProfileForStats),
    cutoffIso,
  );

  const perMilestone: Partial<Record<MilestoneKey, number>> = {};
  for (const k of STATS_MILESTONE_KEYS) perMilestone[k] = 0;

  for (const p of cohortProfiles) {
    for (const k of STATS_MILESTONE_KEYS) {
      if (milestoneDate(p.milestones, k)) {
        perMilestone[k] = (perMilestone[k] ?? 0) + 1;
      }
    }
  }

  const n = cohortProfiles.length;
  const completion_rate =
    distResult.nEligible > 0
      ? distResult.nCompleted / distResult.nEligible
      : 0;

  return {
    cohortKey,
    median_days_to_ppr: distResult.p50,
    p10_days: distResult.p10,
    p25_days: distResult.p25,
    p75_days: distResult.p75,
    p90_days: distResult.p90,
    n_verified: n,
    n_eligible: distResult.nEligible,
    n_completed: distResult.nCompleted,
    n_waiting: distResult.nWaiting,
    n_imputed: distResult.nImputed,
    completion_rate,
    weekly_delta: 0,
    per_milestone_n: perMilestone,
    dist: buildHistogramFromDays(distResult.histogramDays),
    pulseWeekly: [],
    stream_medians: [],
    p1_p25_days: p1Global.n >= 5 ? p1Global.p25 : 0,
    p1_p50_days: p1Global.n >= 5 ? p1Global.p50 : 0,
    p1_p75_days: p1Global.n >= 5 ? p1Global.p75 : 0,
    algorithm_version: ALGORITHM_VERSION,
    last_updated: new Date(),
  };
}

function buildStreamMedians(
  cohortPayloads: { cohortKey: string; median: number }[],
): Map<string, { name: string; median: number }[]> {
  const byGroup = new Map<string, number[]>();
  for (const { cohortKey, median } of cohortPayloads) {
    if (median <= 0) continue;
    const group = cohortKey.split(":")[0] ?? "";
    if (!group) continue;
    const arr = byGroup.get(group) ?? [];
    arr.push(median);
    byGroup.set(group, arr);
  }
  const out = new Map<string, { name: string; median: number }[]>();
  for (const [group, medians] of byGroup) {
    const sorted = [...medians].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const label =
      group === "CEC"
        ? "CEC   Canadian Experience Class"
        : group === "FSW"
          ? "FSW   Federal Skilled Worker"
          : group === "PNP"
            ? "PNP   Provincial Nominee"
            : group;
    out.set(group, [{ name: label, median: mid }]);
  }
  return out;
}

export async function runCohortStatsSyncJob(db: Db): Promise<{
  profilesCohortKeyUpdates: number;
  cohortsUpserted: number;
}> {
  const profilesCohortKeyUpdates = await reconcileProfileCohortKeys(db);
  const profCol = db.collection("profiles");
  const statsCol = db.collection("cohort_stats");

  const storedMedian = await getLatestStoredMedian(db);
  const { cutoffIso, lookbackDays } = resolveCutoffForSync(storedMedian);

  const allDocs = await profCol
    .find(
      {},
      {
        projection: {
          cohortKey: 1,
          milestones: 1,
          aorDate: 1,
          stream: 1,
          type: 1,
        },
      },
    )
    .toArray();

  const allProfiles = allDocs.map((d) => profileFieldsFromDoc(d as Record<string, unknown>));
  const globalDist = computeGlobalDistribution(
    allProfiles.map(toProfileForStats),
    cutoffIso,
  );

  await insertCalibration(
    db,
    storedMedian,
    lookbackDays,
    cutoffIso,
    globalDist,
  );

  const p1Global = computeP1Percentiles(allProfiles.map(toProfileForStats));

  const byCohort = new Map<
    string,
    (ProfileForStats & { stream: string; type: string })[]
  >();
  for (const p of allProfiles) {
    const key =
      p.cohortKey ??
      cohortKeyFromProfile({
        aorDate: p.aorDate,
        stream: p.stream,
        type: p.type,
        province: p.province,
      });
    const list = byCohort.get(key) ?? [];
    list.push(p);
    byCohort.set(key, list);
  }

  const medianRows: { cohortKey: string; median: number }[] = [];
  let cohortsUpserted = 0;

  for (const [cohortKey, profs] of byCohort) {
    const payload = aggregateOneCohort(cohortKey, profs, cutoffIso, p1Global);
    medianRows.push({
      cohortKey,
      median: payload.median_days_to_ppr as number,
    });
    await statsCol.updateOne(
      { cohortKey },
      { $set: payload },
      { upsert: true },
    );
    cohortsUpserted++;
  }

  const streamMedians = buildStreamMedians(medianRows);
  for (const [cohortKey] of byCohort) {
    const group = cohortKey.split(":")[0] ?? "";
    const medians = streamMedians.get(group);
    if (medians?.length) {
      await statsCol.updateOne(
        { cohortKey },
        { $set: { stream_medians: medians } },
      );
    }
  }

  await db.collection("cohort_calibration").createIndex({ computed_at: -1 });

  const seededDocs = await profCol
    .find(
      { seededData: true },
      { projection: { aorDate: 1, milestones: 1, seededData: 1 } },
    )
    .toArray();
  const pace = computeGlobalSeededMilestonePace(
    seededDocs.map((d) => {
      const rec = d as Record<string, unknown>;
      return {
        aorDate: (rec.aorDate as string) ?? "",
        milestones: rec.milestones as Record<string, { date?: string | null }>,
        seededData: true as const,
      };
    }),
  );
  await db.collection("milestone_pace").replaceOne(
    milestonePaceFilter(),
    { ...milestonePaceFilter(), ...pace },
    { upsert: true },
  );

  return { profilesCohortKeyUpdates, cohortsUpserted };
}
