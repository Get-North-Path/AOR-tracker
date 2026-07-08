"use client";

import { useState } from "react";
import {
  DN_TIMELINE,
  DN_TIMELINE_NOTE,
  type DnTimelineBadge,
  type DnTimelineRow,
} from "./data";
import { useDashboardV2Ui } from "./DashboardV2Context";
import {
  IconCheck,
  IconCheckCircle,
  IconEdit,
  IconPlus,
  IconSync,
} from "./dashboard-icons";

const DOT_GLYPHS = {
  done: <IconCheck aria-hidden />,
  now: <IconSync aria-hidden />,
  wait: <IconPlus aria-hidden />,
  final: <IconCheckCircle aria-hidden />,
} as const;

function Badge({ badge }: { badge: DnTimelineBadge }) {
  if (badge.kind === "verified") {
    return (
      <div className="badge-v">
        <IconCheck aria-hidden />
        {badge.label}
      </div>
    );
  }
  if (badge.kind === "pending") {
    return (
      <div className="badge-p">
        <IconSync aria-hidden />
        {badge.label}
      </div>
    );
  }
  return <div className="tl-est">{badge.label}</div>;
}

function TimelineRow({
  row,
  onSaveDate,
}: {
  row: DnTimelineRow;
  /**
   * If provided, the v2 timeline calls this to persist edits (live dashboard
   * wires `updateMilestoneAction(email, key, value)`). When omitted, the
   * preview route just fakes a 1.2s round trip for visual demoing.
   */
  onSaveDate?: (key: string, value: string) => Promise<void>;
}) {
  const { openEditKey, toggleEdit, showToast } = useDashboardV2Ui();
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(row.edit?.initial ?? "");

  const open = openEditKey === row.key;

  const onSave = async () => {
    if (!value) {
      toggleEdit(row.key);
      return;
    }
    setSaving(true);
    try {
      if (onSaveDate) {
        await onSaveDate(row.key, value);
      } else {
        await new Promise((r) => window.setTimeout(r, 1200));
        showToast("Milestone updated · Submitted for community review");
      }
      toggleEdit(row.key);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tl-row">
      <div className="tl-spine" aria-hidden />
      <div className={`tl-dot ${row.state}`}>{DOT_GLYPHS[row.state]}</div>
      <div className="tl-body">
        <div className="tl-top">
          <div>
            <div className="tl-name">{row.name}</div>
            <div className="tl-desc">{row.desc}</div>
            {row.badge ? <Badge badge={row.badge} /> : null}
          </div>
          <div className="tl-r">
            {row.date ? (
              <>
                <div className="tl-date">{row.date.date}</div>
                <div className="tl-day">{row.date.day}</div>
                {row.edit ? (
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => toggleEdit(row.key)}
                  >
                    <IconEdit aria-hidden />
                    {row.edit.label}
                  </button>
                ) : null}
              </>
            ) : row.pending ? (
              <>
                <div className="tl-pend">Not yet</div>
                {row.edit ? (
                  <button
                    type="button"
                    className="edit-btn"
                    style={{ marginTop: 5 }}
                    onClick={() => toggleEdit(row.key)}
                  >
                    <IconPlus aria-hidden />
                    {row.edit.label}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {row.edit ? (
          <div className={`edit-panel${open ? " open" : ""}`}>
            <label className="ep-label">{row.edit.fieldLabel}</label>
            <input
              className="ep-input"
              type="date"
              value={value}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="ep-btns">
              <button
                type="button"
                className="ep-save"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving…" : row.edit.saveLabel ?? "Save"}
              </button>
              <button
                type="button"
                className="ep-cancel"
                onClick={() => toggleEdit(row.key)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Milestone Timeline (Section: `tl-sec`).
 *
 * Sample reference: `.timeline` block in `aortrack-dashboard.html`.
 *
 * Each row can be:
 *   - `done`:  a green dot + verified/pending badge + concrete date
 *   - `now`:   a pulsing blue dot + an estimate badge + "+ Add date" affordance
 *   - `wait`:  a grey dot + estimate + "+ Add date"
 *   - `final`: the PPR row (no edit, just estimate + "Not yet")
 *
 * The live `/dashboard` builds `rows` from `milestoneDefsForCohort` +
 * `profile.milestones` and supplies `onSaveDate` wired to
 * `updateMilestoneAction`; the seed preview falls back to `DN_TIMELINE`.
 */
export function DashboardTimeline({
  rows = DN_TIMELINE,
  note = DN_TIMELINE_NOTE,
  onSaveDate,
}: {
  rows?: DnTimelineRow[];
  note?: string;
  onSaveDate?: (key: string, value: string) => Promise<void>;
} = {}) {
  return (
    <section id="tl-sec">
      <div className="sec-head">
        <div>
          <div className="sec-title">My Milestone Timeline</div>
          <div className="sec-sub">
            {note}
          </div>
        </div>
      </div>

      <div className="timeline" id="ep-bgc-anchor">
        {rows.map((row) => (
          <TimelineRow key={row.key} row={row} onSaveDate={onSaveDate} />
        ))}
      </div>
    </section>
  );
}
