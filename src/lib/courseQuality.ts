const unsafeGenericModels = new Set([
  'g3-division-remainder',
  'g3-fraction-compare',
  'g3-measurement',
  'g4-decimal-add-sub',
  'g4-decimal-properties',
  'g4-div-2digit',
  'g4-parallel-perpendicular',
  'g4-parallelogram-trapezoid',
  'g5-decimal-mult',
  'g5-decimal-div',
  'g5-fraction-meaning',
  'g5-possibility',
  'g6-percentage',
  'g6-proportion',
  'g6-ratio',
  'g6-scale',
]);

/** Shared visuals are hidden when the course audit found a misleading model mapping. */
export function isGenericVisualizationSafe(knowledgePointId: string): boolean {
  return !unsafeGenericModels.has(knowledgePointId);
}

export const unsafeGenericModelIds = Object.freeze([...unsafeGenericModels]);
