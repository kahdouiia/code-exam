import type {
  Book,
  BookWithChapters,
  Chapter,
  ExamAttempt,
  Question,
  User,
  UserRole,
} from '../types';
import type { ParsedQuestionInput } from '../quiz-parser';

export interface CreateBookInput {
  title: string;
  author: string;
  description: string;
  topic: string;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  description?: string;
  topic?: string;
}

export interface CreateChapterInput {
  bookId: string;
  title: string;
  description: string;
  orderIndex?: number;
  quizQuestionCount: number;
}

export interface UpdateChapterInput {
  title?: string;
  description?: string;
  orderIndex?: number;
  quizQuestionCount?: number;
}

export interface DatabaseRepository {
  // Users
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User>;
  countUsers(): Promise<number>;

  // Books
  listBooksWithChapters(userId?: string | null): Promise<BookWithChapters[]>;
  getBookWithChapters(
    bookId: string,
    userId?: string | null
  ): Promise<BookWithChapters | null>;
  createBook(input: CreateBookInput): Promise<Book>;
  updateBook(bookId: string, input: UpdateBookInput): Promise<Book | null>;
  deleteBook(bookId: string): Promise<boolean>;

  // Chapters
  getChapterById(chapterId: string): Promise<Chapter | null>;
  createChapter(input: CreateChapterInput): Promise<Chapter>;
  updateChapter(
    chapterId: string,
    input: UpdateChapterInput
  ): Promise<Chapter | null>;
  reorderChapters(bookId: string, orderedChapterIds: string[]): Promise<void>;
  deleteChapter(chapterId: string): Promise<boolean>;

  // Questions
  listQuestionsByChapter(chapterId: string): Promise<Question[]>;
  saveQuestionsForChapter(
    chapterId: string,
    questions: ParsedQuestionInput[],
    mode: 'append' | 'replace'
  ): Promise<Question[]>;
  deleteQuestion(questionId: string): Promise<boolean>;

  // Exam Attempts
  createExamAttempt(attempt: ExamAttempt): Promise<ExamAttempt>;
  getExamAttemptById(attemptId: string): Promise<ExamAttempt | null>;
  completeExamAttempt(
    attemptId: string,
    update: {
      submittedAnswers: Record<string, number | null>;
      correctCount: number;
      wrongCount: number;
      unansweredCount: number;
      scorePercent: number;
      completedAt: string;
    }
  ): Promise<ExamAttempt | null>;
  listExamAttemptsByUser(userId: string): Promise<ExamAttempt[]>;
  listRecentAttempts(limit?: number): Promise<ExamAttempt[]>;
}
