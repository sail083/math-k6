import type { LanguageLesson } from '@/lib/types';

// 原创阅读方法课程，非教材全文或教材同步。
export const chineseContextLessons: LanguageLesson[] = [
  {
    id: 'zh-g3-context-words', title: '先找词旁边的线索', summary: '借相邻句子的动作和样子理解词语，再把意思放回原句检查。',
    studyGuide: ['先连着读目标词前后的句子。', '找具体动作或样子作依据。', '把猜到的意思代回原句，看是否说得通。'],
    body: '小猫收起四只爪子，把身体团成一个小球，蜷缩（quán suō）在软垫上。“收起”“团成小球”都是线索，所以“蜷缩”是身体弯曲、缩成一团。把这个意思放回句子，动作前后能接上。注意：这句话没有说明小猫已经睡着。读不懂时，先找词旁边写了什么，再检查，不要只凭地点或物品乱猜。',
    questions: [
      { id: 'zh-g3-context-words-q1', type: 'choice', prompt: '“蜷缩”在“小猫把身体团成小球，蜷缩在软垫上”中最接近什么？', options: ['把身体缩成一团', '伸展开四肢', '抬头四处看'], correctAnswer: '把身体缩成一团', explanation: '“收起爪子、团成小球”说明动作是缩成一团。再试时找目标词旁边的动作线索。', points: 10 },
      { id: 'zh-g3-context-words-q2', type: 'choice', prompt: '纸做的小人被风吹得“东倒一个、西躺一个，散落在窗台上”。“散落”是什么样子？', options: ['分散地落在不同位置', '仍整齐站成一排', '被装进同一个盒子'], correctAnswer: '分散地落在不同位置', explanation: '“东倒一个、西躺一个”写出各自分开的位置。再试时用相邻句的样子验证词义。', points: 10 },
      { id: 'zh-g3-context-words-q3', type: 'choice', prompt: '只凭小猫蜷缩在软垫上这一句，哪件事还不能确定？', options: ['小猫是否已经睡着', '小猫身体团起来', '小猫在软垫上'], correctAnswer: '小猫是否已经睡着', explanation: '句子写了动作和位置，没有写睡着。再试时把材料没有说的事留作“还不能确定”。', points: 10 },
    ],
  },
  {
    id: 'zh-g3-context-references', title: '“它”到底指谁', summary: '联系前文对象和后文动作，确定代词指向；信息不足时承认不能确定。',
    studyGuide: ['先找前文可能的对象。', '看“它”随后做了什么，把候选对象分别代入。', '若两个对象都说得通，就说还需要更多信息。'],
    body: '书包里有一本书和一把直尺。小禾打开它，翻到第十页，读起一段故事。“翻到第十页、读故事”都和书相连，所以“它”指书，不是离得更近的直尺。判断“它”不能只选最近的名词，要看后面的动作。若“桌上有红盒子和蓝盒子。我把它收起来”，没有更多线索，就还不能确定是哪一个。',
    questions: [
      { id: 'zh-g3-context-references-q1', type: 'choice', prompt: '“小禾打开它，翻到第十页，读起一段故事”中的“它”指什么？', options: ['书', '直尺', '书包'], correctAnswer: '书', explanation: '翻页和读故事是书的动作。再试时把候选对象代入后面的动作检查。', points: 10 },
      { id: 'zh-g3-context-references-q2', type: 'choice', prompt: '卡片上写着开放时间。小禾把它翻到背面，又读到归还提示。“它”指什么？', options: ['卡片', '钥匙', '盒子'], correctAnswer: '卡片', explanation: '能翻面并继续读文字的是卡片。再试时看动作与对象是否匹配。', points: 10 },
      { id: 'zh-g3-context-references-q3', type: 'choice', prompt: '“桌上有红盒子和蓝盒子。我把它收起来。”哪种说法准确？', options: ['还不能确定，需要说清对象', '一定是蓝盒子，因为离“它”最近', '一定是红盒子，因为最先出现'], correctAnswer: '还不能确定，需要说清对象', explanation: '两个盒子都能被收起来，材料没有提供区别线索。再试时不要替作者补出颜色理由。', points: 10 },
    ],
  },
  {
    id: 'zh-g3-context-reading-card', title: '做一张阅读自助卡', summary: '结合词义线索和代词对象，写一张有依据的理解记录。',
    studyGuide: ['读完整段，先说发生了什么。', '回到目标词和“它”附近找线索。', '写意思、依据和事情经过，检查有没有添入材料没有的事实。'],
    body: '桌上有一张红书签和一张蓝书签。小禾看看红的，又看看蓝的，伸出的手停在半空。她迟疑（chí yí）了一会儿，轻声说：“两张我都喜欢，选哪张呢？”后来，她选了蓝书签，把它夹在故事书里。“下次从这一页接着读。”她说。“来回看、手停住、选哪张呢”说明“迟疑”是一时拿不定主意；“它”指前面明确选出的蓝书签。',
    project: { title: '我的阅读自助卡', prompt: '写清“迟疑”的意思和一处依据，说明“它”指什么，再用自己的话写事情经过。', placeholder: '我理解“迟疑”是……，因为……。“它”指……。事情经过是……。', checklist: ['我写了目标词意思和短文中的依据。', '我明确写出“它”指的对象，和动作一致。', '我没有补入短文未说明的价格、原因或结果。'] },
    questions: [
      { id: 'zh-g3-context-reading-card-q1', type: 'choice', prompt: '“迟疑”在短文中最接近什么？', options: ['一时拿不定主意', '已经选好后立刻行动', '忘记东西在哪里'], correctAnswer: '一时拿不定主意', explanation: '来回看、手停住和“选哪张呢”共同说明拿不定主意。再试时至少找两处线索。', points: 10 },
      { id: 'zh-g3-context-reading-card-q2', type: 'choice', prompt: '“后来，她选了蓝书签，把它夹在故事书里”中的“它”指什么？', options: ['蓝书签', '红书签', '故事书'], correctAnswer: '蓝书签', explanation: '前一句明确写“选了蓝书签”，夹进书里的动作也符合书签。再试时先回看明确指向的句子。', points: 10 },
      { id: 'zh-g3-context-reading-card-q3', type: 'choice', prompt: '哪句话没有添加新事实，又把事情说清楚？', options: ['小禾一时拿不定主意，后来选了蓝书签作阅读标记', '小禾因为蓝书签更便宜，所以选蓝的', '小禾已经把故事书全部读完，所以收起书签'], correctAnswer: '小禾一时拿不定主意，后来选了蓝书签作阅读标记', explanation: '这句话只整理短文已有信息；价格和读完全文都没有依据。再试时逐项核对原文。', points: 10 },
    ],
  },
];
