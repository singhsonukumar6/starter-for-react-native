import { mutation } from "./_generated/server";

/**
 * Seed Script — Populates every table with starter English content.
 * Groups: junior (class 1-3), intermediate (class 4-6), senior (class 7-10)
 * Run: npx convex run seed:seed
 */
export const seed = mutation({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const groups = ["junior", "intermediate", "senior"];

    // ──────────── 1. DAILY ENGLISH (per group) ────────────

    const dailyByGroup: Record<string, any> = {
      junior: {
        word1: "Brave", synonym1: "Courageous", antonym1: "Cowardly",
        sentence1: "The brave little girl saved the kitten from the tree.",
        word2: "Gentle", synonym2: "Soft", antonym2: "Rough",
        sentence2: "He was gentle while holding the baby rabbit.",
        word3: "Bright", synonym3: "Shining", antonym3: "Dull",
        sentence3: "The bright sun made the flowers bloom.",
        structureTitle: "Simple Sentences",
        structureRule: "Subject + Verb + Object",
        structureExamples: "1. The cat drinks milk.\n2. Riya plays football.\n3. Birds fly in the sky.",
        practiceQuestion: 'Make a sentence using: "The dog ___."',
        correctAnswer: "The dog runs fast.",
      },
      intermediate: {
        word1: "Perseverance", synonym1: "Determination", antonym1: "Laziness",
        sentence1: "With perseverance, she finally solved the math problem.",
        word2: "Abundant", synonym2: "Plentiful", antonym2: "Scarce",
        sentence2: "The garden had an abundant supply of fresh vegetables.",
        word3: "Reluctant", synonym3: "Hesitant", antonym3: "Eager",
        sentence3: "He was reluctant to speak in front of the entire school.",
        structureTitle: "Compound Sentences",
        structureRule: "Independent Clause + Conjunction (and, but, or, so) + Independent Clause",
        structureExamples: "1. I wanted to play, but it started raining.\n2. She studied hard, so she passed the exam.\n3. You can read a book, or you can watch a movie.",
        practiceQuestion: 'Join using a conjunction: "I was hungry. I ate lunch."',
        correctAnswer: "I was hungry, so I ate lunch.",
      },
      senior: {
        word1: "Ephemeral", synonym1: "Transient", antonym1: "Permanent",
        sentence1: "The beauty of cherry blossoms is ephemeral, lasting only a few weeks.",
        word2: "Pragmatic", synonym2: "Practical", antonym2: "Idealistic",
        sentence2: "She took a pragmatic approach to solving the complex problem.",
        word3: "Ambivalent", synonym3: "Uncertain", antonym3: "Decisive",
        sentence3: "He felt ambivalent about leaving his hometown for college.",
        structureTitle: "Complex Sentences with Subordinating Conjunctions",
        structureRule: "Subordinating Conjunction + Dependent Clause, Independent Clause",
        structureExamples: "1. Although it was raining, the match continued.\n2. She succeeded because she never gave up.\n3. Unless you study regularly, you won't score well.",
        practiceQuestion: 'Rewrite using "Although": "It was cold. We went for a walk."',
        correctAnswer: "Although it was cold, we went for a walk.",
      },
    };

    for (const group of groups) {
      const existing = await ctx.db.query("dailyEnglish")
        .withIndex("by_group_date", (q) => q.eq("group", group).eq("date", today)).first();
      if (!existing) {
        await ctx.db.insert("dailyEnglish", { group, date: today, ...dailyByGroup[group], createdAt: Date.now() });
      }
    }

    // ──────────── 2. WORD OF THE DAY (per group) ────────────

    const wordsByGroup: Record<string, any> = {
      junior: {
        word: "Curious", meaning: "Wanting to know or learn something new.",
        partOfSpeech: "Adjective", pronunciation: "KYOO-ree-uhs",
        synonym: "Eager", antonym: "Uninterested",
        exampleSentence: "The curious monkey opened every box to see what was inside.",
        funFact: "Did you know? Curious cats helped scientists discover that cats can see in near-total darkness!",
      },
      intermediate: {
        word: "Resilient", meaning: "Able to recover quickly from difficult situations.",
        partOfSpeech: "Adjective", pronunciation: "rih-ZIL-ee-uhnt",
        synonym: "Tough", antonym: "Fragile",
        exampleSentence: "The resilient farmers rebuilt their homes after the flood.",
        funFact: "Bamboo is one of the most resilient plants — it can grow up to 91 cm in a single day!",
      },
      senior: {
        word: "Serendipity", meaning: "The occurrence of finding valuable things by chance.",
        partOfSpeech: "Noun", pronunciation: "sehr-uhn-DIP-ih-tee",
        synonym: "Fortune", antonym: "Misfortune",
        exampleSentence: "It was pure serendipity that he discovered the old manuscript in a second-hand bookshop.",
        funFact: "The word 'serendipity' was coined in 1754 by Horace Walpole, inspired by the Persian fairy tale 'The Three Princes of Serendip'.",
      },
    };

    for (const group of groups) {
      const existing = await ctx.db.query("wordOfTheDay")
        .withIndex("by_group_date", (q) => q.eq("group", group).eq("date", today)).first();
      if (!existing) {
        await ctx.db.insert("wordOfTheDay", { date: today, group, ...wordsByGroup[group], createdAt: Date.now() });
      }
    }

    // ──────────── 3. SENTENCE OF THE DAY (per group) ────────────

    const sentencesByGroup: Record<string, any> = {
      junior: {
        structureName: "Simple Present Tense",
        formula: "Subject + Verb (s/es) + Object",
        explanation: "We use simple present tense to talk about habits, routines, and facts.",
        examples: ["She reads books every evening.", "The sun rises in the east.", "They play football on Sundays."],
        practicePrompt: "Write a sentence about what you do every morning!",
      },
      intermediate: {
        structureName: "Present Perfect Tense",
        formula: "Subject + has/have + Past Participle",
        explanation: "We use present perfect to talk about actions that happened in the past but are still relevant now.",
        examples: ["I have finished my homework.", "She has visited Jaipur three times.", "We have known each other since childhood."],
        practicePrompt: "Write a sentence about something you have achieved this year!",
      },
      senior: {
        structureName: "Conditional Sentences (Type 2)",
        formula: "If + Subject + Past Simple, Subject + would + Base Verb",
        explanation: "Type 2 conditionals express hypothetical or unlikely situations in the present or future.",
        examples: ["If I won the lottery, I would travel the world.", "If she studied harder, she would top the class.", "If we had more time, we would learn French."],
        practicePrompt: "Write a Type 2 conditional about something you wish you could do!",
      },
    };

    for (const group of groups) {
      const existing = await ctx.db.query("sentenceOfTheDay")
        .withIndex("by_group_date", (q) => q.eq("group", group).eq("date", today)).first();
      if (!existing) {
        await ctx.db.insert("sentenceOfTheDay", { date: today, group, ...sentencesByGroup[group], createdAt: Date.now() });
      }
    }

    // ──────────── 4. ENGLISH MICROLEARNING LESSONS (3 per group) ────────────

    const lessonData: {
      group: string; title: string; description: string; order: number;
      xpReward: number; content: any[]; questions: any[];
    }[] = [
      // ── Junior (Class 1-3) ──
      {
        group: "junior", title: "Nouns — Naming Words", order: 1, xpReward: 20,
        description: "Learn what nouns are and how they name people, places, and things!",
        content: [
          { type: "text", title: "What is a Noun?", content: "A noun is a word that names a person, place, thing, or animal. Everything around you has a name — that name is a noun!", emoji: "📝" },
          { type: "example", title: "Examples of Nouns", content: "Person: teacher, mother, doctor\nPlace: school, park, India\nThing: book, pencil, ball\nAnimal: dog, cat, parrot", emoji: "💡" },
          { type: "tip", title: "How to Find a Noun", content: "Ask: Can I put 'a', 'an', or 'the' before this word?\n✅ a ball, an apple, the river\n❌ a happy, a run", emoji: "⭐" },
          { type: "highlight", title: "Remember!", content: "Every sentence needs at least one noun. Without nouns, we can't talk about anything!", emoji: "🔥" },
        ],
        questions: [
          { question: "Which of these is a noun?", options: ["Run", "Beautiful", "School", "Quickly"], correctIndex: 2, explanation: "'School' names a place — it's a noun." },
          { question: "Find the noun: 'The cat sat on the mat.'", options: ["sat", "on", "cat", "the"], correctIndex: 2, explanation: "'Cat' names an animal — it's a noun." },
          { question: "Which sentence has TWO nouns?", options: ["She runs fast.", "The dog ate a bone.", "He is tall.", "They sing well."], correctIndex: 1, explanation: "'Dog' and 'bone' are both nouns." },
        ],
      },
      {
        group: "junior", title: "Verbs — Action Words", order: 2, xpReward: 20,
        description: "Discover the words that bring sentences to life!",
        content: [
          { type: "text", title: "What is a Verb?", content: "A verb is a doing word. It tells us what someone or something does.\nExamples: run, jump, eat, sleep, sing", emoji: "🏃" },
          { type: "example", title: "Verbs in Sentences", content: "Riya reads a book. (reads = verb)\nThe bird flies high. (flies = verb)\nWe eat lunch at 1 PM. (eat = verb)", emoji: "💡" },
          { type: "tip", title: "Finding Verbs", content: "Ask: What is the person/thing DOING?\n'The boy kicks the ball.' → kicks is the verb!", emoji: "⭐" },
          { type: "highlight", title: "Fun Fact!", content: "The most used verb in English is 'be' (am, is, are, was, were). You use it every single day!", emoji: "🔥" },
        ],
        questions: [
          { question: "Which word is a verb?", options: ["Happy", "Jump", "Table", "Blue"], correctIndex: 1, explanation: "'Jump' shows an action — it's a verb." },
          { question: "Find the verb: 'She reads a book.'", options: ["She", "reads", "a", "book"], correctIndex: 1, explanation: "'Reads' tells us what she does." },
          { question: "Which is NOT a verb?", options: ["Swim", "Flower", "Write", "Dance"], correctIndex: 1, explanation: "'Flower' is a thing (noun), not an action." },
        ],
      },
      {
        group: "junior", title: "Adjectives — Describing Words", order: 3, xpReward: 25,
        description: "Make your sentences colourful with describing words!",
        content: [
          { type: "text", title: "What is an Adjective?", content: "An adjective describes a noun. It tells us size, colour, shape, or feeling.\nExamples: big, red, round, happy", emoji: "🎨" },
          { type: "example", title: "Adjectives in Use", content: "a tall building\na red apple\na happy child\nan old book", emoji: "💡" },
          { type: "tip", title: "Where Do Adjectives Go?", content: "Before the noun: 'a beautiful flower'\nAfter is/am/are: 'The flower is beautiful.'", emoji: "⭐" },
          { type: "highlight", title: "Power Up!", content: "Compare:\n'I saw a dog.' 😐\n'I saw a tiny, fluffy, brown dog.' 🐶✨\nAdjectives paint pictures with words!", emoji: "🔥" },
        ],
        questions: [
          { question: "Which word is an adjective?", options: ["Run", "Tall", "Book", "She"], correctIndex: 1, explanation: "'Tall' describes how something looks." },
          { question: "Find the adjective: 'The small cat slept.'", options: ["The", "small", "cat", "slept"], correctIndex: 1, explanation: "'Small' describes the cat." },
          { question: "Choose the correct sentence:", options: ["She happy is.", "The quick dog ran.", "He big very is.", "Runs she fast."], correctIndex: 1, explanation: "'Quick' correctly describes 'dog' — adjective before noun!" },
        ],
      },
      // ── Intermediate (Class 4-6) ──
      {
        group: "intermediate", title: "Tenses — Past, Present, Future", order: 1, xpReward: 25,
        description: "Master the three main tenses and express time like a pro!",
        content: [
          { type: "text", title: "Understanding Tenses", content: "Tenses tell us WHEN something happens.\n\nPast → already happened\nPresent → happening now\nFuture → will happen later", emoji: "⏰" },
          { type: "example", title: "Same Action, Different Times", content: "Past: I played cricket yesterday.\nPresent: I play cricket every day.\nFuture: I will play cricket tomorrow.", emoji: "💡" },
          { type: "tip", title: "Signal Words", content: "Past: yesterday, last week, ago\nPresent: today, every day, always\nFuture: tomorrow, next week, will", emoji: "⭐" },
          { type: "highlight", title: "Why Tenses Matter", content: "Wrong tense = confusing sentence!\n❌ 'I will eat lunch yesterday.'\n✅ 'I ate lunch yesterday.'\nAlways match tense to time!", emoji: "🔥" },
        ],
        questions: [
          { question: "Which sentence is in past tense?", options: ["I will go.", "She walks daily.", "They played football.", "He is reading."], correctIndex: 2, explanation: "'Played' is past tense — it already happened." },
          { question: "Identify the future tense:", options: ["She sang beautifully.", "They will arrive soon.", "We eat lunch.", "I am studying."], correctIndex: 1, explanation: "'Will arrive' = something that hasn't happened yet." },
          { question: "'She ___ (write) every day.' — correct form?", options: ["wrote", "writes", "will write", "written"], correctIndex: 1, explanation: "'Writes' is simple present for she/he/it (add -s)." },
        ],
      },
      {
        group: "intermediate", title: "Active & Passive Voice", order: 2, xpReward: 30,
        description: "Learn how to flip sentences between active and passive!",
        content: [
          { type: "text", title: "Active vs Passive", content: "Active: The subject DOES the action.\nPassive: The subject RECEIVES the action.\n\nActive: The cat caught the mouse.\nPassive: The mouse was caught by the cat.", emoji: "🔄" },
          { type: "example", title: "More Examples", content: "Active: She writes a letter.\nPassive: A letter is written by her.\n\nActive: They built a house.\nPassive: A house was built by them.", emoji: "💡" },
          { type: "tip", title: "How to Convert", content: "Step 1: Find the object → make it subject\nStep 2: Add was/were/is/are + past participle\nStep 3: Add 'by' + original subject", emoji: "⭐" },
          { type: "highlight", title: "When to Use Passive", content: "Use passive when:\n• Doer unknown: 'The window was broken.'\n• Action matters more: 'The Taj Mahal was built in 1632.'", emoji: "🔥" },
        ],
        questions: [
          { question: "Which is passive voice?", options: ["She reads books.", "The cake was eaten by him.", "They play games.", "I wrote a poem."], correctIndex: 1, explanation: "'Cake' receives the action — that's passive." },
          { question: "Convert: 'She painted a picture.'", options: ["A picture was painted by her.", "She was painted.", "A picture painted she.", "Painted was a picture."], correctIndex: 0, explanation: "Object → subject, add 'was painted' + 'by her'." },
          { question: "Which is active voice?", options: ["The song was sung.", "The ball was kicked.", "He teaches maths.", "The book was read."], correctIndex: 2, explanation: "'He teaches' — subject performs the action directly." },
        ],
      },
      {
        group: "intermediate", title: "Prepositions — Connecting Words", order: 3, xpReward: 25,
        description: "Master in, on, at and more linking words!",
        content: [
          { type: "text", title: "What Are Prepositions?", content: "Prepositions show the relationship between a noun and other words. They tell us WHERE, WHEN, or HOW.", emoji: "🔗" },
          { type: "example", title: "Common Prepositions", content: "Place: in, on, at, under, beside, between\nTime: at, on, in, during, after, before\nDirection: to, from, into, towards", emoji: "💡" },
          { type: "tip", title: "In, On, At — The Tricky Trio", content: "IN: months, years, countries → in July, in 2026, in India\nON: days, dates → on Monday, on 15th August\nAT: time, places → at 5 PM, at school", emoji: "⭐" },
          { type: "highlight", title: "Common Mistakes", content: "❌ 'I am waiting since 2 hours.'\n✅ 'I have been waiting for 2 hours.'\n\nUse 'for' with duration, 'since' with a point in time.", emoji: "🔥" },
        ],
        questions: [
          { question: "'The book is ___ the table.'", options: ["in", "on", "at", "to"], correctIndex: 1, explanation: "'On' is used when something is on a surface." },
          { question: "'She arrived ___ Monday.'", options: ["in", "at", "on", "by"], correctIndex: 2, explanation: "We use 'on' with days of the week." },
          { question: "'The cat is ___ the bed.'", options: ["on", "at", "under", "to"], correctIndex: 2, explanation: "'Under' means below something." },
        ],
      },
      // ── Senior (Class 7-10) ──
      {
        group: "senior", title: "Direct & Indirect Speech", order: 1, xpReward: 30,
        description: "Master reporting what someone said — accurately!",
        content: [
          { type: "text", title: "Direct vs Indirect Speech", content: "Direct Speech: The exact words spoken, in quotes.\nIndirect Speech: Reporting what was said without quotes, with tense changes.", emoji: "🗣️" },
          { type: "example", title: "Conversion Examples", content: "Direct: He said, 'I am happy.'\nIndirect: He said that he was happy.\n\nDirect: She said, 'I will come tomorrow.'\nIndirect: She said that she would come the next day.", emoji: "💡" },
          { type: "tip", title: "Key Changes", content: "Tense shifts back:\nam/is → was, are → were\nwill → would, can → could\n\nTime words change:\ntoday → that day, tomorrow → the next day", emoji: "⭐" },
          { type: "highlight", title: "Exceptions!", content: "Don't change tense for universal truths:\nDirect: He said, 'The earth revolves around the sun.'\nIndirect: He said that the earth revolves around the sun.", emoji: "🔥" },
        ],
        questions: [
          { question: "Convert: He said, 'I am tired.'", options: ["He said that I am tired.", "He said that he was tired.", "He said that he is tired.", "He said I was tired."], correctIndex: 1, explanation: "'I am' changes to 'he was' — pronoun + tense change." },
          { question: "In indirect speech, 'tomorrow' becomes:", options: ["today", "the next day", "yesterday", "that day"], correctIndex: 1, explanation: "'Tomorrow' becomes 'the next day' in indirect speech." },
          { question: "We DON'T change tense when:", options: ["Speaker is angry", "Sentence is long", "It's a universal truth", "It's about the future"], correctIndex: 2, explanation: "Universal truths keep their original tense." },
        ],
      },
      {
        group: "senior", title: "Phrasal Verbs — Advanced", order: 2, xpReward: 35,
        description: "Sound like a native speaker with essential phrasal verbs.",
        content: [
          { type: "text", title: "What Are Phrasal Verbs?", content: "A phrasal verb = verb + preposition/adverb with a NEW meaning.\n\n'Give' = to hand something\n'Give up' = to quit\n'Give in' = to surrender", emoji: "🧩" },
          { type: "example", title: "Essential Phrasal Verbs", content: "Look up: search for information\nBreak down: stop functioning\nFigure out: understand\nCome across: find by chance\nTurn out: result in\nPut off: postpone", emoji: "💡" },
          { type: "tip", title: "Separable vs Inseparable", content: "Separable: 'Turn off the light' OR 'Turn the light off' ✅\nInseparable: 'Look after children' ✅ NOT 'Look children after' ❌", emoji: "⭐" },
          { type: "highlight", title: "Why Learn Them?", content: "Native speakers use phrasal verbs constantly. Mastering them makes your English sound natural and fluent!", emoji: "🔥" },
        ],
        questions: [
          { question: "'Put off' means:", options: ["Remove", "Postpone", "Decorate", "Throw away"], correctIndex: 1, explanation: "'Put off' means to postpone or delay." },
          { question: "'I came across an old photo.' means:", options: ["Destroyed it", "Crossed over it", "Found it by chance", "Looked at it carefully"], correctIndex: 2, explanation: "'Come across' = find something unexpectedly." },
          { question: "Which is correct?", options: ["She looked the word up.", "He ran away from.", "Look children after.", "Turn off it."], correctIndex: 0, explanation: "'Looked up' is separable — object can go in between." },
        ],
      },
      {
        group: "senior", title: "Essay Writing — Structure & Flow", order: 3, xpReward: 35,
        description: "Write essays that impress examiners and readers alike.",
        content: [
          { type: "text", title: "The 5-Paragraph Essay", content: "1. Introduction → Hook + Background + Thesis\n2. Body 1 → Main argument + Evidence\n3. Body 2 → Supporting point + Examples\n4. Body 3 → Counter-argument + Rebuttal\n5. Conclusion → Restate thesis + Call to action", emoji: "📝" },
          { type: "example", title: "Strong Introduction", content: "Hook types:\n• Surprising fact: 'India produces 25% of the world's software engineers.'\n• Question: 'What if every child had access to quality education?'\n• Quote: 'Education is the most powerful weapon.' — Mandela", emoji: "💡" },
          { type: "tip", title: "Transition Words", content: "Adding: Furthermore, Moreover, In addition\nContrast: However, Nevertheless, On the other hand\nConclusion: In conclusion, Ultimately, To summarise\n\nTransitions = glue between paragraphs!", emoji: "⭐" },
          { type: "highlight", title: "Common Mistakes", content: "1. Starting with 'I think...' → Show, don't tell\n2. Using informal language\n3. No clear thesis\n4. Weak conclusion\n5. Repeating words → Use synonyms!", emoji: "🔥" },
        ],
        questions: [
          { question: "What should the introduction contain?", options: ["Counter-arguments", "Evidence and data", "Hook, background, and thesis", "Summary of all points"], correctIndex: 2, explanation: "Introduction = Hook + Background + Thesis." },
          { question: "Which transition shows contrast?", options: ["Moreover", "Furthermore", "However", "Firstly"], correctIndex: 2, explanation: "'However' signals an opposing idea." },
          { question: "A strong thesis statement is:", options: ["Dogs are nice.", "In this essay I will discuss...", "Regular exercise significantly improves mental health.", "Exercise is good."], correctIndex: 2, explanation: "Specific, arguable, and clearly states the main point." },
        ],
      },
    ];

    for (const l of lessonData) {
      const existingLessons = await ctx.db.query("lessons")
        .withIndex("by_category_group", (q) => q.eq("category", "english").eq("group", l.group))
        .collect();
      const exists = existingLessons.find((ex) => ex.title === l.title);
      if (!exists) {
        await ctx.db.insert("lessons", {
          category: "english", group: l.group, title: l.title,
          description: l.description, order: l.order, isActive: true,
          xpReward: l.xpReward, content: l.content, questions: l.questions,
          createdAt: Date.now(),
        });
      }
    }

    // ──────────── 5. WEEKLY TESTS — 50 questions per group ────────────
    const sundayDate = getSunday(new Date()).toISOString().split("T")[0];
    const now = Date.now();
    // Make test available now for seeding, ends in 24 hours
    const availableAt = now;
    const endsAt = now + 24 * 60 * 60 * 1000;
    const syllabus = ["Current Affairs", "Maths", "English", "GK", "Miscellaneous"];
    // Note: rewards are now structured as array of objects, defined below

    const juniorQuestions = [
      // Current Affairs (10)
      { question: "Which country hosted the 2024 Olympics?", options: ["India", "France", "USA", "Japan"], correctIndex: 1, marks: 2, explanation: "The 2024 Olympics were held in Paris, France.", subject: "Current Affairs" },
      { question: "Who is the President of India in 2025?", options: ["Narendra Modi", "Droupadi Murmu", "Ram Nath Kovind", "Pranab Mukherjee"], correctIndex: 1, marks: 2, explanation: "Droupadi Murmu is the current President.", subject: "Current Affairs" },
      { question: "What is India's space agency called?", options: ["NASA", "ISRO", "ESA", "JAXA"], correctIndex: 1, marks: 2, explanation: "ISRO = Indian Space Research Organisation.", subject: "Current Affairs" },
      { question: "Which festival is called the 'Festival of Lights'?", options: ["Holi", "Diwali", "Eid", "Christmas"], correctIndex: 1, marks: 2, explanation: "Diwali is known as the Festival of Lights.", subject: "Current Affairs" },
      { question: "Republic Day is celebrated on:", options: ["15 August", "26 January", "2 October", "14 November"], correctIndex: 1, marks: 2, explanation: "Republic Day = 26 January.", subject: "Current Affairs" },
      { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2, marks: 2, explanation: "Mercury is the closest planet to the Sun.", subject: "Current Affairs" },
      { question: "What is the currency of Japan?", options: ["Dollar", "Euro", "Yen", "Rupee"], correctIndex: 2, marks: 2, explanation: "Japan uses the Yen.", subject: "Current Affairs" },
      { question: "Who invented the telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Albert Einstein"], correctIndex: 1, marks: 2, explanation: "Alexander Graham Bell invented the telephone.", subject: "Current Affairs" },
      { question: "What does WHO stand for?", options: ["World Help Organization", "World Health Organization", "Wide Health Office", "World Hospital Organization"], correctIndex: 1, marks: 2, explanation: "WHO = World Health Organization.", subject: "Current Affairs" },
      { question: "Which Indian cricketer is called 'Master Blaster'?", options: ["Virat Kohli", "MS Dhoni", "Sachin Tendulkar", "Rohit Sharma"], correctIndex: 2, marks: 2, explanation: "Sachin Tendulkar is the Master Blaster.", subject: "Current Affairs" },
      // Maths (10)
      { question: "What is 15 + 27?", options: ["42", "41", "43", "40"], correctIndex: 0, marks: 2, explanation: "15 + 27 = 42.", subject: "Maths" },
      { question: "What is 8 × 7?", options: ["54", "56", "48", "63"], correctIndex: 1, marks: 2, explanation: "8 × 7 = 56.", subject: "Maths" },
      { question: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correctIndex: 1, marks: 2, explanation: "A hexagon has 6 sides.", subject: "Maths" },
      { question: "What is half of 64?", options: ["30", "34", "32", "36"], correctIndex: 2, marks: 2, explanation: "64 ÷ 2 = 32.", subject: "Maths" },
      { question: "Which is the smallest: 1/2, 1/3, 1/4, 1/5?", options: ["1/2", "1/3", "1/4", "1/5"], correctIndex: 3, marks: 2, explanation: "1/5 is the smallest fraction.", subject: "Maths" },
      { question: "What is 100 - 37?", options: ["63", "67", "73", "53"], correctIndex: 0, marks: 2, explanation: "100 - 37 = 63.", subject: "Maths" },
      { question: "How many minutes in 2 hours?", options: ["60", "100", "120", "90"], correctIndex: 2, marks: 2, explanation: "2 × 60 = 120 minutes.", subject: "Maths" },
      { question: "What shape has 4 equal sides?", options: ["Rectangle", "Triangle", "Square", "Circle"], correctIndex: 2, marks: 2, explanation: "A square has 4 equal sides.", subject: "Maths" },
      { question: "What comes next: 2, 4, 6, 8, ___?", options: ["9", "10", "12", "11"], correctIndex: 1, marks: 2, explanation: "Even numbers: next is 10.", subject: "Maths" },
      { question: "What is 9 × 9?", options: ["72", "81", "90", "63"], correctIndex: 1, marks: 2, explanation: "9 × 9 = 81.", subject: "Maths" },
      // English (10)
      { question: "Which word is a noun?", options: ["Happy", "Run", "Garden", "Quickly"], correctIndex: 2, marks: 2, explanation: "'Garden' is a noun — it names a place.", subject: "English" },
      { question: "What is the past tense of 'go'?", options: ["Goed", "Gone", "Went", "Going"], correctIndex: 2, marks: 2, explanation: "Past tense of 'go' is 'went'.", subject: "English" },
      { question: "Choose the correct spelling:", options: ["Beutiful", "Beautiful", "Beautifull", "Bueatiful"], correctIndex: 1, marks: 2, explanation: "Correct spelling: Beautiful.", subject: "English" },
      { question: "What is the opposite of 'hot'?", options: ["Warm", "Cool", "Cold", "Heat"], correctIndex: 2, marks: 2, explanation: "Opposite of hot is cold.", subject: "English" },
      { question: "Which is a verb?", options: ["Table", "Jump", "Pretty", "Book"], correctIndex: 1, marks: 2, explanation: "'Jump' is an action word — a verb.", subject: "English" },
      { question: "'She ___ to school every day.'", options: ["go", "goes", "going", "gone"], correctIndex: 1, marks: 2, explanation: "She goes — third person singular present.", subject: "English" },
      { question: "What is the plural of 'child'?", options: ["Childs", "Children", "Childen", "Childres"], correctIndex: 1, marks: 2, explanation: "Plural of child is children (irregular).", subject: "English" },
      { question: "Which sentence is correct?", options: ["He are happy.", "He am happy.", "He is happy.", "He be happy."], correctIndex: 2, marks: 2, explanation: "'He is' — third person singular 'is'.", subject: "English" },
      { question: "A synonym of 'big' is:", options: ["Small", "Tiny", "Large", "Short"], correctIndex: 2, marks: 2, explanation: "'Large' means the same as 'big'.", subject: "English" },
      { question: "'The cat sat ___ the mat.'", options: ["in", "on", "at", "to"], correctIndex: 1, marks: 2, explanation: "'On' is used for surfaces.", subject: "English" },
      // GK (10)
      { question: "What is the capital of India?", options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"], correctIndex: 2, marks: 2, explanation: "New Delhi is the capital of India.", subject: "GK" },
      { question: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2, marks: 2, explanation: "There are 7 continents.", subject: "GK" },
      { question: "Which animal is the king of the jungle?", options: ["Tiger", "Elephant", "Lion", "Bear"], correctIndex: 2, marks: 2, explanation: "The lion is called the king of the jungle.", subject: "GK" },
      { question: "What color are bananas when ripe?", options: ["Green", "Red", "Yellow", "Blue"], correctIndex: 2, marks: 2, explanation: "Ripe bananas are yellow.", subject: "GK" },
      { question: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2, marks: 2, explanation: "The Pacific Ocean is the largest.", subject: "GK" },
      { question: "How many days are in a week?", options: ["5", "6", "7", "10"], correctIndex: 2, marks: 2, explanation: "There are 7 days in a week.", subject: "GK" },
      { question: "What do bees make?", options: ["Milk", "Silk", "Honey", "Butter"], correctIndex: 2, marks: 2, explanation: "Bees make honey.", subject: "GK" },
      { question: "Which planet is known as the Red Planet?", options: ["Jupiter", "Mars", "Venus", "Saturn"], correctIndex: 1, marks: 2, explanation: "Mars is called the Red Planet.", subject: "GK" },
      { question: "What is the national bird of India?", options: ["Sparrow", "Eagle", "Peacock", "Parrot"], correctIndex: 2, marks: 2, explanation: "The peacock is India's national bird.", subject: "GK" },
      { question: "Who is known as the Father of the Nation in India?", options: ["Jawaharlal Nehru", "Subhash Chandra Bose", "Mahatma Gandhi", "Sardar Patel"], correctIndex: 2, marks: 2, explanation: "Mahatma Gandhi is the Father of the Nation.", subject: "GK" },
      // Miscellaneous (10)
      { question: "What is the boiling point of water?", options: ["50°C", "100°C", "150°C", "200°C"], correctIndex: 1, marks: 2, explanation: "Water boils at 100°C.", subject: "Miscellaneous" },
      { question: "How many teeth does an adult human have?", options: ["28", "30", "32", "34"], correctIndex: 2, marks: 2, explanation: "Adults have 32 teeth.", subject: "Miscellaneous" },
      { question: "Which gas do plants breathe in?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2, marks: 2, explanation: "Plants absorb CO2 for photosynthesis.", subject: "Miscellaneous" },
      { question: "Which organ pumps blood?", options: ["Brain", "Lungs", "Heart", "Liver"], correctIndex: 2, marks: 2, explanation: "The heart pumps blood through the body.", subject: "Miscellaneous" },
      { question: "What does a caterpillar become?", options: ["Spider", "Butterfly", "Bee", "Bird"], correctIndex: 1, marks: 2, explanation: "Caterpillars metamorphose into butterflies.", subject: "Miscellaneous" },
      { question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correctIndex: 2, marks: 2, explanation: "A rainbow has 7 colors: VIBGYOR.", subject: "Miscellaneous" },
      { question: "Which is the fastest land animal?", options: ["Lion", "Horse", "Cheetah", "Deer"], correctIndex: 2, marks: 2, explanation: "The cheetah can run up to 120 km/h.", subject: "Miscellaneous" },
      { question: "What is H2O?", options: ["Salt", "Sugar", "Water", "Air"], correctIndex: 2, marks: 2, explanation: "H2O is the chemical formula for water.", subject: "Miscellaneous" },
      { question: "Which instrument is used to measure temperature?", options: ["Barometer", "Thermometer", "Ruler", "Scale"], correctIndex: 1, marks: 2, explanation: "A thermometer measures temperature.", subject: "Miscellaneous" },
      { question: "What is the largest animal on Earth?", options: ["Elephant", "Giraffe", "Blue Whale", "Shark"], correctIndex: 2, marks: 2, explanation: "The blue whale is the largest animal.", subject: "Miscellaneous" },
    ];

    const intermediateQuestions = [
      // Current Affairs (10)
      { question: "Which Indian mission successfully landed on the Moon's south pole?", options: ["Mangalyaan", "Chandrayaan-3", "Gaganyaan", "Aditya-L1"], correctIndex: 1, marks: 2, explanation: "Chandrayaan-3 made a historic lunar south pole landing in 2023.", subject: "Current Affairs" },
      { question: "What is 'G20'?", options: ["A gaming platform", "Group of 20 major economies", "A satellite program", "A military alliance"], correctIndex: 1, marks: 2, explanation: "G20 = Group of 20 leading global economies.", subject: "Current Affairs" },
      { question: "Which country is building the world's largest solar park?", options: ["USA", "China", "India", "Germany"], correctIndex: 2, marks: 2, explanation: "India's Bhadla Solar Park in Rajasthan is one of the world's largest.", subject: "Current Affairs" },
      { question: "What is UPI?", options: ["Universal Payment Interface", "Unified Payments Interface", "United Payment India", "Universal Pay India"], correctIndex: 1, marks: 2, explanation: "UPI = Unified Payments Interface.", subject: "Current Affairs" },
      { question: "Which Indian state was renamed to Telangana?", options: ["It was separated from Andhra Pradesh", "From Tamil Nadu", "From Karnataka", "From Maharashtra"], correctIndex: 0, marks: 2, explanation: "Telangana was carved out of Andhra Pradesh in 2014.", subject: "Current Affairs" },
      { question: "What is the full form of AI?", options: ["Automatic Intelligence", "Artificial Intelligence", "Advanced Internet", "Auto Information"], correctIndex: 1, marks: 2, explanation: "AI = Artificial Intelligence.", subject: "Current Affairs" },
      { question: "Who is the current Prime Minister of India?", options: ["Rahul Gandhi", "Amit Shah", "Narendra Modi", "Rajnath Singh"], correctIndex: 2, marks: 2, explanation: "Narendra Modi is the PM of India.", subject: "Current Affairs" },
      { question: "Which mission studies the Sun from India?", options: ["Chandrayaan", "Mangalyaan", "Aditya-L1", "Gaganyaan"], correctIndex: 2, marks: 2, explanation: "Aditya-L1 is India's solar observation mission.", subject: "Current Affairs" },
      { question: "What is the Swachh Bharat Mission about?", options: ["Education", "Clean India", "Digital India", "Food Security"], correctIndex: 1, marks: 2, explanation: "Swachh Bharat = Clean India initiative.", subject: "Current Affairs" },
      { question: "5G stands for:", options: ["5th Game", "5th Generation", "5 Gigabytes", "5 Groups"], correctIndex: 1, marks: 2, explanation: "5G = 5th Generation of mobile networks.", subject: "Current Affairs" },
      // Maths (10)
      { question: "What is 25% of 200?", options: ["25", "50", "75", "100"], correctIndex: 1, marks: 2, explanation: "25% of 200 = (25/100) × 200 = 50.", subject: "Maths" },
      { question: "If a = 3, b = 4, what is a² + b²?", options: ["7", "12", "25", "49"], correctIndex: 2, marks: 2, explanation: "9 + 16 = 25.", subject: "Maths" },
      { question: "What is the LCM of 4 and 6?", options: ["2", "12", "24", "6"], correctIndex: 1, marks: 2, explanation: "LCM(4,6) = 12.", subject: "Maths" },
      { question: "Simplify: 3/4 + 1/4", options: ["1", "4/8", "2/4", "3/8"], correctIndex: 0, marks: 2, explanation: "3/4 + 1/4 = 4/4 = 1.", subject: "Maths" },
      { question: "Area of a rectangle with l=8, b=5:", options: ["13", "26", "40", "80"], correctIndex: 2, marks: 2, explanation: "Area = l × b = 8 × 5 = 40.", subject: "Maths" },
      { question: "What is the square root of 144?", options: ["11", "12", "13", "14"], correctIndex: 1, marks: 2, explanation: "√144 = 12.", subject: "Maths" },
      { question: "If x + 5 = 12, what is x?", options: ["5", "6", "7", "8"], correctIndex: 2, marks: 2, explanation: "x = 12 - 5 = 7.", subject: "Maths" },
      { question: "What is 15% of 400?", options: ["40", "60", "80", "45"], correctIndex: 1, marks: 2, explanation: "15% of 400 = 60.", subject: "Maths" },
      { question: "HCF of 12 and 18 is:", options: ["2", "3", "6", "9"], correctIndex: 2, marks: 2, explanation: "HCF(12,18) = 6.", subject: "Maths" },
      { question: "Perimeter of a square with side 9 cm:", options: ["18", "27", "36", "81"], correctIndex: 2, marks: 2, explanation: "P = 4 × 9 = 36 cm.", subject: "Maths" },
      // English (10)
      { question: "Convert to passive: 'She writes a letter.'", options: ["A letter is written by her.", "A letter was written.", "She is written.", "Written is a letter."], correctIndex: 0, marks: 2, explanation: "Object → subject + is + V3 + by + agent.", subject: "English" },
      { question: "Which is present perfect tense?", options: ["She writes.", "She wrote.", "She has written.", "She is writing."], correctIndex: 2, marks: 2, explanation: "Has/have + V3 = present perfect.", subject: "English" },
      { question: "'He has been waiting ___ 3 hours.'", options: ["since", "for", "from", "at"], correctIndex: 1, marks: 2, explanation: "'For' with duration.", subject: "English" },
      { question: "Which is future continuous?", options: ["I will go.", "I will be going.", "I have gone.", "I went."], correctIndex: 1, marks: 2, explanation: "will be + V-ing = future continuous.", subject: "English" },
      { question: "Choose the correct sentence:", options: ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea.", "He not like tea."], correctIndex: 2, marks: 2, explanation: "Doesn't + base form of verb.", subject: "English" },
      { question: "'Although it rained, we went out.' This is a:", options: ["Simple sentence", "Compound sentence", "Complex sentence", "Exclamatory sentence"], correctIndex: 2, marks: 2, explanation: "Complex = independent + dependent clause.", subject: "English" },
      { question: "Synonym of 'enormous':", options: ["Tiny", "Huge", "Quick", "Slow"], correctIndex: 1, marks: 2, explanation: "Enormous = huge.", subject: "English" },
      { question: "Which is an adverb?", options: ["Beautiful", "Quickly", "Beauty", "Garden"], correctIndex: 1, marks: 2, explanation: "'Quickly' modifies a verb.", subject: "English" },
      { question: "Antonym of 'ancient':", options: ["Old", "Modern", "Classical", "Historic"], correctIndex: 1, marks: 2, explanation: "Modern is the opposite of ancient.", subject: "English" },
      { question: "'I was born ___ 1990.'", options: ["on", "at", "in", "by"], correctIndex: 2, marks: 2, explanation: "'In' with years.", subject: "English" },
      // GK (10)
      { question: "Which river is the longest in India?", options: ["Yamuna", "Ganga", "Godavari", "Brahmaputra"], correctIndex: 1, marks: 2, explanation: "The Ganga is the longest river in India.", subject: "GK" },
      { question: "Who wrote the Indian national anthem?", options: ["Bankim Chandra", "Rabindranath Tagore", "Mahatma Gandhi", "Sarojini Naidu"], correctIndex: 1, marks: 2, explanation: "Tagore wrote 'Jana Gana Mana'.", subject: "GK" },
      { question: "What is the smallest state in India by area?", options: ["Goa", "Sikkim", "Tripura", "Mizoram"], correctIndex: 0, marks: 2, explanation: "Goa is the smallest state by area.", subject: "GK" },
      { question: "Which vitamin do we get from sunlight?", options: ["A", "B", "C", "D"], correctIndex: 3, marks: 2, explanation: "Sunlight provides Vitamin D.", subject: "GK" },
      { question: "The Great Wall is in which country?", options: ["Japan", "India", "China", "Korea"], correctIndex: 2, marks: 2, explanation: "The Great Wall is in China.", subject: "GK" },
      { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Silver"], correctIndex: 2, marks: 2, explanation: "Diamond is the hardest natural substance.", subject: "GK" },
      { question: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Michelangelo"], correctIndex: 2, marks: 2, explanation: "Leonardo da Vinci painted the Mona Lisa.", subject: "GK" },
      { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Neptune", "Mars"], correctIndex: 1, marks: 2, explanation: "Saturn has the most known moons.", subject: "GK" },
      { question: "What is the national flower of India?", options: ["Rose", "Lily", "Lotus", "Sunflower"], correctIndex: 2, marks: 2, explanation: "The lotus is India's national flower.", subject: "GK" },
      { question: "How many bones does a human body have?", options: ["186", "206", "226", "256"], correctIndex: 1, marks: 2, explanation: "An adult human has 206 bones.", subject: "GK" },
      // Miscellaneous (10)
      { question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correctIndex: 0, marks: 2, explanation: "CPU = Central Processing Unit.", subject: "Miscellaneous" },
      { question: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], correctIndex: 2, marks: 2, explanation: "Nitrogen makes up about 78% of the atmosphere.", subject: "Miscellaneous" },
      { question: "Speed = Distance ÷ ___", options: ["Weight", "Time", "Force", "Mass"], correctIndex: 1, marks: 2, explanation: "Speed = Distance ÷ Time.", subject: "Miscellaneous" },
      { question: "Which blood type is the universal donor?", options: ["A+", "B+", "AB+", "O-"], correctIndex: 3, marks: 2, explanation: "O- is the universal donor.", subject: "Miscellaneous" },
      { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2, marks: 2, explanation: "Au (from Latin 'Aurum') is gold.", subject: "Miscellaneous" },
      { question: "Which country is famous for the Eiffel Tower?", options: ["Italy", "Germany", "France", "Spain"], correctIndex: 2, marks: 2, explanation: "The Eiffel Tower is in Paris, France.", subject: "Miscellaneous" },
      { question: "What type of energy does the Sun provide?", options: ["Mechanical", "Chemical", "Solar/Light", "Nuclear"], correctIndex: 2, marks: 2, explanation: "The Sun provides solar (light) energy.", subject: "Miscellaneous" },
      { question: "How many states does India have (as of 2024)?", options: ["28", "29", "30", "31"], correctIndex: 0, marks: 2, explanation: "India has 28 states.", subject: "Miscellaneous" },
      { question: "What is the full form of NASA?", options: ["National Air Space Agency", "National Aeronautics and Space Administration", "North American Space Agency", "New Air Space Administration"], correctIndex: 1, marks: 2, explanation: "NASA = National Aeronautics and Space Administration.", subject: "Miscellaneous" },
      { question: "Which instrument measures earthquakes?", options: ["Barometer", "Seismograph", "Thermometer", "Anemometer"], correctIndex: 1, marks: 2, explanation: "A seismograph measures earthquakes.", subject: "Miscellaneous" },
    ];

    const seniorQuestions = [
      // Current Affairs (10)
      { question: "What is the Artemis program?", options: ["An AI project", "NASA's Moon exploration program", "India's Mars mission", "An ocean exploration project"], correctIndex: 1, marks: 2, explanation: "Artemis is NASA's program to return humans to the Moon.", subject: "Current Affairs" },
      { question: "Which country has the largest GDP?", options: ["China", "India", "USA", "Japan"], correctIndex: 2, marks: 2, explanation: "The USA has the largest GDP in the world.", subject: "Current Affairs" },
      { question: "What is COP in climate summits?", options: ["Conference of Parties", "Committee of Pollution", "Council of Protection", "Conference of Protocols"], correctIndex: 0, marks: 2, explanation: "COP = Conference of Parties (UN climate conference).", subject: "Current Affairs" },
      { question: "What is Net Zero?", options: ["Zero internet", "Zero emissions target", "Zero waste", "Zero cost energy"], correctIndex: 1, marks: 2, explanation: "Net Zero = achieving balance between emissions produced and removed.", subject: "Current Affairs" },
      { question: "Which organization regulates world trade?", options: ["WHO", "WTO", "UNESCO", "UNICEF"], correctIndex: 1, marks: 2, explanation: "WTO = World Trade Organization.", subject: "Current Affairs" },
      { question: "India's Digital India initiative focuses on:", options: ["Military", "e-Governance & digital empowerment", "Space exploration", "Agriculture only"], correctIndex: 1, marks: 2, explanation: "Digital India aims for digital infrastructure and e-governance.", subject: "Current Affairs" },
      { question: "What is blockchain technology?", options: ["A type of brick", "Decentralized digital ledger", "A social media platform", "A video game engine"], correctIndex: 1, marks: 2, explanation: "Blockchain is a decentralized, distributed digital ledger.", subject: "Current Affairs" },
      { question: "Which Indian city hosted the G20 Summit 2023?", options: ["Mumbai", "Bengaluru", "New Delhi", "Chennai"], correctIndex: 2, marks: 2, explanation: "New Delhi hosted the G20 Summit in 2023.", subject: "Current Affairs" },
      { question: "What is ChatGPT?", options: ["A video game", "An AI language model", "A social media app", "A programming language"], correctIndex: 1, marks: 2, explanation: "ChatGPT is an AI-powered language model by OpenAI.", subject: "Current Affairs" },
      { question: "Semiconductor chips are crucial because:", options: ["They taste good", "They power all electronic devices", "They generate electricity", "They purify water"], correctIndex: 1, marks: 2, explanation: "Semiconductors are the building blocks of modern electronics.", subject: "Current Affairs" },
      // Maths (10)
      { question: "If log₁₀(100) = ?", options: ["1", "2", "10", "100"], correctIndex: 1, marks: 2, explanation: "log₁₀(100) = log₁₀(10²) = 2.", subject: "Maths" },
      { question: "The value of sin 30° is:", options: ["0", "1/2", "1", "√3/2"], correctIndex: 1, marks: 2, explanation: "sin 30° = 1/2.", subject: "Maths" },
      { question: "What is the sum of interior angles of a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1, marks: 2, explanation: "Sum of angles in a triangle = 180°.", subject: "Maths" },
      { question: "If 2x - 3 = 11, what is x?", options: ["4", "5", "7", "8"], correctIndex: 2, marks: 2, explanation: "2x = 14, x = 7.", subject: "Maths" },
      { question: "What is the area of a circle with radius 7 cm? (π = 22/7)", options: ["44 cm²", "154 cm²", "88 cm²", "308 cm²"], correctIndex: 1, marks: 2, explanation: "A = πr² = (22/7)(49) = 154 cm².", subject: "Maths" },
      { question: "Simplify: (x+2)(x+3)", options: ["x²+5x+6", "x²+6x+5", "x²+5x+5", "2x+5"], correctIndex: 0, marks: 2, explanation: "x² + 3x + 2x + 6 = x² + 5x + 6.", subject: "Maths" },
      { question: "What is the probability of getting heads in a coin toss?", options: ["0", "1/4", "1/2", "1"], correctIndex: 2, marks: 2, explanation: "P(heads) = 1/2 for a fair coin.", subject: "Maths" },
      { question: "The nth term of AP: 3, 7, 11, 15... is:", options: ["4n+1", "4n-1", "3n+4", "3n-1"], correctIndex: 1, marks: 2, explanation: "a=3, d=4, nth term = 3 + (n-1)4 = 4n - 1.", subject: "Maths" },
      { question: "Volume of a cube with side 5 cm:", options: ["25 cm³", "50 cm³", "125 cm³", "150 cm³"], correctIndex: 2, marks: 2, explanation: "V = s³ = 125 cm³.", subject: "Maths" },
      { question: "What is the value of √(169)?", options: ["11", "12", "13", "14"], correctIndex: 2, marks: 2, explanation: "√169 = 13.", subject: "Maths" },
      // English (10)
      { question: "Convert: He said, 'I am going home.'", options: ["He said that he is going home.", "He said that he was going home.", "He said he am going home.", "He told he was going home."], correctIndex: 1, marks: 2, explanation: "'am going' → 'was going' in indirect speech.", subject: "English" },
      { question: "'Break down' means:", options: ["Celebrate", "Stop functioning", "Build up", "Divide equally"], correctIndex: 1, marks: 2, explanation: "'Break down' = stop working.", subject: "English" },
      { question: "Which is a complex sentence?", options: ["I like tea.", "I like tea and coffee.", "Although it rained, we played.", "We played. It rained."], correctIndex: 2, marks: 2, explanation: "Independent + dependent clause joined by 'Although'.", subject: "English" },
      { question: "Indirect speech: She said, 'I will come tomorrow.'", options: ["She said she will come tomorrow.", "She said she would come the next day.", "She said she would come tomorrow.", "She told she comes next day."], correctIndex: 1, marks: 2, explanation: "'will' → 'would', 'tomorrow' → 'the next day'.", subject: "English" },
      { question: "Correct semicolon use:", options: ["I like tea; and coffee.", "I like tea; however, she prefers coffee.", "I like; tea.", "Tea is good; nice."], correctIndex: 1, marks: 2, explanation: "Semicolons connect related independent clauses.", subject: "English" },
      { question: "'Look into' means:", options: ["To stare", "To investigate", "To ignore", "To look inside"], correctIndex: 1, marks: 2, explanation: "'Look into' = to investigate.", subject: "English" },
      { question: "Which has a dangling modifier?", options: ["Running quickly, he caught the bus.", "Walking to school, the rain started.", "She ate happily.", "After finishing, I left."], correctIndex: 1, marks: 2, explanation: "The rain isn't walking — modifier dangles.", subject: "English" },
      { question: "Best thesis statement:", options: ["Dogs are nice.", "In this essay I will discuss...", "Regular exercise significantly improves mental health.", "Exercise is good."], correctIndex: 2, marks: 2, explanation: "Specific, arguable, and clear.", subject: "English" },
      { question: "'Put off' means:", options: ["Remove", "Postpone", "Decorate", "Throw away"], correctIndex: 1, marks: 2, explanation: "'Put off' = postpone.", subject: "English" },
      { question: "Active voice: 'The book was read by me.'", options: ["I read the book.", "The book read me.", "Me read the book.", "Read was the book."], correctIndex: 0, marks: 2, explanation: "Agent becomes subject, use active verb.", subject: "English" },
      // GK (10)
      { question: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Hawking"], correctIndex: 1, marks: 2, explanation: "Sir Isaac Newton discovered gravity.", subject: "GK" },
      { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Ganga"], correctIndex: 1, marks: 2, explanation: "The Nile is traditionally the longest river.", subject: "GK" },
      { question: "Which gas is essential for respiration?", options: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Helium"], correctIndex: 1, marks: 2, explanation: "We breathe in oxygen for respiration.", subject: "GK" },
      { question: "The Parliament of India has how many houses?", options: ["1", "2", "3", "4"], correctIndex: 1, marks: 2, explanation: "Lok Sabha and Rajya Sabha = 2 houses.", subject: "GK" },
      { question: "Which is the largest desert in the world?", options: ["Sahara", "Gobi", "Antarctic", "Arabian"], correctIndex: 2, marks: 2, explanation: "Antarctica is technically the largest desert.", subject: "GK" },
      { question: "What is the speed of light approximately?", options: ["3×10⁵ km/s", "3×10⁸ m/s", "3×10⁶ m/s", "3×10⁴ km/s"], correctIndex: 1, marks: 2, explanation: "Speed of light ≈ 3 × 10⁸ m/s.", subject: "GK" },
      { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correctIndex: 1, marks: 2, explanation: "Shakespeare wrote Romeo and Juliet.", subject: "GK" },
      { question: "What is the pH of pure water?", options: ["5", "7", "9", "14"], correctIndex: 1, marks: 2, explanation: "Pure water has a neutral pH of 7.", subject: "GK" },
      { question: "Which fundamental right protects against exploitation?", options: ["Right to Equality", "Right Against Exploitation", "Right to Freedom", "Cultural Rights"], correctIndex: 1, marks: 2, explanation: "Article 23-24: Right Against Exploitation.", subject: "GK" },
      { question: "The Tropic of Cancer passes through how many Indian states?", options: ["6", "7", "8", "9"], correctIndex: 2, marks: 2, explanation: "The Tropic of Cancer passes through 8 states.", subject: "GK" },
      // Miscellaneous (10)
      { question: "What is the full form of HTTP?", options: ["HyperText Transfer Protocol", "High Text Transfer Protocol", "HyperText Transmission Protocol", "High Transfer Text Protocol"], correctIndex: 0, marks: 2, explanation: "HTTP = HyperText Transfer Protocol.", subject: "Miscellaneous" },
      { question: "DNA stands for:", options: ["Deoxyribonucleic Acid", "Dinitro Acid", "Dynamic Nuclear Acid", "Double Nucleic Acid"], correctIndex: 0, marks: 2, explanation: "DNA = Deoxyribonucleic Acid.", subject: "Miscellaneous" },
      { question: "Which layer protects Earth from UV rays?", options: ["Troposphere", "Stratosphere", "Ozone Layer", "Mesosphere"], correctIndex: 2, marks: 2, explanation: "The ozone layer absorbs UV radiation.", subject: "Miscellaneous" },
      { question: "What is the SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctIndex: 2, marks: 2, explanation: "Force is measured in Newtons.", subject: "Miscellaneous" },
      { question: "Binary code uses which digits?", options: ["0 and 1", "1 and 2", "0 to 9", "A to F"], correctIndex: 0, marks: 2, explanation: "Binary uses only 0 and 1.", subject: "Miscellaneous" },
      { question: "Photosynthesis occurs in which cell organelle?", options: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"], correctIndex: 1, marks: 2, explanation: "Photosynthesis happens in chloroplasts.", subject: "Miscellaneous" },
      { question: "What is the formula for kinetic energy?", options: ["mgh", "½mv²", "Fd", "P/t"], correctIndex: 1, marks: 2, explanation: "KE = ½mv².", subject: "Miscellaneous" },
      { question: "Which programming language is used most for web development?", options: ["Python", "C++", "JavaScript", "Java"], correctIndex: 2, marks: 2, explanation: "JavaScript is the dominant web development language.", subject: "Miscellaneous" },
      { question: "What is the atomic number of Carbon?", options: ["4", "6", "8", "12"], correctIndex: 1, marks: 2, explanation: "Carbon has atomic number 6.", subject: "Miscellaneous" },
      { question: "Who is known as the father of computers?", options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"], correctIndex: 1, marks: 2, explanation: "Charles Babbage designed the first mechanical computer.", subject: "Miscellaneous" },
    ];

    // Create tests with new schema (groups array, liveAt, expiresAt, isPaid, structured rewards)
    const testRewards = [
      { rank: 1, title: "1st Place", prize: "₹500 Gift Card", description: "Top scorer" },
      { rank: 2, title: "2nd Place", prize: "₹300 Gift Card", description: "Second highest" },
      { rank: 3, title: "3rd Place", prize: "₹200 Gift Card", description: "Third highest" },
    ];

    for (const group of groups) {
      // Check if test already exists for this group
      const existing = await ctx.db.query("weeklyTests")
        .filter(q => q.eq(q.field("groups"), [group]))
        .filter(q => q.eq(q.field("liveAt"), availableAt))
        .first();
      
      if (!existing) {
        const questions = group === "junior" ? juniorQuestions
          : group === "intermediate" ? intermediateQuestions
          : seniorQuestions;
        await ctx.db.insert("weeklyTests", {
          groups: [group], // Now an array
          title: `${group.charAt(0).toUpperCase() + group.slice(1)} Weekly Test`,
          description: `50 questions covering Current Affairs, Maths, English, GK & Miscellaneous for ${group} students.`,
          duration: group === "junior" ? 30 : group === "intermediate" ? 45 : 60,
          totalMarks: 100,
          liveAt: availableAt, // New field name
          expiresAt: endsAt, // New field name
          isPaid: false, // Free test
          syllabus,
          rewards: testRewards, // Structured rewards
          questions,
          isActive: true,
          isResultsPublished: false,
          createdAt: Date.now(),
        });
      }
    }

    // ──────────── 6. WINNERS (homepage slider) ────────────
    const existingWinners = await ctx.db.query("winners")
      .withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    if (existingWinners.length === 0) {
      const winnersData = [
        { userName: "Sonu Sharma", prize: "iPad M3 Pro", prizeEmoji: "📱", week: "2026-W05" },
        { userName: "Rishu Patel", prize: "MacBook Air M4", prizeEmoji: "💻", week: "2026-W05" },
        { userName: "Ananya Singh", prize: "AirPods Pro 3", prizeEmoji: "🎧", week: "2026-W04" },
        { userName: "Arjun Mehra", prize: "Kindle Paperwhite", prizeEmoji: "📚", week: "2026-W04" },
        { userName: "Priya Gupta", prize: "₹5,000 Amazon Gift Card", prizeEmoji: "🎁", week: "2026-W03" },
      ];
      for (const w of winnersData) {
        await ctx.db.insert("winners", { ...w, isActive: true, createdAt: Date.now() });
      }
    }

    // ──────────── 7. COURSES & LINKED LESSONS ────────────
    
    // 1. CLEAR ALL EXISTING COURSES & LESSONS
    // Deleting ALL courses and lessons to ensure a clean slate with only the 2 requested courses.
    const allCourses = await ctx.db.query("courses").collect();
    for (const c of allCourses) { await ctx.db.delete(c._id); }
    
    const allLessons = await ctx.db.query("lessons").collect();
    for (const l of allLessons) { await ctx.db.delete(l._id); }

    console.log("Deleted ALL old courses and lessons.");
    
    const codingCourses = [
      {
        title: "Python Basics", 
        category: "coding", 
        level: "Beginner", 
        totalLessons: 5, 
        estimatedDuration: "1h", 
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
        description: "Master the basics of Python with strict code challenges.",
        lessons: [
          {
            title: "1. Hello World", order: 1, xpReward: 50, description: "Your first program.",
            content: [
              { type: "text", title: "The Print Function", content: "Use `print()` to output text to the screen.", emoji: "🖨️" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "print('Hello World')", 
                language: "python",
                expectedOutput: "Hello World"
              }
            ],
            questions: []
          },
          {
            title: "2. Simple Math", order: 2, xpReward: 50, description: "Doing calculations.",
            content: [
              { type: "text", title: "Math Operations", content: "Python can act as a calculator.", emoji: "➕" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "print(5 + 3)\nprint(10 - 2)", 
                language: "python",
                expectedOutput: "8\n8"
              }
            ],
            questions: []
          },
          {
            title: "3. Variables", order: 3, xpReward: 50, description: "Storing values.",
            content: [
              { type: "text", title: "Using Variables", content: "Store data in variables.", emoji: "📦" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "score = 100\nprint(score * 2)", 
                language: "python",
                expectedOutput: "200"
              }
            ],
            questions: []
          },
          {
            title: "4. String Concatenation", order: 4, xpReward: 50, description: "Joining strings.",
            content: [
              { type: "text", title: "Joining Text", content: "Use `+` to join strings.", emoji: "🔗" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "print('Super' + 'man')", 
                language: "python",
                expectedOutput: "Superman"
              }
            ],
            questions: []
          },
          {
            title: "5. Loops", order: 5, xpReward: 50, description: "Repeating actions.",
            content: [
              { type: "text", title: "For Loops", content: "Repeat code multiple times.", emoji: "🔄" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "for i in range(3):\n    print(i)", 
                language: "python",
                expectedOutput: "0\n1\n2"
              }
            ],
            questions: []
          },
        ]
      },
      {
        title: "HTML Fundamentals", 
        category: "coding", 
        level: "Beginner", 
        totalLessons: 5, 
        estimatedDuration: "1h", 
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg",
        description: "Build the web structure.",
        lessons: [
          {
            title: "1. Basic Tags", order: 1, xpReward: 50, description: "Headings and Paragraphs.",
            content: [
              { type: "text", title: "Headings", content: "Use h1 for main titles.", emoji: "🏷️" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "<h1>Hello Web</h1>", 
                language: "html",
                expectedOutput: "<h1>Hello Web</h1>" 
              }
            ],
            questions: []
          },
          {
            title: "2. Buttons", order: 2, xpReward: 50, description: "Interactive elements.",
            content: [
              { type: "text", title: "Buttons", content: "Clickable elements.", emoji: "🔘" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "<button>Click Me</button>", 
                language: "html",
                expectedOutput: "<button>Click Me</button>"
              }
            ],
            questions: []
          },
          {
            title: "3. Links", order: 3, xpReward: 50, description: "Connecting pages.",
            content: [
              { type: "text", title: "Anchors", content: "Propel the web.", emoji: "🔗" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "<a href='https://google.com'>Google</a>", 
                language: "html",
                expectedOutput: "<a href='https://google.com'>Google</a>"
              }
            ],
            questions: []
          },
          {
            title: "4. Images", order: 4, xpReward: 50, description: "Displaying visuals.",
            content: [
              { type: "text", title: "Img Tag", content: "Show pictures.", emoji: "🖼️" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "<img src='logo.png' />", 
                language: "html",
                expectedOutput: "<img src='logo.png' />"
              }
            ],
            questions: []
          },
          {
            title: "5. Lists", order: 5, xpReward: 100, description: "Organizing items.",
            content: [
              { type: "text", title: "Unordered List", content: "Bullet points.", emoji: "📋" },
              { 
                type: "playground", 
                title: "Challenge", 
                content: "<ul><li>Item 1</li></ul>", 
                language: "html",
                expectedOutput: "<ul><li>Item 1</li></ul>"
              }
            ],
            questions: []
          }
        ]
      }
    ];

    for (const c of codingCourses) {
      const courseId = await ctx.db.insert("courses", {
        title: c.title,
        description: c.description,
        category: c.category,
        level: c.level,
        totalLessons: c.totalLessons,
        estimatedDuration: c.estimatedDuration,
        thumbnail: c.thumbnail,
        isActive: true,
        createdAt: Date.now()
      });

      // Insert Lessons
      const lessons = c.lessons || [];
      for (const l of lessons) {
          await ctx.db.insert("lessons", {
             category: "coding",
             group: "all",
             courseId: courseId, // Link to course
             title: l.title,
             description: l.description,
             order: l.order,
             xpReward: l.xpReward,
             content: l.content,
             questions: l.questions,
             isActive: true,
             createdAt: Date.now()
          });
      }
    }

    // ──────────── 8. ACHIEVEMENTS ────────────
    const badges = [
      { slug: "first-lesson", title: "First Steps", description: "Complete your first lesson", icon: "🌱", category: "xp", xpToken: 50, requirement: 1 },
      { slug: "streak-3", title: "On Fire", description: "Reach a 3-day streak", icon: "🔥", category: "streak", xpToken: 100, requirement: 3 },
      { slug: "course-completed", title: "Mastery", description: "Complete a full course", icon: "🎓", category: "course", xpToken: 500, requirement: 1 },
      { slug: "python-beginner", title: "Python Snake", description: "Complete Python Basics", icon: "🐍", category: "course", xpToken: 100, requirement: 1 },
    ];
    for (const b of badges) {
       const exists = await ctx.db.query("achievements").withIndex("by_slug", q => q.eq("slug", b.slug)).first();
       if (!exists) {
         await ctx.db.insert("achievements", b);
       }
    }


    return { success: true, message: "Content seeded for junior, intermediate & senior groups! 🎉" };
  },
});

function getSunday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0
  return new Date(d.setDate(diff));
}
