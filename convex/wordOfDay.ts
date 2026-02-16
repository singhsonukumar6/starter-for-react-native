import { query } from "./_generated/server";
import { v } from "convex/values";

// ─── Get word of the day (falls back to latest if today not found) ───
export const getWordOfTheDay = query({
  args: { group: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    // Try exact date first
    const exact = await ctx.db
      .query("wordOfTheDay")
      .withIndex("by_group_date", (q) =>
        q.eq("group", args.group).eq("date", args.date)
      )
      .first();
    if (exact) return exact;

    // Fallback: most recent for this group
    const all = await ctx.db
      .query("wordOfTheDay")
      .withIndex("by_group_date", (q) => q.eq("group", args.group))
      .collect();
    return all.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  },
});

// ─── Get sentence structure of the day (falls back to latest) ───
export const getSentenceOfTheDay = query({
  args: { group: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("sentenceOfTheDay")
      .withIndex("by_group_date", (q) =>
        q.eq("group", args.group).eq("date", args.date)
      )
      .first();
    if (exact) return exact;

    // Fallback: most recent for this group
    const all = await ctx.db
      .query("sentenceOfTheDay")
      .withIndex("by_group_date", (q) => q.eq("group", args.group))
      .collect();
    return all.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  },
});
