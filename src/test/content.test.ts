import { describe, it, expect } from 'vitest';
import {
  getAllKnowledgePoints,
  getKnowledgePointsByGrade,
  getKnowledgePointById,
  loadKnowledgePointDetail,
} from '@/lib/content';

describe('content loading', () => {
  describe('getAllKnowledgePoints', () => {
    it('returns all 47 knowledge points', () => {
      const kps = getAllKnowledgePoints();
      expect(kps).toHaveLength(47);
    });
  });

  describe('getKnowledgePointsByGrade', () => {
    it('returns 10 KPs for grade 3', () => {
      expect(getKnowledgePointsByGrade(3)).toHaveLength(10);
    });

    it('returns 12 KPs for grade 4', () => {
      expect(getKnowledgePointsByGrade(4)).toHaveLength(12);
    });

    it('returns 13 KPs for grade 5', () => {
      expect(getKnowledgePointsByGrade(5)).toHaveLength(13);
    });

    it('returns 12 KPs for grade 6', () => {
      expect(getKnowledgePointsByGrade(6)).toHaveLength(12);
    });
  });

  describe('getKnowledgePointById', () => {
    it("returns the KP with correct title for 'g3-rect-area'", () => {
      const kp = getKnowledgePointById('g3-rect-area');
      expect(kp).toBeDefined();
      expect(kp!.meta.title).toBe('长方形和正方形面积');
    });

    it("returns undefined for 'nonexistent'", () => {
      expect(getKnowledgePointById('nonexistent')).toBeUndefined();
    });
  });

  describe('loadKnowledgePointDetail', () => {
    it("returns undefined for 'nonexistent'", async () => {
      const detail = await loadKnowledgePointDetail('nonexistent');
      expect(detail).toBeUndefined();
    });

    it("loads full detail including explanation for 'g3-rect-area'", async () => {
      const detail = await loadKnowledgePointDetail('g3-rect-area');
      expect(detail).toBeDefined();
      expect(detail!.meta.title).toBe('长方形和正方形面积');
      expect(detail!.explanation.length).toBeGreaterThan(0);
      expect(detail!.game).toBeDefined();
      expect(detail!.game!.questions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('data integrity', () => {
    const allKPs = getAllKnowledgePoints();

    it('all KPs with hasFormula: true have a derivation', async () => {
      for (const kp of allKPs) {
        if (kp.meta.hasFormula) {
          const detail = await loadKnowledgePointDetail(kp.meta.id);
          expect(detail?.derivation).toBeDefined();
          expect(detail?.derivation?.steps.length).toBeGreaterThan(0);
        }
      }
    });

    it('all KPs have a game config with at least 1 question', async () => {
      for (const kp of allKPs) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        expect(detail?.game).toBeDefined();
        expect(detail?.game!.questions.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
