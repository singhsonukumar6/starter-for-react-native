import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Get lessons for a category & group ───
export const getLessons = query({
  args: { category: v.string(), group: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_category_group", (q) =>
        q.eq("category", args.category).eq("group", args.group)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// ─── Get a single lesson ───
export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

// ─── Get next lesson in sequence based on current lesson ID ───
export const getNextLessonInSequence = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const currentLesson = await ctx.db.get(args.lessonId);
    if (!currentLesson) return null;

    // 1. Try by courseId if available
    if (currentLesson.courseId && currentLesson.order !== undefined) {
      const nextInCourse = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", currentLesson.courseId as any))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      const sorted = nextInCourse.sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex((l) => l._id === currentLesson._id);
      
      if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
        return sorted[currentIndex + 1];
      }
      return null;
    }

    // 2. Fallback: Try by category & group & order
    const groupLessons = await ctx.db
      .query("lessons")
      .withIndex("by_category_group", (q) => 
        q.eq("category", currentLesson.category).eq("group", currentLesson.group)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sortedGroup = groupLessons.sort((a, b) => a.order - b.order);
    const index = sortedGroup.findIndex((l) => l._id === currentLesson._id);
    
    if (index !== -1 && index < sortedGroup.length - 1) {
      return sortedGroup[index + 1];
    }
    
    return null;
  },
});

// ─── Get all lesson progress for a user ───
export const getUserLessonProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ─── Check if user completed a specific lesson ───
export const getLessonCompletion = query({
  args: { userId: v.id("users"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .first();
  },
});

// ─── Complete a lesson with quiz score ───
export const completeLesson = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    quizScore: v.number(),
    answersCorrect: v.number(),
    answersTotal: v.number(),
  },
  handler: async (ctx, args) => {
    // Check existing
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      // Update if new score is higher
      if (args.quizScore > existing.quizScore) {
        await ctx.db.patch(existing._id, {
          quizScore: args.quizScore,
          answersCorrect: args.answersCorrect,
          completedAt: Date.now(),
        });
      }
      return existing._id;
    }

    // Get lesson to know XP reward
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const xpEarned = Math.round(lesson.xpReward * (args.quizScore / 100));

    // Save progress
    const progressId = await ctx.db.insert("lessonProgress", {
      userId: args.userId,
      lessonId: args.lessonId,
      completed: true,
      quizScore: args.quizScore,
      answersCorrect: args.answersCorrect,
      answersTotal: args.answersTotal,
      xpEarned,
      completedAt: Date.now(),
    });

    // Add XP to user
    const user = await ctx.db.get(args.userId);
    if (user) {
      const newXp = (user.xp || 0) + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1; // 100 XP per level
      await ctx.db.patch(args.userId, { xp: newXp, level: newLevel });
    }

    // ────────────────── New Logic: Streak, Badges, Certificates ──────────────────

    // 1. Update Streak
    const today = new Date().toISOString().split("T")[0];
    const daily = await ctx.db.query("userDailyProgress")
      .withIndex("by_user_date", q => q.eq("userId", args.userId).eq("date", today))
      .first();

    if (!daily) {
      // Check yesterday for streak continuity
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split("T")[0];

      const lastEntry = await ctx.db.query("userDailyProgress")
        .withIndex("by_user_date", q => q.eq("userId", args.userId).eq("date", yesterday))
        .first();

      const newStreak = lastEntry ? lastEntry.streakDay + 1 : 1;
      await ctx.db.insert("userDailyProgress", {
        userId: args.userId,
        date: today,
        completed: true,
        streakDay: newStreak,
        createdAt: Date.now(),
      });

      // Check Streak Badge (e.g. 7 days)
      if (newStreak === 3) await unlockAchievement(ctx, args.userId, "streak-3");
      if (newStreak === 7) await unlockAchievement(ctx, args.userId, "streak-7");
    }

    // 2. Check "First Lesson" Badge
    const allProgress = await ctx.db.query("lessonProgress")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    
    if (allProgress.length === 1) {
      await unlockAchievement(ctx, args.userId, "first-lesson");
    }

    // 3. Check Course Completion
    if (lesson.courseId) {
      // Fetch all lessons for this course
      const courseLessons = await ctx.db.query("lessons")
        .filter(q => q.eq(q.field("courseId"), lesson.courseId))
        .collect();
      
      const completedSet = new Set(allProgress.map(p => p.lessonId));
      const allDone = courseLessons.every(l => completedSet.has(l._id));

      if (allDone && courseLessons.length > 0) {
        // Issue Certificate if not exists
        const existingCert = await ctx.db.query("certificates")
          .withIndex("by_user", q => q.eq("userId", args.userId))
          .filter(q => q.eq(q.field("courseId"), lesson.courseId))
          .first();
        
        if (!existingCert) {
          await ctx.db.insert("certificates", {
            userId: args.userId,
            courseId: lesson.courseId,
            certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
            certificateUrl: "https://placehold.co/600x400/png?text=Certificate+of+Completion",
            issuedAt: Date.now(),
          });
          await unlockAchievement(ctx, args.userId, "course-completed");
        }
      }
    }

    return progressId;
  },
});

// Helper to unlock achievement
async function unlockAchievement(ctx: any, userId: any, slug: string) {
  const ach = await ctx.db.query("achievements")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();
  
  if (!ach) return;

  const existing = await ctx.db.query("userAchievements")
    .withIndex("by_user_achievement", (q: any) => q.eq("userId", userId).eq("achievementId", ach._id))
    .first();
  
  if (!existing) {
    await ctx.db.insert("userAchievements", {
      userId,
      achievementId: ach._id,
      unlockedAt: Date.now(),
    });
    // Bonus XP for badge
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, { xp: (user.xp || 0) + ach.xpToken });
    }
  }
}


// ─── Get next lesson for a user (first uncompleted) ───
export const getNextLesson = query({
  args: { userId: v.id("users"), category: v.string(), group: v.string() },
  handler: async (ctx, args) => {
    const allLessons = await ctx.db
      .query("lessons")
      .withIndex("by_category_group", (q) =>
        q.eq("category", args.category).eq("group", args.group)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sortedLessons = allLessons.sort((a, b) => a.order - b.order);

    const progress = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    const completedIds = new Set(progress.map((p) => p.lessonId));

    for (const lesson of sortedLessons) {
      if (!completedIds.has(lesson._id)) {
        return lesson;
      }
    }

    return null; // All done!
  },
});
