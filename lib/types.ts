export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  topic: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  description: string;
  orderIndex: number;
  quizQuestionCount: number;
  createdAt: string;
}

export interface Question {
  id: string;
  chapterId: string;
  question: string;
  answers: [string, string, string, string];
  correctIndex: number;
  createdAt: string;
}

export interface PublicQuestion {
  id: string;
  question: string;
  answers: [string, string, string, string];
}

export interface ChapterSummary extends Chapter {
  totalQuestions: number;
  bestScore?: number | null;
  attemptCount?: number;
}

export interface BookWithChapters extends Book {
  chapters: ChapterSummary[];
  totalQuestions: number;
}

export interface ExamReviewItem {
  questionId: string;
  question: string;
  answers: [string, string, string, string];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  questionIds: string[];
  /** Stored snapshot of questions for grading integrity even if bank changes later */
  questionsSnapshot: Question[];
  submittedAnswers: Record<string, number | null>;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercent: number;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt: string | null;
}

export interface ExamResultPayload {
  attemptId: string;
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercent: number;
  completedAt: string;
  review: ExamReviewItem[];
}
