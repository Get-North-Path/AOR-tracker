"use client";

import { useMemo } from "react";
import { FaTwitter, FaLinkedin } from "react-icons/fa";
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

  const hasPPR = !!(ctx.profile.milestones["p1"]?.date || ctx.profile.milestones["p2"]?.date || ctx.profile.milestones["ecopr"]?.date);
  
  let aorMonth = "";
  if (ctx.profile.aorDate) {
    const m = parseInt(ctx.profile.aorDate.slice(5, 7), 10);
    if (!isNaN(m) && m >= 1 && m <= 12) {
      aorMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " AOR";
    }
  }

  const shareText = `Just got my Canadian PR! 🍁 Day ${ctx.days}, ${ctx.profile.stream}, ${aorMonth} tracked with @AORTrack: track.getnorthpath.com #CanadaImmigration`;

  return (
    <>
      <DashboardHeroBar stats={heroStats} />
      <DashboardRings cards={infoCards} />
      <DashboardPprBar journey={journeyProgress} />
      
      {hasPPR ? (
        <div className="card border border-[#5de494]/20 bg-[#5de494]/5 p-4 sm:p-5 mb-4">
          <div className="mb-2 text-base font-bold text-[var(--w)]">
            🥳 You made it! Share your result
          </div>
          <p className="mb-4 text-sm text-[var(--t2)]">
            Help the community by sharing your timeline. It helps other applicants know what to expect!
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded bg-[var(--w)] px-4 py-2 text-sm font-bold text-[var(--bg)] transition-opacity hover:opacity-80"
            >
              <FaTwitter aria-hidden /> Share on X
            </a>
            <a
              href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded bg-[#0a66c2] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
            >
              <FaLinkedin aria-hidden /> Share on LinkedIn
            </a>
          </div>
        </div>
      ) : null}

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
