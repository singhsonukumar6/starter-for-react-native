import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── ADMIN: Get All Contests ───
export const getAllContests = query({
  handler: async (ctx) => {
    return await ctx.db.query("contests").order("desc").collect();
  },
});

// ─── ADMIN: Create Contest ───
export const createContest = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    contestType: v.string(), // "coding" | "english_speech" | "english_essay" | "custom"
    groups: v.array(v.string()), // ["junior", "intermediate", "senior"]
    liveAt: v.number(), // when contest goes live
    expiresAt: v.number(), // when contest expires
    submissionDeadline: v.number(),
    isPaid: v.boolean(), // true = pro users only, false = free
    maxPoints: v.number(),
    evaluationCriteria: v.optional(v.array(v.string())),
    instructions: v.optional(v.string()),
    requirements: v.optional(v.string()),
    // Custom form fields for participation
    formFields: v.optional(v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.string(), // "text" | "textarea" | "url" | "file" | "select" | "number"
        placeholder: v.optional(v.string()),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        maxLength: v.optional(v.number()),
        helpText: v.optional(v.string()),
      })
    )),
    rewards: v.optional(v.array(
      v.object({
        rank: v.number(),
        title: v.string(),
        prize: v.string(),
        description: v.optional(v.string()),
      })
    )),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let status = "upcoming";
    if (now >= args.liveAt && now <= args.expiresAt) {
      status = "live";
    } else if (now > args.expiresAt) {
      status = "evaluation";
    }

    const contestId = await ctx.db.insert("contests", {
      title: args.title,
      description: args.description,
      contestType: args.contestType,
      groups: args.groups,
      liveAt: args.liveAt,
      expiresAt: args.expiresAt,
      submissionDeadline: args.submissionDeadline,
      isPaid: args.isPaid,
      maxPoints: args.maxPoints,
      evaluationCriteria: args.evaluationCriteria,
      instructions: args.instructions,
      requirements: args.requirements,
      formFields: args.formFields,
      rewards: args.rewards,
      status,
      isResultsPublished: false,
      createdBy: args.createdBy,
      createdAt: now,
    });
    return contestId;
  },
});

// ─── ADMIN: Update Contest ───
export const updateContest = mutation({
  args: {
    contestId: v.id("contests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    contestType: v.optional(v.string()),
    groups: v.optional(v.array(v.string())),
    liveAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    submissionDeadline: v.optional(v.number()),
    isPaid: v.optional(v.boolean()),
    maxPoints: v.optional(v.number()),
    evaluationCriteria: v.optional(v.array(v.string())),
    instructions: v.optional(v.string()),
    requirements: v.optional(v.string()),
    formFields: v.optional(v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.string(),
        placeholder: v.optional(v.string()),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        maxLength: v.optional(v.number()),
        helpText: v.optional(v.string()),
      })
    )),
    rewards: v.optional(v.array(
      v.object({
        rank: v.number(),
        title: v.string(),
        prize: v.string(),
        description: v.optional(v.string()),
      })
    )),
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { contestId, ...updates } = args;
    const fieldsToUpdate: any = {};
    
    if (updates.title !== undefined) fieldsToUpdate.title = updates.title;
    if (updates.description !== undefined) fieldsToUpdate.description = updates.description;
    if (updates.contestType !== undefined) fieldsToUpdate.contestType = updates.contestType;
    if (updates.groups !== undefined) fieldsToUpdate.groups = updates.groups;
    if (updates.liveAt !== undefined) fieldsToUpdate.liveAt = updates.liveAt;
    if (updates.expiresAt !== undefined) fieldsToUpdate.expiresAt = updates.expiresAt;
    if (updates.submissionDeadline !== undefined) fieldsToUpdate.submissionDeadline = updates.submissionDeadline;
    if (updates.isPaid !== undefined) fieldsToUpdate.isPaid = updates.isPaid;
    if (updates.maxPoints !== undefined) fieldsToUpdate.maxPoints = updates.maxPoints;
    if (updates.evaluationCriteria !== undefined) fieldsToUpdate.evaluationCriteria = updates.evaluationCriteria;
    if (updates.instructions !== undefined) fieldsToUpdate.instructions = updates.instructions;
    if (updates.requirements !== undefined) fieldsToUpdate.requirements = updates.requirements;
    if (updates.formFields !== undefined) fieldsToUpdate.formFields = updates.formFields;
    if (updates.rewards !== undefined) fieldsToUpdate.rewards = updates.rewards;
    if (updates.status !== undefined) fieldsToUpdate.status = updates.status;

    await ctx.db.patch(contestId, fieldsToUpdate);
  },
});

