import type { LanguageLesson } from '@/lib/types';

// 原创基础拓展，非外研社2022教材同步。短 o 的具体音色会随朗读口音变化。
export const englishShortVowelOLessons: LanguageLesson[] = [
  {
    id: 'en-g3-short-o-hot-pot', title: '听见 hot 和 pot',
    summary: '听完整词，保留 ot 词尾，比较开头 h 和 p。',
    studyGuide: [
      'hot 是热的，pot 是锅，not 表示不、不是。三个词以 ot 结尾，只换开头；这是本课的一组短 o 例词。',
      '先听正文三个完整词，再尝试把开头 h 或 p 的声音接到 ot 上，合读 hot、pot；不要用字母名拼出词音。设备的英语口音可能不同，跟同一参考反复比较即可。',
      'The pot is hot. 是“锅是热的”；The pot is not hot. 是“锅不热”。The pot 指这口锅，is 用来描述状态，not 让意思变成否定。这是虚构画面，不需要接触热锅。',
    ],
    body: 'hot, pot, not.\n\nThe pot is hot.',
    speakable: true,
    questions: [
      { id: 'en-g3-short-o-hot-pot-q1', type: 'choice', prompt: '听辨句说这口锅怎样？', listeningText: 'The pot is not hot.', options: ['是热的', '不是热的', '没有说'], correctAnswer: '不是热的', explanation: '这次有 not，意思是“不热”。再试时听清 hot 前面有没有 not，不直接沿用正文的肯定句。', points: 10 },
      { id: 'en-g3-short-o-hot-pot-q2', type: 'choice', prompt: '保留 hot 的 ot，把 h 换成 p，得到哪个词？', options: ['hot', 'not', 'pot'], correctAnswer: 'pot', explanation: '换开头、留住 ot，得到 pot。再试时先指开头 p，再连起来读完整词。', points: 10 },
      { id: 'en-g3-short-o-hot-pot-q3', type: 'fill-blank', prompt: '把“热的”写完整：The pot is ______.（填一个英文单词）', correctAnswer: 'hot', explanation: '热的是 hot，锅是 pot。再试时检查第一个字母，再读完整句。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-o-box-fox', title: '认识 box 和 fox',
    summary: '比较 ox 词尾，读懂盒子里的动物。',
    studyGuide: [
      'box 是盒子，fox 是狐狸；保留 ox、比较开头 b 和 f。x 在这两个词中发 /ks/，先听完整词，再尝试合读。',
      'dog 是狗。A fox is in a box. 是“一只狐狸在盒子里”。a 表示一只或一个，in 表示在里面；把 fox 换成 dog，动物就变成狗。',
      'fox 和 box 属于 ox 词尾的一组词；dog 属于另一组 og 词尾。英语口音会影响元音的具体音色，不要求每台设备读出完全相同的声音。',
    ],
    body: 'box, fox, dog.\n\nA fox is in a box.',
    speakable: true,
    questions: [
      { id: 'en-g3-short-o-box-fox-q1', type: 'choice', prompt: '这次听到哪种动物在盒子里？', listeningText: 'A dog is in a box.', options: ['狗', '狐狸', '猫'], correctAnswer: '狗', explanation: '这次说 dog，是狗，正文中的 fox 是狐狸。再试时听清动物词，再核对位置。', points: 10 },
      { id: 'en-g3-short-o-box-fox-q2', type: 'choice', prompt: '保留 box 的 ox，把 b 换成 f，得到哪个词？', options: ['dog', 'box', 'fox'], correctAnswer: 'fox', explanation: 'f 加上 ox，得到 fox。再试时分别指开头和共同词尾，再读完整词。', points: 10 },
      { id: 'en-g3-short-o-box-fox-q3', type: 'fill-blank', prompt: '根据“一只狐狸在盒子里”补全：A ______ is in a box.（只填动物的英文单词）', correctAnswer: 'fox', explanation: '狐狸是 fox，狗是 dog。再试时先确定中文指定的动物，再拼写 f、o、x。', points: 10 },
    ],
  },
  {
    id: 'en-g3-short-o-scene-card', title: '把短 o 词放进画面',
    summary: '区分 in 和 on，替换动物与位置写出新画面。',
    studyGuide: [
      'log 是一段原木，dog 是狗，fox 是狐狸，box 是盒子。dog、log 以 og 结尾；fox、box 以 ox 结尾，分别听读比较。',
      'A fox is in a box. 是“一只狐狸在盒子里”；The dog is on a log. 是“这只狗在一段原木上”。in 是在里面，on 是在上面。',
      '换一个词就会改变画面：The fox is on a log. 是狐狸在原木上。先写两句中文画面，再用 A/The ... is in/on a ... 写英文，检查动物和位置都对应。',
      '可听正文再试读；作品自检记录你的练习，不会自动评价发音。',
    ],
    body: 'A fox is in a box.\n\nThe dog is on a log.',
    speakable: true,
    project: {
      title: '我的短 o 画面卡',
      prompt: '写两句虚构画面，至少用到 fox、dog、box、log 中的三个词。至少一句替换正文的动物或位置，再写下想再次听读的词。',
      placeholder: '我的两幅画面：……\nA ... is in a ... .\nThe ... is on a ... .\n我想再听读：……',
      checklist: ['我用了至少三个词，并替换了一个动物或位置。', '我检查了中文画面与英文的动物、in/on 和位置一致。', '我尝试听读，记录仍需核对的词；这不是发音评分。'],
    },
    questions: [
      { id: 'en-g3-short-o-scene-card-q1', type: 'choice', prompt: '这次听到的狗在哪里？', listeningText: 'The dog is in a box.', options: ['原木上', '盒子上', '盒子里'], correctAnswer: '盒子里', explanation: '听辨说 in a box，是盒子里；正文是 on a log。再试时一起核对 in/on 和后面的物品。', points: 10 },
      { id: 'en-g3-short-o-scene-card-q2', type: 'choice', prompt: '哪句表示“一只狐狸在原木上”？', options: ['A dog is on a log.', 'A fox is on a log.', 'A fox is in a box.'], correctAnswer: 'A fox is on a log.', explanation: 'fox 是狐狸，on a log 是在原木上。再试时先核对动物，再核对位置。', points: 10 },
      { id: 'en-g3-short-o-scene-card-q3', type: 'fill-blank', prompt: '表示“狗在盒子里”：The dog is in a ______.（只填位置物品的英文单词）', correctAnswer: 'box', explanation: '盒子是 box。再试时核对中文位置，并按 b、o、x 拼写。', points: 10 },
    ],
  },
];
