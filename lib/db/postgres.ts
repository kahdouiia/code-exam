import crypto from 'node:crypto';
import { Pool } from 'pg';
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

declare global {
  var _codeexamPgPool: Pool | undefined;
  var _codeexamPgInitPromise: Promise<void> | undefined;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT 'Software Engineering',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 1,
    quiz_question_count INTEGER NOT NULL DEFAULT 5 CHECK (quiz_question_count >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chapters_book_order ON chapters(book_id, order_index)`,
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answers JSONB NOT NULL,
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id)`,
  `CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    question_ids JSONB NOT NULL,
    questions_snapshot JSONB NOT NULL,
    submitted_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    unanswered_count INTEGER NOT NULL DEFAULT 0,
    score_percent INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_exam_attempts_chapter ON exam_attempts(chapter_id)`,
];

function getPgPool(): Pool {
  if (!global._codeexamPgPool) {
    const sslEnabled = process.env.PGSSL === 'true';
    const hasUrl =
      Boolean(process.env.DATABASE_URL) &&
      !process.env.DATABASE_URL!.includes('MY_');

    global._codeexamPgPool = hasUrl
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 10000,
        })
      : new Pool({
          host: process.env.PGHOST || 'localhost',
          port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          database: process.env.PGDATABASE || 'codeexam',
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 10000,
        });

    global._codeexamPgPool.on('error', (err) => {
      console.error('PostgreSQL pool idle error:', err);
    });
  }
  return global._codeexamPgPool;
}

