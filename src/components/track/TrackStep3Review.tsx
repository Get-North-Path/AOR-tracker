"use client";

import { useMemo } from "react";
import type {
  CohortStats,
  GlobalMilestonePace,
  MilestoneEntry,
  MilestoneKey,
} from "@/lib/types";
import {
  journeyTargetDays,
  journeyUsesSeededPace,
  resolveApprovalEstimate,
} from "@/lib/ppr-estimate";
import {
  TRACK_MILESTONES,
  type AppType,
  type StreamId,
} from "./data";
import {
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
} from "./track-icons";

type PostAorKey = Exclude<MilestoneKey, "aor">;

type Props = {
  aorDate: string;
  stream: StreamId;
  appType: AppType;
  province: string;

  checked: Record<PostAorKey, boolean>;
  dates: Record<PostAorKey, string>;

  /** Pre-filled from the gate; user can still edit before submitting. */
  email: string;
  emailError: boolean;
  onEmail: (v: string) => void;

  consent: boolean;
  consentError: boolean;
  onConsent: () => void;

  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;

  /** Live cohort stats (null while loading). */
  cohortStats: CohortStats | null;
  cohortStatsLoading: boolean;
  milestonePace: GlobalMilestonePace | null;
  milestonePaceLoading: boolean;
};

const DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function daysBetween(start: string, end: Date): number {
  const s = new Date(`${start}T12:00:00`).getTime();
  return Math.floor((end.getTime() - s) / 86400000);
}

function draftProfileForEstimate(
  aorDate: string,
  checked: Record<PostAorKey, boolean>,
  dates: Record<PostAorKey, string>,
): { aorDate: string; milestones: Record<MilestoneKey, MilestoneEntry> } {
  const entry = (key: PostAorKey): MilestoneEntry => ({
    date: checked[key] && dates[key]?.trim() ? dates[key].trim() : null,
    updatedAt: null,
  });
  return {
    aorDate,
    milestones: {
      aor: { date: aorDate || null, updatedAt: null },
      biometrics: entry("biometrics"),
      background: entry("background"),
      medical: entry("medical"),
      p1: entry("p1"),
      p2: entry("p2"),
      ecopr: entry("ecopr"),
    },
  };
}

/**
 * Step 3   Review (summary card + milestone summary) followed by the
 * "save with email" vs "anon cookie" choice, consent box, and submit
 * button. The orchestrator owns all state.
 */
