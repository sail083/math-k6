import type { LanguageLesson } from '@/lib/types';

/** 原创四下能力拓展，不对应外研社 2022 版教材单元。 */
export const englishG4CommunityLessons: LanguageLesson[] = [
  {
    id: 'en-g4-community-help', title: '在社区里请求帮助', summary: '听懂地点和礼貌请求，完成一次清楚的问答。', speakable: true,
    studyGuide: ['community 是社区，library 是图书馆，near 是在附近。先找人物要去哪里。', 'Could you help me? 是礼貌请求；Sure. 是答应帮助。请先听读，再和家人轮流扮演两个角色。'],
    body: 'Amy: Excuse me. Could you help me? I want to find the library. Tom: Sure. The library is near the park. Amy: Thank you!',
    questions: [
      { id: 'en-g4-community-help-q1', type: 'choice', prompt: 'Amy 想找哪里？', listeningText: 'I want to find the library.', options: ['图书馆', '车站', '商店'], correctAnswer: '图书馆', explanation: 'library 是图书馆。再试时抓住 find 后面的地点。', points: 10 },
      { id: 'en-g4-community-help-q2', type: 'fill-blank', prompt: '补全礼貌请求：Could you ______ me?（一个英文单词）', correctAnswer: 'help', explanation: 'Could you help me? 表示“你能帮助我吗？”。', points: 10 },
      { id: 'en-g4-community-help-q3', type: 'choice', prompt: '根据正文，图书馆在哪里？', options: ['公园附近', '学校里面', '家旁边'], correctAnswer: '公园附近', explanation: '正文说 The library is near the park。', points: 10 },
    ],
  },
  {
    id: 'en-g4-community-route', title: '听懂路线顺序', summary: '按顺序理解 go straight 和 turn left，写出简短路线。', speakable: true,
    studyGuide: ['go straight 是直走，turn left 是左转，at the corner 是在拐角处。把动作按听到的顺序记下来。', '先听新路线，再回正文核对；不需要真的走出家门。'],
    body: 'Go straight to the corner. Turn left at the park. The library is on your right. It is next to the bakery.',
    questions: [
      { id: 'en-g4-community-route-q1', type: 'choice', prompt: '听到的新路线第一步是什么？', listeningText: 'Go straight, then turn right.', options: ['直走', '左转', '停下来'], correctAnswer: '直走', explanation: 'Go straight 表示直走，then 表示然后。', points: 10 },
      { id: 'en-g4-community-route-q2', type: 'fill-blank', prompt: '补全正文：Turn ______ at the park.（一个英文单词）', correctAnswer: 'left', explanation: '正文是 Turn left at the park。', points: 10 },
      { id: 'en-g4-community-route-q3', type: 'choice', prompt: '图书馆在面包店的什么位置？', options: ['旁边', '后面', '远处'], correctAnswer: '旁边', explanation: 'next to 表示“在……旁边”。', points: 10 },
    ],
  },
  {
    id: 'en-g4-community-card', title: '制作我的地点卡', summary: '用三句英文介绍一个虚构地点和到达路线，并完成项目自检。', speakable: true,
    studyGuide: ['地点卡可以使用虚构的 park、library 或 shop。写完后逐句朗读，检查地点、方向和位置是否清楚。', '作品是文字练习，不代表真实导航或发音评定；可以用自己的画帮助记忆。'],
    body: 'My place is the library. Go straight and turn left at the park. The library is next to the bakery.',
    project: { title: '我的地点卡', prompt: '写三句：地点名称、两步路线、一个相邻地点。', placeholder: 'My place is the ...\nGo straight and turn ...\nIt is next to the ...', checklist: ['我写了一个地点。', '我写了路线动作和方向。', '我写了一个相邻地点，并朗读检查。'] },
    questions: [
      { id: 'en-g4-community-card-q1', type: 'fill-blank', prompt: '补全：My place is the ______.（一个地点单词）', listeningText: 'My place is the library.', correctAnswer: 'library', explanation: '正文第一句是 My place is the library。', points: 10 },
      { id: 'en-g4-community-card-q2', type: 'choice', prompt: '地点卡至少要包含哪三类信息？', options: ['地点、路线、相邻地点', '天气、颜色、年龄', '食物、运动、月份'], correctAnswer: '地点、路线、相邻地点', explanation: '项目要求分别介绍去哪里、怎么走以及旁边有什么。', points: 10 },
      { id: 'en-g4-community-card-q3', type: 'choice', prompt: '哪句适合表示“它在面包店旁边”？', options: ['It is next to the bakery.', 'It is under the bakery.', 'It is far from the bakery.'], correctAnswer: 'It is next to the bakery.', explanation: 'next to 表示在旁边，适合地点卡的位置说明。', points: 10 },
    ],
  },
];
