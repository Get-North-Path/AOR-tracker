"use client";

import { useEffect, useState } from "react";
import type { CommunityPost } from "@/lib/types";

export function LandingLiveFeedSection() {
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Helper to extract days since AOR from the timeline label
  const getDaysSinceAOR = (post: CommunityPost) => {
    // Post timeline item matching a milestone with a 'd' prefix (e.g. 'eCOPR d172')
    const msEvent = post.tl?.find((t) => t.done && t.label.toLowerCase().includes("d"));
    if (!msEvent) return null;
    const match = msEvent.label.match(/d(\d+)/i);
    return match ? match[1] : null;
  };

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
          ) : (
            <div 
              className="mx-auto max-w-[640px] relative h-[560px] overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-50/80 to-slate-100/50 border border-slate-200/60 shadow-[inset_0_2px_20px_rgba(0,0,0,0.02)]" 
              style={{ padding: "40px 16px" }}
            >
              {/* Cinematic Blur Overlay for Top and Bottom */}
              <div 
                className="absolute inset-0 z-20 pointer-events-none" 
                style={{ 
                  backdropFilter: 'blur(8px)', 
                  WebkitBackdropFilter: 'blur(8px)',
                  maskImage: 'linear-gradient(to bottom, black 0%, transparent 20%, transparent 80%, black 100%)', 
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 20%, transparent 80%, black 100%)',
                  background: 'linear-gradient(to bottom, rgba(248,250,252,0.9) 0%, transparent 20%, transparent 80%, rgba(248,250,252,0.9) 100%)'
                }}
              ></div>

              <style suppressHydrationWarning>{`
                @keyframes verticalMarquee {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
                .marquee-container:hover {
                  animation-play-state: paused;
                }
              `}</style>
              
              <div 
                className="flex flex-col gap-5 marquee-container px-2 sm:px-6" 
                style={{ animation: 'verticalMarquee 25s linear infinite' }}
              >
                {[...feed, ...feed, ...feed, ...feed].map((post, idx) => {
                  const days = getDaysSinceAOR(post);
                  const isOriginalFirst = idx === 0;

                  return (
                    <div
                      key={`${post.id}-${idx}`}
                      className={`group relative z-10 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 ${
                        isOriginalFirst ? 'border-green-200 shadow-md shadow-green-100/30' : 'border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-[var(--navy)] text-white px-3 py-1 shadow-sm">
                            {post.msl}
                          </span>
                          {isOriginalFirst && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--green)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse"></span>
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-bold text-slate-900 tracking-tight">
                          {post.name}
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1">
                          {post.meta}
                        </div>
                      </div>
                      {days && (
                        <div className="text-left sm:text-right shrink-0 sm:border-l border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto mt-2 sm:mt-0 transition-colors duration-300 group-hover:border-gray-200">
                          <div className="text-3xl font-black text-[var(--green)] tracking-tighter">
                            {days} <span className="text-sm font-bold text-slate-400 tracking-normal">days</span>
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                            Since AOR
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
