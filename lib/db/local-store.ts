import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  Book,
  BookWithChapters,
  Chapter,
  ChapterSummary,
  ExamAttempt,
  Question,
  User,
  UserRole,
} from '../types';
import type { ParsedQuestionInput } from '../quiz-parser';
import type {
  CreateBookInput,
  CreateChapterInput,
  DatabaseRepository,
  UpdateBookInput,
  UpdateChapterInput,
} from './types';
import { buildSeedDataset } from './seed-data';

interface StoreState {
  users: User[];
  books: Book[];
  chapters: Chapter[];
  questions: Question[];
  examAttempts: ExamAttempt[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'codeexam-db.json');

declare global {
  var _codeexamLocalQueue: Promise<unknown> | undefined;
}

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = global._codeexamLocalQueue ?? Promise.resolve();
  const next = prev.then(fn, fn);
  global._codeexamLocalQueue = next.catch(() => undefined);
  return next;
}

async function readStore(): Promise<StoreState> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    if (
      Array.isArray(parsed.users) &&
      Array.isArray(parsed.books) &&
      Array.isArray(parsed.chapters) &&
      Array.isArray(parsed.questions)
    ) {
      return {
        users: parsed.users,
        books: parsed.books,
        chapters: parsed.chapters,
        questions: parsed.questions,
        examAttempts: Array.isArray(parsed.examAttempts) ? parsed.examAttempts : [],
      };
    }
  } catch {
    // First boot: initialize with deterministic seed dataset
  }

  const seed = buildSeedDataset();
  const initial: StoreState = {
    users: seed.users,
    books: seed.books,
    chapters: seed.chapters,
    questions: seed.questions,
    examAttempts: [],
  };
  await writeStore(initial);
  return initial;
}

async function writeStore(state: StoreState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  await fs.rename(tmpFile, DATA_FILE);
}

