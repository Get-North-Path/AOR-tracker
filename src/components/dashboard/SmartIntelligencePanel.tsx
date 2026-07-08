"use client";

import { useDashboard } from "@/components/dashboard/DashboardContext";
import { buildSmartInsight } from "@/lib/smart-cohort-intelligence";
import { useMemo } from "react";

export function SmartIntelligencePanel() {
  const { profile, cohortDisplay, milestonePace } = useDashboard();

  const insight = useMemo(() => {
    return buildSmartInsight(profile, cohortDisplay, milestonePace);
  }, [profile, cohortDisplay, milestonePace]);

  return (
    <div className="card mb-4 border border-[var(--navy4)] bg-[rgba(255,255,255,0.02)]">
      <div className="chd">
        <span className="ctit">Smart Cohort Intelligence</span>
        <span className="ctag text-[var(--t3)]">Future AI Ready</span>
      </div>
      <div className="flex flex-col gap-4 p-4 pt-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-base font-medium">
            <span>{insight.status.icon}</span>
            <span className={insight.status.color}>{insight.status.label}</span>
          </div>
          <div className="text-sm text-[var(--t2)]">
            {insight.status.message}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--t1)]">Expected next milestone:</span>
          <span className="text-sm text-[var(--t2)]">{insight.expectedWindow}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--t1)]">Confidence:</span>
          <span className="text-sm text-[var(--t2)]">{insight.confidence}</span>
        </div>

        {insight.alert && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--t1)]">Alert:</span>
            <span className="text-sm text-[var(--t2)]">{insight.alert}</span>
          </div>
        )}
      </div>
    </div>
  );
}