// ─── ADMIN: Delete Contest ───
export const deleteContest = mutation({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    // Delete all submissions for this contest
    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();
    
    for (const sub of submissions) {
      await ctx.db.delete(sub._id);
    }
    
    await ctx.db.delete(args.contestId);
  },
});

// ─── ADMIN: Publish Results ───
export const publishContestResults = mutation({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contestId, {
      isResultsPublished: true,
      resultsAnnouncedAt: Date.now(),
      status: "completed",
    });
  },
});

// ─── APP: Get Available Contests for User ───
export const getAvailableContests = query({
  args: {
    userGroup: v.string(),
    isPro: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const allContests = await ctx.db.query("contests").collect();

    // Helper functions for backward compatibility
    const getGroups = (c: any) => c.groups || (c.group ? [c.group] : []);
    const getLiveAt = (c: any) => c.liveAt || c.startDate || 0;
    const getExpiresAt = (c: any) => c.expiresAt || c.endDate || 0;

    // Filter contests for user's group and access level
    const availableContests = allContests.filter(contest => {
      // Check if contest is for user's group
      const isForUserGroup = getGroups(contest).includes(args.userGroup);
      if (!isForUserGroup) return false;

      // Check access: free contests or pro user for paid contests
      const hasAccess = !contest.isPaid || args.isPro;
      if (!hasAccess) return false;

      return true;
    });

    // Categorize by status
    const upcoming = availableContests
      .filter(c => getLiveAt(c) > now)
      .sort((a, b) => getLiveAt(a) - getLiveAt(b));

    const live = availableContests
      .filter(c => getLiveAt(c) <= now && getExpiresAt(c) > now)
      .sort((a, b) => getLiveAt(b) - getLiveAt(a));

    const evaluation = availableContests
      .filter(c => getExpiresAt(c) <= now && !c.isResultsPublished)
      .sort((a, b) => getExpiresAt(b) - getExpiresAt(a));

    const completed = availableContests
      .filter(c => c.isResultsPublished)
      .sort((a, b) => (b.resultsAnnouncedAt || 0) - (a.resultsAnnouncedAt || 0));

    return { upcoming, live, evaluation, completed };
  },
});

// ─── Get Contests by Status (legacy support) ───
export const getContestsByStatus = query({
  args: { 
    status: v.optional(v.string()),
    group: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let contests = await ctx.db.query("contests").collect();

    // Helper functions for backward compatibility
    const getGroups = (c: any) => c.groups || (c.group ? [c.group] : []);
    const getLiveAt = (c: any) => c.liveAt || c.startDate || 0;
    const getExpiresAt = (c: any) => c.expiresAt || c.endDate || 0;

    // Filter by group if provided
    if (args.group && args.group !== "all") {
      contests = contests.filter(c => getGroups(c).includes(args.group!));
    }

    // Update status based on current time
    if (args.status === "upcoming") {
      return contests.filter(c => getLiveAt(c) > now).sort((a, b) => getLiveAt(a) - getLiveAt(b));
    }
    if (args.status === "live") {
      return contests.filter(c => getLiveAt(c) <= now && getExpiresAt(c) > now).sort((a, b) => getLiveAt(b) - getLiveAt(a));
    }
    if (args.status === "completed") {
      return contests.filter(c => c.isResultsPublished).sort((a, b) => (b.resultsAnnouncedAt || getExpiresAt(b)) - (a.resultsAnnouncedAt || getExpiresAt(a)));
    }
    if (args.status === "evaluation") {
      return contests.filter(c => getExpiresAt(c) <= now && !c.isResultsPublished).sort((a, b) => getExpiresAt(b) - getExpiresAt(a));
    }

    // Return all sorted by date
    return contests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── Get Contest Details ───
export const getContestDetails = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    if (!contest) return null;

    // Get submissions count
    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();

    return {
      ...contest,
      submissionsCount: submissions.length,
    };
  },
});

