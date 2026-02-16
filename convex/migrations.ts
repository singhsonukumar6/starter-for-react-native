import { mutation } from "./_generated/server";

export const migrateSlidesToContent = mutation({
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    let count = 0;
    for (const lesson of lessons) {
      // @ts-ignore
      if (lesson.slides && !lesson.content) {
        await ctx.db.patch(lesson._id, {
          // @ts-ignore
          content: lesson.slides,
        });
        count++;
      }
    }
    return `Migrated ${count} lessons.`;
  },
});
