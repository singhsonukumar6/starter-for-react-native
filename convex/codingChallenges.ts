import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ────────────────── Queries ──────────────────

// Get all challenge categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("challengeCategories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

// Get all challenges (with filters)
export const getChallenges = query({
  args: {
    categoryId: v.optional(v.id("challengeCategories")),
    difficulty: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    group: v.optional(v.string()), // "junior", "intermediate", "senior"
  },
  handler: async (ctx, args) => {
    let challenges = await ctx.db
      .query("codingChallenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by user group (challenge must include this group)
    if (args.group) {
      challenges = challenges.filter((c) => c.groups?.includes(args.group!));
    }

    // Filter by category
    if (args.categoryId) {
      challenges = challenges.filter((c) => c.categoryId === args.categoryId);
    }

    // Filter by difficulty
    if (args.difficulty) {
      challenges = challenges.filter((c) => c.difficulty === args.difficulty);
    }

    // Filter by search query
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      challenges = challenges.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by order
    challenges.sort((a, b) => a.order - b.order);

    return challenges;
  },
});

// Get challenge by ID
export const getChallengeById = query({
  args: { id: v.id("codingChallenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge) return null;

    // Get category info
    let category = null;
    if (challenge.categoryId) {
      category = await ctx.db.get(challenge.categoryId);
    }

    return {
      ...challenge,
      category,
    };
  },
});

// Get challenge by slug
export const getChallengeBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const challenge = await ctx.db
      .query("codingChallenges")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!challenge) return null;

    // Get category info
    let category = null;
    if (challenge.categoryId) {
      category = await ctx.db.get(challenge.categoryId);
    }

    return {
      ...challenge,
      category,
    };
  },
});

// Get test cases for a challenge (only non-hidden for user view)
export const getTestCases = query({
  args: {
    challengeId: v.id("codingChallenges"),
    includeHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const testCases = await ctx.db
      .query("challengeTestCases")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId)
      )
      .collect();

    // Filter out hidden test cases unless explicitly requested
    if (!args.includeHidden) {
      return testCases.filter((tc) => !tc.isHidden);
    }

    return testCases.sort((a, b) => a.order - b.order);
  },
});

// Get user's progress on challenges
export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return progress;
  },
});

// Get user's progress for a specific challenge
export const getUserChallengeProgress = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("codingChallenges") 
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();

    return progress;
  },
});

// Get user's submissions for a challenge
export const getUserSubmissions = query({
  args: {
    userId: v.id("users"),
    challengeId: v.id("codingChallenges"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .order("desc")
      .collect();

    if (args.limit) {
      submissions = submissions.slice(0, args.limit);
    }

    return submissions;
  },
});

// Get challenge leaderboard
export const getLeaderboard = query({
  args: {
    period: v.optional(v.string()), // "all-time", "weekly-YYYY-WXX", "monthly-YYYY-MM"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "all-time";
    const limit = args.limit || 50;

    const leaderboard = await ctx.db
      .query("challengeLeaderboard")
      .withIndex("by_period_points", (q) => q.eq("period", period))
      .order("desc")
      .take(limit);

    // Add rank
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },
});

// Get user's rank on leaderboard
export const getUserRank = query({
  args: {
    userId: v.id("users"),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "all-time";

    const entry = await ctx.db
      .query("challengeLeaderboard")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("period", period)
      )
      .first();

    return entry;
  },
});

// Get user's challenge stats
export const getUserStats = query({
  args: { 
    userId: v.id("users"),
    group: v.optional(v.string()), // Filter by user group
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const solved = progress.filter((p) => p.solved);

    // Get all challenges to count by difficulty (filtered by group if provided)
    let allChallenges = await ctx.db
      .query("codingChallenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by user group if provided
    if (args.group) {
      allChallenges = allChallenges.filter((c) => c.groups?.includes(args.group!));
    }

    const easyTotal = allChallenges.filter((c) => c.difficulty === "easy").length;
    const mediumTotal = allChallenges.filter((c) => c.difficulty === "medium").length;
    const hardTotal = allChallenges.filter((c) => c.difficulty === "hard").length;

    // Get solved challenge details
    const solvedChallengeIds = solved.map((p) => p.challengeId);
    const solvedChallenges = await Promise.all(
      solvedChallengeIds.map((id) => ctx.db.get(id))
    );

    // Filter solved challenges by group if provided
    let filteredSolvedChallenges = solvedChallenges.filter((c) => c !== null);
    if (args.group) {
      filteredSolvedChallenges = filteredSolvedChallenges.filter(
        (c) => c.groups?.includes(args.group!)
      );
    }

    const easySolved = filteredSolvedChallenges.filter(
      (c) => c?.difficulty === "easy"
    ).length;
    const mediumSolved = filteredSolvedChallenges.filter(
      (c) => c?.difficulty === "medium"
    ).length;
    const hardSolved = filteredSolvedChallenges.filter(
      (c) => c?.difficulty === "hard"
    ).length;

    // Get leaderboard entry
    const leaderboardEntry = await ctx.db
      .query("challengeLeaderboard")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("period", "all-time")
      )
      .first();

    return {
      totalSolved: filteredSolvedChallenges.length,
      totalAttempts: progress.length,
      totalPoints: leaderboardEntry?.totalPoints || 0,
      easySolved,
      mediumSolved,
      hardSolved,
      easyTotal,
      mediumTotal,
      hardTotal,
      rank: leaderboardEntry?.rank,
    };
  },
});

