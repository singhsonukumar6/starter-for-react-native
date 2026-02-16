import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create user profile
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Create user profile
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    class: v.number(),
    parentEmail: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const getUserGroup = (classNum: number): string => {
      if (classNum >= 1 && classNum <= 3) return "junior";
      if (classNum >= 4 && classNum <= 6) return "intermediate";
      return "senior";
    };

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      class: args.class,
      group: getUserGroup(args.class),
      parentEmail: args.parentEmail,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    class: v.optional(v.number()),
    parentEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
  },
});

// Migrate all users from old group names to new ones
export const migrateGroups = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const groupMap: Record<string, string> = {
      group_1_3: "junior",
      group_4_6: "intermediate",
      group_7_10: "senior",
    };
    let migrated = 0;
    for (const user of users) {
      const newGroup = groupMap[user.group];
      if (newGroup) {
        await ctx.db.patch(user._id, { group: newGroup });
        migrated++;
      }
    }
    return { migrated, total: users.length };
  },
});
