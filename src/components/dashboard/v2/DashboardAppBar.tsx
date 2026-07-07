"use client";

import { useRouter } from "next/navigation";
import { WebsiteLogo } from "@/components/WebsiteLogo";
import { DN_PROFILE } from "./data";
import { IconPlus, IconSync, IconUpload, IconWhatsapp } from "./dashboard-icons";

/**
 * Sticky dark app-bar that sits at the top of the dashboard page.
 *
 * Sample reference: <nav class="nav"> in `aortrack-dashboard.html`.
 *
 * `applicantId` and `cohortLabel` default to the seed profile; the live
 * dashboard derives them from `useDashboard()`. The Share / Log Milestone
 * buttons scroll to on-page anchors when present; otherwise they navigate
 * to the relevant sub-route on the dashboard (set via `shareHref` /
 * `timelineHref`).
 */
export function DashboardAppBar({
  applicantId = DN_PROFILE.applicantId,
  cohortLabel = DN_PROFILE.cohortLabel,
  shareHref,
  timelineHref,
  onSyncCohorts,
  syncCohortBusy = false,
  onOpenWhatsappLinks,
  whatsappBadge = false,
}: {
  applicantId?: string;
  cohortLabel?: string;
  /** When provided, the Share button navigates here instead of scrolling. */
  shareHref?: string;
  /** When provided, the +Log Milestone button navigates here. */
  timelineHref?: string;
  /** Rebuild `cohort_stats` from all profiles (live dashboard only). */
  onSyncCohorts?: () => void;
  syncCohortBusy?: boolean;
  onOpenWhatsappLinks?: () => void;
  whatsappBadge?: boolean;
} = {}) {
  const router = useRouter();

  const scrollToOrNavigate = (id: string, fallbackHref?: string) => {
    const el =
      typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (fallbackHref) router.push(fallbackHref);
  };

  return (
    <nav className="dnb" aria-label="Dashboard navigation">
      <div className="dnb-l">
        <WebsiteLogo
          href="/"
          className="dnb-brand"
          layout="nav"
          size="sm"
          aria-label="AORTrack   home"
        />
        <div className="dnb-sep" aria-hidden />
        <div className="dnb-page">Dashboard · {applicantId}</div>
      </div>

      <div className="dnb-r">
        <div className="dnb-pill" title="Live cohort view">
          <span className="dnb-dot" aria-hidden />
          {cohortLabel}
        </div>
        {onSyncCohorts ? (
          <button
            type="button"
            className="dnb-btn"
            disabled={syncCohortBusy}
            title="Rebuild cohort_stats from all profiles"
            style={{gap: "4px"}}
            aria-label={
              syncCohortBusy ? "Syncing cohorts" : "Sync cohorts"
            }
            onClick={() => onSyncCohorts()}
          >
            <IconSync
              className={syncCohortBusy ? "dnb-spin" : undefined}
              aria-hidden
            />
            
              {syncCohortBusy ? "Syncing…" : "Sync cohorts"}
            
          </button>
        ) : null}
        {onOpenWhatsappLinks ? (
          <button
            type="button"
            className="dnb-btn dnb-btn-wa"
            title="WhatsApp community groups"
            aria-label="WhatsApp community groups"
            onClick={onOpenWhatsappLinks}
          >
            <span className="dnb-wa-wrap">
              <IconWhatsapp aria-hidden />
              {whatsappBadge ? (
                <span className="dnb-wa-badge" aria-hidden>
                  2
                </span>
              ) : null}
            </span>
            <span className="dnb-btn-label">WhatsApp</span>
          </button>
        ) : null}
        <button
          type="button"
          className="dnb-btn"
          title="Share your timeline"
          aria-label="Share"
          style={{gap: "4px"}}
          onClick={() => scrollToOrNavigate("share-sec", shareHref)}
        >
          <IconUpload aria-hidden />
          Share
        </button>
        <button
          type="button"
          className="dnb-btn red"
          title="Log a milestone"
          aria-label="Log milestone"
          style={{gap: "4px"}}
          onClick={() => scrollToOrNavigate("tl-sec", timelineHref)}
        >
          <IconPlus aria-hidden />
          Log<span className="dnb-btn-label"> Milestone</span>
        </button>
      </div>
    </nav>
  );
}
