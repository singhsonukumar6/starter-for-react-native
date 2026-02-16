import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateLesson = action({
  args: {
    topic: v.string(),
    additionalDetails: v.optional(v.string()), // e.g. "Focus on loops", "Make it hard"
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const payload = {
      model: "llama-3.3-70b-versatile", // Or "mixtral-8x7b-32768"
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Create a structured lesson plan in JSON format.
The user will provide a topic. You must output a JSON object representing the lesson.
The schema is as follows:

{
  "title": "Lesson Title",
  "description": "Short description",
  "category": "coding",
  "type": "lesson", // or "quiz" if the user asks for a quiz
  "content": [ // Array of content blocks. Used if type is "lesson"
    {
      "type": "text", // or "example", "tip", "highlight", "code", "playground", "video"
      "title": "Block Title",
      "content": "Content text...",
      "emoji": "📚"
    },
    {
      "type": "code",
      "title": "Code Example",
      "content": "print('Hello')",
      "language": "python", // if code/playground
      "emoji": "💻"
    },
    {
      "type": "playground",
      "title": "Try it yourself",
      "content": "print('World')",
      "language": "python",
      "expectedOutput": "World", // For validation
      "emoji": "🚀"
    },
    {
      "type": "video",
      "title": "Video Tutorial",
      "content": "https://youtube.com/watch?v=...", // YouTube URL or direct video URL
      "emoji": "🎬"
    }
  ],
  "questions": [ // Array of questions. Used for quizzes OR checks in lessons
     {
       "question": "Question text?",
       "options": ["A", "B", "C", "D"],
       "correctIndex": 0,
       "explanation": "Why A is correct",
       "type": "mcq"
     }
  ]
}

Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
Ensure the content is engaging, educational, and strictly follows the schema.`
        },
        {
          role: "user",
          content: `Create a lesson about: ${args.topic}. ${args.additionalDetails || ''}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated lesson content");
    }
  }
});

// Regenerate a single content block
export const regenerateContentBlock = action({
  args: {
    blockType: v.string(),
    blockTitle: v.string(),
    lessonContext: v.string(), // Brief description of the lesson topic
    currentContent: v.optional(v.string()),
    instructions: v.optional(v.string()), // User's specific instructions
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Generate a SINGLE content block in JSON format.
The user will provide context about the lesson and the block type needed.
Output a JSON object with this schema:

{
  "type": "text", // or "example", "tip", "highlight", "code", "playground", "video"
  "title": "Block Title",
  "content": "Content text or code...",
  "language": "python", // only for code/playground types
  "expectedOutput": "expected output", // only for playground type
  "emoji": "📚"
}

For video blocks, suggest a relevant YouTube search query or topic in the content field.
Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Lesson topic: ${args.lessonContext}
Block type needed: ${args.blockType}
Current block title: ${args.blockTitle}
${args.currentContent ? `Current content to improve: ${args.currentContent}` : ''}
${args.instructions ? `Additional instructions: ${args.instructions}` : ''}

Generate an improved/replacement content block.`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated content block");
    }
  }
});

// Add more content blocks to an existing lesson
export const addMoreContentBlocks = action({
  args: {
    lessonTitle: v.string(),
    lessonDescription: v.string(),
    existingBlocks: v.array(v.object({
      type: v.string(),
      title: v.string(),
    })),
    count: v.optional(v.number()), // Number of blocks to add
    focusArea: v.optional(v.string()), // What to focus on
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Generate additional content blocks for an existing lesson.
Output a JSON object with an array of content blocks:

{
  "blocks": [
    {
      "type": "text", // or "example", "tip", "highlight", "code", "playground", "video"
      "title": "Block Title",
      "content": "Content text or code...",
      "language": "python", // only for code/playground
      "expectedOutput": "output", // only for playground
      "emoji": "📚"
    }
  ]
}

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Lesson: ${args.lessonTitle}
Description: ${args.lessonDescription}

Existing blocks (do not duplicate):
${args.existingBlocks.map((b, i) => `${i + 1}. ${b.title} (${b.type})`).join('\n')}

Generate ${args.count || 2} new content blocks that complement the existing content.
${args.focusArea ? `Focus on: ${args.focusArea}` : ''}`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated blocks");
    }
  }
});

