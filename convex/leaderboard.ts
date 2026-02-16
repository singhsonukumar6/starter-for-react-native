import { query } from "./_generated/server";
import { v } from "convex/values";

// ─── Get active winners for the homepage slider ───
export const getWinners = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("winners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// ─── Get global leaderboard (all-time XP, top 50) ───
export const getGlobalLeaderboard = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const sorted = users
      .filter((u) => (u.xp || 0) > 0)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 50);

    return sorted.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      name: u.name,
      class: u.class,
      group: u.group,
      xp: u.xp || 0,
      level: u.level || 1,
      imageUrl: u.imageUrl,
    }));
  },
});

// ─── Get leaderboard for a specific group ───
export const getGroupLeaderboard = query({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    const filtered = users
      .filter((u) => u.group === args.group && (u.xp || 0) > 0)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 50);

    return filtered.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      name: u.name,
      class: u.class,
      group: u.group,
      xp: u.xp || 0,
      level: u.level || 1,
      imageUrl: u.imageUrl,
    }));
  },
});

// ─── Monthly leaderboard — aggregated from test results ───
export const getMonthlyLeaderboard = query({
  args: {
    month: v.optional(v.string()),
    group: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const d = new Date();
    const currentMonth =
      args.month ||
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const allResults = await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_month")
      .collect();

    const monthResults = allResults.filter((r) => r.month === currentMonth);

    // Aggregate scores per user
    const userAgg: Record<
      string,
      { totalScore: number; testsTaken: number; totalMarks: number; userId: any }
    > = {};

    for (const r of monthResults) {
      const uid = r.userId as string;
      if (!userAgg[uid]) {
        userAgg[uid] = { totalScore: 0, testsTaken: 0, totalMarks: 0, userId: r.userId };
      }
      userAgg[uid].totalScore += r.score;
      userAgg[uid].totalMarks += r.totalMarks;
      userAgg[uid].testsTaken += 1;
    }

    let sorted = Object.values(userAgg).sort((a, b) => b.totalScore - a.totalScore);

    // Filter by group
    if (args.group) {
      const users = await ctx.db.query("users").collect();
      const ids = new Set(
        users.filter((u) => u.group === args.group).map((u) => u._id as string)
      );
      sorted = sorted.filter((s) => ids.has(s.userId as string));
    }

    const top20 = sorted.slice(0, 20);

    // Get all users for enrichment
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id as string, u]));

    const enriched = top20.map((s, i) => {
      const user = userMap.get(s.userId as string);
      return {
        rank: i + 1,
        userId: s.userId,
        name: user?.name || "Unknown",
        class: user?.class || 0,
        group: user?.group || "",
        totalScore: s.totalScore,
        testsTaken: s.testsTaken,
        avgPercentage:
          s.totalMarks > 0
            ? Math.round((s.totalScore / s.totalMarks) * 100)
            : 0,
        xp: user?.xp || 0,
        level: user?.level || 1,
        imageUrl: user?.imageUrl,
      };
    });

    return {
      month: currentMonth,
      monthLabel: getMonthLabel(currentMonth),
      leaderboard: enriched,
    };
  },
});

// ─── Get user rank (global) ───
export const getUserRank = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    const sorted = users
      .filter((u) => (u.xp || 0) > 0)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));

    const rank = sorted.findIndex((u) => u._id === args.userId) + 1;
    const user = await ctx.db.get(args.userId);

    return {
      rank: rank || sorted.length + 1,
      totalPlayers: sorted.length,
      xp: user?.xp || 0,
      level: user?.level || 1,
    };
  },
});

function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(m) - 1]} ${year}`;
}
