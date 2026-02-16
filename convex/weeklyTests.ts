import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


// ─── ADMIN: Get All Tests ───
export const getAllAdminTests = query({
    handler: async (ctx) => {
        return await ctx.db.query("weeklyTests").order("desc").collect();
    }
});

// ─── ADMIN: Create a new test ───
export const createTest = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    groups: v.array(v.string()), // ["junior", "intermediate", "senior"]
    liveAt: v.number(), // when test goes live
    expiresAt: v.number(), // when test expires
    duration: v.number(),
    totalMarks: v.number(),
    isPaid: v.boolean(), // true = pro users only, false = free
    syllabus: v.optional(v.array(v.string())),
    instructions: v.optional(v.string()),
    rewards: v.optional(v.array(
      v.object({
        rank: v.number(),
        title: v.string(),
        prize: v.string(),
        description: v.optional(v.string()),
      })
    )),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        marks: v.number(),
        explanation: v.string(),
        subject: v.optional(v.string()),
      })
    ),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const testId = await ctx.db.insert("weeklyTests", {
      title: args.title,
      description: args.description,
      groups: args.groups,
      liveAt: args.liveAt,
      expiresAt: args.expiresAt,
      duration: args.duration,
      totalMarks: args.totalMarks,
      isPaid: args.isPaid,
      syllabus: args.syllabus,
      instructions: args.instructions,
      rewards: args.rewards,
      questions: args.questions,
      isActive: true,
      isResultsPublished: false,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
    return testId;
  },
});

// ─── ADMIN: Update Test ───
export const updateTest = mutation({
  args: {
    testId: v.id("weeklyTests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    groups: v.optional(v.array(v.string())),
    liveAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    totalMarks: v.optional(v.number()),
    isPaid: v.optional(v.boolean()),
    syllabus: v.optional(v.array(v.string())),
    instructions: v.optional(v.string()),
    rewards: v.optional(v.array(
      v.object({
        rank: v.number(),
        title: v.string(),
        prize: v.string(),
        description: v.optional(v.string()),
      })
    )),
    questions: v.optional(v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        marks: v.number(),
        explanation: v.string(),
        subject: v.optional(v.string()),
      })
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { testId, ...updates } = args;
    
    const fieldsToUpdate: any = {};
    if (updates.title !== undefined) fieldsToUpdate.title = updates.title;
    if (updates.description !== undefined) fieldsToUpdate.description = updates.description;
    if (updates.groups !== undefined) fieldsToUpdate.groups = updates.groups;
    if (updates.liveAt !== undefined) fieldsToUpdate.liveAt = updates.liveAt;
    if (updates.expiresAt !== undefined) fieldsToUpdate.expiresAt = updates.expiresAt;
    if (updates.duration !== undefined) fieldsToUpdate.duration = updates.duration;
    if (updates.totalMarks !== undefined) fieldsToUpdate.totalMarks = updates.totalMarks;
    if (updates.isPaid !== undefined) fieldsToUpdate.isPaid = updates.isPaid;
    if (updates.syllabus !== undefined) fieldsToUpdate.syllabus = updates.syllabus;
    if (updates.instructions !== undefined) fieldsToUpdate.instructions = updates.instructions;
    if (updates.rewards !== undefined) fieldsToUpdate.rewards = updates.rewards;
    if (updates.questions !== undefined) fieldsToUpdate.questions = updates.questions;
    if (updates.isActive !== undefined) fieldsToUpdate.isActive = updates.isActive;

    await ctx.db.patch(testId, fieldsToUpdate);
  },
});


// ─── ADMIN: Publish Results ───
export const publishResults = mutation({
  args: { 
    testId: v.id("weeklyTests"),
  },
  handler: async (ctx, args) => {
    // Mark test results as published
    await ctx.db.patch(args.testId, { 
      isResultsPublished: true, 
      resultsAnnouncedAt: Date.now(),
      isActive: false 
    });
  },
});