// Generate more quiz questions
export const addMoreQuizQuestions = action({
  args: {
    lessonTitle: v.string(),
    lessonDescription: v.string(),
    existingQuestions: v.array(v.object({
      question: v.string(),
    })),
    count: v.optional(v.number()),
    difficulty: v.optional(v.string()), // easy, medium, hard
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Generate quiz questions for a lesson.
Output a JSON object with an array of questions:

{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct...",
      "type": "mcq"
    }
  ]
}

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Lesson: ${args.lessonTitle}
Description: ${args.lessonDescription}

Existing questions (do not duplicate):
${args.existingQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Generate ${args.count || 3} new quiz questions.
${args.difficulty ? `Difficulty: ${args.difficulty}` : ''}`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated questions");
    }
  }
});

// Generate English lesson with TTS support and interactive quizzes
export const generateEnglishLesson = action({
  args: {
    topic: v.string(),
    grammarFocus: v.optional(v.string()),
    group: v.string(), // junior, intermediate, senior
    difficulty: v.optional(v.string()), // easy, medium, hard
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const difficultyLevel = args.difficulty || (args.group === 'junior' ? 'easy' : args.group === 'intermediate' ? 'medium' : 'hard');

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert English language teacher. Create an interactive English lesson in JSON format.
The lesson should be engaging, educational, and suitable for ${args.group} level students (${difficultyLevel} difficulty).

Output a JSON object with this exact schema:

{
  "title": "Lesson Title",
  "description": "Brief description of what students will learn",
  "content": [
    {
      "type": "rule", // or "example", "pronunciation", "tip", "highlight"
      "title": "Grammar Rule Title",
      "content": "Explanation of the rule...",
      "pronunciation": "/fon-et-ik/", // phonetic spelling for pronunciation blocks
      "audioText": "Text to be spoken by TTS engine", // for pronunciation blocks
      "emoji": "grammar emoji",
      "examples": ["Example sentence 1", "Example sentence 2"] // for example blocks
    }
  ],
  "questions": [
    {
      "type": "mcq", // or "fillBlank", "arrange", "match", "listen"
      "question": "Question text. Use ___ for fill-in-the-blank questions.",
      "audioText": "Text to speak for listen-type questions",
      "options": ["Option A", "Option B", "Option C", "Option D"], // for mcq/listen
      "correctIndex": 0, // for mcq/listen
      "correctAnswer": "answer", // for fillBlank
      "correctOrder": ["word1", "word2", "word3"], // for arrange
      "pairs": [{"left": "word", "right": "meaning"}], // for match
      "explanation": "Why this is correct...",
      "hint": "Helpful hint for the student"
    }
  ]
}

Guidelines:
- Include 3-5 content blocks with clear explanations
- For pronunciation blocks, include phonetic spelling and audioText for TTS
- Include 4-6 varied question types (mix of mcq, fillBlank, arrange, match, listen)
- For "listen" type questions, set audioText to what should be spoken
- Make questions interactive and engaging like Duolingo
- Provide clear explanations for answers
- Include helpful hints

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Create an English lesson about: ${args.topic}
${args.grammarFocus ? `Grammar focus: ${args.grammarFocus}` : ''}
Target audience: ${args.group} students (${difficultyLevel} difficulty)

Make it interactive with pronunciation practice and varied quiz types.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated English lesson");
    }
  }
});

// Generate coding challenge with test cases
export const generateCodingChallenge = action({
  args: {
    topic: v.string(),
    difficulty: v.string(), // easy, medium, hard
    category: v.optional(v.string()), // arrays, strings, etc.
    additionalDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const pointsMap: Record<string, number> = {
      easy: 10,
      medium: 25,
      hard: 50,
    };

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert coding challenge creator like LeetCode/HackerRank. Create a coding challenge in JSON format.
The challenge should be educational, well-structured, and have clear problem statements.

IMPORTANT: 
1. The code must read input from stdin and print output to stdout (competitive programming style).
2. Starter code should be a TEMPLATE with helpful comments - NOT a complete solution. The user needs to write the actual solution logic.

Output a JSON object with this exact schema:

{
  "title": "Challenge Title",
  "description": "Brief one-line description",
  "difficulty": "easy", // or "medium", "hard"
  "points": 10, // 10 for easy, 25 for medium, 50 for hard
  "problemStatement": "Detailed problem statement explaining what the user needs to solve...",
  "inputFormat": "Description of input format...",
  "outputFormat": "Description of expected output format...",
  "constraints": "1 <= n <= 10^5\\n1 <= arr[i] <= 10^9",
  "examples": [
    {
      "input": "5\\n2 7 11 15 9",
      "output": "0 1",
      "explanation": "The first line is n, followed by n numbers. Output the indices."
    }
  ],
  "starterCode": {
    "python": "# Read input from stdin\\nimport sys\\n\\ndef main():\\n    # Read all input from stdin\\n    data = sys.stdin.read().strip().split()\\n    \\n    # TODO: Parse the input according to the problem\\n    # Example: n = int(data[0])\\n    # Example: arr = list(map(int, data[1:]))\\n    \\n    # TODO: Implement your solution here\\n    \\n    # TODO: Print the result\\n    pass\\n\\nif __name__ == '__main__':\\n    main()",
    "javascript": "// Read input from stdin\\nconst readline = require('readline');\\nconst rl = readline.createInterface({ \\n    input: process.stdin,\\n    output: process.stdout\\n});\\n\\nlet lines = [];\\nrl.on('line', (line) => {\\n    lines.push(line);\\n});\\n\\nrl.on('close', () => {\\n    // TODO: Parse the input from lines array\\n    // Example: const n = parseInt(lines[0]);\\n    // Example: const arr = lines[1].split(' ').map(Number);\\n    \\n    // TODO: Implement your solution here\\n    \\n    // TODO: Print the result with console.log()\\n    \\n});",
    "java": "import java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        \\n        // TODO: Read input using sc.nextInt(), sc.next(), sc.nextLine(), etc.\\n        // Example: int n = sc.nextInt();\\n        // Example: int[] arr = new int[n];\\n        //          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\\n        \\n        // TODO: Implement your solution here\\n        \\n        // TODO: Print the result with System.out.println()\\n        \\n        sc.close();\\n    }\\n}",
    "cpp": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nint main() {\\n    // TODO: Read input using cin\\n    // Example: int n;\\n    //          cin >> n;\\n    // Example: vector<int> arr(n);\\n    //          for (int i = 0; i < n; i++) cin >> arr[i];\\n    \\n    // TODO: Implement your solution here\\n    \\n    // TODO: Print the result with cout\\n    \\n    return 0;\\n}"
  },
  "functionSignature": {
    "python": "# Read from stdin, print to stdout",
    "javascript": "// Read from stdin, print to stdout",
    "java": "public static void main(String[] args)",
    "cpp": "int main()"
  },
  "testCases": [
    {
      "input": "5\\n2 7 11 15 9",
      "expectedOutput": "0 1",
      "isHidden": false
    },
    {
      "input": "3\\n3 2 4\\n6",
      "expectedOutput": "1 2",
      "isHidden": false
    },
    {
      "input": "2\\n3 3\\n6",
      "expectedOutput": "0 1",
      "isHidden": true
    }
  ],
  "hints": [
    "Hint 1: Think about how to parse the input",
    "Hint 2: Consider using a hash map for efficient lookup"
  ],
  "tags": ["array", "hash-table"]
}

Guidelines:
- Create 3-5 test cases (mix of visible and hidden)
- Test case input is raw input that goes to stdin (not function parameters)
- Test case expectedOutput is what should be printed to stdout
- Include 2-3 helpful hints that progressively guide the user
- Starter code MUST be a template with TODO comments - NOT a complete solution
- The user should need to write the actual algorithm/solution logic
- Ensure test cases cover edge cases
- Points should match difficulty: easy=10, medium=25, hard=50
- Include relevant tags for searchability

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Create a ${args.difficulty} coding challenge about: ${args.topic}
${args.category ? `Category: ${args.category}` : ''}
${args.additionalDetails ? `Additional details: ${args.additionalDetails}` : ''}

Make it educational with clear examples and comprehensive test cases.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      // Ensure points matches difficulty
      parsed.points = pointsMap[args.difficulty] || parsed.points;
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated challenge");
    }
  }
});

// Generate Test Questions with AI
export const generateTestQuestions = action({
  args: {
    group: v.string(), // "junior" | "intermediate" | "senior"
    testType: v.string(), // "weekly" | "monthly"
    subjects: v.array(v.string()), // ["Maths", "English", "GK", "Science"]
    questionCount: v.optional(v.number()),
    difficulty: v.optional(v.string()), // "easy" | "medium" | "hard" | "mixed"
    additionalInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const questionCount = args.questionCount || 10;
    const difficulty = args.difficulty || "mixed";

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert quiz creator for students. Create a ${args.testType} test for ${args.group} students.

Output a JSON object with this exact schema:

{
  "title": "Test Title",
  "description": "Brief description of the test",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "marks": 5,
      "explanation": "Explanation of why this is correct",
      "subject": "Maths"
    }
  ],
  "syllabus": ["Topic 1", "Topic 2"],
  "rewards": "🥇 1st Place: Prize\\n🥈 2nd Place: Prize\\n🥉 3rd Place: Prize"
}

Guidelines:
- Create exactly ${questionCount} questions
- Difficulty level: ${difficulty}
- Target audience: ${args.group} students (junior=class 1-3, intermediate=class 4-6, senior=class 7+)
- Cover these subjects: ${args.subjects.join(", ")}
- Distribute questions evenly across subjects
- Questions should be age-appropriate and educational
- Each question should have 4 options (A, B, C, D)
- Provide clear explanations for correct answers
- Marks should be 5 for easy, 10 for medium, 15 for hard questions

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Create a ${args.testType} test for ${args.group} students.
Subjects to cover: ${args.subjects.join(", ")}
Number of questions: ${questionCount}
Difficulty: ${difficulty}
${args.additionalInstructions ? `Additional instructions: ${args.additionalInstructions}` : ''}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated test");
    }
  }
});

// Generate Contest Details with AI
export const generateContestDetails = action({
  args: {
    contestType: v.string(), // "coding" | "english_speech" | "english_essay"
    group: v.string(),
    topic: v.optional(v.string()),
    duration: v.optional(v.number()), // duration in days
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    const duration = args.duration || 7; // default 7 days

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert contest organizer. Create details for a ${args.contestType} contest.

Output a JSON object with this exact schema:

{
  "title": "Contest Title",
  "description": "Detailed description of the contest",
  "requirements": "Specific requirements and instructions for participants",
  "evaluationCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
  "prizes": "🥇 1st Place: Prize\\n🥈 2nd Place: Prize\\n🥉 3rd Place: Prize",
  "maxPoints": 100,
  "tips": ["Tip 1 for participants", "Tip 2 for participants"]
}

Guidelines for ${args.contestType}:
- coding: Project-based contest where participants submit hosted project URLs
- english_speech: Video speech contest where participants submit YouTube URLs
- english_essay: Essay writing contest where participants submit PDF URLs

Target audience: ${args.group} students
Duration: ${duration} days

Return ONLY valid JSON. Do not include markdown formatting.`
        },
        {
          role: "user",
          content: `Create a ${args.contestType} contest for ${args.group} students.
${args.topic ? `Topic/Theme: ${args.topic}` : ''}
Duration: ${duration} days`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      throw new Error("Failed to parse generated contest details");
    }
  }
});