export function TrackStep3Review(props: Props) {
  const {
    aorDate,
    stream,
    appType,
    province,
    checked,
    dates,
    email,
    emailError,
    onEmail,
    consent,
    consentError,
    onConsent,
    submitting,
    onBack,
    onSubmit,
    cohortStats,
    cohortStatsLoading,
    milestonePace,
    milestonePaceLoading,
  } = props;

  const daysElapsed = aorDate ? daysBetween(aorDate, new Date()) : 0;
  const cohortMedian =
    cohortStats && cohortStats.median_days_to_ppr > 0
      ? cohortStats.median_days_to_ppr
      : 0;
  const journeyFromSeeded = journeyUsesSeededPace(milestonePace);
  const typicalDays = journeyTargetDays(milestonePace, cohortMedian);
  const typicalDaysDisplay =
    typicalDays > 0 ? `${typicalDays}d` : null;

  const draftProfile = useMemo(
    () => draftProfileForEstimate(aorDate, checked, dates),
    [aorDate, checked, dates],
  );

  const approvalLabel = useMemo(() => {
    if (!aorDate || !cohortStats) return null;
    return resolveApprovalEstimate(
      aorDate,
      cohortStats,
      milestonePace,
      draftProfile,
    ).windowLabel;
  }, [aorDate, cohortStats, milestonePace, draftProfile]);

  const approvalDisplay =
    cohortStatsLoading || milestonePaceLoading
      ? "…"
      : approvalLabel ?? " ";

  const aorLabel = aorDate
    ? DATE_FMT.format(new Date(`${aorDate}T12:00:00`))
    : " ";

  return (
    <div className="tk-panel active" role="tabpanel" aria-labelledby="tk-step-3">
      <div className="tk-step-head">
        <div className="tk-step-num">Step 3 of 3</div>
        <div className="tk-step-title">Review &amp; save your profile</div>
        <div className="tk-step-desc">
          Confirm your details below, then choose how to save your profile.
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="tk-summary">
        <div className="tk-summary-top">
          <div>
            <div className="tk-summary-stream">{stream}</div>
            <div className="tk-summary-type">
              {appType}
              {stream === "PNP" && province ? ` · ${province}` : ""}
            </div>
          </div>
          <div className="tk-summary-aor">
            <div className="tk-summary-aor-val">{aorLabel}</div>
            <div className="tk-summary-aor-label">AOR Date</div>
          </div>
        </div>
        <div className="tk-summary-stats">
          <div className="tk-summary-stat">
            <div className="tk-summary-stat-val">{daysElapsed}d</div>
            <div className="tk-summary-stat-label">Days elapsed</div>
          </div>
          <div className="tk-summary-stat">
            <div className="tk-summary-stat-val green">
              {typicalDaysDisplay ?? " "}
            </div>
            <div className="tk-summary-stat-label">
              {journeyFromSeeded ? "Typical journey" : "Cohort median"}
            </div>
          </div>
          <div className="tk-summary-stat">
            <div className="tk-summary-stat-val">{approvalDisplay}</div>
            <div className="tk-summary-stat-label">Est. eCOPR</div>
          </div>
        </div>
      </div>

      {/* MILESTONE SUMMARY */}
      <div className="tk-ms-summary">
        <div className="tk-ms-summary-title">Your milestones</div>
        <div className="tk-ms-summary-list">
          {TRACK_MILESTONES.map((m) => {
            const done = !!(checked[m.key] && dates[m.key]);
            const dateStr = done
              ? DATE_FMT.format(new Date(`${dates[m.key]}T12:00:00`))
              : null;
            return (
              <div className="tk-ms-summary-row" key={m.key}>
                <span
                  className={`tk-ms-summary-dot ${done ? "done" : "pending"}`}
                  aria-hidden="true"
                />
                <span className="tk-ms-summary-name">{m.label}</span>
                {done ? (
                  <span className="tk-ms-summary-date">{dateStr}</span>
                ) : (
                  <span className="tk-ms-summary-est">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EMAIL */}
      <div className="tk-field">
        <label className="tk-field-label" htmlFor="tk-step3-email">
          Your email
        </label>
        <input
          id="tk-step3-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          className={emailError ? "tk-error" : undefined}
          aria-invalid={emailError}
          autoComplete="email"
        />
        <div className="tk-field-note">
          We&apos;ll save your profile under this email so you can resume
          from any device. No password, no spam.
        </div>
        <div className={`tk-field-error${emailError ? " show" : ""}`}>
          Please enter a valid email address.
        </div>
      </div>

      {/* CONSENT */}
      <button
        type="button"
        className={`tk-consent${consent ? " checked" : ""}`}
        onClick={onConsent}
        aria-pressed={consent}
      >
        <span className="tk-consent-check" aria-hidden="true">
          {consent ? <IconCheck /> : null}
        </span>
        <span className="tk-consent-text">
          I agree to the{" "}
          <a
            href="https://www.getnorthpath.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </a>
          . I understand my data contributes anonymously to community cohort
          statistics and can be deleted at any time from my dashboard.
        </span>
      </button>
      <div className={`tk-field-error${consentError ? " show" : ""}`}>
        Please agree to the privacy policy to continue.
      </div>

      <div className="tk-row">
        <button
          type="button"
          className="tk-btn-secondary"
          onClick={onBack}
          disabled={submitting}
        >
          <IconChevronLeft aria-hidden />
          Back
        </button>
        <button
          type="button"
          className="tk-btn tk-btn-submit"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="tk-spinner" aria-hidden="true" />
              Creating your profile…
            </>
          ) : (
            <>
              Start Tracking My Application
              <IconArrowRight aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