export class LocalJsonRepository implements DatabaseRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const store = await readStore();
    const target = email.trim().toLowerCase();
    return store.users.find((u) => u.email.toLowerCase() === target) ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    const store = await readStore();
    return store.users.find((u) => u.id === id) ?? null;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    return withWriteLock(async () => {
      const store = await readStore();
      const email = input.email.trim().toLowerCase();
      if (store.users.some((u) => u.email.toLowerCase() === email)) {
        throw new Error('EMAIL_EXISTS');
      }
      const user: User = {
        id: `usr_${crypto.randomUUID().slice(0, 12)}`,
        name: input.name.trim(),
        email,
        passwordHash: input.passwordHash,
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      await writeStore(store);
      return user;
    });
  }

  async countUsers(): Promise<number> {
    const store = await readStore();
    return store.users.length;
  }

  async listBooksWithChapters(userId?: string | null): Promise<BookWithChapters[]> {
    const store = await readStore();

    const questionCounts = new Map<string, number>();
    for (const q of store.questions) {
      questionCounts.set(q.chapterId, (questionCounts.get(q.chapterId) ?? 0) + 1);
    }

    const userStats = new Map<string, { best: number; attempts: number }>();
    if (userId) {
      for (const att of store.examAttempts) {
        if (att.userId === userId && att.status === 'completed') {
          const prev = userStats.get(att.chapterId);
          if (!prev) {
            userStats.set(att.chapterId, { best: att.scorePercent, attempts: 1 });
          } else {
            userStats.set(att.chapterId, {
              best: Math.max(prev.best, att.scorePercent),
              attempts: prev.attempts + 1,
            });
          }
        }
      }
    }

    return store.books.map((book) => {
      const chs: ChapterSummary[] = store.chapters
        .filter((c) => c.bookId === book.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((c) => {
          const stat = userStats.get(c.id);
          return {
            ...c,
            totalQuestions: questionCounts.get(c.id) ?? 0,
            bestScore: stat ? stat.best : null,
            attemptCount: stat ? stat.attempts : 0,
          };
        });

      return {
        ...book,
        chapters: chs,
        totalQuestions: chs.reduce((acc, c) => acc + c.totalQuestions, 0),
      };
    });
  }

  async getBookWithChapters(
    bookId: string,
    userId?: string | null
  ): Promise<BookWithChapters | null> {
    const all = await this.listBooksWithChapters(userId);
    return all.find((b) => b.id === bookId) ?? null;
  }

  async createBook(input: CreateBookInput): Promise<Book> {
    return withWriteLock(async () => {
      const store = await readStore();
      const book: Book = {
        id: `bk_${crypto.randomUUID().slice(0, 10)}`,
        title: input.title.trim(),
        author: input.author.trim(),
        description: input.description.trim(),
        topic: input.topic.trim() || 'مهندسی نرم‌افزار',
        createdAt: new Date().toISOString(),
      };
      store.books.push(book);
      await writeStore(store);
      return book;
    });
  }

  async updateBook(bookId: string, input: UpdateBookInput): Promise<Book | null> {
    return withWriteLock(async () => {
      const store = await readStore();
      const idx = store.books.findIndex((b) => b.id === bookId);
      if (idx === -1) return null;
      const current = store.books[idx];
      const updated: Book = {
        ...current,
        title: input.title !== undefined ? input.title.trim() : current.title,
        author: input.author !== undefined ? input.author.trim() : current.author,
        description:
          input.description !== undefined
            ? input.description.trim()
            : current.description,
        topic: input.topic !== undefined ? input.topic.trim() : current.topic,
      };
      store.books[idx] = updated;
      await writeStore(store);
      return updated;
    });
  }

  async deleteBook(bookId: string): Promise<boolean> {
    return withWriteLock(async () => {
      const store = await readStore();
      const before = store.books.length;
      store.books = store.books.filter((b) => b.id !== bookId);
      if (store.books.length === before) return false;
      const removedChapterIds = new Set(
        store.chapters.filter((c) => c.bookId === bookId).map((c) => c.id)
      );
      store.chapters = store.chapters.filter((c) => c.bookId !== bookId);
      store.questions = store.questions.filter(
        (q) => !removedChapterIds.has(q.chapterId)
      );
      store.examAttempts = store.examAttempts.filter((a) => a.bookId !== bookId);
      await writeStore(store);
      return true;
    });
  }

  async getChapterById(chapterId: string): Promise<Chapter | null> {
    const store = await readStore();
    return store.chapters.find((c) => c.id === chapterId) ?? null;
  }

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    return withWriteLock(async () => {
      const store = await readStore();
      const existing = store.chapters.filter((c) => c.bookId === input.bookId);
      const nextOrder =
        input.orderIndex ??
        (existing.length > 0
          ? Math.max(...existing.map((c) => c.orderIndex)) + 1
          : 1);

      const chapter: Chapter = {
        id: `ch_${crypto.randomUUID().slice(0, 10)}`,
        bookId: input.bookId,
        title: input.title.trim(),
        description: input.description.trim(),
        orderIndex: nextOrder,
        quizQuestionCount: Math.max(1, Math.floor(input.quizQuestionCount)),
        createdAt: new Date().toISOString(),
      };
      store.chapters.push(chapter);
      await writeStore(store);
      return chapter;
    });
  }

  async updateChapter(
    chapterId: string,
    input: UpdateChapterInput
  ): Promise<Chapter | null> {
    return withWriteLock(async () => {
      const store = await readStore();
      const idx = store.chapters.findIndex((c) => c.id === chapterId);
      if (idx === -1) return null;
      const current = store.chapters[idx];
      const updated: Chapter = {
        ...current,
        title: input.title !== undefined ? input.title.trim() : current.title,
        description:
          input.description !== undefined
            ? input.description.trim()
            : current.description,
        orderIndex:
          input.orderIndex !== undefined ? input.orderIndex : current.orderIndex,
        quizQuestionCount:
          input.quizQuestionCount !== undefined
            ? Math.max(1, Math.floor(input.quizQuestionCount))
            : current.quizQuestionCount,
      };
      store.chapters[idx] = updated;
      await writeStore(store);
      return updated;
    });
  }

  async reorderChapters(bookId: string, orderedChapterIds: string[]): Promise<void> {
    return withWriteLock(async () => {
      const store = await readStore();
      const orderMap = new Map<string, number>();
      orderedChapterIds.forEach((id, idx) => orderMap.set(id, idx + 1));
      store.chapters = store.chapters.map((c) => {
        if (c.bookId === bookId && orderMap.has(c.id)) {
          return { ...c, orderIndex: orderMap.get(c.id)! };
        }
        return c;
      });
      await writeStore(store);
    });
  }

  async deleteChapter(chapterId: string): Promise<boolean> {
    return withWriteLock(async () => {
      const store = await readStore();
      const before = store.chapters.length;
      store.chapters = store.chapters.filter((c) => c.id !== chapterId);
      if (store.chapters.length === before) return false;
      store.questions = store.questions.filter((q) => q.chapterId !== chapterId);
      store.examAttempts = store.examAttempts.filter(
        (a) => a.chapterId !== chapterId
      );
      await writeStore(store);
      return true;
    });
  }

  async listQuestionsByChapter(chapterId: string): Promise<Question[]> {
    const store = await readStore();
    return store.questions.filter((q) => q.chapterId === chapterId);
  }

  async saveQuestionsForChapter(
    chapterId: string,
    questions: ParsedQuestionInput[],
    mode: 'append' | 'replace'
  ): Promise<Question[]> {
    return withWriteLock(async () => {
      const store = await readStore();
      if (mode === 'replace') {
        store.questions = store.questions.filter((q) => q.chapterId !== chapterId);
      }
      const now = new Date().toISOString();
      for (const q of questions) {
        store.questions.push({
          id: `q_${crypto.randomUUID().slice(0, 12)}`,
          chapterId,
          question: q.question,
          answers: q.answers,
          correctIndex: q.correctIndex,
          createdAt: now,
        });
      }
      await writeStore(store);
      return store.questions.filter((q) => q.chapterId === chapterId);
    });
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    return withWriteLock(async () => {
      const store = await readStore();
      const before = store.questions.length;
      store.questions = store.questions.filter((q) => q.id !== questionId);
      if (store.questions.length === before) return false;
      await writeStore(store);
      return true;
    });
  }

  async createExamAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    return withWriteLock(async () => {
      const store = await readStore();
      store.examAttempts.push(attempt);
      await writeStore(store);
      return attempt;
    });
  }

  async getExamAttemptById(attemptId: string): Promise<ExamAttempt | null> {
    const store = await readStore();
    return store.examAttempts.find((a) => a.id === attemptId) ?? null;
  }

  async completeExamAttempt(
    attemptId: string,
    update: {
      submittedAnswers: Record<string, number | null>;
      correctCount: number;
      wrongCount: number;
      unansweredCount: number;
      scorePercent: number;
      completedAt: string;
    }
  ): Promise<ExamAttempt | null> {
    return withWriteLock(async () => {
      const store = await readStore();
      const idx = store.examAttempts.findIndex((a) => a.id === attemptId);
      if (idx === -1) return null;
      const updated: ExamAttempt = {
        ...store.examAttempts[idx],
        submittedAnswers: update.submittedAnswers,
        correctCount: update.correctCount,
        wrongCount: update.wrongCount,
        unansweredCount: update.unansweredCount,
        scorePercent: update.scorePercent,
        status: 'completed',
        completedAt: update.completedAt,
      };
      store.examAttempts[idx] = updated;
      await writeStore(store);
      return updated;
    });
  }

  async listExamAttemptsByUser(userId: string): Promise<ExamAttempt[]> {
    const store = await readStore();
    return store.examAttempts
      .filter((a) => a.userId === userId && a.status === 'completed')
      .sort((a, b) =>
        (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)
      );
  }

  async listRecentAttempts(limit = 20): Promise<ExamAttempt[]> {
    const store = await readStore();
    return store.examAttempts
      .filter((a) => a.status === 'completed')
      .sort((a, b) =>
        (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)
      )
      .slice(0, limit);
  }
}
