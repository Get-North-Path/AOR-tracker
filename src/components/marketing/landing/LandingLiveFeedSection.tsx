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
            <div className="relative rounded overflow-hidden" style={{ border: "1px dashed var(--b2)", backgroundColor: "var(--bg)" }}>
              {/* Blurred fake background posts */}
              <div className="opacity-30 blur-[2px] pointer-events-none flex flex-col gap-4 p-4">
                <div className="rounded flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border border-gray-100 p-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider rounded bg-[var(--navy)] text-white px-2 py-0.5">eCOPR received</span>
                      <span className="text-sm font-semibold text-[var(--t1)]">Applicant #4821</span>
                    </div>
                    <div className="text-sm text-[var(--t2)]">CEC · Feb 20 AOR · Inland</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-[var(--green)]">172 <span className="text-sm font-medium text-[var(--t2)]">days</span></div>
                    <div className="text-xs uppercase tracking-wide text-[var(--t2)]">Since AOR</div>
                  </div>
                </div>
                
                <div className="rounded flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border border-gray-100 p-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider rounded bg-[var(--navy)] text-white px-2 py-0.5">BGC Started</span>
                      <span className="text-sm font-semibold text-[var(--t1)]">Applicant #5107</span>
                    </div>
                    <div className="text-sm text-[var(--t2)]">CEC · Feb 28 AOR · Outland</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-[var(--green)]">61 <span className="text-sm font-medium text-[var(--t2)]">days</span></div>
                    <div className="text-xs uppercase tracking-wide text-[var(--t2)]">Since AOR</div>
                  </div>
                </div>
              </div>
              
              {/* Overlay Message */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div 
                  className="rounded-full flex items-center justify-center bg-white shadow-sm mb-3" 
                  style={{ width: 48, height: 48, color: "var(--t2)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="font-bold text-base text-center bg-white/90 px-3 py-1 rounded" style={{ color: "var(--t1)" }}>
                  Quiet right now   check back soon
                </div>
                <div className="text-sm mt-2 text-center bg-white/90 px-3 py-1 rounded" style={{ color: "var(--t2)", maxWidth: "320px" }}>
                  Live community milestone updates will stream here in real-time.
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
