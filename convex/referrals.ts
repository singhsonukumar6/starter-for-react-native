/**
 * Referral System
 * - Each user gets a unique referral code
 * - Referrer earns 100 XP when someone signs up with their code
 * - Referrer earns 1000 XP when referred user becomes PRO
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────
// Generate unique referral code for user
// ─────────────────────────────────────────────────────────────
function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomPart}`;
}

// ─────────────────────────────────────────────────────────────
// Get or create referral code for current user
// ─────────────────────────────────────────────────────────────
export const getMyReferralCode = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    return {
      code: user.referralCode || null,
      userId: user._id,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// Generate referral code if not exists
// ─────────────────────────────────────────────────────────────
export const generateMyReferralCode = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.referralCode) {
      return { code: user.referralCode };
    }

    // Generate unique code
    let code = generateReferralCode(user.name);
    let attempts = 0;

    while (attempts < 10) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
        .first();

      if (!existing) break;

      code = generateReferralCode(user.name);
      attempts++;
    }

    await ctx.db.patch(user._id, {
      referralCode: code,
    });

    return { code };
  },
});

// ─────────────────────────────────────────────────────────────
// Apply referral code (called during signup or later)
// ─────────────────────────────────────────────────────────────
export const applyReferralCode = mutation({
  args: {
    clerkId: v.string(), // The new user applying the code
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has a referrer
    if (user.referredBy) {
      throw new Error("You have already used a referral code");
    }

    // Find referrer by code
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode.toUpperCase()))
      .first();

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    // Can't refer yourself
    if (referrer._id === user._id) {
      throw new Error("You cannot use your own referral code");
    }

    // Update the new user with referrer info
    await ctx.db.patch(user._id, {
      referredBy: referrer._id,
      referralXpClaimed: true, // Mark that referrer should get XP
    });

    // Award referrer 100 XP for signup
    await ctx.db.patch(referrer._id, {
      xp: (referrer.xp || 0) + 100,
    });

    // Create referral record
    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referredUserId: user._id,
      signupXpAwarded: true,
      proXpAwarded: false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      referrerName: referrer.name,
      xpAwarded: 100,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// Get my referral stats
// ─────────────────────────────────────────────────────────────
export const getMyReferralStats = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { totalReferrals: 0, proReferrals: 0, totalXpEarned: 0 };
    }

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", user._id))
      .collect();

    const totalReferrals = referrals.length;
    const proReferrals = referrals.filter((r) => r.proXpAwarded).length;
    const totalXpEarned = totalReferrals * 100 + proReferrals * 1000;

    return {
      totalReferrals,
      proReferrals,
      totalXpEarned,
      referrals,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// Get who referred me
// ─────────────────────────────────────────────────────────────
export const getMyReferrer = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user || !user.referredBy) {
      return null;
    }

    const referrer = await ctx.db.get(user.referredBy);
    if (!referrer) return null;

    return {
      name: referrer.name,
      imageUrl: referrer.imageUrl,
    };
  },
});
