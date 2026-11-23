export interface ParsedQuestionInput {
  question: string;
  answers: [string, string, string, string];
  correctIndex: number;
}

export type ParseQuestionsResult =
  | { ok: true; questions: ParsedQuestionInput[] }
  | { ok: false; errors: string[] };

const LETTER_MAP: Record<string, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

function resolveCorrectIndex(
  rawCorrect: unknown,
  answers: [string, string, string, string]
): number | null {
  if (typeof rawCorrect === 'number' && Number.isInteger(rawCorrect)) {
    if (rawCorrect >= 0 && rawCorrect <= 3) {
      return rawCorrect;
    }
    return null;
  }

  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    if (!trimmed) return null;

    // 1. Exact match against option text
    const exactIdx = answers.findIndex((opt) => opt === trimmed);
    if (exactIdx !== -1) return exactIdx;

    // 2. Case-insensitive match against option text
    const lower = trimmed.toLowerCase();
    const ciIdx = answers.findIndex((opt) => opt.toLowerCase() === lower);
    if (ciIdx !== -1) return ciIdx;

    // 3. Numeric string "0".."3"
    if (/^[0-3]$/.test(trimmed)) {
      return Number(trimmed);
    }

    // 4. Letter "A".."D"
    if (lower in LETTER_MAP) {
      return LETTER_MAP[lower];
    }
  }

  return null;
}

export function parseQuestionsJson(rawJson: string): ParseQuestionsResult {
  if (!rawJson || !rawJson.trim()) {
    return { ok: false, errors: ['فایل یا متن JSON خالی است.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Syntax error';
    return {
      ok: false,
      errors: [`ساختار JSON معتبر نیست: ${message}`],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      errors: ['ساختار ریشه JSON باید یک آرایه (Array) از آبجکت‌های سوال باشد.'],
    };
  }

  if (parsed.length === 0) {
    return {
      ok: false,
      errors: ['آرایه سوالات نمی‌تواند خالی باشد.'],
    };
  }

  const errors: string[] = [];
  const questions: ParsedQuestionInput[] = [];

  parsed.forEach((item, index) => {
    const itemNum = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`آیتم شماره ${itemNum} باید یک آبجکت معتبر باشد.`);
      return;
    }

    const record = item as Record<string, unknown>;
    const rawQuestion = record.question;
    if (typeof rawQuestion !== 'string' || !rawQuestion.trim()) {
      errors.push(`آیتم شماره ${itemNum}: فیلد "question" باید یک متن غیرخالی باشد.`);
      return;
    }

    const rawAnswers = record.answers;
    if (!Array.isArray(rawAnswers) || rawAnswers.length !== 4) {
      errors.push(
        `آیتم شماره ${itemNum}: فیلد "answers" باید یک آرایه دقیقاً ۴ گزینه‌ای باشد.`
      );
      return;
    }

    const cleanedAnswers: string[] = [];
    let hasInvalidAnswer = false;
    for (let i = 0; i < 4; i++) {
      const opt = rawAnswers[i];
      if (typeof opt !== 'string' || !opt.trim()) {
        errors.push(
          `آیتم شماره ${itemNum}: گزینه شماره ${i + 1} در "answers" باید متن غیرخالی باشد.`
        );
        hasInvalidAnswer = true;
      } else {
        cleanedAnswers.push(opt.trim());
      }
    }
    if (hasInvalidAnswer) return;

    const tupleAnswers = cleanedAnswers as [string, string, string, string];

    const rawCorrect =
      record.correctAnswer ??
      record.correct_answer ??
      record['correct answer'] ??
      record.correctIndex ??
      record.correct;

    if (rawCorrect === undefined || rawCorrect === null) {
      errors.push(
        `آیتم شماره ${itemNum}: فیلد "correct_answer" یا "correctAnswer" مشخص نشده است.`
      );
      return;
    }

    const correctIndex = resolveCorrectIndex(rawCorrect, tupleAnswers);
    if (correctIndex === null) {
      errors.push(
        `آیتم شماره ${itemNum}: مقدار "correct_answer" با هیچ‌یک از ۴ گزینه (یا اندیس 0 تا 3) مطابقت ندارد.`
      );
      return;
    }

    questions.push({
      question: rawQuestion.trim(),
      answers: tupleAnswers,
      correctIndex,
    });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, questions };
}

export const SAMPLE_QUESTIONS_JSON = JSON.stringify(
  [
    {
      question: 'According to John Ousterhout, what is the primary characteristic of a "deep module"?',
      answers: [
        'It provides powerful functionality through a simple interface',
        'It has many small getter and setter methods',
        'It splits a single feature across dozens of tiny classes',
        'It exposes all internal data structures for maximum flexibility',
      ],
      correct_answer: 'It provides powerful functionality through a simple interface',
    },
    {
      question: 'What is "information leakage" in software design?',
      answers: [
        'Logging sensitive credentials to stdout',
        'When a design decision is reflected in multiple modules',
        'Using more heap memory than expected',
        'Forgetting to close a database connection pool',
      ],
      correct_answer: 'When a design decision is reflected in multiple modules',
    },
  ],
  null,
  2
);
