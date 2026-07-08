"use client";

import { useDashboard } from "@/components/dashboard/DashboardContext";
import { buildSmartInsight } from "@/lib/smart-cohort-intelligence";
import { useMemo } from "react";
import { IconInfo } from "./dashboard-icons";

export function SmartIntelligencePanelV2() {
  const { profile, cohortDisplay, milestonePace } = useDashboard();

  const insight = useMemo(() => {
    return buildSmartInsight(profile, cohortDisplay, milestonePace);
  }, [profile, cohortDisplay, milestonePace]);

  return (
    <section id="smart-insight-sec">
      <div className="sec-head" style={{ marginTop: 32 }}>
        <div>
          <div className="sec-title">Smart Cohort Intelligence</div>
          <div className="sec-sub">Future AI-Ready Deterministic Engine</div>
        </div>
      </div>
      
      <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
        <div>
          <div className="card-label" style={{ fontSize: '14px', marginBottom: '8px' }}>
            <span style={{ marginRight: '6px' }}>{insight.status.icon}</span>
            <strong style={{ 
              color: insight.status.label === "Delayed" ? "#c0392b" : 
                     insight.status.label === "Watch" ? "#d35400" : 
                     "#27ae60" 
            }}>
              {insight.status.label}
            </strong>
          </div>
          <div className="card-explain" style={{ fontSize: '15px', color: '#34495e' }}>
            {insight.status.message}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid #ecf0f1', paddingTop: '20px' }}>
          <div>
            <div className="card-label" style={{ marginBottom: '4px' }}>Expected Next Milestone</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50' }}>{insight.expectedWindow}</div>
          </div>
          <div>
            <div className="card-label" style={{ marginBottom: '4px' }}>Confidence Score</div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: insight.confidence === 'High' ? '#27ae60' : insight.confidence === 'Moderate' ? '#f39c12' : '#c0392b' 
            }}>
              {insight.confidence}
            </div>
          </div>
        </div>

        {insight.alert && (
          <div style={{ 
            marginTop: '8px',
            backgroundColor: '#f8f9fa', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef', 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center' 
          }}>
            <IconInfo aria-hidden style={{ color: '#7f8c8d' }} />
            <div className="card-explain" style={{ margin: 0, fontWeight: 500, color: '#495057' }}>
              <span style={{ fontWeight: 600, color: '#34495e', marginRight: '4px' }}>Alert:</span> 
              {insight.alert}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
