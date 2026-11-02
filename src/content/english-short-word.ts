import type { LanguageLesson } from '@/lib/types';

// 原创基础拓展，非外研社教材同步；聚焦受控短词的词尾与开头比较。
export const englishShortWordLessons: LanguageLesson[] = [
  {
    id: 'en-g3-short-word-at', title: '留住词尾，听开头的变化', summary: '比较 cat、hat、mat，尝试读词并用完整词句核对。',
    studyGuide: ['cat是猫，hat是帽子，mat是垫子；三个词都保留末尾at，开头字母不同。', '先看词义和拼写，轻声尝试，再听完整词核对；本课只讨论这些例词，不推断所有相似拼写的词。', 'A cat is on a mat. 是一只猫在垫子上；a表示一只/一个，on表示在……上面。'],
    body: 'Word family: cat, hat, mat.\n\nA cat is on a mat.', speakable: true,
    questions: [
      { id: 'en-g3-short-word-at-q1', type: 'choice', prompt: '听到的新句子中，垫子上是什么？', listeningText: 'A hat is on a mat.', options: ['猫', '帽子', '笔'], correctAnswer: '帽子', explanation: '录音说A hat is on a mat，hat是帽子。再试时注意开头声音与cat不同。', points: 10 },
      { id: 'en-g3-short-word-at-q2', type: 'choice', prompt: '保留cat的末尾at，把开头c换成h，得到哪个词？', options: ['cat', 'hat', 'mat'], correctAnswer: 'hat', explanation: '只换开头、保留at，得到hat。本题检查词形变化，不等于发音已经正确。再试时逐字母核对。', points: 10 },
      { id: 'en-g3-short-word-at-q3', type: 'choice', prompt: '哪句表示“垫子上是一顶帽子”？', options: ['A hat is on a mat.', 'A cat is on a mat.', 'A mat is on a hat.'], correctAnswer: 'A hat is on a mat.', explanation: '同时核对物品hat和位置on a mat。再试时先找谁在垫子上。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-word-en', title: '用熟悉的开头，试一组新词', summary: '比较 pen、hen、ten，复用开头并听完整词核对。',
    studyGuide: ['pen是笔，hen是母鸡，ten是十；例词都保留en，开头p、h、t不同。', 'hat和hen都以h开头，先听完整词，再观察开头与词尾；不读字母名代替词音。', 'I can see a hen. 是我能看见一只母鸡；The pen is red. 是这支笔是红色的。'],
    body: 'Word family: pen, hen, ten.\n\nI can see a hen. The pen is red.', speakable: true,
    questions: [
      { id: 'en-g3-short-word-en-q1', type: 'choice', prompt: '听到的新句子中，这次看见什么？', listeningText: 'I can see a red pen.', options: ['红色的笔', '一只母鸡', '一顶帽子'], correctAnswer: '红色的笔', explanation: '录音说I can see a red pen，pen是笔，red是红色。再试时不要用正文的hen代替。', points: 10 },
      { id: 'en-g3-short-word-en-q2', type: 'choice', prompt: '保留pen的en，把p换成h，得到哪个词？', options: ['hen', 'ten', 'pen'], correctAnswer: 'hen', explanation: '只换开头、保留en，得到hen。再试时看清p与h。', points: 10 },
      { id: 'en-g3-short-word-en-q3', type: 'choice', prompt: '哪一组都属于本课en词尾的一组词？', options: ['pen与hen', 'hat与mat', 'cat与ten'], correctAnswer: 'pen与hen', explanation: 'pen和hen都以en结尾。再试时逐个比较词尾字母。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-word-scene', title: '把读过的词放进新画面', summary: '把短词放入位置句，并完成两句文字画面自检。',
    studyGuide: ['复习cat、hat、mat、pen、hen、red、bag、in、on。The ... is on ... 表示在上面，The ... is in ... 表示在里面。', '先确定物品和位置，再写句子；虚构文字画面即可，不需要真实物品、图片或录音。', '作品自检区分拼写、画面对应和尝试朗读；勾选自检不代表系统判定发音正确。'],
    body: 'The cat is on the mat.\n\nThe red pen is in the bag.', speakable: true,
    project: { title: '我的两句新画面', prompt: '写两句英文新画面，至少换用本单元一个词，并写下你检查了什么、还想再听什么。', placeholder: '我的文字画面：……\nThe ... is on the ... .\nThe ... is in the ... .\n我的核对记录：我检查了……，还想再听一听……。', checklist: ['我写了两句新画面，至少换用一个本单元的词，并检查字母与词尾。', '我核对了每句话的物品和位置与文字画面一致。', '我尝试读过或听过参考，并诚实写下还想核对的词。'] },
    questions: [
      { id: 'en-g3-short-word-scene-q1', type: 'choice', prompt: '听到的新句子中，包里是什么？', listeningText: 'The hen is on the mat. The hat is in the bag.', options: ['笔', '帽子', '母鸡'], correctAnswer: '帽子', explanation: '录音说The hat is in the bag，包里是帽子。再试时听清题目问包里的物品。', points: 10 },
      { id: 'en-g3-short-word-scene-q2', type: 'choice', prompt: '哪句表示“母鸡在垫子上”？', options: ['The hen is on the mat.', 'The hat is on the mat.', 'The hen is in the bag.'], correctAnswer: 'The hen is on the mat.', explanation: '同时核对hen和on the mat。再试时逐项检查物品和位置。', points: 10 },
      { id: 'en-g3-short-word-scene-q3', type: 'choice', prompt: '哪句表示“帽子在包里”？', options: ['The hat is in the bag.', 'The hat is on the bag.', 'The pen is in the bag.'], correctAnswer: 'The hat is in the bag.', explanation: 'in表示在里面，物品是hat。再试时不要只看bag。', points: 10 },
    ],
  },
];
