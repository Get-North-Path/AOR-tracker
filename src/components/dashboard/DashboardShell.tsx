"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChartBar,
  FaGem,
  FaHome,
  FaRegEdit,
  FaShareAlt,
  FaSyncAlt,
  FaUsers,
} from "react-icons/fa";
import {
  getLiveCohortAggregateAction,
  listRelatedCohortSummariesAction,
  type CohortSummaryRow,
  type LiveCohortAggregate,
} from "@/app/actions/aggregate";
import {
  getCohortStatsByKeyAction,
  getGlobalMilestonePaceAction,
} from "@/app/actions/cohort";
import { syncCohortStatsFromProfilesAction } from "@/app/actions/cohort-sync";
import { getProfileAction, updateMilestoneAction } from "@/app/actions/profile";
import { ensureShareTokenForEmailAction } from "@/app/actions/share";
import { WebsiteLogo } from "@/components/WebsiteLogo";
import { DashboardLoadingSkeleton } from "@/components/dashboard/DashboardLoadingSkeleton";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardRails } from "@/components/dashboard/DashboardRails";
import { useToast } from "@/components/ToastContext";
import {
  buildCohortInsights,
  mergeMilestoneDefsForCohort,
} from "@/lib/cohort-dynamic";
import { MILESTONE_DEFS } from "@/lib/constants";
import { dashboardHref, dashboardNavActive } from "@/lib/dashboard-nav";
import { cohortKeyFromProfile, humanizeCohortKey } from "@/lib/cohort";
import { computeProfileCompleteness } from "@/lib/profile-completeness";
import {
  daysSinceAor,
  journeyTargetDays,
  journeyUsesSeededPace,
  pctThroughMedian,
  resolveApprovalEstimate,
} from "@/lib/ppr-estimate";
import { clearSessionEmail, readSessionEmail } from "@/lib/session-client";
import type {
  CohortStats,
  GlobalMilestonePace,
  MilestoneKey,
  UserProfile,
} from "@/lib/types";

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cohort, setCohort] = useState<CohortStats | null>(null);
  const [openPicker, setOpenPicker] = useState<MilestoneKey | null>(null);
  const [savedFlash, setSavedFlash] = useState<MilestoneKey | null>(null);
  const [ringPct, setRingPct] = useState(0);
  const [liveAggregate, setLiveAggregate] = useState<LiveCohortAggregate | null>(
    null,
  );
  const [relatedCohorts, setRelatedCohorts] = useState<
    Omit<CohortSummaryRow, "isCurrent">[]
  >([]);
  const [viewingCohortKeyOverride, setViewingCohortKeyOverride] = useState<
    string | null
  >(null);
  const [syncCohortBusy, setSyncCohortBusy] = useState(false);
  const [milestonePace, setMilestonePace] =
    useState<GlobalMilestonePace | null>(null);
  const [shareState, setShareState] = useState<{
    email: string;
    token: string | null;
    error: string | null;
  } | null>(null);

  const hydrateCohortView = useCallback(
    async (viewKey: string, peerRootKey: string) => {
      const [c, live, related] = await Promise.all([
        getCohortStatsByKeyAction(viewKey),
        getLiveCohortAggregateAction(viewKey),
        listRelatedCohortSummariesAction(peerRootKey, 8),
      ]);
      setCohort({ ...c, cohortKey: viewKey });
      setLiveAggregate(live);
      setRelatedCohorts(related);
    },
    [],
  );

  const load = useCallback(
    async (em: string) => {
      const p = await getProfileAction(em);
      if (!p.ok) {
        router.replace("/");
        return;
      }
      setProfile(p.profile);
      setViewingCohortKeyOverride(null);
      const pk = cohortKeyFromProfile(p.profile);
      await hydrateCohortView(pk, pk);
    },
    [router, hydrateCohortView],
  );

  const refreshAfterProfileUpdate = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      setViewingCohortKeyOverride(null);
      const pk = cohortKeyFromProfile(next);
      await hydrateCohortView(pk, pk);
    },
    [hydrateCohortView],
  );

  useEffect(() => {
    const em = readSessionEmail();
    if (!em) {
      router.replace("/");
      return;
    }
    startTransition(() => {
      setEmail(em);
    });
  }, [router]);

  useEffect(() => {
    if (!email) return;
    const id = window.setTimeout(() => {
      void load(email);
    }, 0);
    return () => window.clearTimeout(id);
  }, [email, load]);

  useEffect(() => {
    let cancelled = false;
    void getGlobalMilestonePaceAction().then((pace) => {
      if (!cancelled) setMilestonePace(pace);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    void ensureShareTokenForEmailAction(email).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        setShareState({ email, token: r.token, error: null });
      } else {
        setShareState({
          email,
          token: null,
          error:
            r.error === "not_found"
              ? "Could not load profile for sharing."
              : r.error,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const cohortDataSparse = (liveAggregate?.profileCount ?? 0) < 2;

  const cohortDisplay = useMemo((): CohortStats | null => {
    if (!cohort || !liveAggregate) return cohort;
    const useLive = liveAggregate.profileCount >= 2;
    if (!useLive) return cohort;
    return {
      ...cohort,
      n_verified: liveAggregate.profileCount,
      per_milestone_n: { ...liveAggregate.perMilestoneFilled },
      dist: liveAggregate.histogramDist,
    };
  }, [cohort, liveAggregate]);

  const ppr = useMemo(() => {
    if (!profile || !cohortDisplay || !profile.aorDate) return null;
    return resolveApprovalEstimate(
      profile.aorDate,
      cohortDisplay,
      milestonePace,
      profile,
    );
  }, [profile, cohortDisplay, milestonePace]);

  const completeness = useMemo(
    () => (profile ? computeProfileCompleteness(profile) : null),
    [profile],
  );

  const profileCohortKey = useMemo(
    () => (profile ? cohortKeyFromProfile(profile) : ""),
    [profile],
  );
  const activeCohortKey =
    (viewingCohortKeyOverride ?? profileCohortKey) || "";

  const similarCohortsDisplay = useMemo((): CohortSummaryRow[] => {
    if (!cohort || !profileCohortKey) return [];
    const rows: CohortSummaryRow[] = relatedCohorts.map((r) => ({
      ...r,
      isCurrent: r.cohortKey === activeCohortKey,
    }));
    if (!rows.some((r) => r.cohortKey === activeCohortKey)) {
      rows.unshift({
        cohortKey: activeCohortKey,
        label: humanizeCohortKey(activeCohortKey),
        nVerified: cohort.n_verified,
        medianDays: cohort.median_days_to_ppr,
        isCurrent: true,
      });
    }
    return rows.slice(0, 8);
  }, [cohort, relatedCohorts, profileCohortKey, activeCohortKey]);

  const cohortInsights = useMemo(() => {
    if (!cohort) return [];
    return buildCohortInsights(cohort, liveAggregate);
  }, [cohort, liveAggregate]);

  const milestoneDefsForCohort = useMemo(() => {
    if (!profile?.aorDate?.trim()) {
      return [...MILESTONE_DEFS];
    }
    return mergeMilestoneDefsForCohort(
      profile.aorDate,
      milestonePace,
      profile,
    );
  }, [profile, milestonePace]);

  const days = profile?.aorDate ? daysSinceAor(profile.aorDate) : 0;
  const median = cohortDisplay?.median_days_to_ppr ?? 0;
  const journeyDays = journeyTargetDays(milestonePace, median);
  const journeyFromSeededPace = journeyUsesSeededPace(milestonePace);
  const pct = pctThroughMedian(days, journeyDays);

  useEffect(() => {
    const t = window.setTimeout(() => setRingPct(pct), 250);
    return () => window.clearTimeout(t);
  }, [pct]);

  const ringOffset = 207 - (207 * ringPct) / 100;

  const selectCohort = useCallback(
    async (key: string) => {
      if (!profile) return;
      setViewingCohortKeyOverride(key);
      await hydrateCohortView(key, cohortKeyFromProfile(profile));
    },
    [profile, hydrateCohortView],
  );

  const resetCohortToProfile = useCallback(async () => {
    if (!profile) return;
    setViewingCohortKeyOverride(null);
    const pk = cohortKeyFromProfile(profile);
    await hydrateCohortView(pk, pk);
  }, [profile, hydrateCohortView]);

  const syncCohortStats = useCallback(async () => {
    if (!email || syncCohortBusy) return;
    setSyncCohortBusy(true);
    try {
      const r = await syncCohortStatsFromProfilesAction(email);
      if (!r.ok) {
        toast.show(r.error);
        return;
      }
      toast.show(
        `Cohorts synced · ${r.cohortsUpserted} groups · ${r.profilesCohortKeyUpdates} profiles relinked`,
      );
      if (!profile) return;
      const pk = cohortKeyFromProfile(profile);
      const vk = viewingCohortKeyOverride ?? pk;
      await hydrateCohortView(vk, pk);
      const pace = await getGlobalMilestonePaceAction();
      setMilestonePace(pace);
    } finally {
      setSyncCohortBusy(false);
    }
  }, [
    email,
    syncCohortBusy,
    profile,
    viewingCohortKeyOverride,
    hydrateCohortView,
    toast,
  ]);

  const switchProfile = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Switch to a different profile?")
    ) {
      clearSessionEmail();
      router.push("/");
    }
  };

  const onSaveMilestone = async (key: MilestoneKey, val: string) => {
    if (!email) return;
    const dateToSave=val.trim() ||null;
    const res=await updateMilestoneAction(email,key,dateToSave);
    const res = await updateMilestoneAction(email, key, val);
    if (res.ok && res.profile) {
      setProfile(res.profile);
      setOpenPicker(null);
      setSavedFlash(key);
      window.setTimeout(() => setSavedFlash(null), 3000);
      const next = res.profile;
      const pk = cohortKeyFromProfile(next);
      if (key === "aor") {
        setViewingCohortKeyOverride(null);
      }
      const vk = key === "aor" ? pk : (viewingCohortKeyOverride ?? pk);
      await hydrateCohortView(vk, pk);
     toast.show(
  dateToSave
    ? `${MILESTONE_DEFS.find((m) => m.key === key)?.label} date saved`
    : `${MILESTONE_DEFS.find((m) => m.key === key)?.label} date cleared`
);
    }
  };

  const cohortTotal = cohortDisplay?.n_verified ?? cohort?.n_verified ?? 0;

  const shareLinkError =
    shareState?.email === email ? shareState.error : null;
  const shareToken =
    shareState?.email === email ? shareState.token : null;
  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/s/${shareToken}`
      : "";

  if (!profile || !cohort || !cohortDisplay || !email) {
    return <DashboardLoadingSkeleton />;
  }

  const ctxValue = {
    email,
    profile,
    setProfile,
    cohort,
    setCohort,
    cohortDisplay,
    liveAggregate,
    setLiveAggregate,
    relatedCohorts,
    setRelatedCohorts,
    refreshAfterProfileUpdate,
    onSaveMilestone,
    openPicker,
    setOpenPicker,
    savedFlash,
    switchProfile,
    days,
    median,
    journeyDays,
    journeyFromSeededPace,
    milestonePace,
    pct,
    ppr,
    completeness,
    similarCohortsDisplay,
    cohortInsights,
    milestoneDefsForCohort,
    cohortTotal,
    ringOffset,
    shareUrl,
    shareLinkError,
    profileCohortKey,
    activeCohortKey,
    selectCohort,
    resetCohortToProfile,
    syncCohortStats,
    syncCohortBusy,
    cohortDataSparse,
    queueAhead: 0,
    lateBiometrics: false,
  };

  return (
    <DashboardProvider value={ctxValue}>
      <div id="screen-dashboard" className="screen active flex min-h-screen flex-col">
        <div className="topbar">
          <WebsiteLogo href="/" className="logo" aria-label="AORTrack   home" />
          <nav className="nav">
            <Link
              href={dashboardHref.timeline}
              className={`nb ${dashboardNavActive(pathname, "timeline") ? "on" : ""}`}
            >
              Timeline
            </Link>
            <Link
              href={dashboardHref.community}
              className={`nb ${dashboardNavActive(pathname, "community") ? "on" : ""}`}
            >
              Community
            </Link>
            <Link
              href={dashboardHref.stats}
              className={`nb ${dashboardNavActive(pathname, "stats") ? "on" : ""}`}
            >
              Processing Stats
            </Link>
            <Link
              href={dashboardHref.share}
              className={`nb ${dashboardNavActive(pathname, "share") ? "on" : ""}`}
            >
              Share
            </Link>
          </nav>
          <div className="tr flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-(--border) bg-(--navy3) px-4 py-2.5 text-[11px] font-medium leading-snug text-(--t2) hover:border-[rgba(255,255,255,.18)] disabled:opacity-40"
              disabled={syncCohortBusy || !email}
              title="Rebuild cohort_stats from all profiles (run daily in production via cron)"
              onClick={() => void syncCohortStats()}
            >
              <span className="inline-flex items-center gap-1.5">
                <FaSyncAlt className={syncCohortBusy ? "animate-spin" : ""} aria-hidden />
                {syncCohortBusy ? "Syncing…" : "Sync cohorts"}
              </span>
            </button>
            <span className="text-[11px] text-(--t3)">
              <span className="dlive" />
              Live
            </span>
            <button type="button" className="bg" onClick={switchProfile}>
              Switch profile
            </button>
          </div>
        </div>

        <div className="dlayout flex-1 min-h-0">
          <aside className="dsb">
            <div className="sblbl">Views</div>
            <Link
              href={dashboardHref.timeline}
              className={`sbitem no-underline ${dashboardNavActive(pathname, "timeline") ? "on" : ""}`}
            >
              <span className="sbico">
                <FaCalendarAlt aria-hidden />
              </span>
              My Timeline
            </Link>
            <Link
              href={dashboardHref.community}
              className={`sbitem no-underline ${dashboardNavActive(pathname, "community") ? "on" : ""}`}
            >
              <span className="sbico">
                <FaUsers aria-hidden />
              </span>
              Community Feed
            </Link>
            <Link
              href={dashboardHref.stats}
              className={`sbitem no-underline ${dashboardNavActive(pathname, "stats") ? "on" : ""}`}
            >
              <span className="sbico">
                <FaChartBar aria-hidden />
              </span>
              Processing Stats
            </Link>
            <Link
              href={dashboardHref.share}
              className={`sbitem no-underline ${dashboardNavActive(pathname, "share") ? "on" : ""}`}
            >
              <span className="sbico">
                <FaShareAlt aria-hidden />
              </span>
              Share Timeline
            </Link>
            <hr className="sbdiv" />
            <div className="sblbl">Cohort compare</div>
            {activeCohortKey && activeCohortKey !== profileCohortKey ? (
              <button
                type="button"
                className="sbitem w-full text-left"
                onClick={() => void resetCohortToProfile()}
              >
                <span className="sbico">
                  <FaHome aria-hidden />
                </span>
                <span className="truncate text-(--t2)">Back to my cohort</span>
              </button>
            ) : null}
            {similarCohortsDisplay.slice(0, 6).map((s) => (
              <button
                key={s.cohortKey}
                type="button"
                className={`sbitem w-full text-left ${s.isCurrent ? "on" : ""}`}
                onClick={() => void selectCohort(s.cohortKey)}
              >
                <span className="sbico">
                  <FaGem aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">
                  {s.label}
                </span>
                <span className="shrink-0 text-[9px] text-(--t3)">
                  n={s.nVerified}
                </span>
              </button>
            ))}
            <hr className="sbdiv" />
            <Link href="/track" className="sbitem no-underline">
              <span className="sbico">
                <FaRegEdit aria-hidden />
              </span>
              Edit profile
            </Link>
            <button type="button" className="sbitem" onClick={switchProfile}>
              <span className="sbico">
                <FaArrowLeft aria-hidden />
              </span>
              Switch profile
            </button>
            <div className="sbuser">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(192,57,43,0.2)] text-[10px] font-semibold text-(--red)">
                  {email.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="sbun">{email.split("@")[0]}</div>
                  <div className="sbue">{email}</div>
                </div>
              </div>
              <div className="sbub">
                {profile.stream} · {profile.type} · {profile.province}
              </div>
            </div>
          </aside>

          <main className="dmain">{children}</main>

          <aside className="dr">
            <DashboardRails
              days={days}
              pct={pct}
              ringOffset={ringOffset}
              journeyDays={journeyDays}
              journeyFromSeededPace={journeyFromSeededPace}
              ppr={ppr}
              cohort={cohortDisplay}
              similarCohorts={similarCohortsDisplay}
              cohortInsights={cohortInsights}
              onSelectCohort={selectCohort}
            />
          </aside>
        </div>
      </div>
    </DashboardProvider>
  );
}
