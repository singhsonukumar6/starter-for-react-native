import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all courses
export const getCourses = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_creation_time")
      .order("desc")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get course by ID
export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

// Get course lessons with optional sections data
export const getCourseContent = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Map lessons into sections if any
    if (sections.length > 0) {
       const sortedSections = sections.sort((a,b) => a.order - b.order);
       // Lessons without section go to "General" or first
       return {
          hasSections: true,
          sections: sortedSections,
          lessons: lessons.sort((a,b) => a.order - b.order)
       };
    }

    return { hasSections: false, lessons: lessons.sort((a,b) => a.order - b.order) };
  },
});

// Get course lessons (Legacy: returns flat list)
export const getCourseLessons = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get user certificates
export const getUserCertificates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Enrich with course details if needed
    /*
    const courses = await Promise.all(certs.map(c => ctx.db.get(c.courseId)));
    return certs.map((c, i) => ({ ...c, courseTitle: courses[i]?.title }));
    */
   return certs;
  },
});

// Get user course progress (Legacy: mapped to lessonProgress)
export const getUserCourseProgress = query({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, args) => {
     // Get all lessons for this course
     const courseLessons = await ctx.db.query("lessons")
       .withIndex("by_course", q => q.eq("courseId", args.courseId))
       .collect();
     
     const lessonIds = new Set(courseLessons.map(l => l._id));

     // Get user's total progress (optimized in real apps by index, but ok here)
     const allProgress = await ctx.db.query("lessonProgress")
       .withIndex("by_user", q => q.eq("userId", args.userId))
       .collect();

     return allProgress.filter(p => lessonIds.has(p.lessonId));
  },
});

// Complete lesson
export const completeLesson = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("courseLessons"),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if already completed
    const existing = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        completedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("courseProgress", {
      userId: args.userId,
      courseId: args.courseId,
      lessonId: args.lessonId,
      completed: true,
      score: args.score,
      completedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Get next lesson in course
export const getNextCourseLesson = query({
  args: { courseId: v.id("courses"), currentOrder: v.number() },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Sort by order ascending
    lessons.sort((a, b) => a.order - b.order);
    
    // Find first one with order > currentOrder
    return lessons.find(l => l.order > args.currentOrder) || null;
  },
});

// Generate certificate (returns certificate ID for now)
export const generateCertificate = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    return await ctx.db.insert("certificates", {
      userId: args.userId,
      courseId: args.courseId,
      certificateUrl: `https://certificates.lemolearn.com/${certificateId}`,
      certificateId,
      issuedAt: Date.now(),
    });
  },
});


