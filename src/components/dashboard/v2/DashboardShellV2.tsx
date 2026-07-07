"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getLiveCohortAggregateAction,
  getQueuePositionAction,
  listRelatedCohortSummariesAction,
  type CohortSummaryRow,
  type LiveCohortAggregate,
} from "@/app/actions/aggregate";
import { isLateBiometrics } from "@/lib/cohort-algorithm-v2";
import {
  getCohortStatsByKeyAction,
  getGlobalMilestonePaceAction,
} from "@/app/actions/cohort";
import { syncCohortStatsFromProfilesAction } from "@/app/actions/cohort-sync";
import {
  getProfileAction,
  updateMilestoneAction,
} from "@/app/actions/profile";
import { ensureShareTokenForEmailAction } from "@/app/actions/share";
import { DashboardLoadingSkeleton } from "@/components/dashboard/DashboardLoadingSkeleton";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { useToast } from "@/components/ToastContext";
import {
  buildCohortInsights,
  mergeMilestoneDefsForCohort,
} from "@/lib/cohort-dynamic";
import { MILESTONE_DEFS } from "@/lib/constants";
import {
  cohortKeyFromProfile,
  humanizeCohortKey,
} from "@/lib/cohort";
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

import { DashboardAppBar } from "./DashboardAppBar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardToaster } from "./DashboardToaster";
import { DashboardWhatsappLinksModal } from "./DashboardWhatsappLinksModal";
import { DashboardV2UiProvider } from "./DashboardV2Context";
import { shouldAutoOpenWhatsappLinks } from "./whatsapp-links";
import { profileVM, sidebarSectionsVM } from "./live-vm";
import {
  pickActiveDashboardSection,
  type DashboardScrollSpyKey,
} from "./scroll-spy";

/**
 * Live `/dashboard` shell   owns auth/session/profile/cohort loading and the
 * server-action plumbing, then renders the v2 chrome (`.dashboard-v2-page`).
 *
 * This is the production counterpart of the seed-data `DashboardV2Client`
 * that powers the `/dashboard-new` preview route. The two share the same
 * presentational components in `src/components/dashboard/v2/`   the
 * difference is which data they pass through props.
 *
 * Drop-in replacement for the old `DashboardShell.tsx`. Wrapped at
 * `app/dashboard/layout.tsx`.
 */
