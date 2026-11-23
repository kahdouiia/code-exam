import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestionsJson, SAMPLE_QUESTIONS_JSON } from './quiz-parser';

test('parseQuestionsJson parses valid sample JSON with correct_answer text', () => {
  const result = parseQuestionsJson(SAMPLE_QUESTIONS_JSON);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.questions.length, 2);
    assert.equal(result.questions[0].correctIndex, 0);
    assert.equal(result.questions[1].correctIndex, 1);
  }
});

test('parseQuestionsJson supports correctAnswer camelCase, numeric index, and letter A-D', () => {
  const payload = JSON.stringify([
    {
      question: 'Q1',
      answers: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      correctAnswer: 'gamma',
    },
    {
      question: 'Q2',
      answers: ['One', 'Two', 'Three', 'Four'],
      correct_answer: 3,
    },
    {
      question: 'Q3',
      answers: ['First', 'Second', 'Third', 'Fourth'],
      correct_answer: 'B',
    },
  ]);

  const result = parseQuestionsJson(payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.questions[0].correctIndex, 2);
    assert.equal(result.questions[1].correctIndex, 3);
    assert.equal(result.questions[2].correctIndex, 1);
  }
});

test('parseQuestionsJson rejects malformed JSON, non-arrays, and non-4-option arrays', () => {
  const badSyntax = parseQuestionsJson('{not valid json');
  assert.equal(badSyntax.ok, false);

  const notArray = parseQuestionsJson(JSON.stringify({ question: 'hi' }));
  assert.equal(notArray.ok, false);

  const wrongOptionCount = parseQuestionsJson(
    JSON.stringify([
      {
        question: 'Only three options',
        answers: ['A', 'B', 'C'],
        correct_answer: 'A',
      },
    ])
  );
  assert.equal(wrongOptionCount.ok, false);

  const unmatchedCorrect = parseQuestionsJson(
    JSON.stringify([
      {
        question: 'Mismatched answer',
        answers: ['A', 'B', 'C', 'D'],
        correct_answer: 'Not in list',
      },
    ])
  );
  assert.equal(unmatchedCorrect.ok, false);
});