async function ensurePgInitialized(): Promise<Pool> {
  const pool = getPgPool();
  if (!global._codeexamPgInitPromise) {
    global._codeexamPgInitPromise = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await pool.query(stmt);
      }
      const userCountRes = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users'
      );
      if (Number(userCountRes.rows[0]?.count ?? 0) === 0) {
        const seed = buildSeedDataset();
        for (const u of seed.users) {
          await pool.query(
            `INSERT INTO users (id, name, email, password_hash, role, created_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
            [u.id, u.name, u.email, u.passwordHash, u.role, u.createdAt]
          );
        }
        for (const b of seed.books) {
          await pool.query(
            `INSERT INTO books (id, title, author, description, topic, created_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [b.id, b.title, b.author, b.description, b.topic, b.createdAt]
          );
        }
        for (const c of seed.chapters) {
          await pool.query(
            `INSERT INTO chapters (id, book_id, title, description, order_index, quiz_question_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [
              c.id,
              c.bookId,
              c.title,
              c.description,
              c.orderIndex,
              c.quizQuestionCount,
              c.createdAt,
            ]
          );
        }
        for (const q of seed.questions) {
          await pool.query(
            `INSERT INTO questions (id, chapter_id, question, answers, correct_index, created_at)
             VALUES ($1, $2, $3, $4::jsonb, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [
              q.id,
              q.chapterId,
              q.question,
              JSON.stringify(q.answers),
              q.correctIndex,
              q.createdAt,
            ]
          );
        }
      }
    })().catch((err) => {
      global._codeexamPgInitPromise = undefined;
      throw err;
    });
  }
  await global._codeexamPgInitPromise;
  return pool;
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: row.role as UserRole,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapBook(row: Record<string, unknown>): Book {
  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    description: String(row.description ?? ''),
    topic: String(row.topic ?? ''),
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapChapter(row: Record<string, unknown>): Chapter {
  return {
    id: String(row.id),
    bookId: String(row.book_id),
    title: String(row.title),
    description: String(row.description ?? ''),
    orderIndex: Number(row.order_index),
    quizQuestionCount: Number(row.quiz_question_count),
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapQuestion(row: Record<string, unknown>): Question {
  const answers = Array.isArray(row.answers)
    ? (row.answers as [string, string, string, string])
    : (JSON.parse(String(row.answers)) as [string, string, string, string]);
  return {
    id: String(row.id),
    chapterId: String(row.chapter_id),
    question: String(row.question),
    answers,
    correctIndex: Number(row.correct_index),
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapAttempt(row: Record<string, unknown>): ExamAttempt {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    bookId: String(row.book_id),
    chapterId: String(row.chapter_id),
    bookTitle: String(row.book_title),
    chapterTitle: String(row.chapter_title),
    questionIds: row.question_ids as string[],
    questionsSnapshot: row.questions_snapshot as Question[],
    submittedAnswers: (row.submitted_answers ?? {}) as Record<string, number | null>,
    totalQuestions: Number(row.total_questions),
    correctCount: Number(row.correct_count),
    wrongCount: Number(row.wrong_count),
    unansweredCount: Number(row.unanswered_count),
    scorePercent: Number(row.score_percent),
    status: row.status as 'in_progress' | 'completed',
    startedAt: new Date(row.started_at as string).toISOString(),
    completedAt: row.completed_at
      ? new Date(row.completed_at as string).toISOString()
      : null,
  };
}

export class PostgresRepository implements DatabaseRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [
      email.trim(),
    ]);
    return res.rows[0] ? mapUser(res.rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] ? mapUser(res.rows[0]) : null;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    const pool = await ensurePgInitialized();
    const id = `usr_${crypto.randomUUID().slice(0, 12)}`;
    const res = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, input.name.trim(), input.email.trim().toLowerCase(), input.passwordHash, input.role]
    );
    return mapUser(res.rows[0]);
  }

  async countUsers(): Promise<number> {
    const pool = await ensurePgInitialized();
    const res = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    return Number(res.rows[0]?.count ?? 0);
  }

  async listBooksWithChapters(userId?: string | null): Promise<BookWithChapters[]> {
    const pool = await ensurePgInitialized();
    const booksRes = await pool.query('SELECT * FROM books ORDER BY created_at ASC');
    const chaptersRes = await pool.query(
      'SELECT * FROM chapters ORDER BY order_index ASC, created_at ASC'
    );
    const countsRes = await pool.query<{ chapter_id: string; count: string }>(
      'SELECT chapter_id, COUNT(*)::text AS count FROM questions GROUP BY chapter_id'
    );

    const questionCountMap = new Map<string, number>();
    for (const row of countsRes.rows) {
      questionCountMap.set(row.chapter_id, Number(row.count));
    }

    const bestScoreMap = new Map<string, { best: number; attempts: number }>();
    if (userId) {
      const statsRes = await pool.query<{
        chapter_id: string;
        best: string;
        attempts: string;
      }>(
        `SELECT chapter_id, MAX(score_percent)::text AS best, COUNT(*)::text AS attempts
         FROM exam_attempts
         WHERE user_id = $1 AND status = 'completed'
         GROUP BY chapter_id`,
        [userId]
      );
      for (const row of statsRes.rows) {
        bestScoreMap.set(row.chapter_id, {
          best: Number(row.best),
          attempts: Number(row.attempts),
        });
      }
    }

    const chaptersByBook = new Map<string, ChapterSummary[]>();
    for (const row of chaptersRes.rows) {
      const ch = mapChapter(row);
      const stat = bestScoreMap.get(ch.id);
      const summary: ChapterSummary = {
        ...ch,
        totalQuestions: questionCountMap.get(ch.id) ?? 0,
        bestScore: stat ? stat.best : null,
        attemptCount: stat ? stat.attempts : 0,
      };
      const arr = chaptersByBook.get(ch.bookId) ?? [];
      arr.push(summary);
      chaptersByBook.set(ch.bookId, arr);
    }

    return booksRes.rows.map((row) => {
      const book = mapBook(row);
      const chs = chaptersByBook.get(book.id) ?? [];
      const totalQuestions = chs.reduce((sum, c) => sum + c.totalQuestions, 0);
      return {
        ...book,
        chapters: chs,
        totalQuestions,
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
    const pool = await ensurePgInitialized();
    const id = `bk_${crypto.randomUUID().slice(0, 10)}`;
    const res = await pool.query(
      `INSERT INTO books (id, title, author, description, topic)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, input.title.trim(), input.author.trim(), input.description.trim(), input.topic.trim()]
    );
    return mapBook(res.rows[0]);
  }

  async updateBook(bookId: string, input: UpdateBookInput): Promise<Book | null> {
    const pool = await ensurePgInitialized();
    const existing = await pool.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (!existing.rows[0]) return null;
    const current = mapBook(existing.rows[0]);
    const res = await pool.query(
      `UPDATE books SET title = $2, author = $3, description = $4, topic = $5
       WHERE id = $1 RETURNING *`,
      [
        bookId,
        input.title?.trim() ?? current.title,
        input.author?.trim() ?? current.author,
        input.description?.trim() ?? current.description,
        input.topic?.trim() ?? current.topic,
      ]
    );
    return res.rows[0] ? mapBook(res.rows[0]) : null;
  }

  async deleteBook(bookId: string): Promise<boolean> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('DELETE FROM books WHERE id = $1', [bookId]);
    return (res.rowCount ?? 0) > 0;
  }

  async getChapterById(chapterId: string): Promise<Chapter | null> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('SELECT * FROM chapters WHERE id = $1', [chapterId]);
    return res.rows[0] ? mapChapter(res.rows[0]) : null;
  }

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    const pool = await ensurePgInitialized();
    const id = `ch_${crypto.randomUUID().slice(0, 10)}`;
    let orderIndex = input.orderIndex;
    if (!orderIndex) {
      const maxRes = await pool.query<{ max: number | null }>(
        'SELECT MAX(order_index) AS max FROM chapters WHERE book_id = $1',
        [input.bookId]
      );
      orderIndex = Number(maxRes.rows[0]?.max ?? 0) + 1;
    }
    const res = await pool.query(
      `INSERT INTO chapters (id, book_id, title, description, order_index, quiz_question_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id,
        input.bookId,
        input.title.trim(),
        input.description.trim(),
        orderIndex,
        Math.max(1, Math.floor(input.quizQuestionCount)),
      ]
    );
    return mapChapter(res.rows[0]);
  }

  async updateChapter(
    chapterId: string,
    input: UpdateChapterInput
  ): Promise<Chapter | null> {
    const pool = await ensurePgInitialized();
    const existing = await this.getChapterById(chapterId);
    if (!existing) return null;
    const res = await pool.query(
      `UPDATE chapters
       SET title = $2, description = $3, order_index = $4, quiz_question_count = $5
       WHERE id = $1 RETURNING *`,
      [
        chapterId,
        input.title?.trim() ?? existing.title,
        input.description?.trim() ?? existing.description,
        input.orderIndex ?? existing.orderIndex,
        input.quizQuestionCount !== undefined
          ? Math.max(1, Math.floor(input.quizQuestionCount))
          : existing.quizQuestionCount,
      ]
    );
    return res.rows[0] ? mapChapter(res.rows[0]) : null;
  }

  async reorderChapters(bookId: string, orderedChapterIds: string[]): Promise<void> {
    const pool = await ensurePgInitialized();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedChapterIds.length; i++) {
        await client.query(
          'UPDATE chapters SET order_index = $1 WHERE id = $2 AND book_id = $3',
          [i + 1, orderedChapterIds[i], bookId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteChapter(chapterId: string): Promise<boolean> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('DELETE FROM chapters WHERE id = $1', [chapterId]);
    return (res.rowCount ?? 0) > 0;
  }

  async listQuestionsByChapter(chapterId: string): Promise<Question[]> {
    const pool = await ensurePgInitialized();
    const res = await pool.query(
      'SELECT * FROM questions WHERE chapter_id = $1 ORDER BY created_at ASC',
      [chapterId]
    );
    return res.rows.map(mapQuestion);
  }

  async saveQuestionsForChapter(
    chapterId: string,
    questions: ParsedQuestionInput[],
    mode: 'append' | 'replace'
  ): Promise<Question[]> {
    const pool = await ensurePgInitialized();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (mode === 'replace') {
        await client.query('DELETE FROM questions WHERE chapter_id = $1', [chapterId]);
      }
      for (const q of questions) {
        const id = `q_${crypto.randomUUID().slice(0, 12)}`;
        await client.query(
          `INSERT INTO questions (id, chapter_id, question, answers, correct_index)
           VALUES ($1, $2, $3, $4::jsonb, $5)`,
          [id, chapterId, q.question, JSON.stringify(q.answers), q.correctIndex]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return this.listQuestionsByChapter(chapterId);
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
    return (res.rowCount ?? 0) > 0;
  }

  async createExamAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    const pool = await ensurePgInitialized();
    const res = await pool.query(
      `INSERT INTO exam_attempts (
        id, user_id, book_id, chapter_id, book_title, chapter_title,
        question_ids, questions_snapshot, submitted_answers,
        total_questions, correct_count, wrong_count, unanswered_count,
        score_percent, status, started_at, completed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        attempt.id,
        attempt.userId,
        attempt.bookId,
        attempt.chapterId,
        attempt.bookTitle,
        attempt.chapterTitle,
        JSON.stringify(attempt.questionIds),
        JSON.stringify(attempt.questionsSnapshot),
        JSON.stringify(attempt.submittedAnswers),
        attempt.totalQuestions,
        attempt.correctCount,
        attempt.wrongCount,
        attempt.unansweredCount,
        attempt.scorePercent,
        attempt.status,
        attempt.startedAt,
        attempt.completedAt,
      ]
    );
    return mapAttempt(res.rows[0]);
  }

  async getExamAttemptById(attemptId: string): Promise<ExamAttempt | null> {
    const pool = await ensurePgInitialized();
    const res = await pool.query('SELECT * FROM exam_attempts WHERE id = $1', [attemptId]);
    return res.rows[0] ? mapAttempt(res.rows[0]) : null;
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
    const pool = await ensurePgInitialized();
    const res = await pool.query(
      `UPDATE exam_attempts
       SET submitted_answers = $2::jsonb,
           correct_count = $3,
           wrong_count = $4,
           unanswered_count = $5,
           score_percent = $6,
           status = 'completed',
           completed_at = $7
       WHERE id = $1
       RETURNING *`,
      [
        attemptId,
        JSON.stringify(update.submittedAnswers),
        update.correctCount,
        update.wrongCount,
        update.unansweredCount,
        update.scorePercent,
        update.completedAt,
      ]
    );
    return res.rows[0] ? mapAttempt(res.rows[0]) : null;
  }

  async listExamAttemptsByUser(userId: string): Promise<ExamAttempt[]> {
    const pool = await ensurePgInitialized();
    const res = await pool.query(
      `SELECT * FROM exam_attempts
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY completed_at DESC`,
      [userId]
    );
    return res.rows.map(mapAttempt);
  }

  async listRecentAttempts(limit = 20): Promise<ExamAttempt[]> {
    const pool = await ensurePgInitialized();
    const res = await pool.query(
      `SELECT * FROM exam_attempts
       WHERE status = 'completed'
       ORDER BY completed_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map(mapAttempt);
  }
}
