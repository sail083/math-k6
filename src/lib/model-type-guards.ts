/**
 * Lightweight type-guard functions for course-specific models.
 *
 * These live in a shared utility so that InteractivePractice.tsx and
 * KnowledgePoint.tsx can test vizType / knowledgePointId strings
 * without eagerly importing the heavy React component modules that
 * back each model.
 */
import type { VizType } from '@/lib/types';

// ---------------------------------------------------------------------------
// CourseMathModel guards
// ---------------------------------------------------------------------------

type CourseMathModelType = Extract<VizType,
  | 'remainder-groups'
  | 'trial-division'
  | 'decimal-place-value'
  | 'decimal-product'
  | 'decimal-quotient'
  | 'fraction-product'
  | 'fraction-quotient'>;

const courseModelTypes = new Set<VizType>([
  'remainder-groups',
  'trial-division',
  'decimal-place-value',
  'decimal-product',
  'decimal-quotient',
  'fraction-product',
  'fraction-quotient',
]);

export function isCourseModelType(type: VizType): type is CourseMathModelType {
  return courseModelTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseConceptModel guards
// ---------------------------------------------------------------------------

type ConceptModelType = Extract<VizType,
  | 'measurement-lab'
  | 'fraction-compare-model'
  | 'fraction-equivalence'
  | 'decimal-equivalence'
  | 'line-relations'
  | 'quadrilateral-constraints'
  | 'probability-experiment'
  | 'percent-grid'
  | 'ratio-mixture'
  | 'proportion-table'
  | 'coordinate-scale'>;

const conceptModelTypes = new Set<VizType>([
  'measurement-lab', 'fraction-compare-model', 'fraction-equivalence', 'decimal-equivalence',
  'line-relations', 'quadrilateral-constraints', 'probability-experiment', 'percent-grid',
  'ratio-mixture', 'proportion-table', 'coordinate-scale',
]);

export function isConceptModelType(type: VizType): type is ConceptModelType {
  return conceptModelTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseAdvancedModel guards
// ---------------------------------------------------------------------------

type AdvancedModelType = Extract<VizType,
  | 'place-value-product'
  | 'perimeter-walk'
  | 'operation-laws'
  | 'partial-products'
  | 'fraction-common-parts'
  | 'circle-roll'
  | 'cylinder-layers'>;

const advancedTypes = new Set<VizType>(['place-value-product','perimeter-walk','operation-laws','partial-products','fraction-common-parts','circle-roll','cylinder-layers']);

export function isAdvancedModelType(type: VizType): type is AdvancedModelType {
  return advancedTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseFoundationModel guards
// ---------------------------------------------------------------------------

type FoundationModelType =
  | 'g3-fraction-intro'
  | 'g3-fraction-add-sub'
  | 'g3-rect-area'
  | 'g3-time'
  | 'g4-angle-measure'
  | 'g4-decimal-meaning'
  | 'g4-large-numbers';

const foundationModelTypes = new Set<string>([
  'g3-fraction-intro',
  'g3-fraction-add-sub',
  'g3-rect-area',
  'g3-time',
  'g4-angle-measure',
  'g4-decimal-meaning',
  'g4-large-numbers',
]);

export function isFoundationModelType(type: string): type is FoundationModelType {
  return foundationModelTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseGeometryModel guards
// ---------------------------------------------------------------------------

type CourseGeometryModelType =
  | 'g3-rect-area'
  | 'g4-angle-measure'
  | 'g4-triangle'
  | 'g5-parallelogram-area'
  | 'g5-trapezoid-area'
  | 'g5-triangle-area'
  | 'g6-circle-area';

const geometryModelTypes = new Set<string>([
  'g3-rect-area', 'g4-angle-measure', 'g4-triangle', 'g5-parallelogram-area',
  'g5-trapezoid-area', 'g5-triangle-area', 'g6-circle-area',
]);

export function isGeometryModelType(type: string): type is CourseGeometryModelType {
  return geometryModelTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseMasteryModelC guards
// ---------------------------------------------------------------------------

type CourseMasteryModelCType =
  | 'g5-cuboid-surface'
  | 'g5-cuboid-volume'
  | 'g5-equation'
  | 'g6-circle-area'
  | 'g6-cone-volume'
  | 'g6-cylinder-surface'
  | 'g6-sector-chart';

const modelTypes = new Set<string>([
  'g5-cuboid-surface', 'g5-cuboid-volume', 'g5-equation', 'g6-circle-area',
  'g6-cone-volume', 'g6-cylinder-surface', 'g6-sector-chart',
]);

export function isCourseMasteryModelCType(type: string): type is CourseMasteryModelCType {
  return modelTypes.has(type);
}

// ---------------------------------------------------------------------------
// CourseApplicationModel guards
// ---------------------------------------------------------------------------

type ApplicationModelType =
  | 'g4-bar-chart'
  | 'g5-position'
  | 'g5-tree-planting'
  | 'g3-cycle-pattern'
  | 'g3-systematic-enumeration'
  | 'g4-sum-difference'
  | 'g4-sum-difference-multiple'
  | 'g5-chicken-rabbit';

const applicationModelIds = new Set<string>([
  'g4-bar-chart', 'g5-position', 'g5-tree-planting',
  'g3-cycle-pattern', 'g3-systematic-enumeration',
  'g4-sum-difference', 'g4-sum-difference-multiple', 'g5-chicken-rabbit',
]);

export function isApplicationModelType(id: string): id is ApplicationModelType {
  return applicationModelIds.has(id);
}
