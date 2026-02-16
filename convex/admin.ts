import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Dashboard Statistics
export const getStats = query({
  handler: async (ctx) => {
    const usersCount = (await ctx.db.query("users").collect()).length;
    const coursesCount = (await ctx.db.query("courses").collect()).length;
    const lessonsCount = (await ctx.db.query("lessons").collect()).length;
    
    // Maybe calculate some revenue or other stats later
    
    return {
      usersCount,
      coursesCount,
      lessonsCount,
    };
  },
});

// Admin: Get All Users (with basic pagination or just all for now)
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(100);
  },
});

// Admin: Get All Courses
export const getAllCourses = query({
  handler: async (ctx) => {
    return await ctx.db.query("courses").order("desc").collect();
  },
});

// Admin: Create Course
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(), // "coding", "english", "abacus", "vedic", "ai"
    group: v.optional(v.string()), // For English courses: "junior", "intermediate", "senior"
    level: v.string(), // "beginner", "intermediate", "advanced"
    totalLessons: v.optional(v.number()),
    estimatedDuration: v.optional(v.string()),
    thumbnail: v.optional(v.string()), // Image for list
    icon: v.optional(v.string()), // New: Icon for categories/grid
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      category: args.category,
      group: args.group,
      level: args.level,
      totalLessons: args.totalLessons || 0,
      estimatedDuration: args.estimatedDuration || "0h",
      thumbnail: args.thumbnail,
      icon: args.icon,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
    });
    return courseId;
  },
});

// Admin: Create Lesson for a Course
export const createLesson = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    category: v.string(), // e.g. "python_basics"
    group: v.string(), // "junior"
    order: v.number(),
    xpReward: v.number(),
    type: v.optional(v.string()),
    content: v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        content: v.string(),
        emoji: v.optional(v.string()),
        language: v.optional(v.string()),
        expectedOutput: v.optional(v.string()),
      })
    ),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()),
        correctAnswer: v.optional(v.string()), // For input type
        explanation: v.string(),
        type: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const lessonId = await ctx.db.insert("lessons", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      category: args.category,
      group: args.group,
      order: args.order,
      xpReward: args.xpReward,
      content: args.content,
      questions: args.questions,
      isActive: true,
      createdAt: Date.now(),
    });

    // Update course total lessons count
    const course = await ctx.db.get(args.courseId);
    if (course) {
      await ctx.db.patch(args.courseId, {
        totalLessons: (course.totalLessons || 0) + 1,
      });
    }

    return lessonId;
  },
});

// Admin: Get recent Words of the Day
export const getRecentWords = query({
  handler: async (ctx) => {
    return await ctx.db.query("wordOfTheDay").order("desc").take(20);
  },
});

// Admin: Add Word of the Day
export const createWord = mutation({
  args: {
    group: v.string(), // "junior", "intermediate", "senior"
    date: v.string(), // YYYY-MM-DD
    word: v.string(),
    meaning: v.string(),
    partOfSpeech: v.string(),
    pronunciation: v.optional(v.string()),
    synonym: v.string(),
    antonym: v.string(),
    exampleSentence: v.string(),
    funFact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("wordOfTheDay", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateLesson = mutation({
  args: {
    id: v.id("lessons"),
    courseId: v.optional(v.id("courses")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    group: v.optional(v.string()),
    order: v.optional(v.number()),
    xpReward: v.optional(v.number()),
    type: v.optional(v.string()),
    
    // Content array
    content: v.optional(v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        content: v.string(),
        emoji: v.optional(v.string()),
        language: v.optional(v.string()),
        expectedOutput: v.optional(v.string()),
      })
    )),

    // Questions array
    questions: v.optional(v.array(
      v.object({
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()),
        correctAnswer: v.optional(v.string()),
        explanation: v.string(),
        type: v.optional(v.string()),
      })
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    level: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteCourse = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("lessons"), courseId: v.optional(v.id("courses")) },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    if (args.courseId) {
        const course = await ctx.db.get(args.courseId);
        if (course && course.totalLessons > 0) {
            await ctx.db.patch(args.courseId, { totalLessons: course.totalLessons - 1 });
        }
    }
  },
});

// ────────────────── Coding Challenges Admin ──────────────────

// Get all challenge categories
export const getChallengeCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("challengeCategories")
      .order("asc")
      .collect();
  },
});

// Create challenge category
export const createChallengeCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("challengeCategories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      order: args.order || 0,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
    });
  },
});

