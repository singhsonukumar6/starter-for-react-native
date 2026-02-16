import { query } from "./_generated/server";

export const listCourses = query({
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});
