/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessCodes from "../accessCodes.js";
import type * as achievements from "../achievements.js";
import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as codingChallenges from "../codingChallenges.js";
import type * as contests from "../contests.js";
import type * as courses from "../courses.js";
import type * as daily from "../daily.js";
import type * as debug from "../debug.js";
import type * as englishLessons from "../englishLessons.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lessons from "../lessons.js";
import type * as migrations from "../migrations.js";
import type * as referrals from "../referrals.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as weeklyTests from "../weeklyTests.js";
import type * as wordOfDay from "../wordOfDay.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessCodes: typeof accessCodes;
  achievements: typeof achievements;
  admin: typeof admin;
  ai: typeof ai;
  codingChallenges: typeof codingChallenges;
  contests: typeof contests;
  courses: typeof courses;
  daily: typeof daily;
  debug: typeof debug;
  englishLessons: typeof englishLessons;
  leaderboard: typeof leaderboard;
  lessons: typeof lessons;
  migrations: typeof migrations;
  referrals: typeof referrals;
  seed: typeof seed;
  users: typeof users;
  weeklyTests: typeof weeklyTests;
  wordOfDay: typeof wordOfDay;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
