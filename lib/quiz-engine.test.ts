import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeExam, selectRandomQuestions } from './quiz-engine';
import type { Question } from './types';

function makeBank(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q_${i + 1}`,
    chapterId: 'ch_1',
    question: `Question ${i + 1}`,
    answers: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
    correctIndex: i % 4,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
}

test('selectRandomQuestions returns requested count of unique items without mutating bank', () => {
  const bank = makeBank(10);
  const snapshotIds = bank.map((q) => q.id);

  let seed = 42;
  const deterministicRng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const selected = selectRandomQuestions(bank, 4, deterministicRng);
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected.map((q) => q.id)).size, 4);
  assert.deepEqual(
    bank.map((q) => q.id),
    snapshotIds
  );
});

test('selectRandomQuestions caps count at bank size', () => {
  const bank = makeBank(3);
  const selected = selectRandomQuestions(bank, 10);
  assert.equal(selected.length, 3);
});

test('gradeExam calculates scorePercent, correct, wrong, and unanswered counts accurately', () => {
  const questions = makeBank(4);
  // correctIndex: q_1=0, q_2=1, q_3=2, q_4=3
  const result = gradeExam(questions, {
    q_1: 0, // correct
    q_2: 1, // correct
    q_3: 0, // wrong
    // q_4 omitted -> unanswered
  });

  assert.equal(result.totalQuestions, 4);
  assert.equal(result.correctCount, 2);
  assert.equal(result.wrongCount, 1);
  assert.equal(result.unansweredCount, 1);
  assert.equal(result.scorePercent, 50);
  assert.equal(result.review[0].isCorrect, true);
  assert.equal(result.review[2].isCorrect, false);
  assert.equal(result.review[2].selectedIndex, 0);
  assert.equal(result.review[2].correctIndex, 2);
  assert.equal(result.review[3].selectedIndex, null);
  assert.equal(result.review[3].isCorrect, false);
});