// ─── ADMIN: Delete Test ───
export const deleteTest = mutation({
  args: { testId: v.id("weeklyTests") },
  handler: async (ctx, args) => {
    // Delete all results for this test
    const results = await ctx.db
      .query("weeklyTestResults")
      .filter(q => q.eq(q.field("testId"), args.testId))
      .collect();
    
    for (const result of results) {
      await ctx.db.delete(result._id);
    }
    
    // Delete winners
    const winners = await ctx.db
      .query("winners")
      .filter(q => q.eq(q.field("testId"), args.testId))
      .collect();
    
    for (const winner of winners) {
      await ctx.db.delete(winner._id);
    }
    
    await ctx.db.delete(args.testId);
  },
});

// ─── APP: Get Available Tests for User ───
// Returns tests that are:
// 1. Active
// 2. For user's group
// 3. Either free or user is pro (if paid)
export const getAvailableTests = query({
    args: { 
      userGroup: v.string(),
      isPro: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const allTests = await ctx.db
          .query("weeklyTests")
          .filter(q => q.eq(q.field("isActive"), true))
          .collect();

        // Filter tests for user's group and access level
        const availableTests = allTests.filter(test => {
          // Check if test is for user's group (support both old and new schema)
          const testGroups = test.groups || (test.group ? [test.group] : []);
          const isForUserGroup = testGroups.includes(args.userGroup);
          if (!isForUserGroup) return false;

          // Check access: free tests or pro user for paid tests
          const hasAccess = !test.isPaid || args.isPro;
          if (!hasAccess) return false;

          return true;
        });

        // Helper to get live/expires times (support both old and new schema)
        const getLiveAt = (t: any) => t.liveAt || t.availableAt || 0;
        const getExpiresAt = (t: any) => t.expiresAt || t.endsAt || 0;

        // Categorize by status
        const upcoming = availableTests
          .filter(t => getLiveAt(t) > now)
          .sort((a, b) => getLiveAt(a) - getLiveAt(b));

        const live = availableTests
          .filter(t => getLiveAt(t) <= now && getExpiresAt(t) > now)
          .sort((a, b) => getLiveAt(b) - getLiveAt(a));

        const expired = availableTests
          .filter(t => getExpiresAt(t) <= now)
          .sort((a, b) => getExpiresAt(b) - getExpiresAt(a));

        return { upcoming, live, expired };
    }
});

// ─── APP: Get Test Details ───
export const getTestDetails = query({
    args: { testId: v.id("weeklyTests") },
    handler: async (ctx, args) => {
        const test = await ctx.db.get(args.testId);
        if (!test) return null;

        // Don't return questions with correct answers to client
        // Only return question text and options
        const safeQuestions = test.questions.map(q => ({
          question: q.question,
          options: q.options,
          marks: q.marks,
          subject: q.subject,
        }));

        // Support both old and new schema fields
        const liveAt = test.liveAt || test.availableAt || 0;
        const expiresAt = test.expiresAt || test.endsAt || 0;
        const groups = test.groups || (test.group ? [test.group] : []);

        return { 
          ...test, 
          questions: safeQuestions,
          totalQuestions: test.questions.length,
          liveAt,
          expiresAt,
          groups,
        };
    }
});

// ─── APP: Get Test for Taking (includes correct answers for validation) ───
// Only available when test is live
export const getTestForTaking = query({
    args: { 
      testId: v.id("weeklyTests"),
      userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const test = await ctx.db.get(args.testId);
        if (!test) return null;

        const now = Date.now();
        
        // Support both old and new schema fields
        const liveAt = test.liveAt || test.availableAt || 0;
        const expiresAt = test.expiresAt || test.endsAt || 0;
        const testGroups = test.groups || (test.group ? [test.group] : []);
        
        // Check if test is live
        if (liveAt > now) {
          return { error: "Test not yet live", status: "upcoming" };
        }
        
        if (expiresAt <= now) {
          return { error: "Test has expired", status: "expired" };
        }

        // Check if user already submitted
        const existingResult = await ctx.db
          .query("weeklyTestResults")
          .withIndex("by_user_test", (q) =>
            q.eq("userId", args.userId).eq("testId", args.testId)
          )
          .first();

        if (existingResult) {
          return { error: "Already submitted", status: "submitted", resultId: existingResult._id };
        }

        // Get user to check access
        const user = await ctx.db.get(args.userId);
        if (!user) return { error: "User not found" };

        // Check group access
        if (!testGroups.includes(user.group)) {
          return { error: "Not authorized for this test", status: "unauthorized" };
        }

        // Check pro access for paid tests
        if (test.isPaid) {
          const isPro = user.isPro === true && 
            (user.proExpiresAt ? user.proExpiresAt > now : true);
          if (!isPro) {
            return { error: "Pro subscription required", status: "pro_required" };
          }
        }

        // Return full test with questions (but not correct answers)
        return {
          ...test,
          liveAt,
          expiresAt,
          groups: testGroups,
          status: "available",
          questions: test.questions.map(q => ({
            question: q.question,
            options: q.options,
            marks: q.marks,
            subject: q.subject,
          })),
        };
    }
});

