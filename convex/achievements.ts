import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get All Achievements (Admin) ───
export const getAllAchievements = query({
  handler: async (ctx) => {
    const achievements = await ctx.db.query("achievements").collect();
    
    // Get unlock counts for each achievement
    const achievementsWithStats = await Promise.all(
      achievements.map(async (achievement) => {
        const unlocks = await ctx.db
          .query("userAchievements")
          .withIndex("by_achievement", (q) => q.eq("achievementId", achievement._id))
          .collect();
        
        return {
          ...achievement,
          unlockCount: unlocks.length,
        };
      })
    );
    
    return achievementsWithStats.sort((a, b) => a.category.localeCompare(b.category));
  },
});

// ─── Create Achievement (Admin) ───
export const createAchievement = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    category: v.string(),
    requirement: v.number(),
    xpToken: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error("Achievement with this slug already exists");
    }
    
    const id = await ctx.db.insert("achievements", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      icon: args.icon,
      category: args.category,
      requirement: args.requirement,
      xpToken: args.xpToken,
    });
    
    return id;
  },
});

// ─── Update Achievement (Admin) ───
export const updateAchievement = mutation({
  args: {
    achievementId: v.id("achievements"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    category: v.optional(v.string()),
    requirement: v.optional(v.number()),
    xpToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { achievementId, ...updates } = args;
    
    // Check if new slug conflicts with existing
    if (updates.slug) {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();
      
      if (existing && existing._id !== achievementId) {
        throw new Error("Achievement with this slug already exists");
      }
    }
    
    await ctx.db.patch(achievementId, updates);
  },
});

// ─── Delete Achievement (Admin) ───
export const deleteAchievement = mutation({
  args: {
    achievementId: v.id("achievements"),
  },
  handler: async (ctx, args) => {
    // Delete all user achievements for this achievement
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_achievement", (q) => q.eq("achievementId", args.achievementId))
      .collect();
    
    for (const ua of userAchievements) {
      await ctx.db.delete(ua._id);
    }
    
    await ctx.db.delete(args.achievementId);
  },
});

// ─── Get User Achievements ───
export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all achievements (metadata)
    const allBadges = await ctx.db.query("achievements").collect();
    
    // Get user's unlocked badges
    const unlocked = await ctx.db.query("userAchievements")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    
    const unlockedSet = new Set(unlocked.map(u => u.achievementId));
    
    // Merge
    return allBadges.map(badge => ({
      ...badge,
      unlocked: unlockedSet.has(badge._id),
      unlockedAt: unlocked.find(u => u.achievementId === badge._id)?.unlockedAt,
    })).sort((a, b) => {
       // Unlocked first, then by title
       if (a.unlocked && !b.unlocked) return -1;
       if (!a.unlocked && b.unlocked) return 1;
       return 0;
    });
  },
});
