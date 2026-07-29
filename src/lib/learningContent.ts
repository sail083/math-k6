import type { KnowledgePointMeta } from '@/lib/types';

interface MarkdownSection {
  title: string;
  source: string;
  plain: string;
}

export interface DiscoveryContent {
  rule: string;
  evidence: string;
  whyTitle: string;
  reason: string;
  transfer: string;
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[◆💡⚠]/gu, '')
    .replace(/\uFE0F/gu, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSections(markdown: string): MarkdownSection[] {
  return markdown
    .split(/(?=^##\s+)/m)
    .map(section => section.trim())
    .map(section => {
      const lines = section.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim();
      const source = lines.slice(1).join('\n').trim();
      return { title, source, plain: cleanMarkdown(source) };
    })
    .filter(section => section.source.length > 0 && section.plain.length > 8);
}

function shorten(value: string, maximum = 68): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maximum) return normalized;
  const sentence = normalized.slice(0, maximum).replace(/[，、；：][^，、；：]*$/, '');
  return `${sentence || normalized.slice(0, maximum)}…`;
}

function extractKeyPhrases(source: string): string[] {
  const phrases = [...source.matchAll(/\*\*([^*\n]{3,42})\*\*/g)]
    .map(match => cleanMarkdown(match[1]))
    .filter(value => !/^(例|结果|注意|记忆)/.test(value));
  return [...new Set(phrases)].slice(0, 3);
}

function scoreSection(section: MarkdownSection): number {
  let score = 0;
  if (/法则|公式|怎么算|什么是|关系|意义|性质|规律|步骤|关键|核心|拼一拼|方法/.test(section.title)) score += 4;
  if (/为什么要学|生活|例题|算一算|练习|注意事项|常见/.test(section.title)) score -= 3;
  if (/\*\*|###|公式|等于|必须|如果|所以/.test(section.source)) score += 2;
  return score;
}

export function buildDiscoveryContent(meta: KnowledgePointMeta, markdown: string): DiscoveryContent {
  const sections = getSections(markdown);
  const ranked = sections.map((section, index) => ({ section, index, score: scoreSection(section) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const core = ranked[0]?.section;
  const supporting = ranked.find(item => item.section !== core && item.score >= 1)?.section
    ?? sections.find(section => section !== core);
  const phrases = core ? extractKeyPhrases(core.source) : [];
  const firstSentence = shorten((core?.plain ?? '').split(/[。！？]/)[0] ?? '', 68);
  const repeatedPhraseOpening = new Set(phrases.map(phrase => phrase.slice(0, 3))).size < phrases.length;
  const ruleCandidate = meta.formula
    ? `${meta.formula}，关键是${phrases[0] ?? meta.objectives[0]}`
    : phrases.length >= 2 && !repeatedPhraseOpening
      ? phrases.join('；')
      : firstSentence || shorten(core?.plain ?? meta.objectives[0] ?? `${meta.title}的关键规律`);
  const rule = ruleCandidate.length > 8
    ? ruleCandidate
    : `${ruleCandidate}：${firstSentence || shorten(core?.plain ?? meta.objectives[0], 52)}`;
  const reasonSource = supporting?.plain ?? core?.plain ?? meta.objectives.slice(1).join('；');
  const keyCondition = phrases[0] ?? shorten(rule, 32);

  return {
    rule: shorten(rule),
    evidence: `刚才换了两个不同情况，这条规律仍然成立。关键不是记住例题里的数字，而是先看“${shorten(keyCondition, 36)}”，再按同样的办法处理。`,
    whyTitle: supporting?.title ?? (meta.formula ? `公式为什么是 ${meta.formula}` : '这个规律为什么成立？'),
    reason: shorten(reasonSource || `换一组数字或图形，仍然可以按“${rule}”解释。`, 180),
    transfer: `遇到新的${meta.title}题，先判断是否满足“${shorten(rule, 42)}”，再开始计算。`,
  };
}