// ─── Get specific test ───
export const getTest = query({
  args: { testId: v.id("weeklyTests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.testId);
  },
});

// ─── Get all results for a user ───
export const getMyTestResults = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ─── Check if user already took a test ───
export const getUserTestResult = query({
  args: { userId: v.id("users"), testId: v.id("weeklyTests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .first();
  },
});

// ─── Check pro status ───
export const checkProStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { isPro: false, expiresAt: null, isSuspended: false };

    const now = Date.now();
    const isPro =
      user.isPro === true &&
      (user.proExpiresAt ? user.proExpiresAt > now : true);

    return {
      isPro,
      expiresAt: user.proExpiresAt || null,
      isSuspended: user.isSuspended || false,
    };
  },
});

// ─── Activate Pro subscription ───
export const activatePro = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(args.userId, {
      isPro: true,
      proExpiresAt: Date.now() + thirtyDays,
    });

    return { success: true, expiresAt: Date.now() + thirtyDays };
  },
});

// ─── Submit test ───
export const submitTest = mutation({
  args: {
    userId: v.id("users"),
    testId: v.id("weeklyTests"),
    answers: v.array(v.number()),
    timeTaken: v.number(),
  },
  handler: async (ctx, args) => {
    // Prevent double submission
    const existing = await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .first();

    if (existing) {
      return { alreadySubmitted: true, resultId: existing._id };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.isSuspended) throw new Error("Account suspended");

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    const now = Date.now();
    
    // Support both old and new schema fields
    const liveAt = test.liveAt || test.availableAt || 0;
    const expiresAt = test.expiresAt || test.endsAt || 0;
    const testGroups = test.groups || (test.group ? [test.group] : []);
    
    // Validate test is still live
    if (liveAt > now) throw new Error("Test not yet live");
    if (expiresAt <= now) throw new Error("Test has expired");

    // Check group access
    if (!testGroups.includes(user.group)) {
      throw new Error("Not authorized for this test");
    }

    // Check pro access for paid tests
    if (test.isPaid) {
      const isPro = user.isPro === true && 
        (user.proExpiresAt ? user.proExpiresAt > now : true);
      if (!isPro) throw new Error("Pro subscription required");
    }

    // Calculate score
    let score = 0;
    for (let i = 0; i < test.questions.length; i++) {
      if (args.answers[i] === test.questions[i].correctIndex) {
        score += test.questions[i].marks;
      }
    }

    const percentage = Math.round((score / test.totalMarks) * 100);
    const xpEarned = Math.round(percentage * 0.5);

    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const resultId = await ctx.db.insert("weeklyTestResults", {
      userId: args.userId,
      testId: args.testId,
      score,
      totalMarks: test.totalMarks,
      percentage,
      answers: args.answers,
      timeTaken: args.timeTaken,
      xpEarned,
      month,
      completedAt: now,
    });

    // Update user XP
    const newXp = (user.xp || 0) + xpEarned;
    const newLevel = Math.floor(newXp / 100) + 1;
    await ctx.db.patch(args.userId, { xp: newXp, level: newLevel });

    // Return result WITHOUT detailed score - just confirmation
    return { 
      alreadySubmitted: false, 
      resultId, 
      submitted: true,
      message: "Test submitted successfully. Results will be announced after the test ends.",
    };
  },
});

