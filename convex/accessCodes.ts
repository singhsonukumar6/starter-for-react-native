/**
 * Access Codes & PRO Subscription Management
 * - Admin can create/manage access codes
 * - Users can redeem codes to get PRO access
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────
// ADMIN: Create Access Code
// ─────────────────────────────────────────────────────────────
export const createAccessCode = mutation({
  args: {
    code: v.string(),
    durationDays: v.number(),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existing = await ctx.db
      .query("accessCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Access code already exists");
    }

    const codeId = await ctx.db.insert("accessCodes", {
      code: args.code.toUpperCase(),
      durationDays: args.durationDays,
      maxUses: args.maxUses,
      usedCount: 0,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });

    return codeId;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: List All Access Codes
// ─────────────────────────────────────────────────────────────
export const listAccessCodes = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query("accessCodes").order("desc").collect();
    return codes;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle Access Code Active Status
// ─────────────────────────────────────────────────────────────
export const toggleAccessCode = mutation({
  args: {
    codeId: v.id("accessCodes"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.codeId, { isActive: args.isActive });
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete Access Code
// ─────────────────────────────────────────────────────────────
export const deleteAccessCode = mutation({
  args: {
    codeId: v.id("accessCodes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.codeId);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────
// USER: Redeem Access Code
// ─────────────────────────────────────────────────────────────
export const redeemAccessCode = mutation({
  args: {
    clerkId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find the access code
    const accessCode = await ctx.db
      .query("accessCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!accessCode) {
      throw new Error("Invalid access code");
    }

    if (!accessCode.isActive) {
      throw new Error("This access code is no longer active");
    }

    // Check if code has expired
    if (accessCode.expiresAt && accessCode.expiresAt < Date.now()) {
      throw new Error("This access code has expired");
    }

    // Check max uses
    if (accessCode.maxUses && accessCode.usedCount >= accessCode.maxUses) {
      throw new Error("This access code has reached its usage limit");
    }

    // Calculate new PRO expiry
    const now = Date.now();
    const currentExpiry = user.proExpiresAt && user.proExpiresAt > now ? user.proExpiresAt : now;
    const newExpiry = currentExpiry + accessCode.durationDays * 24 * 60 * 60 * 1000;

    // Update user PRO status
    await ctx.db.patch(user._id, {
      isPro: true,
      proExpiresAt: newExpiry,
    });

    // Increment usage count
    await ctx.db.patch(accessCode._id, {
      usedCount: accessCode.usedCount + 1,
    });

    // Record redemption
    await ctx.db.insert("codeRedemptions", {
      userId: user._id,
      codeId: accessCode._id,
      code: accessCode.code,
      durationDays: accessCode.durationDays,
      proExpiresAt: newExpiry,
      redeemedAt: now,
    });

    // ─── Award referrer 1000 XP if this is user's first time becoming PRO ───
    if (user.referredBy && !user.referralProXpClaimed) {
      const referrer = await ctx.db.get(user.referredBy);
      if (referrer) {
        await ctx.db.patch(referrer._id, {
          xp: (referrer.xp || 0) + 1000,
        });

        // Mark as claimed
        await ctx.db.patch(user._id, {
          referralProXpClaimed: true,
        });

        // Update referral record
        const referralRecord = await ctx.db
          .query("referrals")
          .withIndex("by_referred", (q) => q.eq("referredUserId", user._id))
          .first();

        if (referralRecord) {
          await ctx.db.patch(referralRecord._id, {
            proXpAwarded: true,
          });
        }
      }
    }

    return {
      success: true,
      durationDays: accessCode.durationDays,
      expiresAt: newExpiry,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// USER: Get My Code Redemptions
// ─────────────────────────────────────────────────────────────
export const getMyRedemptions = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return [];

    const redemptions = await ctx.db
      .query("codeRedemptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return redemptions;
  },
});

// ─────────────────────────────────────────────────────────────
// USER: Get PRO Status
// ─────────────────────────────────────────────────────────────
export const getProStatus = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { isPro: false, expiresAt: null, daysRemaining: 0 };
    }

    const now = Date.now();
    const isPro = user.isPro && user.proExpiresAt && user.proExpiresAt > now;
    const daysRemaining = isPro
      ? Math.ceil((user.proExpiresAt! - now) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      isPro: !!isPro,
      expiresAt: user.proExpiresAt || null,
      daysRemaining,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get All Pro Users
// ─────────────────────────────────────────────────────────────
export const getAllProUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    const proUsers = users
      .filter((user) => user.isPro === true)
      .map((user) => {
        const isActive = user.proExpiresAt ? user.proExpiresAt > now : true;
        const daysRemaining = user.proExpiresAt
          ? Math.max(0, Math.ceil((user.proExpiresAt - now) / (24 * 60 * 60 * 1000)))
          : null;

        return {
          _id: user._id,
          name: user.name || "Unknown",
          email: user.email || "",
          clerkId: user.clerkId,
          isPro: user.isPro,
          proExpiresAt: user.proExpiresAt || null,
          isActive,
          daysRemaining,
          xp: user.xp || 0,
          level: user.level || 1,
          createdAt: user.createdAt,
        };
      })
      .sort((a, b) => {
        // Sort by active status first, then by expiration date
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return (b.proExpiresAt || 0) - (a.proExpiresAt || 0);
      });

    return proUsers;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get All Code Redemptions
// ─────────────────────────────────────────────────────────────
export const getAllRedemptions = query({
  args: {},
  handler: async (ctx) => {
    const redemptions = await ctx.db
      .query("codeRedemptions")
      .order("desc")
      .take(100);

    // Get user details for each redemption
    const redemptionsWithUsers = await Promise.all(
      redemptions.map(async (redemption) => {
        const user = await ctx.db.get(redemption.userId);
        return {
          ...redemption,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "",
        };
      })
    );

    return redemptionsWithUsers;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Extend User Subscription
// ─────────────────────────────────────────────────────────────
export const extendUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const currentExpiry = user.proExpiresAt && user.proExpiresAt > now ? user.proExpiresAt : now;
    const newExpiry = currentExpiry + args.days * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.userId, {
      isPro: true,
      proExpiresAt: newExpiry,
    });

    return {
      success: true,
      newExpiry,
      daysAdded: args.days,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Revoke User Subscription
// ─────────────────────────────────────────────────────────────
export const revokeUserSubscription = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      isPro: false,
      proExpiresAt: Date.now(),
    });

    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get Subscription Stats
// ─────────────────────────────────────────────────────────────
export const getSubscriptionStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    let activePro = 0;
    let expiredPro = 0;
    let freeUsers = 0;

    users.forEach((user) => {
      if (user.isPro === true) {
        const isActive = user.proExpiresAt ? user.proExpiresAt > now : true;
        if (isActive) {
          activePro++;
        } else {
          expiredPro++;
        }
      } else {
        freeUsers++;
      }
    });

    const totalRedemptions = await ctx.db
      .query("codeRedemptions")
      .collect()
      .then((r) => r.length);

    return {
      activePro,
      expiredPro,
      freeUsers,
      totalUsers: users.length,
      totalRedemptions,
    };
  },
});
