/**
 * LemoLearn Type Definitions
 */

export type UserGroup = 'junior' | 'intermediate' | 'senior';
export type CourseCategory = 'english' | 'abacus' | 'vedic' | 'coding' | 'ai';
export type CourseStatus = 'not_started' | 'in_progress' | 'completed';

export interface User {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  class: number;
  group: UserGroup;
  parentEmail: string;
  imageUrl?: string;
  createdAt: number;
}

export interface DailyEnglishWord {
  word: string;
  synonym: string;
  antonym: string;
  sentence: string;
}

export interface DailyEnglish {
  _id: string;
  group: UserGroup;
  date: string;
  word1: string; synonym1: string; antonym1: string; sentence1: string;
  word2: string; synonym2: string; antonym2: string; sentence2: string;
  word3: string; synonym3: string; antonym3: string; sentence3: string;
  structureTitle: string;
  structureRule: string;
  structureExamples: string;
  practiceQuestion: string;
  correctAnswer: string;
  createdAt: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: CourseCategory;
  level: string;
  totalLessons: number;
  estimatedDuration: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: number;
}

export interface CourseLesson {
  _id: string;
  courseId: string;
  order: number;
  title: string;
  content: string;
  videoUrl?: string;
  duration: string;
  hasAssessment: boolean;
  assessmentQuestions?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  createdAt: number;
}

export interface Certificate {
  _id: string;
  userId: string;
  courseId: string;
  certificateUrl: string;
  certificateId: string;
  issuedAt: number;
}
