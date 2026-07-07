"use client";

import { useEffect, useState } from "react";
import { getLandingHomeAction } from "@/app/actions/landing";
import { IconArrowRight } from "@/components/marketing/landing-icons";
import { LandingCohortSection } from "@/components/marketing/landing/LandingCohortSection";
import { LandingCtaSection } from "@/components/marketing/landing/LandingCtaSection";
import { LandingFeaturesSection } from "@/components/marketing/landing/LandingFeaturesSection";
import { LandingGrowthSection } from "@/components/marketing/landing/LandingGrowthSection";
import { LandingHeroSection } from "@/components/marketing/landing/LandingHeroSection";
import { LandingSeoIntroSection } from "@/components/marketing/landing/LandingSeoIntroSection";
import { LandingLiveFeedSection } from "@/components/marketing/landing/LandingLiveFeedSection";
import { LandingHowItWorksSection } from "@/components/marketing/landing/LandingHowItWorksSection";
import { LandingLoadingAnimation } from "@/components/landing/LandingLoadingAnimation";
import { LandingMessagingSection } from "@/components/marketing/landing/LandingMessagingSection";
import { LandingOssSection } from "@/components/marketing/landing/LandingOssSection";
import { LandingStatsBar } from "@/components/marketing/landing/LandingStatsBar";
import { LandingStreamsSection } from "@/components/marketing/landing/LandingStreamsSection";
import Link from "next/link";

export function LandingMarketingClient() {
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [medianSample, setMedianSample] = useState<number | null>(null);

  useEffect(() => {
    void getLandingHomeAction().then((d) => {
      setProfileCount(d.profileCount);
      setMedianSample(d.medianSample);
    });
  }, []);

  useEffect(() => {
    const sticky = document.getElementById("mkt-sticky");
    const onScroll = () => {
      if (!sticky) return;
      sticky.classList.toggle("show", window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("shown");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const countLabel =
    profileCount != null ? `${profileCount.toLocaleString()}+` : "Community";

  return (
    <div className="mkt-landing-page">
      <LandingLoadingAnimation />
      <LandingHeroSection profileCount={profileCount} />
      <LandingSeoIntroSection profileCount={profileCount} />
      <LandingStatsBar profileCount={profileCount} medianSample={medianSample} />
      <LandingLiveFeedSection />
      <LandingHowItWorksSection />
      <LandingFeaturesSection />
      <LandingCohortSection />
      <LandingMessagingSection />
      <LandingStreamsSection />
      <LandingOssSection />
      <LandingGrowthSection profileCount={profileCount} />
      <LandingCtaSection countLabel={countLabel} />

      <div className="sticky" id="mkt-sticky">
        <div>
          <div className="sticky-text">AORTrack   Free PR Tracker</div>
          <div className="sticky-sub">Open source · Community powered · No signup</div>
        </div>
        <Link href="/track" className="btn-hero btn-red" style={{ fontSize: "0.84rem", padding: "10px 22px" }}>
          Track My AOR <IconArrowRight />
        </Link>
      </div>
    </div>
  );
}
