import type { Question, TimedPracticePolicy } from './types';

export interface TimedAnswerDetails {
  outcome: 'answered' | 'timeout';
  timing: 'timed' | 'untimed';
}

// A numerical safety bound, not a pedagogical time allowance.
export function isValidTimeLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    && value <= Math.floor(Number.MAX_SAFE_INTEGER / 1000);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasReview(policy: TimedPracticePolicy): boolean {
  const review = policy.review;
  return !!review && hasText(review.reviewer) && hasText(review.evidence)
    && /^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt)
    && Number.isFinite(Date.parse(review.reviewedAt))
    && new Date(review.reviewedAt).toISOString().slice(0, 10) === review.reviewedAt;
}

function hasValidOptions(question: Question): boolean {
  const options = question.options;
  return Array.isArray(options) && options.length >= 2 && options.length <= 4
    && options.every(hasText) && new Set(options.map((option) => option.trim())).size === options.length;
}

/** Missing/invalid/unreviewed configuration never silently becomes a 30-second test. */
export function canUseTimedPractice(question: Question): boolean {
  const policy = question.timing;
  return isValidTimeLimit(question.timeLimit) && !!policy
    && policy.goal === 'fluency' && policy.reviewStatus === 'approved'
    && hasText(policy.rationale) && hasReview(policy) && hasValidOptions(question)
    && hasText(question.correctAnswer) && question.options!.includes(question.correctAnswer as string)
    && (!question.evidenceType || question.evidenceType === 'procedural');
}

/** Structural checks cannot certify mathematics, learning impact, or a reviewer's approval. */
export function validateTimedQuestion(question: Question, grade: number | undefined): string[] {
  if (question.type !== 'timed-challenge') return [];
  const issues: string[] = [];
  if (!Number.isInteger(grade) || grade! < 1 || grade! > 6) issues.push('grade: requires an explicit elementary grade');
  if (!hasText(question.id)) issues.push('id: required');
  if (!hasText(question.prompt)) issues.push('prompt: required');
  if (!hasText(question.explanation)) issues.push('explanation: must explain the method');
  if (!Number.isFinite(question.points) || question.points < 0) issues.push('points: must be finite and nonnegative');
  if (!isValidTimeLimit(question.timeLimit)) issues.push('timeLimit: explicit positive safe whole seconds required');
  const options = question.options;
  if (!hasValidOptions(question)) {
    issues.push('options: requires 2–4 distinct nonempty single-choice options');
  }
  if (!hasText(question.correctAnswer) || !Array.isArray(options) || !options.includes(question.correctAnswer as string)) {
    issues.push('correctAnswer: must be exactly one of the options');
  }
  const policy = question.timing;
  if (!policy || !['fluency', 'reasoning'].includes(policy.goal) || !hasText(policy.rationale)
    || !['pending', 'approved'].includes(policy.reviewStatus)) {
    issues.push('timing: goal, reviewStatus and rationale required');
  } else if (policy.reviewStatus === 'approved') {
    if (policy.goal !== 'fluency') issues.push('timing: reasoning must remain untimed');
    if (!hasReview(policy)) issues.push('timing.review: reviewer, real date and calibration evidence required');
  }
  if (question.evidenceType && question.evidenceType !== 'procedural') {
    issues.push('evidenceType: timed single-choice cannot certify conceptual, transfer or retention mastery');
  }
  return issues;
}
