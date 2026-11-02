type CharacterData = {
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
};

const loaders: Record<string, () => Promise<{ default: CharacterData }>> = {
  晨: () => import('hanzi-writer-data/晨.json'),
  绒: () => import('hanzi-writer-data/绒.json'),
  球: () => import('hanzi-writer-data/球.json'),
  汉: () => import('hanzi-writer-data/汉.json'),
  艳: () => import('hanzi-writer-data/艳.json'),
  服: () => import('hanzi-writer-data/服.json'),
  装: () => import('hanzi-writer-data/装.json'),
  扮: () => import('hanzi-writer-data/扮.json'),
  读: () => import('hanzi-writer-data/读.json'),
  静: () => import('hanzi-writer-data/静.json'),
  停: () => import('hanzi-writer-data/停.json'),
  孔: () => import('hanzi-writer-data/孔.json'),
  雀: () => import('hanzi-writer-data/雀.json'),
  粗: () => import('hanzi-writer-data/粗.json'),
  影: () => import('hanzi-writer-data/影.json'),
};

export function loadHanziData(character: string): Promise<CharacterData> {
  const loader = loaders[character];
  return loader ? loader().then(({ default: data }) => data) : Promise.reject(new Error(`Missing stroke data for ${character}`));
}
