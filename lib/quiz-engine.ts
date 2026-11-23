import type { ExamReviewItem, Question } from './types';

/**
 * Randomly selects `requestedCount` unique questions using Fisher-Yates shuffle.
 * Does not mutate the source array.
 */
export function selectRandomQuestions(
  bank: readonly Question[],
  requestedCount: number,
  rng: () => number = Math.random
): Question[] {
  if (bank.length === 0) return [];
  const count = Math.min(Math.max(1, Math.floor(requestedCount)), bank.length);
  const copy = [...bank];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  return copy.slice(0, count);
}

export interface GradeExamSummary {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercent: number;
  review: ExamReviewItem[];
}

/**
 * Grades submitted user answers against the authoritative question list.
 */
export function gradeExam(
  questions: readonly Question[],
  submittedAnswers: Record<string, number | null | undefined>
): GradeExamSummary {
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const review: ExamReviewItem[] = questions.map((q) => {
    const raw = submittedAnswers[q.id];
    const selectedIndex =
      typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 3
        ? raw
        : null;

    const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
    if (selectedIndex === null) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    return {
      questionId: q.id,
      question: q.question,
      answers: q.answers,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
    };
  });

  const totalQuestions = questions.length;
  const scorePercent =
    totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return {
    totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    scorePercent,
    review,
  };
}
