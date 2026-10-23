"use client";

import { FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from "react-icons/fa";
import type { DnAnomalyAlert } from "./data";

export function DashboardAnomalyAlerts({
  alerts,
}: {
  alerts: DnAnomalyAlert[];
}) {
  if (!alerts.length) return null;

  return (
    <section className="anomaly-alerts-section">
      <h2 className="sec-title" style={{ marginBottom: "12px" }}>
        Community Alerts
      </h2>

      {alerts.map((alert) => {
        let Icon = FaInfoCircle;
        if (alert.severity === "warning") {
          Icon = FaExclamationTriangle;
        } else if (alert.severity === "critical") {
          Icon = FaExclamationCircle;
        }

        return (
          <div
            key={alert.id}
            className={`anomaly-alert-card ${alert.severity}`}
          >
            <Icon className="anomaly-alert-icon" aria-hidden />
            <div className="anomaly-alert-content">
              <div className="anomaly-alert-title">{alert.title}</div>
              <div className="anomaly-alert-desc">{alert.description}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
