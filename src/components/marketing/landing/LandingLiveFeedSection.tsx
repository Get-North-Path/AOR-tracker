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

        <div
          className="mx-auto flex flex-col gap-4"
          style={{ maxWidth: "600px" }}
        >
          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--t2)" }}>
              Loading live events...
            </div>
          ) : feed.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-center p-8 sm:p-12 gap-10">
              {/* Faint dot grid background */}
              <div 
                className="absolute inset-0 z-0 opacity-40" 
                style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              ></div>
              
              {/* Left: Message */}
              <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-6 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></span>
                  Live Feed
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                  Quiet right now.<br className="hidden md:block"/> Check back soon.
                </h3>
                
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-sm">
                  When community members report their Express Entry milestones, they stream here in real-time.
                </p>
              </div>
              
              {/* Right: Example Post */}
              <div className="relative z-10 w-full md:w-[320px] shrink-0 mt-6 md:mt-0">
                {/* Fun Sneak Peek Badge */}
                <div className="absolute -top-3 -right-3 md:-right-4 rotate-12 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-20">
                  Sneak Peek 👀
                </div>
                
                {/* Mock Card */}
                <div className="rounded-xl flex flex-col gap-3 justify-between items-start bg-white border border-gray-200 shadow-md p-5 opacity-90 rotate-[-2deg] transition-transform hover:rotate-0 duration-300 cursor-default">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--navy)] text-white px-2 py-0.5">eCOPR received</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">Applicant #4821</div>
                    <div className="text-xs text-slate-500 mt-1">CEC · Feb 20 AOR · Inland</div>
                  </div>
                  <div className="text-left mt-2">
                    <div className="text-2xl font-black text-[var(--green)]">172 <span className="text-sm font-medium text-slate-500">days</span></div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Since AOR</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            feed.map((post, idx) => {
              const days = getDaysSinceAOR(post);

              return (
                <div
                  key={post.id}
                  className="rounded flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center motion-safe:animate-[fadeInUp_0.4s_ease-out_both]"
                  style={{
                    backgroundColor: "var(--w)",
                    border: "1px solid var(--b2)",
                    padding: "16px 20px",
                    animationDelay: `${idx * 0.1}s`,
                  }}
                >
                  <style suppressHydrationWarning>{`
                    @keyframes fadeInUp {
                      from { opacity: 0; transform: translateY(10px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-bold uppercase tracking-wider rounded"
                        style={{
                          backgroundColor: "var(--navy)",
                          color: "#fff",
                          padding: "2px 6px",
                        }}
                      >
                        {post.msl}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--t1)" }}
                      >
                        {post.name}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: "var(--t2)" }}>
                      {post.meta}
                    </div>
                  </div>
                  {days && (
                    <div className="text-right shrink-0">
                      <div
                        className="text-xl font-bold"
                        style={{ color: "var(--green)" }}
                      >
                        {days}{" "}
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--t2)" }}
                        >
                          days
                        </span>
                      </div>
                      <div
                        className="text-xs uppercase tracking-wide"
                        style={{ color: "var(--t2)" }}
                      >
                        Since AOR
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
