"use client";

import { FaArrowLeft, FaArrowUp, FaCheck } from "react-icons/fa";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DashboardRails } from "@/components/dashboard/DashboardRails";
import { ProfileCompletenessCard } from "@/components/dashboard/ProfileCompletenessCard";
import { SmartIntelligencePanel } from "@/components/dashboard/SmartIntelligencePanel";
import type { MilestoneDefRow } from "@/lib/cohort-dynamic";
import type { MilestoneKey } from "@/lib/types";
import { fmtDate, fmtShortUpdated } from "@/lib/format";

function dotClass(
  profile: { milestones: Record<MilestoneKey, { date: string | null }> },
  defs: MilestoneDefRow[],
  idx: number,
  key: MilestoneKey,
  hasDate: boolean,
): string {
  if (!hasDate) return "pend";
  let lastDone = -1;
  defs.forEach((d, i) => {
    if (profile.milestones[d.key]?.date) lastDone = i;
  });
  if (idx === lastDone) return "now";
  return "done";
}

export function DashboardTimelineTab() {
  const {
    email,
    profile,
    cohort,
    cohortDisplay,
    completeness,
    refreshAfterProfileUpdate,
    onSaveMilestone,
    openPicker,
    setOpenPicker,
    savedFlash,
    days,
    median,
    journeyDays,
    journeyFromSeededPace,
    ppr,
    pct,
    ringOffset,
    similarCohortsDisplay,
    cohortInsights,
    milestoneDefsForCohort,
    cohortTotal,
    cohortDataSparse,
    selectCohort,
  } = useDashboard();

  return (
    <div className="flex flex-col gap-4">
      <div className={`srow ${cohortDataSparse ? "srow--sparse" : ""}`}>
        <div className="sc hi">
          <div className="slbl">Days since AOR</div>
          <div className="sval">{days}</div>
          <div className="ssub">{fmtDate(profile.aorDate) || " "}</div>
        </div>
        <div className="sc">
          <div className="slbl">
            {journeyFromSeededPace ? "Typical journey" : "Median PPR (cohort)"}
          </div>
          <div className="sval">{journeyDays > 0 ? journeyDays : " "}</div>
          <div className="ssub">
            days · {profile.stream}
            {journeyFromSeededPace && median > 0
              ? ` · cohort median ${median}d`
              : ""}
          </div>
        </div>
        <div className="sc">
          <div className="slbl">Est. eCOPR</div>
          <div className="sval mt-1 text-base leading-tight">
            {ppr?.windowLabel ?? " "}
          </div>
          <div className="ssub">
            {cohortDisplay.n_verified} similar profiles
            {ppr?.limitedData ? " · Limited data (n < 30)" : ""}
          </div>
        </div>
        <div className="sc">
          <div className="slbl">Cohort PPR rate</div>
          <div className="sval">
            {Math.round((cohort.completion_rate ?? 0) * 100)}%
          </div>
          <div className="ssub text-[#5de494]">
            {cohortDataSparse ? (
              "Low sample   sync cohorts"
            ) : (
              <span className="inline-flex items-center gap-1">
                <FaArrowUp aria-hidden />
                {Math.round((cohort.weekly_delta ?? 0) * 100)}% this week
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:hidden">
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
      </div>

      {completeness && completeness.remaining.length > 0 ? (
        <ProfileCompletenessCard
          key={profile.updatedAt}
          email={email}
          profile={profile}
          completeness={completeness}
          onProfileUpdated={refreshAfterProfileUpdate}
        />
      ) : null}

      <SmartIntelligencePanel />

      <div className="card card-timeline">
        <div className="chd">
          <span className="ctit">Your milestone timeline</span>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="hidden text-[11px] leading-snug text-[var(--t3)] sm:inline">
              Estimates use your <strong className="text-[var(--t2)]">AOR date</strong>{" "}
              and this cohort&apos;s median PPR (
              {median > 0 ? `${median}d` : "not available yet"}). Add dates below to
              replace estimates.
            </span>
            <span className="text-[10px] leading-snug text-[var(--t3)] sm:hidden">
              Estimates from cohort median{" "}
              <strong className="text-[var(--t2)]">
                {median > 0 ? `${median}d` : " "}
              </strong>{" "}
              PPR.
            </span>
            <span className="ctag shrink-0">
              {profile.stream} · {profile.type}
            </span>
          </div>
        </div>
        <div>
          {milestoneDefsForCohort.map((def, i) => {
            const m = profile.milestones[def.key];
            const hasDate = !!m.date;
            const isLast = i === milestoneDefsForCohort.length - 1;
            const n = cohortDisplay.per_milestone_n[def.key] ?? 0;
            const cp = Math.round((n / cohortTotal) * 100);
            const pickerOpen = openPicker === def.key;
            return (
              <div key={def.key} className="tlrow">
                <div className="tll">
                  <div className="tl-date-stack">
                    <span className="tldt-main">
                      {hasDate ? fmtDate(m.date) : "Not set"}
                    </span>
                    {!hasDate ? (
                      <span className="tldt-est">Est. {def.est}</span>
                    ) : null}
                  </div>
                </div>
                <div className="tlc">
                  <div
                    className={`tldot ${dotClass(profile, milestoneDefsForCohort, i, def.key, hasDate)}`}
                  />
                  {!isLast ? (
                    <div className={`tlln ${hasDate ? "done" : ""}`} />
                  ) : null}
                </div>
                <div className="tlr">
                  <div className="tltrow">
                    <span className="tltit">{def.label}</span>
                    <span className={`tltag ${hasDate ? "done" : "est"}`}>
                      {hasDate ? "Completed" : "Estimated"}
                    </span>
                  </div>
                  <div className="tldesc">{def.desc}</div>
                  {pickerOpen ? (
                    <div className="tl-date-panel">
                      <span className="tl-date-panel-lbl">
                        {hasDate ? "Change date" : "Set milestone date"}
                      </span>
                      <div className="tl-date-panel-row">
                        <input
                          type="date"
                          className="tl-date-input"
                          value={m.date ?? ""}
                          onChange={(e) =>
                            void onSaveMilestone(def.key, e.target.value)
                          }
                          autoFocus
                        />
                        <button
                          type="button"
                          className="tl-date-dismiss"
                          onClick={() => setOpenPicker(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="tl-set-date"
                      onClick={() =>
                        setOpenPicker((k) =>
                          k === def.key ? null : def.key,
                        )
                      }
                    >
                      {hasDate ? "Change date" : "Add date"}
                    </button>
                  )}
                  <div
                    className={`tlsaved ${savedFlash === def.key ? "is-visible" : ""}`}
                  >
                    {m.updatedAt ? (
                      <span className="inline-flex items-center gap-1">
                        <FaCheck aria-hidden />
                        Saved {fmtShortUpdated(m.updatedAt)}
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                  {!isLast ? (
                    <div
                      className={`tlcrowd ${cohortDataSparse || cohortTotal === 0 ? "tlcrowd--sparse" : ""}`}
                    >
                      <div className="tlcbw">
                        <div className="tlcb" style={{ width: `${cp}%` }} />
                      </div>
                      <span className="tlctxt">
                        {cohortTotal === 0 ? (
                          <>No cohort data yet   more verified profiles will fill this in.</>
                        ) : (
                          <>
                            <b>{n}</b> of {cohortTotal} ({cp}%) past this
                            {cohortDataSparse
                              ? " · smaller sample, wider spread"
                              : ""}
                          </>
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="card">
          <div className="chd">
            <span className="ctit">Days to PPR distribution</span>
            <span className="ctag">your cohort</span>
          </div>
          {cohort.dist.map((r) => (
            <div key={r.range} className="drow">
              <span className="dlbl">{r.range}</span>
              <div className="dtrk">
                <div
                  className={`dfil ${r.you ? "y" : "n"}`}
                  style={{ width: `${r.pct}%` }}
                >
                  <span className="dcnt">{r.count}</span>
                  {r.you ? (
                    <span className="dytag">
                      <FaArrowLeft aria-hidden /> You
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <p className="mt-2 text-[10px] text-[var(--t3)]">
            {cohort.n_verified} completed applications · {cohort.cohortKey}
          </p>
        </div>
        <div className="card">
          <div className="chd">
            <span className="ctit">Cohort map</span>
            <span className="ctag">{cohortTotal} applicants</span>
          </div>
          <div
            className={`cgrid ${cohortDataSparse || cohortTotal === 0 ? "cgrid--sparse" : ""}`}
          >
            {Array.from({
              length: Math.min(Math.max(cohortTotal, 1), 400),
            }).map((_, i) => {
              const cap = Math.min(Math.max(cohortTotal, 1), 400) - 1;
              const pos = Math.min(Math.max(days - 1, 0), cap);
              let bg = "var(--navy4)";
              let title = "Early stage";
              if (cohortTotal === 0 || cohortDataSparse) {
                bg =
                  i === pos
                    ? "var(--red)"
                    : "rgba(255,255,255,.08)";
                title =
                  i === pos
                    ? `You   Day ${days} (sparse cohort)`
                    : "Awaiting data";
              } else if (i === pos) {
                bg = "var(--red)";
                title = `You   Day ${days}`;
              } else if (i < 94) {
                bg = "var(--red)";
                title = "PPR received";
              } else if (i < 204) {
                bg = "rgba(192,57,43,.38)";
                title = "In progress";
              }
              return (
                <div
                  key={i}
                  className="cdot"
                  style={{
                    background: bg,
                    outline: i === pos ? "2.5px solid #fff" : undefined,
                    outlineOffset: i === pos ? -2 : undefined,
                  }}
                  title={title}
                />
              );
            })}
          </div>
          <div className="cleg">
            <div className="cli">
              <div className="cld" style={{ background: "var(--red)" }} />
              PPR received
            </div>
            <div className="cli">
              <div
                className="cld"
                style={{ background: "rgba(192,57,43,.38)" }}
              />
              In progress
            </div>
            <div className="cli">
              <div className="cld" style={{ background: "var(--navy4)" }} />
              Early stage
            </div>
            <div className="cli">
              <div
                className="cld"
                style={{
                  background: "var(--red)",
                  outline: "2.5px solid #fff",
                  outlineOffset: -2,
                }}
              />
              You
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