// ─── Get Single Contest ───
export const getContest = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contestId);
  },
});

// ─── Get Contest Rankings ───
export const getContestRankings = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    if (!contest) return [];

    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();

    // Filter submissions with marks and sort by marks descending
    const ranked = submissions
      .filter(s => s.marks !== undefined)
      .sort((a, b) => (b.marks || 0) - (a.marks || 0));

    // Enrich with user data
    const enriched = await Promise.all(
      ranked.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          _id: sub._id,
          rank: sub.rank,
          userId: sub.userId,
          userName: user?.name || "Anonymous",
          userImageUrl: user?.imageUrl,
          userGroup: user?.group,
          marks: sub.marks,
          feedback: sub.feedback,
          submissionUrl: sub.submissionUrl,
        };
      })
    );

    return enriched;
  },
});

// ─── Get Contest Submissions (Admin) ───
export const getContestSubmissions = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();

    // Enrich with user data
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          ...sub,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "",
          userClass: user?.class || 0,
        };
      })
    );

    return enrichedSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// ─── Get User's Contest Submission ───
export const getUserContestSubmission = query({
  args: { 
    contestId: v.id("contests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    const submission = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest_user", (q) => 
        q.eq("contestId", args.contestId).eq("userId", args.userId)
      )
      .first();

    if (!submission) return null;

    // If results not published, only return submission confirmation
    if (!contest?.isResultsPublished) {
      return {
        submitted: true,
        resultsPublished: false,
        message: "Results will be available once announced.",
        submittedAt: submission.submittedAt,
        submissionUrl: submission.submissionUrl,
      };
    }

    // Results published - return full details
    return {
      submitted: true,
      resultsPublished: true,
      marks: submission.marks,
      feedback: submission.feedback,
      rank: submission.rank,
      submittedAt: submission.submittedAt,
      submissionUrl: submission.submissionUrl,
    };
  },
});

// ─── Submit Contest Entry ───
export const submitContestEntry = mutation({
  args: {
    contestId: v.id("contests"),
    userId: v.id("users"),
    // Form responses (new way)
    formResponses: v.optional(v.array(
      v.object({
        fieldId: v.string(),
        fieldLabel: v.optional(v.string()),
        value: v.string(),
      })
    )),
    // Legacy fields (backward compatibility)
    submissionUrl: v.optional(v.string()),
    submissionType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already submitted
    const existing = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest_user", (q) => 
        q.eq("contestId", args.contestId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("You have already submitted an entry for this contest");
    }

    // Check if contest is still accepting submissions
    const contest = await ctx.db.get(args.contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }

    const now = Date.now();
    
    // Helper functions for backward compatibility
    const liveAt = contest.liveAt || contest.startDate || 0;
    const expiresAt = contest.expiresAt || contest.endDate || 0;
    const contestGroups = contest.groups || (contest.group ? [contest.group] : []);
    const submissionDeadline = contest.submissionDeadline || expiresAt;
    
    // Check if contest is live
    if (liveAt > now) {
      throw new Error("Contest not yet live");
    }
    
    if (expiresAt <= now) {
      throw new Error("Contest has ended");
    }
    
    if (now > submissionDeadline) {
      throw new Error("Submission deadline has passed");
    }

    // Check user access
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check group access
    if (!contestGroups.includes(user.group)) {
      throw new Error("Not authorized for this contest");
    }

    // Check pro access for paid contests
    if (contest.isPaid) {
      const isPro = user.isPro === true && 
        (user.proExpiresAt ? user.proExpiresAt > now : true);
      if (!isPro) {
        throw new Error("Pro subscription required for this contest");
      }
    }

    const submissionId = await ctx.db.insert("contestSubmissions", {
      contestId: args.contestId,
      userId: args.userId,
      formResponses: args.formResponses,
      submissionUrl: args.submissionUrl,
      submissionType: args.submissionType,
      notes: args.notes,
      submittedAt: now,
    });

    return submissionId;
  },
});

