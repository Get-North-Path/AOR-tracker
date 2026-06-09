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
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm p-12 sm:p-16 flex flex-col items-center justify-center text-center">
              {/* Subtle Dot Grid Background */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.03]" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', 
                  backgroundSize: '24px 24px' 
                }}
              ></div>
              
              <div className="relative z-10 flex flex-col items-center">
                {/* Pulsing Live Indicator */}
                <div className="relative flex h-16 w-16 items-center justify-center mb-6">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-20" style={{ backgroundColor: "var(--green)" }}></span>
                  <div className="relative flex items-center justify-center h-16 w-16 rounded-full" style={{ backgroundColor: "rgba(93, 228, 148, 0.15)", color: "var(--green)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight" style={{ color: "var(--t1)" }}>
                  Listening for live updates...
                </h3>
                <p className="max-w-md text-sm sm:text-base leading-relaxed" style={{ color: "var(--t2)" }}>
                  When community members report their Express Entry milestones (like PPRs and Medicals), they will stream here in real-time. Check back soon!
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
