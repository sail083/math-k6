import type { LanguageLesson } from '@/lib/types';

// 原创文学阅读迁移，非教材同步。
export const chineseG6CharacterLessons: LanguageLesson[] = [
  { id: 'zh-g6-character-action', title: '从动作找到心情线索', summary: '用人物动作推断当下感受，并区分推断与事实。', studyGuide: ['先找人物做了什么。', '再想这个动作可能表现什么。', '用“可能、似乎”保留推断边界。'], body: '比赛结果还没公布，阿宁把手里的号码牌翻来翻去，几次想问老师又停住了。动作“翻来翻去、想问又停住”可以支持他有些紧张或犹豫；但不能确定他一定会得第一名。', questions: [
    { id: 'zh-g6-character-action-q1', type: 'choice', prompt: '哪些动作是推断阿宁心情的线索？', options: ['翻来翻去、想问又停住', '比赛结果已经公布', '号码牌上有数字'], correctAnswer: '翻来翻去、想问又停住', explanation: '这些动作表现不安或犹豫。再试时先找人物具体做了什么。', points: 10 },
    { id: 'zh-g6-character-action-q2', type: 'choice', prompt: '根据材料，哪项说法最稳妥？', options: ['阿宁可能有些紧张或犹豫', '阿宁一定会得第一名', '阿宁已经知道结果'], correctAnswer: '阿宁可能有些紧张或犹豫', explanation: '动作支持可能的心情，但结果尚未公布。再试时用“可能”守住证据范围。', points: 10 },
    { id: 'zh-g6-character-action-q3', type: 'choice', prompt: '哪件事材料没有写？', options: ['阿宁最后是否获奖', '他翻号码牌', '他想问老师又停住'], correctAnswer: '阿宁最后是否获奖', explanation: '原文没有公布结果。再试时不把推断当作事实。', points: 10 },
  ] },
  { id: 'zh-g6-character-language', title: '把语言和行为放在一起读', summary: '结合人物说的话和做的事，判断态度变化。', studyGuide: ['先摘出关键原话。', '再对照前后动作。', '结论只写材料能支持的变化。'], body: '小周第一次看到新同学独自整理画具，只说：“我还有事。”走出几步后，他又回头说：“我帮你一起分颜色吧。”前后语言和回头的动作说明他后来愿意提供帮助；不能断定他一开始讨厌新同学。', questions: [
    { id: 'zh-g6-character-language-q1', type: 'choice', prompt: '哪句话表现小周后来愿意帮助？', options: ['我帮你一起分颜色吧', '我还有事', '我看见画具了'], correctAnswer: '我帮你一起分颜色吧', explanation: '这句直接提出帮助。再试时结合说话内容和动作判断态度。', points: 10 },
    { id: 'zh-g6-character-language-q2', type: 'choice', prompt: '哪项是材料支持的态度变化？', options: ['他后来愿意提供帮助', '他一直讨厌新同学', '他已经完成了所有整理'], correctAnswer: '他后来愿意提供帮助', explanation: '回头并提出分颜色支持这一变化；其他说法没有依据。再试时按前后行为对照。', points: 10 },
    { id: 'zh-g6-character-language-q3', type: 'choice', prompt: '哪项属于过度推断？', options: ['小周一开始讨厌新同学', '小周后来回头了', '小周提出分颜色'], correctAnswer: '小周一开始讨厌新同学', explanation: '“我还有事”不能证明讨厌。再试时区分事实和替人物添加的原因。', points: 10 },
  ] },
  { id: 'zh-g6-character-card', title: '写一张人物证据卡', summary: '用一条行为证据写出有边界的人物判断。', studyGuide: ['写出人物当时的行为或语言。', '用“可能、后来”等词表达判断。', '检查有没有把猜测写成确定事实。'], body: '人物证据卡示例：“阿宁翻号码牌又停住，说明他可能有些紧张；结果尚未公布，不能写他一定获奖。”证据卡要把原文事实和自己的判断分开。', project: { title: '我的人物证据卡', prompt: '选择本单元一段短文，写人物的一条行为/语言证据和你的谨慎判断（60字以内即可）。不填写真实姓名。', placeholder: '证据：……。我的判断：他/她可能……，但不能确定……。', checklist: ['我引用了一条原文行为或语言。', '我用“可能”等词区分了判断和事实。', '我没有添加材料未写的动机、结果或评价。'] }, questions: [
    { id: 'zh-g6-character-card-q1', type: 'choice', prompt: '证据卡第一步应写什么？', options: ['人物的行为或语言证据', '作者的个人评价', '人物未来一定会怎样'], correctAnswer: '人物的行为或语言证据', explanation: '先有证据才能作判断。再试时回到原文找可引用的动作或话语。', points: 10 },
    { id: 'zh-g6-character-card-q2', type: 'choice', prompt: '哪句判断有合适边界？', options: ['他可能有些紧张，但结果还不能确定', '他一定因为害怕才这样做', '他以后每次都会紧张'], correctAnswer: '他可能有些紧张，但结果还不能确定', explanation: '这句用“可能”和“不能确定”区分推断与事实。再试时删掉无依据的“一定、每次”。', points: 10 },
    { id: 'zh-g6-character-card-q3', type: 'choice', prompt: '人物证据卡不能自动证明什么？', options: ['已经完全了解人物长期性格', '找到一条行为线索', '写出有边界的判断'], correctAnswer: '已经完全了解人物长期性格', explanation: '一段短文只能支持局部判断，不能概括长期性格。再试时限定判断范围。', points: 10 },
  ] },
];