// ────────────────── Mutations ──────────────────

// Submit a solution
export const submitSolution = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("codingChallenges"),
    language: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Get challenge
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Get all test cases
    const testCases = await ctx.db
      .query("challengeTestCases")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId)
      )
      .collect();

    // Create pending submission
    const submissionId = await ctx.db.insert("challengeSubmissions", {
      userId: args.userId,
      challengeId: args.challengeId,
      language: args.language,
      code: args.code,
      status: "pending",
      totalTestCases: testCases.length,
      passedTestCases: 0,
      pointsEarned: 0,
      xpEarned: 0,
      submittedAt: Date.now(),
    });

    // Update user progress (increment attempts)
    const existingProgress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .first();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        attempts: existingProgress.attempts + 1,
        lastAttemptAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userChallengeProgress", {
        userId: args.userId,
        challengeId: args.challengeId,
        solved: false,
        attempts: 1,
        lastAttemptAt: Date.now(),
      });
    }

    return {
      submissionId,
      testCases: testCases.map((tc) => ({
        id: tc._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      })),
      challenge,
    };
  },
});

// Update submission with results (called after code execution)
export const updateSubmissionResults = mutation({
  args: {
    submissionId: v.id("challengeSubmissions"),
    status: v.string(),
    testResults: v.array(
      v.object({
        testCaseId: v.optional(v.id("challengeTestCases")),
        input: v.string(),
        expectedOutput: v.string(),
        actualOutput: v.optional(v.string()),
        passed: v.boolean(),
        timeTaken: v.optional(v.number()),
        memoryUsed: v.optional(v.number()),
        error: v.optional(v.string()),
      })
    ),
    executionTime: v.optional(v.number()),
    memoryUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const passedCount = args.testResults.filter((r) => r.passed).length;
    const allPassed = passedCount === args.testResults.length;

    // Get challenge for points
    const challenge = await ctx.db.get(submission.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Calculate points (only if all tests passed)
    const pointsEarned = allPassed ? challenge.points : 0;
    const xpEarned = allPassed ? Math.floor(challenge.points * 1.5) : 0; // XP bonus

    // Update submission
    await ctx.db.patch(args.submissionId, {
      status: args.status,
      testResults: args.testResults,
      passedTestCases: passedCount,
      executionTime: args.executionTime,
      memoryUsed: args.memoryUsed,
      pointsEarned,
      xpEarned,
      completedAt: Date.now(),
    });

    // If solved, update user progress and leaderboard
    if (allPassed) {
      const progress = await ctx.db
        .query("userChallengeProgress")
        .withIndex("by_user_challenge", (q) =>
          q.eq("userId", submission.userId).eq("challengeId", submission.challengeId)
        )
        .first();

      if (progress && !progress.solved) {
        await ctx.db.patch(progress._id, {
          solved: true,
          solvedAt: Date.now(),
          bestSubmissionId: args.submissionId,
        });

        // Update user XP
        const user = await ctx.db.get(submission.userId);
        if (user) {
          await ctx.db.patch(submission.userId, {
            xp: (user.xp || 0) + xpEarned,
          });
        }

        // Update leaderboard
        await updateLeaderboard(ctx, submission.userId, challenge.difficulty, pointsEarned);
      }

      // Update challenge stats
      await ctx.db.patch(challenge._id, {
        successfulSubmissions: (challenge.successfulSubmissions || 0) + 1,
        acceptanceRate: ((challenge.successfulSubmissions || 0) + 1) / 
                        ((challenge.totalSubmissions || 0) + 1) * 100,
      });
    }

    // Update challenge total submissions
    await ctx.db.patch(challenge._id, {
      totalSubmissions: (challenge.totalSubmissions || 0) + 1,
    });

    return {
      success: allPassed,
      passedCount,
      totalCount: args.testResults.length,
      pointsEarned,
      xpEarned,
    };
  },
});

// Helper function to update leaderboard
async function updateLeaderboard(
  ctx: any,
  userId: string,
  difficulty: string,
  points: number
) {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const periods = ["all-time", getCurrentWeek(), getCurrentMonth()];

  for (const period of periods) {
    const existing = await ctx.db
      .query("challengeLeaderboard")
      .withIndex("by_user_period", (q: any) =>
        q.eq("userId", userId).eq("period", period)
      )
      .first();

    if (existing) {
      const updates: any = {
        totalPoints: existing.totalPoints + points,
        totalSolved: existing.totalSolved + 1,
        updatedAt: Date.now(),
      };

      if (difficulty === "easy") updates.easySolved = existing.easySolved + 1;
      if (difficulty === "medium") updates.mediumSolved = existing.mediumSolved + 1;
      if (difficulty === "hard") updates.hardSolved = existing.hardSolved + 1;

      await ctx.db.patch(existing._id, updates);
    } else {
      const entry = {
        userId,
        userName: user.name,
        userImageUrl: user.imageUrl,
        totalSolved: 1,
        totalPoints: points,
        easySolved: difficulty === "easy" ? 1 : 0,
        mediumSolved: difficulty === "medium" ? 1 : 0,
        hardSolved: difficulty === "hard" ? 1 : 0,
        period,
        updatedAt: Date.now(),
      };

      await ctx.db.insert("challengeLeaderboard", entry);
    }
  }
}

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  const weekNum = Math.ceil(diff / oneWeek);
  return `weekly-${now.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `monthly-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
}

