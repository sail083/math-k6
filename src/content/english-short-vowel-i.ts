import type { LanguageLesson } from '@/lib/types';

// 原创基础拓展，非外研社2022教材同步；词形、听辨和作品自检不代表发音测评。
export const englishShortVowelILessons: LanguageLesson[] = [
  {
    id: 'en-g3-short-i-sit-fit',
    title: '听见 sit 和 fit',
    summary: '听完整词，比较 sit、fit、hit 的开头和共同词尾。',
    studyGuide: [
      'sit 是坐，fit 在 The bags fit. 中表示“这些包放得下”，hit 是击中。例词中的小写 i 发短音 /ɪ/，不是字母名 /aɪ/；表示“我”的大写 I 读 /aɪ/。',
      '先听正文中的 sit、fit、hit，再试读：保留词尾 it，只换开头 s、f、h。本课只练这些例词，不把所有含 i 的词都读成同一个音。',
      'I sit on a mat. 是“我坐在垫子上”；on 是在……上，mat 是垫子。The bags fit. 是“这些包放得下”。听辨题换了一个熟悉词，先听完整词再选。',
    ],
    body: 'sit, fit, hit.\n\nI sit on a mat. The bags fit.',
    speakable: true,
    questions: [
      { id: 'en-g3-short-i-sit-fit-q1', type: 'choice', prompt: '听到的是哪个完整词？', listeningText: 'fit', options: ['sit', 'hit', 'fit'], correctAnswer: 'fit', explanation: '播放的是 fit，开头是 f 的声音。再试时听完整词，再与 sit 的开头比较；不要读字母名代替词音。', points: 10 },
      { id: 'en-g3-short-i-sit-fit-q2', type: 'choice', prompt: '保留 fit 的 it，把 f 换成 s，得到哪个词？', options: ['fit', 'sit', 'hit'], correctAnswer: 'sit', explanation: '换掉开头 f，保留 it，得到 sit。再试时先指开头，再核对共同词尾。', points: 10 },
      { id: 'en-g3-short-i-sit-fit-q3', type: 'choice', prompt: 'The bags fit. 在本课中表示什么？', options: ['这些包放得下。', '我坐在垫子上。', '这些包是红色的。'], correctAnswer: '这些包放得下。', explanation: 'fit 在这里表示大小合适、放得下。再试时回到自学提示，核对整句意思。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-i-six-mix',
    title: '读懂 six、mix 和 big',
    summary: '听短词、拼写数字，把 six 和 big 放进物品句。',
    studyGuide: [
      'six 是六，mix 是混合，big 是大的。三个例词中的 i 都发短音 /ɪ/；six 与 mix 只换了开头，末尾 x 在这两个词里发 /ks/。',
      'I see six big bags. 是“我看见六个大包”。I see 是我看见，bags 是包的复数；six 说明几个，big 说明大小。',
      '先听完整词，再按顺序看字母；听不清可以重播或用阅读辅助核对，随后再听一次。',
    ],
    body: 'six, mix, big.\n\nI see six big bags.',
    speakable: true,
    questions: [
      { id: 'en-g3-short-i-six-mix-q1', type: 'choice', prompt: '听到的是哪个完整词？', listeningText: 'mix', options: ['big', 'mix', 'six'], correctAnswer: 'mix', explanation: '播放的是 mix，开头是 m 的声音；six 的开头不同。再试时重听完整词，比较开头和末尾。', points: 10 },
      { id: 'en-g3-short-i-six-mix-q2', type: 'choice', prompt: 'I see six big bags. 中，哪个词告诉我们包的大小？', options: ['six', 'bags', 'big'], correctAnswer: 'big', explanation: 'big 表示大的；six 表示六个，bags 表示包。再试时分别圈出数量、大小和物品。', points: 10 },
      { id: 'en-g3-short-i-six-mix-q3', type: 'fill-blank', prompt: '把“六个大包”的数量写完整：I see ______ big bags.（填一个英文数字词）', correctAnswer: 'six', explanation: '六是 six。再试时按 s、i、x 的顺序拼写，再把整句读一遍。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-i-scene-card',
    title: '把短 i 词放进画面',
    summary: '读懂两句话，再换一个物品写出自己的新画面。',
    studyGuide: [
      'I sit on a mat. 是“我坐在垫子上”；I see six big bags. 是“我看见六个大包”。sit、six、big 是本单元的短 i 例词；大写 I 是“我”，读字母名 /aɪ/。',
      '迁移词库：pens 是多支笔，hats 是多顶帽子，bags 是多个包。把 I see six big bags. 中的 bags 换成 pens 或 hats，就能描述不同画面。',
      '先用中文想好两句画面，再写英文。核对人物、数量、物品和位置；尝试听读并记下仍不确定的词，作品自检不会自动判断你的发音。',
    ],
    body: 'I sit on a mat.\n\nI see six big bags.',
    speakable: true,
    project: {
      title: '我的短 i 画面卡',
      prompt: '写两句虚构画面：一句使用 sit，一句使用 six 和 big。第二句把 bags 换成词库中的 pens 或 hats，再写下你想再次听读的词。',
      placeholder: '我的画面：……\nI sit on a mat.\nI see six big ... .\n我想再听读：……',
      checklist: ['我用了 sit、six 和 big，并换写了第二句的物品。', '两句英文与我的人物、数量、物品和位置一致。', '我尝试听读，记录仍需核对的词；这不是发音评分。'],
    },
    questions: [
      { id: 'en-g3-short-i-scene-card-q1', type: 'choice', prompt: '这次听到的是哪种物品？', listeningText: 'I see six big hats.', options: ['六个大包', '六支大笔', '六顶大帽子'], correctAnswer: '六顶大帽子', explanation: '这次是 hats，帽子；正文示例用 bags。再试时留意句尾物品，不直接套用正文答案。', points: 10 },
      { id: 'en-g3-short-i-scene-card-q2', type: 'choice', prompt: '想说“我看见六支大笔”，应选哪句？', options: ['I see six big pens.', 'I see six big bags.', 'I see ten big pens.'], correctAnswer: 'I see six big pens.', explanation: 'six 是六，pens 是笔。再试时同时核对数量和物品。', points: 10 },
      { id: 'en-g3-short-i-scene-card-q3', type: 'fill-blank', prompt: '表示“我坐在垫子上”：I ______ on a mat.（填一个动作词）', correctAnswer: 'sit', explanation: 'sit 表示坐。再试时按 s、i、t 拼写，再读整句核对动作和位置。', points: 10 },
    ],
  },
];