export function DashboardShellV2({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const mainRef = useRef<HTMLElement | null>(null);
  const [activeScrollKey, setActiveScrollKey] =
    useState<DashboardScrollSpyKey>("overview");

  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cohort, setCohort] = useState<CohortStats | null>(null);
  const [openPicker, setOpenPicker] = useState<MilestoneKey | null>(null);
  const [savedFlash, setSavedFlash] = useState<MilestoneKey | null>(null);
  const [ringPct, setRingPct] = useState(0);
  const [liveAggregate, setLiveAggregate] =
    useState<LiveCohortAggregate | null>(null);
  const [relatedCohorts, setRelatedCohorts] = useState<
    Omit<CohortSummaryRow, "isCurrent">[]
  >([]);
  const [viewingCohortKeyOverride, setViewingCohortKeyOverride] = useState<
    string | null
  >(null);
  const [syncCohortBusy, setSyncCohortBusy] = useState(false);
  const [shareState, setShareState] = useState<{
    email: string;
    token: string | null;
    error: string | null;
  } | null>(null);
  const [queueAhead, setQueueAhead] = useState(0);
  const [milestonePace, setMilestonePace] =
    useState<GlobalMilestonePace | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappBadge, setWhatsappBadge] = useState(true);
  const whatsappAutoOpenedRef = useRef(false);

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

  const lateBiometrics = useMemo(() => {
    if (!profile?.aorDate?.trim()) return false;
    const bio = profile.milestones.biometrics?.date?.trim();
    if (!bio) return false;
    return isLateBiometrics(profile.aorDate, bio);
  }, [profile]);

  useEffect(() => {
    if (!profile?.aorDate?.trim() || !activeCohortKey) {
      setQueueAhead(0);
      return;
    }
    let cancelled = false;
    getQueuePositionAction(activeCohortKey, profile.aorDate).then((r) => {
      if (!cancelled) setQueueAhead(r.ahead);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.aorDate, activeCohortKey, profile?.updatedAt]);

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
    if (!email || !val) return;
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
        `${MILESTONE_DEFS.find((m) => m.key === key)?.label} date saved`,
      );
    }
  };

  const cohortTotal =
    cohortDisplay?.n_verified ?? cohort?.n_verified ?? 0;

  const shareLinkError =
    shareState?.email === email ? shareState.error : null;
  const shareToken =
    shareState?.email === email ? shareState.token : null;
  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/s/${shareToken}`
      : "";

  /* ─── view-models for the v2 chrome ─────────────────────────────── */

  const dnProfile = useMemo(
    () => (profile && email ? profileVM(email, profile) : null),
    [profile, email],
  );

  const sidebarSections = useMemo(() => {
    const base = sidebarSectionsVM({
      pathname,
      cohortTotal,
      hasEmail: !!email,
    });
    if (pathname !== "/dashboard") return base;
    return {
      ...base,
      dashboard: base.dashboard.map((it) => ({
        ...it,
        active: it.key === activeScrollKey,
      })),
      share: base.share.map((it) => ({
        ...it,
        active:
          it.active ||
          (activeScrollKey === "share-link" && it.key === "share-link"),
      })),
    };
  }, [pathname, cohortTotal, email, activeScrollKey]);

  useLayoutEffect(() => {
    if (pathname !== "/dashboard" || !profile) return;
    const main = mainRef.current;
    if (!main) return;

    const tick = () => {
      setActiveScrollKey(pickActiveDashboardSection(main));
    };

    tick();
    main.addEventListener("scroll", tick, { passive: true });
    const ro = new ResizeObserver(() => tick());
    ro.observe(main);
    window.addEventListener("resize", tick);
    window.addEventListener("hashchange", tick);
    return () => {
      main.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      window.removeEventListener("hashchange", tick);
      ro.disconnect();
    };
  }, [pathname, profile, profile?.updatedAt]);

  useEffect(() => {
    if (!profile || whatsappAutoOpenedRef.current) return;
    whatsappAutoOpenedRef.current = true;
    if (shouldAutoOpenWhatsappLinks()) {
      setWhatsappModalOpen(true);
    }
  }, [profile]);

  if (!profile || !cohort || !cohortDisplay || !email || !dnProfile) {
    return <DashboardLoadingSkeleton />;
  }

  const openWhatsappLinks = () => {
    setWhatsappModalOpen(true);
    setWhatsappBadge(false);
  };

  const closeWhatsappLinks = () => {
    setWhatsappModalOpen(false);
    setWhatsappBadge(false);
  };

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
    queueAhead,
    lateBiometrics,
  };

  return (
    <DashboardProvider value={ctxValue}>
      <DashboardV2UiProvider>
        <div className="dashboard-v2-page flex min-h-0 flex-1 flex-col">
          <DashboardAppBar
            applicantId={dnProfile.applicantId}
            cohortLabel={dnProfile.cohortLabel}
            shareHref="/dashboard/share"
            timelineHref="/dashboard"
            onSyncCohorts={() => void syncCohortStats()}
            syncCohortBusy={syncCohortBusy}
            onOpenWhatsappLinks={openWhatsappLinks}
            whatsappBadge={whatsappBadge}
          />

          <DashboardWhatsappLinksModal
            open={whatsappModalOpen}
            onClose={closeWhatsappLinks}
          />

          <div className="dlay">
            <DashboardSidebar
              profile={dnProfile}
              sections={sidebarSections}
              noEmailWarn={email ? null : undefined}
            />
            <main ref={mainRef} className="dmain">
              {/*
               * Scroll anchor for the sidebar's "Overview" item. Must live
               * inside `.dmain` because that's the actual scroll container  
               * putting `id="top"` on the outer page wrapper would target an
               * element whose ancestor (the page, `overflow: hidden`) cannot
               * scroll, so the click would be a no-op.
               */}
              <div id="top" aria-hidden="true" />
              {children}
            </main>
          </div>

          <DashboardToaster />
        </div>
      </DashboardV2UiProvider>
    </DashboardProvider>
  );
}
