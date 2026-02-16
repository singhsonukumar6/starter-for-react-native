/**
 * English Lessons - Convex functions
 * Interactive English lessons like Duolingo
 * Now linked to English micro-courses
 */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all English courses (courses with category "english")
export const getEnglishCourses = query({
  args: { group: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.group) {
      return await ctx.db
        .query("courses")
        .withIndex("by_category_group", (q) => 
          q.eq("category", "english").eq("group", args.group)
        )
        .collect();
    }
    return await ctx.db
      .query("courses")
      .withIndex("by_category", (q) => q.eq("category", "english"))
      .collect();
  },
});

// Get all English lessons for a group (legacy support)
export const getEnglishLessons = query({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("englishLessons")
      .withIndex("by_group_order", (q) => q.eq("group", args.group))
      .order("asc")
      .collect();
  },
});

// Get English lessons by course
export const getEnglishLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("englishLessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();
  },
});

// Get a single English lesson
export const getEnglishLesson = query({
  args: { lessonId: v.id("englishLessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

// Create a new English lesson (now requires courseId)
export const createEnglishLesson = mutation({
  args: {
    courseId: v.id("courses"), // Now required
    sectionId: v.optional(v.id("sections")),
    group: v.string(),
    title: v.string(),
    description: v.string(),
    order: v.number(),
    xpReward: v.number(),
    content: v.array(
      v.object({
        type: v.string(),
        title: v.optional(v.string()),
        content: v.string(),
        pronunciation: v.optional(v.string()),
        audioText: v.optional(v.string()),
        emoji: v.optional(v.string()),
        examples: v.optional(v.array(v.string())),
      })
    ),
    questions: v.array(
      v.object({
        type: v.string(),
        question: v.string(),
        audioText: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()),
        correctAnswer: v.optional(v.string()),
        correctOrder: v.optional(v.array(v.string())),
        pairs: v.optional(v.array(v.object({
          left: v.string(),
          right: v.string(),
        }))),
        explanation: v.string(),
        hint: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lessonId = await ctx.db.insert("englishLessons", {
      ...args,
      isActive: true,
      createdAt: now,
    });
    
    // Update course totalLessons count
    const course = await ctx.db.get(args.courseId);
    if (course) {
      await ctx.db.patch(args.courseId, {
        totalLessons: (course.totalLessons || 0) + 1,
      });
    }
    
    return lessonId;
  },
});

// Update an English lesson
export const updateEnglishLesson = mutation({
  args: {
    lessonId: v.id("englishLessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    xpReward: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    content: v.optional(v.array(
      v.object({
        type: v.string(),
        title: v.optional(v.string()),
        content: v.string(),
        pronunciation: v.optional(v.string()),
        audioText: v.optional(v.string()),
        emoji: v.optional(v.string()),
        examples: v.optional(v.array(v.string())),
      })
    )),
    questions: v.optional(v.array(
      v.object({
        type: v.string(),
        question: v.string(),
        audioText: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()),
        correctAnswer: v.optional(v.string()),
        correctOrder: v.optional(v.array(v.string())),
        pairs: v.optional(v.array(v.object({
          left: v.string(),
          right: v.string(),
        }))),
        explanation: v.string(),
        hint: v.optional(v.string()),
      })
    )),
  },
  handler: async (ctx, args) => {
    const { lessonId, ...updates } = args;
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(lessonId, cleanUpdates);
    return lessonId;
  },
});

// Delete an English lesson
export const deleteEnglishLesson = mutation({
  args: { lessonId: v.id("englishLessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (lesson && lesson.courseId) {
      const course = await ctx.db.get(lesson.courseId);
      if (course && course.totalLessons > 0) {
        await ctx.db.patch(lesson.courseId, {
          totalLessons: course.totalLessons - 1,
        });
      }
    }
    await ctx.db.delete(args.lessonId);
    return args.lessonId;
  },
});

// Save English lesson progress
export const saveEnglishLessonProgress = mutation({
  args: {
    lessonId: v.id("englishLessons"),
    score: v.number(),
    answersCorrect: v.number(),
    answersTotal: v.number(),
    xpEarned: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Check if progress already exists
    const existing = await ctx.db
      .query("englishLessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      // Update existing progress
      await ctx.db.patch(existing._id, {
        completed: true,
        score: args.score,
        answersCorrect: args.answersCorrect,
        answersTotal: args.answersTotal,
        xpEarned: args.xpEarned,
        completedAt: now,
      });
      return existing._id;
    }

    // Create new progress
    return await ctx.db.insert("englishLessonProgress", {
      userId: user._id,
      lessonId: args.lessonId,
      completed: true,
      score: args.score,
      answersCorrect: args.answersCorrect,
      answersTotal: args.answersTotal,
      xpEarned: args.xpEarned,
      completedAt: now,
    });
  },
});

// Get user's English lesson progress
export const getEnglishLessonProgress = query({
  args: { lessonId: v.id("englishLessons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    return await ctx.db
      .query("englishLessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", args.lessonId)
      )
      .first();
  },
});

// Get all English lesson progress for a user
export const getUserEnglishLessonProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("englishLessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
