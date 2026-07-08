"use client";

import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DashboardCohortBars } from "./DashboardCohortBars";
import { DashboardCohortSection } from "./DashboardCohortSection";
import { DashboardConsultingCTA } from "./DashboardConsultingCTA";
import { DashboardDotMap } from "./DashboardDotMap";
import { DashboardHeroBar } from "./DashboardHeroBar";
import { DashboardHistogram } from "./DashboardHistogram";
import { DashboardPprBar } from "./DashboardPprBar";
import { DashboardRings } from "./DashboardRings";
import { DashboardShareSection } from "./DashboardShareSection";
import { SmartIntelligencePanelV2 } from "./SmartIntelligencePanelV2";
import { DashboardTimeline } from "./DashboardTimeline";
import {
  cohortBarsVM,
  dotMapVM,
  heroStatsVM,
  histVM,
  histSubtitleVM,
  infoCardsVM,
  journeyProgressVM,
  timelineRowsVM,
} from "./live-vm";
import { humanizeCohortKey } from "@/lib/cohort";
import { applicantIdFromEmail } from "@/lib/share-timeline-vm";
import type { MilestoneKey } from "@/lib/types";

/**
 * Single-page `/dashboard` view in the v2 design   composes every section
 * from `dashboard-new` and drives them off live `DashboardContext` data.
 *
 * The "Dashboard" sidebar items scroll to anchors on this page:
 *   - Overview      → #top    (rendered by `DashboardShellV2`)
 *   - My Timeline   → #tl-sec (rendered by `DashboardTimeline`)
 *   - My Cohort     → #cohort-sec
 *
 * Share / Stats are reachable both via the on-page sections and via the
 * dedicated sub-routes (`/dashboard/share`, `/dashboard/stats`), which share
 * the same shell so the user can land on either entry point.
 */
export function DashboardTimelineTabV2() {
  const ctx = useDashboard();

  const heroStats = useMemo(() => heroStatsVM(ctx), [ctx]);
  const infoCards = useMemo(() => infoCardsVM(ctx), [ctx]);
  const journeyProgress = useMemo(() => journeyProgressVM(ctx), [ctx]);
  const timelineRows = useMemo(
    () => timelineRowsVM(ctx.milestoneDefsForCohort, ctx.profile),
    [ctx.milestoneDefsForCohort, ctx.profile],
  );
  const cohortBars = useMemo(
    () => cohortBarsVM(ctx, ctx.milestoneDefsForCohort),
    [ctx, ctx.milestoneDefsForCohort],
  );
  const hist = useMemo(() => histVM(ctx), [ctx]);
  const histSubtitle = useMemo(() => histSubtitleVM(ctx), [ctx]);
  const dotMap = useMemo(() => dotMapVM(ctx), [ctx]);

  const onSaveDate = async (key: string, value: string) => {
    await ctx.onSaveMilestone(key as MilestoneKey, value);
  };

  return (
    <>
      <DashboardHeroBar stats={heroStats} />
      <DashboardRings cards={infoCards} />
      <DashboardPprBar journey={journeyProgress} />
      
      <SmartIntelligencePanelV2 />
      
      <DashboardTimeline
        rows={timelineRows}
        note={`Cohort: ${humanizeCohortKey(ctx.activeCohortKey)} · ${ctx.cohortTotal} verified profiles`}
        onSaveDate={onSaveDate}
      />
      <DashboardShareSection
        share={{
          shareUrl: ctx.shareUrl,
          shareUrlDisplay: ctx.shareUrl.replace(/^https?:\/\//, ""),
          githubUrl: "https://github.com/Get-North-Path/AOR-tracker",
        }}
        error={ctx.shareLinkError}
      />

      <DashboardCohortSection
        title={`Your Cohort   ${humanizeCohortKey(ctx.activeCohortKey)}`}
        subtitle={`${ctx.cohortTotal} verified applicants${ctx.cohortDataSparse ? " · Data refreshed daily" : ""}`}
      >
        <DashboardCohortBars bars={cohortBars} />
        <DashboardHistogram bars={hist} subtitle={histSubtitle} />
        <DashboardDotMap
          map={dotMap}
          applicantId={applicantIdFromEmail(ctx.email)}
        />
      </DashboardCohortSection>

      <DashboardConsultingCTA />

      <div style={{ height: 36 }} />
    </>
  );
}
