import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { serializePost } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const safeLimit = Math.min(Math.max(1, limit), 20); // Cap at 20

    const db = await getDb();
    const col = db.collection("community_posts");

    // Only posts from the last 24 hours
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const filter = {
      approved: true,
      replyToId: { $exists: false },
      createdAt: { $gte: cutoffDate },
    };

    const rows = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray();

    // Serialize to strip ObjectId and ensure plain objects
    const posts = rows.map((r) => serializePost(r as Record<string, unknown>, null));

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