// Save code draft
export const saveDraft = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("codingChallenges"),
    language: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, we'll just return success
    // In a full implementation, you'd store drafts in a separate table
    return { success: true };
  },
});

// ────────────────── Discussions ──────────────────

// Get discussions for a challenge
export const getDiscussions = query({
  args: {
    challengeId: v.id("codingChallenges"),
  },
  handler: async (ctx, args) => {
    const discussions = await ctx.db
      .query("challengeDiscussions")
      .withIndex("by_challenge_created", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .collect();

    // Separate top-level posts and replies
    const posts = discussions.filter((d) => !d.parentId);
    const replies = discussions.filter((d) => d.parentId);

    // Attach replies to their parent posts
    return posts.map((post) => ({
      ...post,
      replies: replies
        .filter((r) => r.parentId === post._id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));
  },
});

// Create a discussion post
export const createDiscussion = mutation({
  args: {
    challengeId: v.id("codingChallenges"),
    userId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("challengeDiscussions")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("challengeDiscussions", {
      challengeId: args.challengeId,
      userId: args.userId,
      userName: user.name,
      userImageUrl: user.imageUrl,
      content: args.content,
      parentId: args.parentId,
      likes: 0,
      likedBy: [],
      isEdited: false,
      createdAt: Date.now(),
    });
  },
});

// Like/unlike a discussion
export const toggleDiscussionLike = mutation({
  args: {
    discussionId: v.id("challengeDiscussions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const discussion = await ctx.db.get(args.discussionId);
    if (!discussion) throw new Error("Discussion not found");

    const likedBy = discussion.likedBy || [];
    const hasLiked = likedBy.includes(args.userId);

    if (hasLiked) {
      await ctx.db.patch(args.discussionId, {
        likes: (discussion.likes || 1) - 1,
        likedBy: likedBy.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.discussionId, {
        likes: (discussion.likes || 0) + 1,
        likedBy: [...likedBy, args.userId],
      });
    }

    return { liked: !hasLiked };
  },
});

// Delete a discussion (only by author)
export const deleteDiscussion = mutation({
  args: {
    discussionId: v.id("challengeDiscussions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const discussion = await ctx.db.get(args.discussionId);
    if (!discussion) throw new Error("Discussion not found");

    if (discussion.userId !== args.userId) {
      throw new Error("Not authorized to delete this discussion");
    }

    // Delete replies first
    const replies = await ctx.db
      .query("challengeDiscussions")
      .withIndex("by_parent", (q) => q.eq("parentId", args.discussionId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.discussionId);
    return { success: true };
  },
});

// ────────────────── Submissions ──────────────────

// Get public submissions for a challenge (only from users who solved it)
export const getPublicSubmissions = query({
  args: {
    challengeId: v.id("codingChallenges"),
    language: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .order("desc")
      .take(limit * 2); // Get more to filter by language

    // Filter by language if specified
    if (args.language) {
      submissions = submissions.filter((s) => s.language === args.language);
    }

    // Get user info for each submission
    const submissionsWithUser = await Promise.all(
      submissions.slice(0, limit).map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        return {
          _id: submission._id,
          language: submission.language,
          status: submission.status,
          executionTime: submission.executionTime,
          memoryUsed: submission.memoryUsed,
          submittedAt: submission.submittedAt,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return submissionsWithUser;
  },
});

// Get submission code (only if user has solved the challenge)
export const getSubmissionCode = query({
  args: {
    submissionId: v.id("challengeSubmissions"),
    userId: v.id("users"), // Requesting user
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    // Check if requesting user has solved this challenge
    const userProgress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", submission.challengeId)
      )
      .first();

    if (!userProgress?.solved) {
      return { locked: true, message: "Solve the challenge to view solutions" };
    }

    // Return the code
    return {
      locked: false,
      code: submission.code,
      language: submission.language,
      user: await ctx.db.get(submission.userId),
    };
  },
});
