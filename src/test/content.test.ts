import { describe, it, expect } from 'vitest';
import {
  getAllKnowledgePoints,
  getKnowledgePointsByGrade,
  getKnowledgePointById,
  getChallengeCourses,
  getCourseRelations,
  getCourseTrack,
  getTrackCourses,
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
    it('returns all 57 knowledge points', () => {
      const kps = getAllKnowledgePoints();
      expect(kps).toHaveLength(57);
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
    it('returns 15 KPs for grade 3 including progression courses', () => {
      expect(getKnowledgePointsByGrade(3)).toHaveLength(15);
    });

    it('returns 16 KPs for grade 4 including progression courses', () => {
      expect(getKnowledgePointsByGrade(4)).toHaveLength(16);
    });

    it('returns 14 KPs for grade 5 including challenges', () => {
      expect(getKnowledgePointsByGrade(5)).toHaveLength(14);
    });

    it('returns 12 KPs for grade 6', () => {
      expect(getKnowledgePointsByGrade(6)).toHaveLength(12);
    });
  });

  describe('three-level progression tracks', () => {
    const extensionIds = [
      'g3-systematic-enumeration',
      'g3-smart-calculation',
      'g3-perimeter-area-puzzle',
      'g3-fraction-visual-reasoning',
      'g4-sum-difference',
    ];
    const challengeIds = [
      'g3-cycle-pattern',
      'g4-sum-difference-multiple',
      'g4-operation-patterns',
      'g4-angle-shape-reasoning',
      'g5-chicken-rabbit',
    ];

    it('keeps five extension and five challenge courses in prerequisite order', () => {
      expect(getTrackCourses('extension').map((kp) => kp.meta.id)).toEqual(extensionIds);
      expect(getChallengeCourses().map((kp) => kp.meta.id)).toEqual(challengeIds);
      const allIds = new Set(getAllKnowledgePoints().map((kp) => kp.meta.id));
      for (const kp of [...getTrackCourses('extension'), ...getChallengeCourses()]) {
        expect(kp.meta.prerequisites.every((id) => allIds.has(id)), kp.meta.id).toBe(true);
      }
    });

    it('does not mix progression courses into textbook curricula or fake textbook references', () => {
      for (const kp of [...getTrackCourses('extension'), ...getChallengeCourses()]) {
        expect(getCourseTrack(kp.meta)).not.toBe('base');
        expect(kp.meta.textbookRefs).toEqual([]);
      }
      for (const grade of [3, 4, 5, 6] as const) {
        expect(getCurriculum(grade).every((kp) => getCourseTrack(kp.meta) === 'base')).toBe(true);
      }
      expect(getCurriculum(3)).toHaveLength(10);
      expect(getCurriculum(4)).toHaveLength(12);
      expect(getCurriculum(5)).toHaveLength(13);
      expect(getCurriculum(6)).toHaveLength(12);
    });

    it('ships each progression course with six questions, one constructed transfer, and complete D1/D7 reviews', async () => {
      for (const kp of [...getTrackCourses('extension'), ...getChallengeCourses()]) {
        const game = (await loadKnowledgePointDetail(kp.meta.id))?.game;
        expect(game?.questions).toHaveLength(6);
        expect(game?.questions.filter((question) => question.type !== 'choice')).toHaveLength(1);
        expect(game?.reviewSets?.d1?.questions).toHaveLength(2);
        expect(game?.reviewSets?.d7?.questions).toHaveLength(2);
      }
    });

    it('derives batch A base relations from prerequisites only', () => {
      expect(getCourseRelations('g3-smart-calculation').baseCourses.map((kp) => kp.meta.id)).toEqual([
        'g3-add-sub-10000', 'g3-mult-1digit', 'g3-measurement',
      ]);
      expect(getCourseRelations('g3-perimeter-area-puzzle').baseCourses.map((kp) => kp.meta.id)).toEqual([
        'g3-measurement', 'g3-rect-area', 'g3-rect-perimeter',
      ]);
      expect(getCourseRelations('g3-fraction-visual-reasoning').baseCourses.map((kp) => kp.meta.id)).toEqual([
        'g3-fraction-intro', 'g3-fraction-compare', 'g3-fraction-add-sub',
      ]);
      expect(getCourseRelations('g4-sum-difference').challengeNext.map((kp) => kp.meta.id)).toContain('g4-sum-difference-multiple');
      expect(getCourseRelations('g3-smart-calculation').challengeNext.map((kp) => kp.meta.id)).toContain('g4-operation-patterns');
    });

    it('keeps dependencies present, acyclic, and non-descending by track', () => {
      const all = getAllKnowledgePoints();
      const byId = new Map(all.map((kp) => [kp.meta.id, kp]));
      const rank = { base: 0, extension: 1, challenge: 2 } as const;
      const visiting = new Set<string>();
      const visited = new Set<string>();
      const visit = (id: string) => {
        expect(visiting.has(id), `cycle at ${id}`).toBe(false);
        if (visited.has(id)) return;
        visiting.add(id);
        const kp = byId.get(id)!;
        for (const prerequisiteId of kp.meta.prerequisites) {
          const prerequisite = byId.get(prerequisiteId);
          expect(prerequisite, `${id} -> missing ${prerequisiteId}`).toBeDefined();
          expect(rank[getCourseTrack(prerequisite!.meta)], `${id} track order`).toBeLessThanOrEqual(rank[getCourseTrack(kp.meta)]);
          visit(prerequisiteId);
        }
        visiting.delete(id);
        visited.add(id);
      };
      all.forEach((kp) => visit(kp.meta.id));
    });

    it('reuses relevant existing visual models for batch A', () => {
      expect(getKnowledgePointById('g3-smart-calculation')?.meta.vizType).toBe('operation-laws');
      expect(getKnowledgePointById('g3-perimeter-area-puzzle')?.meta.vizType).toBe('area-grid');
      expect(getKnowledgePointById('g3-fraction-visual-reasoning')?.meta.vizType).toBe('fraction-pie');
      expect(getKnowledgePointById('g4-operation-patterns')?.meta.vizType).toBe('operation-laws');
      expect(getKnowledgePointById('g4-angle-shape-reasoning')?.meta.vizType).toBe('shape-transform');
      for (const id of [
        'g3-smart-calculation',
        'g3-perimeter-area-puzzle',
        'g3-fraction-visual-reasoning',
        'g4-angle-shape-reasoning',
      ]) {
        expect(hasCourseSpecificModel(id), id).toBe(true);
      }
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
        '7×5 - 2×3 = 43',
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

  describe('delayed review sets (all 57 courses)', () => {
    it('covers all 57 courses — none missing reviewSets', async () => {
      const kps = getAllKnowledgePoints();
      expect(kps).toHaveLength(57);
      for (const kp of kps) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        expect(detail?.game?.reviewSets?.d1, kp.meta.id).toBeDefined();
        expect(detail?.game?.reviewSets?.d7, kp.meta.id).toBeDefined();
      }
    });

    it('original main challenge has at least 6 questions in every course', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        expect(detail?.game?.questions.length, kp.meta.id).toBeGreaterThanOrEqual(6);
      }
    });

    it('each review set has exactly 2 questions: 1 choice and 1 fill-blank', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          expect(qs.length, `${id}.${setKey}: question count`).toBe(2);
          const choiceCount = qs.filter((q) => q.type === 'choice').length;
          const fillCount = qs.filter((q) => q.type === 'fill-blank').length;
          expect(choiceCount, `${id}.${setKey}: choice count`).toBe(1);
          expect(fillCount, `${id}.${setKey}: fill-blank count`).toBe(1);
        }
      }
    });

    it('every review question has nonempty id/prompt/explanation, points=10, supported type', async () => {
      const supportedTypes = new Set(['choice', 'fill-blank']);
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) {
            const ctx = `${id}.${setKey}.${q.id}`;
            expect(q.id?.trim(), `${ctx}: id`).toBeTruthy();
            expect(q.prompt?.trim(), `${ctx}: prompt`).toBeTruthy();
            expect(q.explanation?.trim(), `${ctx}: explanation`).toBeTruthy();
            expect(q.points, `${ctx}: points`).toBe(10);
            expect(supportedTypes.has(q.type), `${ctx}: type=${q.type}`).toBe(true);
          }
        }
      }
    });

    it('choice questions have valid options and unambiguous single correct answer', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) {
            if (q.type !== 'choice') continue;
            const ctx = `${id}.${setKey}.${q.id}`;
            const opts = q.options as string[] | undefined;
            const ca = q.correctAnswer as string;
            expect(Array.isArray(opts), `${ctx}: options must be array`).toBe(true);
            expect(opts!.length, `${ctx}: at least 3 options`).toBeGreaterThanOrEqual(3);
            expect(opts!.includes(ca), `${ctx}: correctAnswer in options`).toBe(true);
            expect(opts!.filter((o) => o === ca).length, `${ctx}: correctAnswer appears exactly once`).toBe(1);
            expect(new Set(opts).size, `${ctx}: no duplicate options`).toBe(opts!.length);
          }
        }
      }
    });

    it('fill-blank questions have a nonempty string or nonempty string-array correctAnswer', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) {
            if (q.type !== 'fill-blank') continue;
            const ctx = `${id}.${setKey}.${q.id}`;
            const ca = q.correctAnswer;
            if (Array.isArray(ca)) {
              expect(ca.length, `${ctx}: non-empty array`).toBeGreaterThan(0);
              for (const ans of ca) {
                expect(typeof ans === 'string' && ans.trim().length > 0, `${ctx}: each answer non-empty string`).toBe(true);
              }
            } else {
              expect(typeof ca === 'string' && (ca as string).trim().length > 0, `${ctx}: non-empty string`).toBe(true);
            }
          }
        }
      }
    });

    it('review prompts differ from all original prompts', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        const originalPrompts = new Set(detail?.game?.questions.map((q) => q.prompt) ?? []);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) {
            expect(originalPrompts.has(q.prompt), `${id}.${setKey}.${q.id}: prompt must differ from originals`).toBe(false);
          }
        }
      }
    });

    it('d1 and d7 prompts are distinct from each other', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        const d1Prompts = new Set(detail?.game?.reviewSets?.d1?.questions.map((q) => q.prompt) ?? []);
        const d7Qs = detail?.game?.reviewSets?.d7?.questions ?? [];
        for (const q of d7Qs) {
          expect(d1Prompts.has(q.prompt), `${id}: d7 prompt must differ from d1`).toBe(false);
        }
      }
    });

    it('all question IDs are unique within each course across original + both review sets', async () => {
      for (const kp of getAllKnowledgePoints()) {
        const id = kp.meta.id;
        const detail = await loadKnowledgePointDetail(id);
        const allIds: string[] = (detail?.game?.questions ?? []).map((q) => q.id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) allIds.push(q.id);
        }
        expect(new Set(allIds).size, `${id}: duplicate question IDs`).toBe(allIds.length);
      }
    });

    it('review-choice correct positions cover positions A, B, and C across all 57 courses', async () => {
      const positions = new Set<number>();
      for (const kp of getAllKnowledgePoints()) {
        const detail = await loadKnowledgePointDetail(kp.meta.id);
        for (const setKey of ['d1', 'd7'] as const) {
          const qs = detail?.game?.reviewSets?.[setKey]?.questions ?? [];
          for (const q of qs) {
            if (q.type === 'choice' && Array.isArray(q.options)) {
              const pos = (q.options as string[]).indexOf(q.correctAnswer as string);
              if (pos >= 0) positions.add(pos);
            }
          }
        }
      }
      // Positions 0=A, 1=B, 2=C must all appear; D (3) is not required
      expect(positions.has(0), 'position A must appear').toBe(true);
      expect(positions.has(1), 'position B must appear').toBe(true);
      expect(positions.has(2), 'position C must appear').toBe(true);
    });
  });

  describe('curriculum prerequisite ordering', () => {
    it('orders fraction intro before compare before add-sub in 人教版 grade 3', () => {
      const curriculum = getCurriculum(3, '人教版');
      const introIdx = curriculum.findIndex((kp) => kp.meta.id === 'g3-fraction-intro');
      const compareIdx = curriculum.findIndex((kp) => kp.meta.id === 'g3-fraction-compare');
      const addSubIdx = curriculum.findIndex((kp) => kp.meta.id === 'g3-fraction-add-sub');
      expect(introIdx).toBeGreaterThanOrEqual(0);
      expect(compareIdx).toBeGreaterThanOrEqual(0);
      expect(addSubIdx).toBeGreaterThanOrEqual(0);
      expect(introIdx).toBeLessThan(compareIdx);
      expect(compareIdx).toBeLessThan(addSubIdx);
    });

    it('orders circle perimeter before area in 人教版 grade 6', () => {
      const curriculum = getCurriculum(6, '人教版');
      const perimIdx = curriculum.findIndex((kp) => kp.meta.id === 'g6-circle-perimeter');
      const areaIdx = curriculum.findIndex((kp) => kp.meta.id === 'g6-circle-area');
      expect(perimIdx).toBeGreaterThanOrEqual(0);
      expect(areaIdx).toBeGreaterThanOrEqual(0);
      expect(perimIdx).toBeLessThan(areaIdx);
    });

    it('orders cylinder surface before volume before cone volume in 人教版 grade 6', () => {
      const curriculum = getCurriculum(6, '人教版');
      const surfIdx = curriculum.findIndex((kp) => kp.meta.id === 'g6-cylinder-surface');
      const volIdx = curriculum.findIndex((kp) => kp.meta.id === 'g6-cylinder-volume');
      const coneIdx = curriculum.findIndex((kp) => kp.meta.id === 'g6-cone-volume');
      expect(surfIdx).toBeGreaterThanOrEqual(0);
      expect(volIdx).toBeGreaterThanOrEqual(0);
      expect(coneIdx).toBeGreaterThanOrEqual(0);
      expect(surfIdx).toBeLessThan(volIdx);
      expect(volIdx).toBeLessThan(coneIdx);
    });

    it('has no duplicate courses in any textbook curriculum', () => {
      for (const grade of [3, 4, 5, 6] as const) {
        const curriculum = getCurriculum(grade, '人教版');
        const ids = curriculum.map((kp) => kp.meta.id);
        expect(new Set(ids).size, `grade ${grade}`).toBe(ids.length);
      }
    });
  });
});