// ─── ADMIN: Evaluate Submission ───
export const evaluateSubmission = mutation({
  args: {
    submissionId: v.id("contestSubmissions"),
    marks: v.number(),
    feedback: v.optional(v.string()),
    evaluatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, {
      marks: args.marks,
      feedback: args.feedback,
      evaluatedBy: args.evaluatedBy,
      evaluatedAt: Date.now(),
    });
  },
});

// ─── ADMIN: Assign Ranks ───
export const assignContestRanks = mutation({
  args: {
    contestId: v.id("contests"),
  },
  handler: async (ctx, args) => {
    // Get all evaluated submissions for this contest
    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest", (q) => q.eq("contestId", args.contestId))
      .collect();

    // Filter only evaluated submissions and sort by marks
    const evaluated = submissions
      .filter(s => s.marks !== undefined)
      .sort((a, b) => (b.marks || 0) - (a.marks || 0));

    // Assign ranks
    for (let i = 0; i < evaluated.length; i++) {
      await ctx.db.patch(evaluated[i]._id, {
        rank: i + 1,
      });
    }

    return { success: true, rankedCount: evaluated.length };
  },
});

// ─── Get Contest Results (Public) ───
export const getContestResults = query({
  args: { contestId: v.id("contests") },
  handler: async (ctx, args) => {
    const contest = await ctx.db.get(args.contestId);
    if (!contest || !contest.isResultsPublished) {
      return null;
    }

    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_contest_rank", (q) => q.eq("contestId", args.contestId))
      .collect();

    // Filter submissions with ranks and sort
    const ranked = submissions
      .filter(s => s.rank !== undefined)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    // Enrich with user data
    const enriched = await Promise.all(
      ranked.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          rank: sub.rank,
          userId: sub.userId,
          userName: user?.name || "Unknown",
          userImageUrl: user?.imageUrl,
          marks: sub.marks,
          feedback: sub.feedback,
          submissionUrl: sub.submissionUrl,
        };
      })
    );

    return {
      contest,
      winners: enriched.slice(0, 3), // Top 3
      rankings: enriched, // All rankings
    };
  },
});

// ─── Get User's Contest History ───
export const getUserContestHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("contestSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with contest data
    const history = await Promise.all(
      submissions.map(async (sub) => {
        const contest = await ctx.db.get(sub.contestId);
        return {
          ...sub,
          contestTitle: contest?.title || "Unknown Contest",
          contestType: contest?.contestType,
          contestStatus: contest?.status,
          isResultsPublished: contest?.isResultsPublished,
        };
      })
    );

    return history.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// ─── Update Contest Statuses (Cron Job) ───
export const updateContestStatuses = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const contests = await ctx.db.query("contests").collect();

    for (const contest of contests) {
      // Helper functions for backward compatibility
      const liveAt = contest.liveAt || contest.startDate || 0;
      const expiresAt = contest.expiresAt || contest.endDate || 0;
      
      let newStatus = contest.status;
      
      if (liveAt > now) {
        newStatus = "upcoming";
      } else if (liveAt <= now && expiresAt > now) {
        newStatus = "live";
      } else if (expiresAt <= now && !contest.isResultsPublished) {
        newStatus = "evaluation";
      } else if (contest.isResultsPublished) {
        newStatus = "completed";
      }

      if (newStatus !== contest.status) {
        await ctx.db.patch(contest._id, { status: newStatus });
      }
    }

    return { success: true };
  },
});
