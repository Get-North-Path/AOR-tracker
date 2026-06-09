"use client";

import { useEffect, useState } from "react";
import type { CommunityPost } from "@/lib/types";

export function LandingLiveFeedSection() {
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/feed?limit=5");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.posts) {
          setFeed(data.posts);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch feed", err);
      }
    };

    void fetchFeed();
    const interval = setInterval(fetchFeed, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Cycle through feed items
  useEffect(() => {
    if (feed.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feed.length);
    }, 4500); // 4.5 seconds per item
    return () => clearInterval(timer);
  }, [feed.length]);

  // Helper to extract days since AOR from the timeline label
  const getDaysSinceAOR = (post: CommunityPost) => {
    const msEvent = post.tl?.find((t) => t.done && t.label.toLowerCase().includes("d"));
    if (!msEvent) return null;
    const match = msEvent.label.match(/d(\d+)/i);
    return match ? match[1] : null;
  };

  const currentPost = feed[currentIndex];
  const days = currentPost ? getDaysSinceAOR(currentPost) : null;

  return (
    <section className="section py-16" id="live-feed" style={{ backgroundColor: "var(--bg)" }}>
      <div className="inner">
        <p className="section-eye reveal">Live Community Reports</p>
        <h2 className="section-h2 reveal" style={{ marginBottom: "2rem" }}>
          See the latest milestones as they happen.
        </h2>

        <div className="mx-auto w-full px-4">
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--t2)" }}>
              Loading live events...
            </div>
          ) : feed.length === 0 ? (
            <div className="mx-auto max-w-4xl relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg flex flex-col md:flex-row items-center p-8 sm:p-14 gap-8 md:gap-14">
              <style suppressHydrationWarning>{`
                @keyframes floatCard {
                  0%, 100% { transform: translateY(0px) rotate(-3deg); }
                  50% { transform: translateY(-12px) rotate(-1deg); }
                }
                @keyframes pulseGlow {
                  0%, 100% { opacity: 0.1; transform: scale(1); }
                  50% { opacity: 0.15; transform: scale(1.1); }
                }
              `}</style>

              {/* Glowing Background Spotlight */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none"
                style={{ backgroundColor: "var(--green)", animation: "pulseGlow 8s ease-in-out infinite" }}
              ></div>

              {/* Faint dot grid background with fade mask */}
              <div 
                className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
                style={{ 
                  backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                  backgroundSize: '20px 20px',
                  maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
                }}
              ></div>
              
              {/* Left: Message */}
              <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-6 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Data Stream
                </div>

                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                  Quiet right now.<br className="hidden md:block"/> Check back soon.
                </h3>
                
                <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-sm">
                  When community members report their Express Entry milestones, they stream here in real-time.
                </p>
              </div>
              
              {/* Right: Example Post */}
              <div className="relative z-10 w-full md:w-[340px] shrink-0 mt-8 md:mt-0 perspective-1000">
                {/* Mock Card with Floating Animation */}
                <div 
                  className="relative rounded-2xl flex flex-col gap-3 justify-between items-start bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl p-6 cursor-default transition-all duration-300"
                  style={{ animation: 'floatCard 6s ease-in-out infinite' }}
                >
                  {/* Fun Sneak Peek Badge */}
                  <div className="absolute -top-4 -right-4 bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20 transform rotate-12">
                    Sneak Peek 👀
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-md bg-[var(--navy)] text-white px-2.5 py-1 shadow-sm">eCOPR received</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">Applicant #4821</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">CEC · Feb 20 AOR · Inland</div>
                  </div>
                  <div className="text-left mt-3 pt-3 border-t border-slate-100 w-full">
                    <div className="text-3xl font-black text-[var(--green)]">172 <span className="text-sm font-bold text-slate-400">days</span></div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Since AOR</div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentPost ? (
            <div className="mx-auto max-w-4xl relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg flex flex-col md:flex-row items-center p-8 sm:p-14 gap-8 md:gap-14">
              <style suppressHydrationWarning>{`
                @keyframes pulseGlow {
                  0%, 100% { opacity: 0.1; transform: scale(1); }
                  50% { opacity: 0.15; transform: scale(1.1); }
                }
                @keyframes cycleFeed {
                  0% { opacity: 0; transform: translateY(20px) scale(0.95); filter: blur(4px); }
                  8% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
                  90% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
                  100% { opacity: 0; transform: translateY(-20px) scale(0.95); filter: blur(4px); }
                }
              `}</style>

              {/* Glowing Background Spotlight */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none"
                style={{ backgroundColor: "var(--green)", animation: "pulseGlow 8s ease-in-out infinite" }}
              ></div>

              {/* Faint dot grid background with fade mask */}
              <div 
                className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
                style={{ 
                  backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                  backgroundSize: '20px 20px',
                  maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
                }}
              ></div>
              
              {/* Left: Message */}
              <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-6 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Data Stream
                </div>

                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--t1)] tracking-tight mb-4 leading-tight">
                  Live updates.<br className="hidden md:block"/> Streaming now.
                </h3>
                
                <p className="text-[var(--t2)] text-base md:text-lg leading-relaxed max-w-sm">
                  Watch as Express Entry applicants report their latest processing milestones in real-time.
                </p>
              </div>
              
              {/* Right: Active Post Carousel */}
              <div className="relative z-10 w-full md:w-[360px] shrink-0 mt-8 md:mt-0 perspective-1000 min-h-[160px] flex items-center justify-center">
                <div
                  key={currentPost.id + currentIndex}
                  className="group relative rounded-2xl flex flex-col gap-3 justify-between items-start bg-white/90 backdrop-blur-md border border-white/50 shadow-2xl p-6 w-full cursor-default"
                  style={{ animation: 'cycleFeed 4.5s ease-in-out forwards' }}
                >
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-[var(--navy)] text-white px-3 py-1 shadow-sm">
                        {currentPost.msl}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--green)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 tracking-tight">
                      {currentPost.name}
                    </div>
                    <div className="text-sm text-slate-500 font-medium mt-1">
                      {currentPost.meta}
                    </div>
                  </div>
                  {days && (
                    <div className="text-left mt-3 pt-3 border-t border-slate-100 w-full">
                      <div className="text-3xl font-black text-[var(--green)] tracking-tighter">
                        {days} <span className="text-sm font-bold text-slate-400 tracking-normal">days</span>
                      </div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                        Since AOR
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
