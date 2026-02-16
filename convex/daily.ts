import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get today's English content for user's group (falls back to latest)
export const getTodayEnglish = query({
  args: { group: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("dailyEnglish")
      .withIndex("by_group_date", (q) =>
        q.eq("group", args.group).eq("date", args.date)
      )
      .first();
    if (exact) return exact;

    // Fallback: most recent for this group
    const all = await ctx.db
      .query("dailyEnglish")
      .withIndex("by_group_date", (q) => q.eq("group", args.group))
      .collect();
    return all.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  },
});

// Submit daily completion
export const submitCompletion = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already completed
    const existing = await ctx.db
      .query("userDailyProgress")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Get previous streak
    const allProgress = await ctx.db
      .query("userDailyProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sortedProgress = allProgress.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streakDay = 1;
    if (sortedProgress.length > 0) {
      const lastEntry = sortedProgress[0];
      const yesterday = new Date(args.date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastEntry.date === yesterdayStr) {
        streakDay = lastEntry.streakDay + 1;
      }
    }

    return await ctx.db.insert("userDailyProgress", {
      userId: args.userId,
      date: args.date,
      completed: true,
      streakDay,
      createdAt: Date.now(),
    });
  },
});

// Get user streak info
export const getStreakInfo = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allProgress = await ctx.db
      .query("userDailyProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    if (allProgress.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysCompleted: 0,
      };
    }

    const sortedProgress = allProgress.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let currentStreak = 0;
    if (
      sortedProgress[0].date === today ||
      sortedProgress[0].date === yesterdayStr
    ) {
      currentStreak = sortedProgress[0].streakDay;
    }

    const longestStreak = Math.max(...allProgress.map((p) => p.streakDay));

    return {
      currentStreak,
      longestStreak,
      totalDaysCompleted: allProgress.length,
    };
  },
});