// ─── Get test result (only if results are published) ───
export const getTestResult = query({
  args: { 
    userId: v.id("users"),
    testId: v.id("weeklyTests"),
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return null;

    const result = await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .first();

    if (!result) return null;

    // If results not published, only return submission confirmation
    if (!test.isResultsPublished) {
      return {
        submitted: true,
        resultsPublished: false,
        message: "Results will be available once announced.",
        submittedAt: result.completedAt,
      };
    }

    // Results are published - return full result
    return {
      submitted: true,
      resultsPublished: true,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      timeTaken: result.timeTaken,
      xpEarned: result.xpEarned,
      completedAt: result.completedAt,
    };
  },
});

// ─── Get test leaderboard (only after results published) ───
export const getTestLeaderboard = query({
  args: { testId: v.id("weeklyTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return null;
    
    // Only show leaderboard if results are published
    if (!test.isResultsPublished) {
      return { resultsPublished: false, leaderboard: [] };
    }

    const results = await ctx.db
      .query("weeklyTestResults")
      .filter(q => q.eq(q.field("testId"), args.testId))
      .collect();

    const sorted = results.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.timeTaken - b.timeTaken;
    });
    const top20 = sorted.slice(0, 20);

    // Get all users for enrichment
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id as string, u]));

    const enriched = top20.map((r, index) => {
      const user = userMap.get(r.userId as string);
      return {
        rank: index + 1,
        userId: r.userId,
        userName: user?.name || "Unknown",
        userClass: user?.class || 0,
        score: r.score,
        totalMarks: r.totalMarks,
        percentage: r.percentage,
        timeTaken: r.timeTaken,
      };
    });

    return { resultsPublished: true, leaderboard: enriched };
  },
});

