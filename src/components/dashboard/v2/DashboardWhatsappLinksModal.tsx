"use client";

import { useEffect, useId, useState } from "react";
import { IconClose, IconWhatsapp } from "./dashboard-icons";
import {
  setWhatsappLinksAutoDismiss,
  WHATSAPP_COMMUNITY_LINKS,
} from "./whatsapp-links";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DashboardWhatsappLinksModal({ open, onClose }: Props) {
  const labelId = useId();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function handleClose() {
    if (dontShowAgain) {
      setWhatsappLinksAutoDismiss(true);
    }
    onClose();
  }

  function onOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose();
  }

  return (
    <div
      className={`dn-modal-overlay${open ? " open" : ""}`}
      role="presentation"
      onMouseDown={onOverlayMouseDown}
      aria-hidden={!open}
    >
      <div
        className="dn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <div className="dn-modal-header">
          <div className="dn-modal-title" id={labelId}>
            Join the community on WhatsApp
          </div>
          <button
            type="button"
            className="dn-modal-close"
            aria-label="Close"
            onClick={handleClose}
          >
            <IconClose aria-hidden />
          </button>
        </div>

        <div className="dn-modal-body">
          <p className="dn-modal-lead">
            Stay in sync with other applicants and share updates, compare timelines,
            and get support while you wait.
          </p>
          <ul className="dn-wa-list">
            {WHATSAPP_COMMUNITY_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="dn-wa-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="dn-wa-card-icon" aria-hidden>
                    <IconWhatsapp />
                  </span>
                  <span className="dn-wa-card-text">
                    <span className="dn-wa-card-title">{link.title}</span>
                    <span className="dn-wa-card-desc">{link.description}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="dn-modal-footer">
          <label className="dn-modal-dismiss">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don&apos;t show automatically on login
          </label>
          <button type="button" className="dn-modal-done" onClick={handleClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
