import { describe, it, expect } from 'vitest';
import {
  getAllKnowledgePoints,
  getKnowledgePointsByGrade,
  getKnowledgePointById,
  loadKnowledgePointDetail,
  getCurriculum,
  getSemester,
  getTextbookRef,
} from '@/lib/content';
import { isGenericVisualizationSafe, unsafeGenericModelIds } from '@/lib/courseQuality';
import { hasCourseSpecificModel } from '@/components/InteractivePractice';
import { buildDiscoveryContent } from '@/lib/learningContent';

describe('content loading', () => {
  describe('getAllKnowledgePoints', () => {
    it('returns all 47 knowledge points', () => {
      const kps = getAllKnowledgePoints();
      expect(kps).toHaveLength(47);
    });

    it('gives every course enough questions and a non-choice mastery check', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        expect(detail?.game?.questions.length, kp.meta.id).toBeGreaterThanOrEqual(6);
        expect(detail?.game?.questions.some((question) => question.type !== 'choice'), kp.meta.id).toBe(true);
      }
    });

    it('builds a course-specific discovery rule and explanation for every course', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        const discovery = buildDiscoveryContent(kp.meta, detail?.explanation ?? '');
        expect(discovery.rule.length, kp.meta.id).toBeGreaterThan(8);
        expect(discovery.reason.length, kp.meta.id).toBeGreaterThan(18);
        expect(discovery.rule, kp.meta.id).not.toBe(kp.meta.objectives[0]);
      }
    });

    it('extracts concrete rules instead of generic objectives for representative courses', async () => {
      const addition = await loadKnowledgePointDetail('g3-add-sub-10000');
      const fraction = await loadKnowledgePointDetail('g3-fraction-intro');
      const additionRule = buildDiscoveryContent(addition!.meta, addition!.explanation).rule;
      const fractionRule = buildDiscoveryContent(fraction!.meta, fraction!.explanation).rule;

      expect(additionRule).toContain('相同数位对齐');
      expect(additionRule).toContain('满十进一');
      expect(fractionRule).toContain('平均分成几份');
      expect(fractionRule).toContain('就是分数');
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

    it('uses a place-value column model for addition and subtraction within 10,000', () => {
      expect(getKnowledgePointById('g3-add-sub-10000')?.meta.vizType).toBe('column-arithmetic');
    });

    it('uses dedicated models for high-risk computation concepts', () => {
      const expectedModels = {
        'g3-division-remainder': 'remainder-groups',
        'g4-div-2digit': 'trial-division',
        'g4-decimal-add-sub': 'decimal-place-value',
        'g5-decimal-mult': 'decimal-product',
        'g5-decimal-div': 'decimal-quotient',
        'g6-fraction-mult': 'fraction-product',
        'g6-fraction-div': 'fraction-quotient',
      } as const;

      for (const [id, model] of Object.entries(expectedModels)) {
        expect(getKnowledgePointById(id)?.meta.vizType, id).toBe(model);
      }
    });

    it('adds a non-choice migration check to dedicated computation courses', async () => {
      const ids = [
        'g3-division-remainder',
        'g4-div-2digit',
        'g4-decimal-add-sub',
        'g5-decimal-mult',
        'g5-decimal-div',
        'g6-fraction-mult',
        'g6-fraction-div',
      ];

      for (const id of ids) {
        const detail = await loadKnowledgePointDetail(id);
        expect(detail?.game?.questions.length, id).toBeGreaterThanOrEqual(6);
        expect(detail?.game?.questions.some((question) => question.type !== 'choice'), id).toBe(true);
      }
    });

    it('uses dedicated models for audited concept courses', () => {
      const expectedModels = {
        'g3-measurement': 'measurement-lab',
        'g3-fraction-compare': 'fraction-compare-model',
        'g5-fraction-meaning': 'fraction-equivalence',
        'g4-decimal-properties': 'decimal-equivalence',
        'g4-parallel-perpendicular': 'line-relations',
        'g4-parallelogram-trapezoid': 'quadrilateral-constraints',
        'g5-possibility': 'probability-experiment',
        'g6-percentage': 'percent-grid',
        'g6-ratio': 'ratio-mixture',
        'g6-proportion': 'proportion-table',
        'g6-scale': 'coordinate-scale',
      } as const;

      for (const [id, model] of Object.entries(expectedModels)) {
        expect(getKnowledgePointById(id)?.meta.vizType, id).toBe(model);
      }
    });

    it('adds non-choice migration checks to dedicated concept courses', async () => {
      const ids = [
        'g3-measurement', 'g3-fraction-compare', 'g5-fraction-meaning',
        'g4-decimal-properties', 'g4-parallel-perpendicular', 'g4-parallelogram-trapezoid',
        'g5-possibility', 'g6-percentage', 'g6-ratio', 'g6-proportion', 'g6-scale',
      ];

      for (const id of ids) {
        const detail = await loadKnowledgePointDetail(id);
        expect(detail?.game?.questions.length, id).toBeGreaterThanOrEqual(6);
        expect(detail?.game?.questions.some((question) => question.type !== 'choice'), id).toBe(true);
      }
    });

    it('does not route any audited unsafe course through its former shared model', () => {
      for (const id of unsafeGenericModelIds) {
        const model = getKnowledgePointById(id)?.meta.vizType;
        expect(model, id).not.toBe('number-line');
        expect(model, id).not.toBe('bar-chart');
        expect(model, id).not.toBe('shape-transform');
        expect(model, id).not.toBe('probability-model');
      }
    });

    it('uses dedicated models and migration checks for remaining P0 courses', async () => {
      const expectedModels = {
        'g3-mult-1digit': 'place-value-product',
        'g3-rect-perimeter': 'perimeter-walk',
        'g4-arith-laws': 'operation-laws',
        'g4-mult-2digit': 'partial-products',
        'g5-fraction-add-sub': 'fraction-common-parts',
        'g6-circle-perimeter': 'circle-roll',
        'g6-cylinder-volume': 'cylinder-layers',
      } as const;
      for (const [id, model] of Object.entries(expectedModels)) {
        const detail = await loadKnowledgePointDetail(id);
        expect(detail?.meta.vizType, id).toBe(model);
        expect(detail?.game?.questions.length, id).toBeGreaterThanOrEqual(6);
        expect(detail?.game?.questions.some((question) => question.type !== 'choice'), id).toBe(true);
      }
    });

    it('uses course-specific models and non-choice mastery checks for all 21 P1 courses', async () => {
      const ids = [
        'g3-fraction-intro', 'g3-fraction-add-sub', 'g3-rect-area', 'g3-time',
        'g4-angle-measure', 'g4-bar-chart', 'g4-decimal-meaning', 'g4-large-numbers', 'g4-triangle',
        'g5-cuboid-surface', 'g5-cuboid-volume', 'g5-equation', 'g5-parallelogram-area',
        'g5-position', 'g5-trapezoid-area', 'g5-tree-planting', 'g5-triangle-area',
        'g6-circle-area', 'g6-cone-volume', 'g6-cylinder-surface', 'g6-sector-chart',
      ];

      expect(ids).toHaveLength(21);
      for (const id of ids) {
        const detail = await loadKnowledgePointDetail(id);
        expect(hasCourseSpecificModel(id), id).toBe(true);
        expect(detail?.game?.questions.length, id).toBeGreaterThanOrEqual(6);
        expect(detail?.game?.questions.some((question) => question.type !== 'choice'), id).toBe(true);
      }
    });

    it('blocks audited misleading shared visualizations', () => {
      expect(unsafeGenericModelIds).toHaveLength(16);
      expect(isGenericVisualizationSafe('g4-div-2digit')).toBe(false);
      expect(isGenericVisualizationSafe('g6-ratio')).toBe(false);
      expect(isGenericVisualizationSafe('g5-position')).toBe(true);
    });

    it('does not reintroduce known misleading mathematical claims', async () => {
      const forbiddenClaims = [
        '商是三位数（实际商 32',
        '从5份中减去吃掉的，看剩余的1份',
        '比值是一个数，不带单位',
        '所有柱体的体积都等于底面积 × 高',
        '一个数乘真分数（小于1的分数）',
      ];

      for (const kp of allKPs) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        const source = JSON.stringify(detail);
        for (const claim of forbiddenClaims) {
          expect(source, `${kp.meta.id} contains misleading claim: ${claim}`).not.toContain(claim);
        }
      }
    });
  });

  describe('textbook curriculum', () => {
    it('keeps one canonical course while sorting by the selected textbook', () => {
      const curriculum = getCurriculum(4, '北师大版');
      expect(new Set(curriculum.map((kp) => kp.meta.id)).size).toBe(curriculum.length);
      expect(curriculum.every((kp) => getTextbookRef(kp.meta, '北师大版'))).toBe(true);
    });

    it('groups textbook references into upper and lower semesters', () => {
      const upper = getKnowledgePointById('g4-large-numbers')!;
      const lower = getKnowledgePointById('g4-decimal-meaning')!;
      expect(getSemester(getTextbookRef(upper.meta, '人教版'))).toBe('上册');
      expect(getSemester(getTextbookRef(lower.meta, '人教版'))).toBe('下册');
    });
  });
});
