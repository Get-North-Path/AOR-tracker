import type { Db } from "mongodb";
import type { CohortStats, CommunityPost } from "./types";

const EMPTY_DIST: CohortStats["dist"] = [
  { range: "< 120d", count: 0, pct: 0, you: false },
  { range: "120–150d", count: 0, pct: 0, you: false },
  { range: "150–180d", count: 0, pct: 0, you: false },
  { range: "180–210d", count: 0, pct: 0, you: false },
  { range: "210–240d", count: 0, pct: 0, you: false },
  { range: "> 240d", count: 0, pct: 0, you: false },
];

/** Cohort stats when Mongo has no document   no synthetic medians or histograms. */
export function emptyCohortStats(cohortKey: string): CohortStats {
  return {
    cohortKey,
    median_days_to_ppr: 0,
    p10_days: 0,
    p25_days: 0,
    p75_days: 0,
    p90_days: 0,
    n_verified: 0,
    n_eligible: 0,
    n_completed: 0,
    n_waiting: 0,
    n_imputed: 0,
    completion_rate: 0,
    weekly_delta: 0,
    per_milestone_n: {},
    dist: EMPTY_DIST.map((r) => ({ ...r })),
    pulseWeekly: [],
    stream_medians: [],
    p1_p25_days: 0,
    p1_p50_days: 0,
    p1_p75_days: 0,
    algorithm_version: "v2.0",
    last_updated: new Date().toISOString(),
  };
}

const SEED_POSTS: Omit<
  CommunityPost,
  "id" | "bodyIsHtml" | "viewerHasMarkedHelpful"
>[] = [
  {
    initials: "AK",
    name: "Applicant #4821",
    meta: "CEC · Feb 20 AOR · Inland",
    ms: "ecopr",
    msl: "eCOPR received",
    body: "Just got my <strong>eCOPR at day 172!</strong> Background check started around day 55, medical day 108.",
    tl: [
      { label: "AOR", done: true },
      { label: "BIL d13", done: true },
      { label: "Bio d25", done: true },
      { label: "BGC d55", done: true },
      { label: "Med d108", done: true },
      { label: "eCOPR d172", done: true },
    ],
    helpful: 84,
  },
  {
    initials: "PK",
    name: "Applicant #3302",
    meta: "CEC · Feb 25 AOR · Inland",
    ms: "bil",
    msl: "BIL",
    body: "Got my BIL <strong>15 days after AOR.</strong> Tracker shows pending even though biometrics done Apr 27. Anyone?",
    tl: [
      { label: "AOR", done: true },
      { label: "BIL d15", done: true },
      { label: "Bio d27", done: true },
      { label: "BGC", done: false },
      { label: "Med", done: false },
      { label: "P1", done: false },
      { label: "P2", done: false },
      { label: "eCOPR", done: false },
    ],
    helpful: 32,
  },
  {
    initials: "SS",
    name: "Applicant #5107",
    meta: "CEC · Feb 28 AOR · Outland",
    ms: "bg",
    msl: "BGC Started",
    body: "Background check appeared at <strong>day 61.</strong> WES regular issue resolved in 3 days by uploading scanned original.",
    tl: [
      { label: "AOR", done: true },
      { label: "BIL d14", done: true },
      { label: "Bio d28", done: true },
      { label: "BGC d61", done: true },
      { label: "Med", done: false },
      { label: "P1", done: false },
      { label: "P2", done: false },
      { label: "eCOPR", done: false },
    ],
    helpful: 47,
  },
  {
    initials: "NA",
    name: "Applicant #2890",
    meta: "CEC · Jan 31 AOR · Inland",
    ms: "ecopr",
    msl: "eCOPR received",
    body: "eCOPR at day 198! <strong>STEM NOC codes</strong> consistently 2–3 weeks faster. Portal confirmation email a few hours after P2.",
    tl: [
      { label: "AOR", done: true },
      { label: "BIL d12", done: true },
      { label: "Bio d22", done: true },
      { label: "BGC d52", done: true },
      { label: "Med d119", done: true },
      { label: "eCOPR d198", done: true },
    ],
    helpful: 61,
  },
  {
    initials: "MR",
    name: "Applicant #6014",
    meta: "CEC · Mar 10 AOR · Inland",
    ms: "med",
    msl: "Medical Done",
    body: "Medical completed today (day 34). Anyone get a <strong>second medical request?</strong> Mine from EE stage is from 2023.",
    tl: [
      { label: "AOR", done: true },
      { label: "BIL d16", done: true },
      { label: "Bio d30", done: true },
      { label: "Med d34", done: true },
      { label: "BGC", done: false },
      { label: "P1", done: false },
      { label: "P2", done: false },
      { label: "eCOPR", done: false },
    ],
    helpful: 29,
  },
];