// Update challenge category
export const updateChallengeCategory = mutation({
  args: {
    id: v.id("challengeCategories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete challenge category
export const deleteChallengeCategory = mutation({
  args: { id: v.id("challengeCategories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get all challenges for admin
export const getAllChallenges = query({
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("codingChallenges")
      .order("desc")
      .collect();

    // Get category info for each challenge
    const challengesWithCategory = await Promise.all(
      challenges.map(async (challenge) => {
        let category = null;
        if (challenge.categoryId) {
          category = await ctx.db.get(challenge.categoryId);
        }
        return {
          ...challenge,
          category,
        };
      })
    );

    return challengesWithCategory;
  },
});

// Create coding challenge
export const createCodingChallenge = mutation({
  args: {
    categoryId: v.optional(v.id("challengeCategories")),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    difficulty: v.string(),
    points: v.number(),
    groups: v.array(v.string()), // "junior", "intermediate", "senior"
    timeLimit: v.optional(v.number()),
    memoryLimit: v.optional(v.number()),
    problemStatement: v.string(),
    inputFormat: v.string(),
    outputFormat: v.string(),
    constraints: v.optional(v.string()),
    examples: v.array(
      v.object({
        input: v.string(),
        output: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    starterCode: v.object({
      python: v.optional(v.string()),
      javascript: v.optional(v.string()),
      java: v.optional(v.string()),
      cpp: v.optional(v.string()),
    }),
    functionSignature: v.object({
      python: v.optional(v.string()),
      javascript: v.optional(v.string()),
      java: v.optional(v.string()),
      cpp: v.optional(v.string()),
    }),
    hints: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("codingChallenges", {
      categoryId: args.categoryId,
      title: args.title,
      slug: args.slug,
      description: args.description,
      difficulty: args.difficulty,
      points: args.points,
      groups: args.groups,
      timeLimit: args.timeLimit,
      memoryLimit: args.memoryLimit,
      problemStatement: args.problemStatement,
      inputFormat: args.inputFormat,
      outputFormat: args.outputFormat,
      constraints: args.constraints,
      examples: args.examples,
      starterCode: args.starterCode,
      functionSignature: args.functionSignature,
      hints: args.hints,
      tags: args.tags,
      totalSubmissions: 0,
      successfulSubmissions: 0,
      isActive: args.isActive ?? true,
      order: args.order || 0,
      createdAt: Date.now(),
    });
  },
});

// Update coding challenge
export const updateCodingChallenge = mutation({
  args: {
    id: v.id("codingChallenges"),
    categoryId: v.optional(v.id("challengeCategories")),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    points: v.optional(v.number()),
    groups: v.optional(v.array(v.string())), // "junior", "intermediate", "senior"
    timeLimit: v.optional(v.number()),
    memoryLimit: v.optional(v.number()),
    problemStatement: v.optional(v.string()),
    inputFormat: v.optional(v.string()),
    outputFormat: v.optional(v.string()),
    constraints: v.optional(v.string()),
    examples: v.optional(
      v.array(
        v.object({
          input: v.string(),
          output: v.string(),
          explanation: v.optional(v.string()),
        })
      )
    ),
    starterCode: v.optional(
      v.object({
        python: v.optional(v.string()),
        javascript: v.optional(v.string()),
        java: v.optional(v.string()),
        cpp: v.optional(v.string()),
      })
    ),
    functionSignature: v.optional(
      v.object({
        python: v.optional(v.string()),
        javascript: v.optional(v.string()),
        java: v.optional(v.string()),
        cpp: v.optional(v.string()),
      })
    ),
    hints: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

// Delete coding challenge
export const deleteCodingChallenge = mutation({
  args: { id: v.id("codingChallenges") },
  handler: async (ctx, args) => {
    // Delete associated test cases first
    const testCases = await ctx.db
      .query("challengeTestCases")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.id))
      .collect();

    for (const tc of testCases) {
      await ctx.db.delete(tc._id);
    }

    // Delete the challenge
    await ctx.db.delete(args.id);
  },
});

// Get test cases for a challenge (admin view - includes hidden)
export const getChallengeTestCases = query({
  args: { challengeId: v.id("codingChallenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challengeTestCases")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .order("asc")
      .collect();
  },
});

// Create test case
export const createTestCase = mutation({
  args: {
    challengeId: v.id("codingChallenges"),
    input: v.string(),
    expectedOutput: v.string(),
    isHidden: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("challengeTestCases", {
      challengeId: args.challengeId,
      input: args.input,
      expectedOutput: args.expectedOutput,
      isHidden: args.isHidden ?? false,
      order: args.order || 0,
      createdAt: Date.now(),
    });
  },
});

// Update test case
export const updateTestCase = mutation({
  args: {
    id: v.id("challengeTestCases"),
    input: v.optional(v.string()),
    expectedOutput: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete test case
export const deleteTestCase = mutation({
  args: { id: v.id("challengeTestCases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Batch create test cases
export const batchCreateTestCases = mutation({
  args: {
    challengeId: v.id("codingChallenges"),
    testCases: v.array(
      v.object({
        input: v.string(),
        expectedOutput: v.string(),
        isHidden: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (let i = 0; i < args.testCases.length; i++) {
      const tc = args.testCases[i];
      const id = await ctx.db.insert("challengeTestCases", {
        challengeId: args.challengeId,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: i,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// Get challenge stats for admin dashboard
export const getChallengeStats = query({
  handler: async (ctx) => {
    const challenges = await ctx.db.query("codingChallenges").collect();
    const categories = await ctx.db.query("challengeCategories").collect();
    const submissions = await ctx.db.query("challengeSubmissions").collect();
    const leaderboard = await ctx.db
      .query("challengeLeaderboard")
      .filter((q) => q.eq(q.field("period"), "all-time"))
      .collect();

    const easyCount = challenges.filter((c) => c.difficulty === "easy").length;
    const mediumCount = challenges.filter((c) => c.difficulty === "medium").length;
    const hardCount = challenges.filter((c) => c.difficulty === "hard").length;

    const acceptedSubmissions = submissions.filter((s) => s.status === "accepted").length;

    return {
      totalChallenges: challenges.length,
      totalCategories: categories.length,
      totalSubmissions: submissions.length,
      acceptedSubmissions,
      activeUsers: leaderboard.length,
      easyCount,
      mediumCount,
      hardCount,
    };
  },
});
