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
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center text-center p-10 sm:p-14">
              {/* Faint dot grid background */}
              <div 
                className="absolute inset-0 z-0 opacity-40" 
                style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              ></div>
              
              <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
                
                {/* Overlapping Event Icons */}
                <div className="flex -space-x-3 mb-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[var(--navy)] text-white shadow-sm z-30" title="eCOPR">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[var(--green)] text-white shadow-sm z-20" title="Medical">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-gray-400 text-white shadow-sm z-10" title="BGC">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                </div>
                
                {/* Status Pill */}
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-4 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></span>
                  Live Feed
                </div>

                <h3 className="text-2xl font-extrabold text-[var(--t1)] tracking-tight mb-3">
                  Quiet right now   check back soon
                </h3>
                
                <p className="text-[var(--t2)] text-base leading-relaxed max-w-sm mx-auto">
                  When community members report their Express Entry milestones, they will stream here in real-time.
                </p>
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
