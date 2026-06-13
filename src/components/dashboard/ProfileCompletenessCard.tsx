"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProfileAction,
  saveProfileAction,
  updateMilestoneAction,
} from "@/app/actions/profile";
import { useToast } from "@/components/ToastContext";
import { PROVINCES, STREAM_OPTIONS } from "@/lib/constants";
import type { ProfileCompleteness } from "@/lib/profile-completeness";
import type { MilestoneKey, UserProfile } from "@/lib/types";

type Props = {
  email: string;
  profile: UserProfile;
  completeness: ProfileCompleteness;
  onProfileUpdated: (next: UserProfile) => void;
};

export function ProfileCompletenessCard({
  email,
  profile,
  completeness,
  onProfileUpdated,
}: Props) {
  const toast = useToast();
  const [savingDetails, setSavingDetails] = useState(false);
  const [milestoneSaving, setMilestoneSaving] = useState<MilestoneKey | null>(
    null,
  );

  const requiredFields = useMemo(
    () => completeness.remaining.filter((r) => r.priority === "required"),
    [completeness.remaining],
  );
  const optionalFields = useMemo(
    () => completeness.remaining.filter((r) => r.priority === "optional"),
    [completeness.remaining],
  );

  const [draft, setDraft] = useState(() => ({
    aorDate: profile.aorDate,
    stream: profile.stream,
    type: profile.type,
    province: profile.province,
  }));

  useEffect(() => {
    setDraft({
      aorDate: profile.aorDate,
      stream: profile.stream,
      type: profile.type,
      province: profile.province,
    });
  }, [profile.aorDate, profile.stream, profile.type, profile.province]);

  const saveApplicationDetails = useCallback(async () => {
    setSavingDetails(true);
    try {
      const next: UserProfile = {
        ...profile,
        aorDate: draft.aorDate.trim(),
        stream: draft.stream.trim(),
        type: draft.type.trim(),
        province: draft.province.trim(),
      };
      if (!next.aorDate) {
        toast.show("AOR date is required");
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      if (next.aorDate > today) {
        toast.show("AOR date cannot be in the future");
        return;
      }
      if (!next.stream || !next.type || !next.province) {
        toast.show("Please fill stream, type, and province");
        return;
      }
      const res = await saveProfileAction(next);
      if (!res.ok) {
        toast.show(res.error ?? "Could not save");
        return;
      }
      const p = await getProfileAction(email);
      if (p.ok) {
        onProfileUpdated(p.profile);
        toast.show("Application details saved");
      }
    } finally {
      setSavingDetails(false);
    }
  }, [draft, email, onProfileUpdated, profile, toast]);

  const saveMilestoneDate = useCallback(
    async (key: MilestoneKey, date: string) => {
     if (!date) {
        toast.show("Pick a date first");
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      if (date > today) {
        toast.show("Milestone date cannot be in the future");
        return;
      }
      setMilestoneSaving(key);
      try {
        const res = await updateMilestoneAction(email, key, date);
        if (!res.ok) {
          toast.show(res.error ?? "Could not save");
          return;
        }
        if (res.profile) {
          onProfileUpdated(res.profile);
          toast.show("Milestone saved");
        }
      } finally {
        setMilestoneSaving(null);
      }
    },
    [email, onProfileUpdated, toast],
  );

  if (completeness.remaining.length === 0) return null;

  return (
    <div className="card card-pc mb-4 border border-[rgba(192,57,43,0.28)] bg-[rgba(192,57,43,0.07)]">
      <div className="chd">
        <span className="ctit">Complete your profile</span>
        <span className="ctag">
          {completeness.percent}% ·{" "}
          {completeness.requiredRemaining > 0
            ? `${completeness.requiredRemaining} required`
            : "Required fields done"}{" "}
          · {completeness.optionalRemaining} optional
        </span>
      </div>
      <p className="pc-intro">
        {completeness.requiredRemaining > 0
          ? "Fill in the fields below, then save application details. Optional milestones use their own Save   or add them from the timeline."
          : "Add dates for steps you have already completed."}
      </p>

      {requiredFields.length > 0 ? (
        <div className="pc-section">
          <h3 className="pc-section-title">Application details</h3>
          <div className="pc-grid">
            {requiredFields.some((r) => r.field === "aorDate") ? (
              <div>
                <label className="pc-field-label" htmlFor="pc-aor">
                  AOR date
                </label>
               <input
                  id="pc-aor"
                  type="date"
                  className="aor-date-input"
                  value={draft.aorDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, aorDate: e.target.value }))
                  }
                />
                <p className="pc-field-hint">
                  Official acknowledgement-of-receipt date from IRCC.
                </p>
              </div>
            ) : null}
            {requiredFields.some((r) => r.field === "stream") ? (
              <div>
                <label className="pc-field-label" htmlFor="pc-stream">
                  Application stream
                </label>
                <select
                  id="pc-stream"
                  className="pc-select"
                  value={draft.stream}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stream: e.target.value }))
                  }
                >
                  {STREAM_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {requiredFields.some((r) => r.field === "type") ? (
              <div className="sm:col-span-2">
                <span className="pc-field-label">Inland or Outland</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(["Inland", "Outland"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        draft.type === t
                          ? "border-(--red) bg-[rgba(192,57,43,0.18)] text-(--w)"
                          : "border-(--border) bg-(--navy) text-(--t2) hover:border-[rgba(255,255,255,.15)]"
                      }`}
                      onClick={() => setDraft((d) => ({ ...d, type: t }))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {requiredFields.some((r) => r.field === "province") ? (
              <div>
                <label className="pc-field-label" htmlFor="pc-prov">
                  Province of residence
                </label>
                <select
                  id="pc-prov"
                  className="pc-select"
                  value={draft.province}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, province: e.target.value }))
                  }
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="pc-actions">
            <button
              type="button"
              className="pc-btn-primary"
              disabled={savingDetails}
              onClick={() => void saveApplicationDetails()}
            >
              {savingDetails ? "Saving…" : "Save application details"}
            </button>
            <Link href="/track" className="pc-link-onboarding">
              Open full onboarding form
            </Link>
          </div>
        </div>
      ) : null}

      {optionalFields.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {optionalFields.map((r) => {
            if (r.field !== "milestone") return null;
            const key = r.milestoneKey;
            return (
              <li
                key={r.id}
                id={`complete-milestone-${key}`}
                className="pc-milestone"
              >
                <div className="pc-milestone-main">
                  <div className="pc-milestone-labelwrap">
                    <p className="pc-milestone-head">
                      {r.label}
                      <span className="pc-milestone-badge">Optional</span>
                    </p>
                  </div>
                  <div className="pc-milestone-datewrap">
                    <MilestoneDateRow
                      busy={milestoneSaving === key}
                      onSave={(date) => void saveMilestoneDate(key, date)}
                    />
                  </div>
                </div>
                <p className="pc-milestone-hint">{r.hint}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function MilestoneDateRow({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (date: string) => void;
}) {
  const [val, setVal] = useState("");

  return (
    <div className="pc-date-row">
     <input
        type="date"
        className="aor-date-input"
        aria-label="Milestone completion date"
        value={val}
        max={new Date().toISOString().split("T")[0]}
        disabled={busy}
        onChange={(e) => setVal(e.target.value)}
      />
      <button
        type="button"
        className="pc-btn-primary shrink-0 px-5"
        disabled={busy || !val}
        onClick={() => {
          onSave(val);
          setVal("");
        }}
      >
        {busy ? "Saving…" : "Save date"}
      </button>
    </div>
  );
}