// ─── Get winners for a test (after results published) ───
export const getTestWinners = query({
  args: { testId: v.id("weeklyTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test || !test.isResultsPublished) return [];

    const winners = await ctx.db
      .query("winners")
      .filter(q => q.eq(q.field("testId"), args.testId))
      .collect();

    return winners.sort((a, b) => {
      // Sort by prize emoji: 🥇, 🥈, 🥉
      const order: Record<string, number> = { "🥇": 1, "🥈": 2, "🥉": 3 };
      return (order[a.prizeEmoji] || 99) - (order[b.prizeEmoji] || 99);
    });
  },
});

// ─── ADMIN: Set winners after results announced ───
export const setTestWinners = mutation({
  args: {
    testId: v.id("weeklyTests"),
    winners: v.array(v.object({
      userId: v.id("users"),
      rank: v.number(),
      prize: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Create winner entries
    for (const w of args.winners) {
      const user = await ctx.db.get(w.userId);
      if (user) {
        await ctx.db.insert("winners", {
          testId: args.testId,
          userId: w.userId,
          userName: user.name,
          userImageUrl: user.imageUrl,
          prize: w.prize,
          prizeEmoji: w.rank === 1 ? "🥇" : w.rank === 2 ? "🥈" : "🥉",
          week: `Test-${args.testId}`,
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// ─── Monthly leaderboard ───
export const getMonthlyLeaderboard = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const d = new Date();
    const currentMonth =
      args.month ||
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const results = await ctx.db
      .query("weeklyTestResults")
      .withIndex("by_month")
      .collect();

    const monthResults = results.filter((r) => r.month === currentMonth);

    // Aggregate per user
    const userScores: Record<
      string,
      {
        totalScore: number;
        totalMarks: number;
        testsTaken: number;
        avgPercentage: number;
        bestPercentage: number;
        userId: any;
      }
    > = {};

    for (const r of monthResults) {
      const uid = r.userId as string;
      if (!userScores[uid]) {
        userScores[uid] = {
          totalScore: 0,
          totalMarks: 0,
          testsTaken: 0,
          avgPercentage: 0,
          bestPercentage: 0,
          userId: r.userId,
        };
      }
      userScores[uid].totalScore += r.score;
      userScores[uid].totalMarks += r.totalMarks;
      userScores[uid].testsTaken += 1;
      userScores[uid].bestPercentage = Math.max(
        userScores[uid].bestPercentage,
        r.percentage
      );
    }

    // Calculate averages and sort
    const leaderboard = Object.values(userScores)
      .map((u) => ({
        ...u,
        avgPercentage: Math.round((u.totalScore / u.totalMarks) * 100),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    // Enrich with user data
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id as string, u]));

    return leaderboard.slice(0, 50).map((entry, index) => {
      const user = userMap.get(entry.userId as string);
      return {
        rank: index + 1,
        ...entry,
        userName: user?.name || "Unknown",
        userClass: user?.class || 0,
        userImageUrl: user?.imageUrl,
      };
    });
  },
});

// ─── Get tests by status (for backward compatibility) ───
export const getTestsByStatus = query({
    args: { group: v.string(), status: v.string() },
    handler: async (ctx, args) => {
        const now = Date.now();
        const allTests = await ctx.db
            .query("weeklyTests")
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();

        // Helper functions for backward compatibility
        const getGroups = (t: any) => t.groups || (t.group ? [t.group] : []);
        const getLiveAt = (t: any) => t.liveAt || t.availableAt || 0;
        const getExpiresAt = (t: any) => t.expiresAt || t.endsAt || 0;

        // Filter by group
        const groupTests = allTests.filter(t => getGroups(t).includes(args.group));

        if (args.status === 'upcoming') {
            return groupTests.filter(t => getLiveAt(t) > now).sort((a, b) => getLiveAt(a) - getLiveAt(b));
        }
        
        if (args.status === 'live') {
            return groupTests.filter(t => getLiveAt(t) <= now && getExpiresAt(t) > now);
        }

        if (args.status === 'past') {
            return groupTests.filter(t => getExpiresAt(t) <= now || t.isResultsPublished).sort((a, b) => getExpiresAt(b) - getExpiresAt(a));
        }

        return [];
    }
});

// ─── Get active test (legacy support) ───
export const getActiveTest = query({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tests = await ctx.db
      .query("weeklyTests")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
    
    // Helper functions for backward compatibility
    const getGroups = (t: any) => t.groups || (t.group ? [t.group] : []);
    const getLiveAt = (t: any) => t.liveAt || t.availableAt || 0;
    const getExpiresAt = (t: any) => t.expiresAt || t.endsAt || 0;

    const groupTests = tests.filter(t => 
      getGroups(t).includes(args.group) && 
      getLiveAt(t) <= now && 
      getExpiresAt(t) > now
    );
    
    return groupTests.sort((a, b) => getLiveAt(b) - getLiveAt(a))[0] || null;
  },
});

// ─── Get test schedule info (legacy support) ───
export const getTestSchedule = query({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const tests = await ctx.db
      .query("weeklyTests")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Helper functions for backward compatibility
    const getGroups = (t: any) => t.groups || (t.group ? [t.group] : []);
    const getLiveAt = (t: any) => t.liveAt || t.availableAt || 0;
    const getExpiresAt = (t: any) => t.expiresAt || t.endsAt || 0;

    const groupTests = tests.filter(t => getGroups(t).includes(args.group));
    const latestTest = groupTests.sort((a, b) => getLiveAt(b) - getLiveAt(a))[0];

    const defaultSyllabus = ["Current Affairs", "Maths", "English", "GK", "Miscellaneous"];

    if (!latestTest) {
      return {
        isAvailable: false,
        nextTestAt: null,
        currentTest: null,
        syllabus: defaultSyllabus,
        rewards: [],
      };
    }

    const liveAt = getLiveAt(latestTest);
    const expiresAt = getExpiresAt(latestTest);
    const isAvailable = now >= liveAt && now <= expiresAt;

    return {
      isAvailable,
      nextTestAt: isAvailable ? expiresAt : liveAt,
      currentTest: isAvailable ? latestTest : null,
      testId: latestTest._id,
      syllabus: latestTest.syllabus || defaultSyllabus,
      rewards: latestTest.rewards || [],
      title: latestTest.title,
      description: latestTest.description,
      isPaid: latestTest.isPaid,
    };
  },
});