/** Idempotent indexes   invoked from `getDb()` on first use. */
export async function ensureIndexes(db: Db): Promise<void> {
  const posts = db.collection("community_posts");
  await db.collection("profiles").createIndex({ emailNorm: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ caseNo: 1 }, { unique: true, sparse: true });
  await db.collection("profiles").createIndex({ seededData: 1 });
  await db.collection("profiles").createIndex({ cohortKey: 1 });
  await db
    .collection("profiles")
    .createIndex({ shareToken: 1 }, { unique: true, sparse: true });
  await db.collection("cohort_stats").createIndex({ cohortKey: 1 }, { unique: true });
  await db.collection("cohort_calibration").createIndex({ computed_at: -1 });
  await db
    .collection("milestone_pace")
    .createIndex({ paceKey: 1 }, { unique: true });
  await posts.createIndex({ createdAt: -1 });
}

export type SeedDemoResult = {
  postsInserted: number;
};

/**
 * Inserts sample community posts only when that collection is empty.
 * Cohort stats are derived from `profiles` via `runCohortStatsSyncJob` (bulk seed or live usage).
 */
export async function seedDemoDataIfEmpty(db: Db): Promise<SeedDemoResult> {
  const posts = db.collection("community_posts");

  let postsInserted = 0;

  const postCount = await posts.estimatedDocumentCount();
  if (postCount === 0) {
    await posts.insertMany(
      SEED_POSTS.map((p) => ({
        ...p,
        bodyIsHtml: true,
        helpfulVoters: [] as string[],
        approved: true,
        createdAt: new Date(),
      })),
    );
    postsInserted = SEED_POSTS.length;
  }

  return { postsInserted };
}

export function serializeCohort(
  doc: Record<string, unknown> | null | undefined,
  fallbackCohortKey = "CEC:0:2026:inland",
): CohortStats {
  if (!doc) {
    return emptyCohortStats(fallbackCohortKey);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  const c = rest as CohortStats & { last_updated?: Date };
  return {
    ...c,
    last_updated:
      typeof c.last_updated === "string"
        ? c.last_updated
        : (c.last_updated as Date)?.toISOString?.() ?? new Date().toISOString(),
  };
}

export function serializePost(
  doc: Record<string, unknown>,
  viewerEmailNorm?: string | null,
): CommunityPost {
  const voters = (doc.helpfulVoters as string[] | undefined) ?? [];
  const helpfulStored =
    typeof doc.helpful === "number" ? doc.helpful : voters.length;
  const helpful = Math.max(helpfulStored, voters.length);
  let replyTo: CommunityPost["replyTo"];
  const rtId = doc.replyToId;
  const rtPrev = doc.replyToPreview as
    | { initials?: string; name?: string; snippet?: string }
    | undefined;
  if (rtId && rtPrev && typeof rtPrev === "object") {
    replyTo = {
      id: String(rtId),
      initials: String(rtPrev.initials ?? "?"),
      name: String(rtPrev.name ?? ""),
      snippet: String(rtPrev.snippet ?? ""),
    };
  }

  const created = doc.createdAt;
  const createdAt =
    created instanceof Date
      ? created.toISOString()
      : typeof created === "string"
        ? created
        : undefined;

  return {
    id: String(doc._id),
    initials: doc.initials as string,
    name: doc.name as string,
    meta: doc.meta as string,
    ms: doc.ms as string,
    msl: doc.msl as string,
    body: doc.body as string,
    bodyIsHtml: doc.bodyIsHtml !== false,
    tl: doc.tl as CommunityPost["tl"],
    helpful,
    viewerHasMarkedHelpful: viewerEmailNorm
      ? voters.includes(viewerEmailNorm)
      : false,
    ...(replyTo ? { replyTo } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}
