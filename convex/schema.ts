import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ────────────────── User profiles ──────────────────
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    class: v.number(),
    group: v.string(), // "junior", "intermediate", "senior"
    parentEmail: v.string(),
    imageUrl: v.optional(v.string()),
    xp: v.optional(v.number()), // experience points for leaderboard
    level: v.optional(v.number()), // computed from XP
    isPro: v.optional(v.boolean()), // pro subscription active
    proExpiresAt: v.optional(v.number()), // ms timestamp when pro expires
    isSuspended: v.optional(v.boolean()), // cheating penalty
    referralCode: v.optional(v.string()), // unique code for this user to share
    referredBy: v.optional(v.id("users")), // who referred this user
    referralXpClaimed: v.optional(v.boolean()), // has the referrer received signup XP?
    referralProXpClaimed: v.optional(v.boolean()), // has the referrer received pro XP?
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_xp", ["xp"])
    .index("by_referral_code", ["referralCode"]),

  // ────────────────── Access Codes (for PRO activation) ──────────────────
  accessCodes: defineTable({
    code: v.string(), // unique code e.g. "LEMO2026PRO"
    durationDays: v.number(), // how many days of PRO access
    maxUses: v.optional(v.number()), // max redemptions (null = unlimited)
    usedCount: v.number(), // how many times redeemed
    isActive: v.boolean(),
    createdBy: v.optional(v.string()), // admin who created
    expiresAt: v.optional(v.number()), // code expiry (optional)
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // ────────────────── Access Code Redemptions ──────────────────
  codeRedemptions: defineTable({
    userId: v.id("users"),
    codeId: v.id("accessCodes"),
    code: v.string(),
    durationDays: v.number(),
    proExpiresAt: v.number(), // when this activation expires
    redeemedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["codeId"]),

  // ────────────────── Referral Tracking ──────────────────
  referrals: defineTable({
    referrerId: v.id("users"), // who shared the code
    referredUserId: v.id("users"), // who signed up
    signupXpAwarded: v.boolean(), // 100 XP awarded on signup?
    proXpAwarded: v.boolean(), // 1000 XP awarded when referred becomes pro?
    createdAt: v.number(),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredUserId"]),

  // ────────────────── Micro-lessons (Sololearn-style) ──────────────────
  // Each lesson = a set of slides (learn) + quiz questions (practice)
  lessons: defineTable({
    courseId: v.optional(v.id("courses")), // optional link to a course
    sectionId: v.optional(v.id("sections")), // New: link to section
    category: v.string(), // "english", "abacus", "vedic", "coding", "ai"
    group: v.string(), // which student group
    title: v.string(),
    description: v.string(),
    type: v.optional(v.string()), // "lesson" | "quiz"
    order: v.number(),
    isActive: v.boolean(),
    xpReward: v.number(), // XP earned on completion
    // Learn content — vertical blocks (Sololearn style)
    content: v.optional(v.array(
      v.object({
        type: v.string(), // "text", "example", "tip", "highlight", "code", "playground"
        title: v.string(),
        content: v.string(),
        emoji: v.optional(v.string()),
        language: v.optional(v.string()), // Added for playground support
        expectedOutput: v.optional(v.string()), // Added for validation
      })
    )),
    // Legacy support for migration
    slides: v.optional(v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        content: v.string(),
        emoji: v.optional(v.string()),
      })
    )),
    // Practice quiz after the slides
    questions: v.array(
      v.object({
        type: v.optional(v.string()), // "mcq" | "input" | "fillBlank" | "arrange" | "match" | "listen"
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()),
        correctAnswer: v.optional(v.string()), // For input/fillBlank type
        correctOrder: v.optional(v.array(v.string())), // For arrange type
        pairs: v.optional(v.array(v.object({ // For match type
          left: v.string(),
          right: v.string(),
        }))),
        audioText: v.optional(v.string()), // For listen type (TTS)
        explanation: v.string(),
        hint: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_category_group", ["category", "group"])
    .index("by_group_order", ["group", "order"])
    .index("by_course", ["courseId"]),

  // Tracks which lessons a user completed and their quiz scores
  lessonProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    completed: v.boolean(),
    quizScore: v.number(), // 0-100
    answersCorrect: v.number(),
    answersTotal: v.number(),
    xpEarned: v.number(),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  // ────────────────── Achievements & Certificates ──────────────────
  achievements: defineTable({
    slug: v.string(), // "first-lesson", "python-master"
    title: v.string(),
    description: v.string(),
    icon: v.string(),
    category: v.string(), // "course", "streak", "xp"
    requirement: v.number(), // e.g., 5 courses, 1000 XP
    xpToken: v.number(),
  }).index("by_slug", ["slug"]),

  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    unlockedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"])
    .index("by_user_achievement", ["userId", "achievementId"]),

  // ────────────────── Word of the Day ──────────────────
  wordOfTheDay: defineTable({
    date: v.string(), // YYYY-MM-DD
    group: v.string(),
    word: v.string(),
    meaning: v.string(),
    partOfSpeech: v.string(), // noun, verb, adjective, etc.
    pronunciation: v.optional(v.string()),
    synonym: v.string(),
    antonym: v.string(),
    exampleSentence: v.string(),
    funFact: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_group_date", ["group", "date"])
    .index("by_date", ["date"]),

  // ────────────────── Sentence Structure of the Day ──────────────────
  sentenceOfTheDay: defineTable({
    date: v.string(),
    group: v.string(),
    structureName: v.string(), // e.g. "Present Perfect Continuous"
    formula: v.string(), // "Subject + has/have + been + V-ing"
    explanation: v.string(),
    examples: v.array(v.string()),
    practicePrompt: v.string(), // "Make a sentence using this structure"
    createdAt: v.number(),
  })
    .index("by_group_date", ["group", "date"])
    .index("by_date", ["date"]),

  // ────────────────── Tests (formerly Weekly/Monthly Tests) ──────────────────
  // Tests are now created on-demand with admin-controlled availability
  weeklyTests: defineTable({
    title: v.string(),
    description: v.string(),
    // Multiple groups can be assigned to a test (new field)
    groups: v.optional(v.array(v.string())), // ["junior", "intermediate", "senior"] or any combination
    // Legacy single group field (for backward compatibility)
    group: v.optional(v.string()), // "junior", "intermediate", "senior"
    // Scheduling - new fields
    liveAt: v.optional(v.number()), // ms timestamp when test goes live
    expiresAt: v.optional(v.number()), // ms timestamp when test expires
    // Legacy scheduling fields (for backward compatibility)
    availableAt: v.optional(v.number()), // old field name for liveAt
    endsAt: v.optional(v.number()), // old field name for expiresAt
    duration: v.number(), // minutes
    totalMarks: v.number(),
    // Access control
    isPaid: v.optional(v.boolean()), // true = only for paid/pro users, false = free for all
    // Syllabus & Instructions
    syllabus: v.optional(v.array(v.string())), // ["Current Affairs","Maths","English","GK","Miscellaneous"]
    instructions: v.optional(v.string()), // Instructions shown before starting test
    // Rewards (for paid tests) - can be string (legacy) or array (new)
    rewards: v.optional(v.union(
      v.string(), // legacy format
      v.array(
        v.object({
          rank: v.number(), // 1, 2, 3
          title: v.string(), // "1st Place"
          prize: v.string(), // "₹500 Gift Card"
          description: v.optional(v.string()), // Additional details
        })
      )
    )),
    // Results
    isResultsPublished: v.optional(v.boolean()), // has admin announced results?
    resultsAnnouncedAt: v.optional(v.number()), // when results were announced
    // Questions
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        marks: v.number(),
        explanation: v.string(),
        subject: v.optional(v.string()), // matches syllabus category
      })
    ),
    isActive: v.boolean(), // Admin can deactivate
    testType: v.optional(v.string()), // "weekly" | "monthly" (legacy)
    weekStart: v.optional(v.string()), // legacy field
    createdBy: v.optional(v.id("users")), // Admin who created
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_live", ["liveAt"])
    .index("by_expires", ["expiresAt"]),

  weeklyTestResults: defineTable({
    userId: v.id("users"),
    testId: v.id("weeklyTests"),
    score: v.number(),
    totalMarks: v.number(),
    percentage: v.number(),
    answers: v.array(v.number()), // user-selected indices
    timeTaken: v.number(), // seconds
    xpEarned: v.number(),
    month: v.optional(v.string()), // "YYYY-MM" for monthly leaderboard
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_test", ["userId", "testId"])
    .index("by_test_score", ["testId", "percentage"])
    .index("by_month", ["month"]),

  // ────────────────── Winners / Prizes (admin-managed) ──────────────────
  winners: defineTable({
    testId: v.optional(v.id("weeklyTests")), // Link to specific test
    userId: v.optional(v.id("users")), // Link to user
    userName: v.string(),
    userImageUrl: v.optional(v.string()),
    prize: v.string(), // "iPad M3 Pro", "MacBook Air", etc.
    prizeEmoji: v.string(), // "💻", "📱"
    week: v.string(), // "2026-W06"
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),

  // ────────────────── Leaderboard (computed weekly / all-time) ──────────────────
  leaderboardEntries: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    userClass: v.number(),
    userGroup: v.string(),
    totalXp: v.number(),
    weeklyXp: v.number(),
    rank: v.optional(v.number()),
    period: v.string(), // "all-time" | "2026-W06"
    updatedAt: v.number(),
  })
    .index("by_period_xp", ["period", "totalXp"])
    .index("by_user_period", ["userId", "period"]),

  // ────────── Keep existing tables ──────────

  // Daily English content (legacy — still used by DailyEnglishScreen)
  dailyEnglish: defineTable({
    group: v.string(),
    date: v.string(),
    word1: v.string(),
    synonym1: v.string(),
    antonym1: v.string(),
    sentence1: v.string(),
    word2: v.string(),
    synonym2: v.string(),
    antonym2: v.string(),
    sentence2: v.string(),
    word3: v.string(),
    synonym3: v.string(),
    antonym3: v.string(),
    sentence3: v.string(),
    structureTitle: v.string(),
    structureRule: v.string(),
    structureExamples: v.string(),
    practiceQuestion: v.string(),
    correctAnswer: v.string(),
    createdAt: v.number(),
  })
    .index("by_group_date", ["group", "date"])
    .index("by_date", ["date"]),

  userDailyProgress: defineTable({
    userId: v.id("users"),
    date: v.string(),
    completed: v.boolean(),
    streakDay: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(), // "coding", "english", "abacus", "vedic", "ai"
    group: v.optional(v.string()), // "junior", "intermediate", "senior" - for English courses
    level: v.string(),
    totalLessons: v.number(),
    estimatedDuration: v.string(),
    thumbnail: v.optional(v.string()),
    icon: v.optional(v.string()), // New: separate icon (e.g., specific svg/png)
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_category_group", ["category", "group"]),

  // English Lessons - Interactive lessons like Duolingo
  englishLessons: defineTable({
    courseId: v.id("courses"), // Required link to an English course
    sectionId: v.optional(v.id("sections")), // link to section
    group: v.string(), // "junior", "intermediate", "senior"
    title: v.string(),
    description: v.string(),
    order: v.number(),
    isActive: v.boolean(),
    xpReward: v.number(),
    // Interactive content blocks
    content: v.array(
      v.object({
        type: v.string(), // "rule", "example", "pronunciation", "tip", "highlight"
        title: v.optional(v.string()),
        content: v.string(),
        pronunciation: v.optional(v.string()), // For TTS - phonetic spelling
        audioText: v.optional(v.string()), // Text to speak via TTS
        emoji: v.optional(v.string()),
        examples: v.optional(v.array(v.string())),
      })
    ),
    // Interactive quiz questions
    questions: v.array(
      v.object({
        type: v.string(), // "mcq", "fillBlank", "arrange", "match", "listen"
        question: v.string(),
        audioText: v.optional(v.string()), // For listen-type questions (TTS)
        options: v.optional(v.array(v.string())),
        correctIndex: v.optional(v.number()), // For MCQ
        correctAnswer: v.optional(v.string()), // For fillBlank
        correctOrder: v.optional(v.array(v.string())), // For arrange
        pairs: v.optional(v.array(v.object({ // For match type
          left: v.string(),
          right: v.string(),
        }))),
        explanation: v.string(),
        hint: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_group_order", ["group", "order"])
    .index("by_course", ["courseId"])
    .index("by_course_order", ["courseId", "order"]),

  // Track English lesson progress
  englishLessonProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("englishLessons"),
    completed: v.boolean(),
    score: v.number(), // 0-100
    answersCorrect: v.number(),
    answersTotal: v.number(),
    xpEarned: v.number(),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  // ────────────────── Course Sections (For grouping lessons) ──────────────────
  sections: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
  })
    .index("by_course", ["courseId"]),

  courseLessons: defineTable({
    courseId: v.id("courses"),
    order: v.number(),
    title: v.string(),
    content: v.string(),
    videoUrl: v.optional(v.string()),
    duration: v.string(),
    hasAssessment: v.boolean(),
    assessmentQuestions: v.optional(
      v.array(
        v.object({
          question: v.string(),
          options: v.array(v.string()),
          correctAnswer: v.number(),
        })
      )
    ),
    createdAt: v.number(),
  }).index("by_course", ["courseId"]),

  courseProgress: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("courseLessons"),
    completed: v.boolean(),
    score: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    certificateUrl: v.string(),
    certificateId: v.string(),
    issuedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_certificate_id", ["certificateId"]),

  // ────────────────── Coding Challenges (LeetCode-style) ──────────────────
  // Categories for organizing challenges
  challengeCategories: defineTable({
    name: v.string(), // "Arrays", "Strings", "Dynamic Programming", etc.
    slug: v.string(), // "arrays", "strings", "dynamic-programming"
    description: v.string(),
    icon: v.optional(v.string()), // emoji or icon name
    order: v.number(), // display order
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // Coding Challenges
  codingChallenges: defineTable({
    categoryId: v.optional(v.id("challengeCategories")),
    title: v.string(),
    slug: v.string(), // URL-friendly identifier
    description: v.string(), // Problem description (markdown supported)
    difficulty: v.string(), // "easy", "medium", "hard"
    points: v.number(), // Points awarded for solving
    timeLimit: v.optional(v.number()), // Time limit in seconds (optional)
    memoryLimit: v.optional(v.number()), // Memory limit in MB (optional)
    
    // User groups this challenge is suitable for (can belong to multiple groups)
    // "junior" = class 1-3, "intermediate" = class 4-6, "senior" = class 7+
    groups: v.array(v.string()), 
    
    // Problem details
    problemStatement: v.string(), // Detailed problem statement
    inputFormat: v.string(), // Input format description
    outputFormat: v.string(), // Output format description
    constraints: v.optional(v.string()), // Constraints description
    examples: v.array(
      v.object({
        input: v.string(),
        output: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    
    // Starter code templates for different languages
    starterCode: v.object({
      python: v.optional(v.string()),
      javascript: v.optional(v.string()),
      java: v.optional(v.string()),
      cpp: v.optional(v.string()),
    }),
    
    // Function signature info for code validation
    functionSignature: v.object({
      python: v.optional(v.string()),
      javascript: v.optional(v.string()),
      java: v.optional(v.string()),
      cpp: v.optional(v.string()),
    }),
    
    // Hints (progressive hints)
    hints: v.optional(v.array(v.string())),
    
    // Tags for search/filter
    tags: v.optional(v.array(v.string())),
    
    // Stats
    totalSubmissions: v.optional(v.number()),
    successfulSubmissions: v.optional(v.number()),
    acceptanceRate: v.optional(v.number()),
    
    isActive: v.boolean(),
    order: v.number(), // Order within category
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_difficulty", ["difficulty"])
    .index("by_active", ["isActive"]),

  // Test cases for challenges (hidden from users)
  challengeTestCases: defineTable({
    challengeId: v.id("codingChallenges"),
    input: v.string(),
    expectedOutput: v.string(),
    isHidden: v.boolean(), // Hidden test cases are not shown to users
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_challenge", ["challengeId"]),

  // User submissions for challenges
  challengeSubmissions: defineTable({
    userId: v.id("users"),
    challengeId: v.id("codingChallenges"),
    language: v.string(), // "python", "javascript", "java", "cpp"
    code: v.string(),
    status: v.string(), // "pending", "running", "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compile_error"
    
    // Test case results
    testResults: v.optional(v.array(
      v.object({
        testCaseId: v.optional(v.id("challengeTestCases")),
        input: v.string(),
        expectedOutput: v.string(),
        actualOutput: v.optional(v.string()),
        passed: v.boolean(),
        timeTaken: v.optional(v.number()), // ms
        memoryUsed: v.optional(v.number()), // KB
        error: v.optional(v.string()),
      })
    )),
    
    // Summary stats
    totalTestCases: v.number(),
    passedTestCases: v.number(),
    executionTime: v.optional(v.number()), // Total execution time in ms
    memoryUsed: v.optional(v.number()), // Peak memory in KB
    
    // Points and XP
    pointsEarned: v.number(),
    xpEarned: v.number(),
    
    submittedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user_challenge", ["userId", "challengeId"])
    .index("by_status", ["status"]),

  // Track which challenges user has solved
  userChallengeProgress: defineTable({
    userId: v.id("users"),
    challengeId: v.id("codingChallenges"),
    solved: v.boolean(), // Has solved at least once
    bestSubmissionId: v.optional(v.id("challengeSubmissions")), // Best submission
    attempts: v.number(), // Number of attempts
    solvedAt: v.optional(v.number()), // First solve timestamp
    lastAttemptAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_challenge", ["userId", "challengeId"])
    .index("by_user_solved", ["userId", "solved"]),

  // Challenge leaderboard
  challengeLeaderboard: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    userImageUrl: v.optional(v.string()),
    totalSolved: v.number(), // Total challenges solved
    totalPoints: v.number(), // Total points earned
    easySolved: v.number(),
    mediumSolved: v.number(),
    hardSolved: v.number(),
    rank: v.optional(v.number()),
    period: v.string(), // "all-time" | "weekly-2026-W07" | "monthly-2026-02"
    updatedAt: v.number(),
  })
    .index("by_user_period", ["userId", "period"])
    .index("by_period_points", ["period", "totalPoints"])
    .index("by_period", ["period"]),

  // Challenge Discussions
  challengeDiscussions: defineTable({
    challengeId: v.id("codingChallenges"),
    userId: v.id("users"),
    userName: v.string(),
    userImageUrl: v.optional(v.string()),
    content: v.string(), // The discussion post content (markdown supported)
    parentId: v.optional(v.id("challengeDiscussions")), // For replies
    likes: v.optional(v.number()), // Number of likes
    likedBy: v.optional(v.array(v.id("users"))), // Users who liked
    isEdited: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .index("by_challenge_created", ["challengeId", "createdAt"]),

  // ────────────────── Contests ──────────────────
  // Contests with admin-controlled scheduling and access
  contests: defineTable({
    title: v.string(),
    description: v.string(),
    contestType: v.string(), // "coding" | "english_speech" | "english_essay" | "custom"
    // Multiple groups can be assigned (new field)
    groups: v.optional(v.array(v.string())), // ["junior", "intermediate", "senior"] or any combination
    // Legacy single group field (for backward compatibility)
    group: v.optional(v.string()), // "junior", "intermediate", "senior"
    // Scheduling - new fields
    liveAt: v.optional(v.number()), // ms timestamp when contest goes live
    expiresAt: v.optional(v.number()), // ms timestamp when contest expires
    // Legacy scheduling fields (for backward compatibility)
    startDate: v.optional(v.number()), // old field name
    endDate: v.optional(v.number()), // old field name
    submissionDeadline: v.optional(v.number()), // timestamp for submission deadline
    // Access control
    isPaid: v.optional(v.boolean()), // true = only for paid/pro users, false = free for all
    // Points & Evaluation
    maxPoints: v.number(), // maximum points for evaluation
    evaluationCriteria: v.optional(v.array(v.string())), // criteria for evaluation
    // Instructions
    instructions: v.optional(v.string()), // Instructions for participants
    requirements: v.optional(v.string()), // specific requirements
    // Custom form fields for participation
    formFields: v.optional(v.array(
      v.object({
        id: v.string(), // unique field identifier
        label: v.string(), // field label shown to user
        type: v.string(), // "text" | "textarea" | "url" | "file" | "select" | "number"
        placeholder: v.optional(v.string()), // placeholder text
        required: v.boolean(), // is field required
        options: v.optional(v.array(v.string())), // for select type
        maxLength: v.optional(v.number()), // max character length
        helpText: v.optional(v.string()), // help text shown below field
      })
    )),
    // Rewards (for paid contests) - can be string (legacy) or array (new)
    rewards: v.optional(v.union(
      v.string(), // legacy format
      v.array(
        v.object({
          rank: v.number(), // 1, 2, 3
          title: v.string(), // "1st Place"
          prize: v.string(), // "₹500 Gift Card"
          description: v.optional(v.string()), // Additional details
        })
      )
    )),
    // Results
    isResultsPublished: v.optional(v.boolean()), // has admin announced results?
    resultsAnnouncedAt: v.optional(v.number()), // when results were announced
    status: v.optional(v.string()), // "upcoming" | "live" | "evaluation" | "completed"
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_type", ["contestType"])
    .index("by_live", ["liveAt"])
    .index("by_expires", ["expiresAt"]),

  // ────────────────── Contest Submissions ──────────────────
  contestSubmissions: defineTable({
    contestId: v.id("contests"),
    userId: v.id("users"),
    // Form response data (key-value pairs matching formFields)
    formResponses: v.optional(v.array(
      v.object({
        fieldId: v.string(), // matches formField id
        fieldLabel: v.optional(v.string()), // field label for display
        value: v.string(), // user's response
      })
    )),
    // Legacy fields for backward compatibility
    submissionUrl: v.optional(v.string()), // URL for project/video/pdf
    submissionType: v.optional(v.string()), // "project_url" | "youtube_url" | "pdf_url"
    notes: v.optional(v.string()), // additional notes from user
    // Evaluation
    marks: v.optional(v.number()), // marks given by admin
    feedback: v.optional(v.string()), // feedback from admin
    rank: v.optional(v.number()), // final rank
    evaluatedBy: v.optional(v.id("users")), // admin who evaluated
    evaluatedAt: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_contest", ["contestId"])
    .index("by_user", ["userId"])
    .index("by_contest_user", ["contestId", "userId"])
    .index("by_contest_rank", ["contestId", "rank"]),
});
