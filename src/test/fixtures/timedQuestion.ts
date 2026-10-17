import type { Question } from '@/lib/types';

/** Synthetic review data exercises engineering paths; it is never a curriculum approval. */
export const approvedTimedQuestion: Question = {
  id: 'timed-safety', type: 'timed-challenge', prompt: '23 × 4 = ?',
  options: ['82', '92', '86', '96'], correctAnswer: '92',
  explanation: '个位 3×4=12，进1；十位 2×4+1=9，所以是92。', points: 10, timeLimit: 15,
  timing: {
    goal: 'fluency', reviewStatus: 'approved', rationale: 'Synthetic test fixture only.',
    review: { reviewer: 'test fixture', reviewedAt: '2026-10-17', evidence: 'fixture://not-a-teaching-approval' },
  },
};
