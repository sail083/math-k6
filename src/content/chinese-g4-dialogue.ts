import type { LanguageLesson } from '@/lib/types';

// 原创对话理解练习，文字模拟不等同真实听说测评，非教材同步。
export const chineseG4DialogueLessons: LanguageLesson[] = [
  { id: 'zh-g4-dialogue-key', title: '找出同伴的意思', summary: '从对话中分清对方的建议、理由和条件。', studyGuide: ['先找对方建议做什么。', '再找“因为”后的理由。', '最后留意时间、地点等条件。'], body: '小雨说：“我们把海报放在走廊公告栏吧，因为那里每天都有同学经过。不过要等老师确认位置。”她的建议是放在公告栏，理由是同学经过，条件是等老师确认。', questions: [
    { id: 'zh-g4-dialogue-key-q1', type: 'choice', prompt: '小雨建议把海报放在哪里？', options: ['走廊公告栏', '教室抽屉', '操场看台'], correctAnswer: '走廊公告栏', explanation: '“我们把海报放在……”后面直接说出建议。再试时先找对方主张做什么。', points: 10 },
    { id: 'zh-g4-dialogue-key-q2', type: 'choice', prompt: '她为什么这样建议？', options: ['每天有同学经过', '老师已经同意', '公告栏刚刚换新'], correctAnswer: '每天有同学经过', explanation: '“因为”后面是理由。再试时把理由和条件分开。', points: 10 },
    { id: 'zh-g4-dialogue-key-q3', type: 'choice', prompt: '行动前还要满足什么条件？', options: ['等老师确认位置', '再画一张海报', '等到下个月'], correctAnswer: '等老师确认位置', explanation: '“不过”后面补充了行动条件。再试时留意表示转折或限制的词。', points: 10 },
  ] },
  { id: 'zh-g4-dialogue-confirm', title: '用一句话确认听懂', summary: '复述对方的重点，再提出一个具体问题。', studyGuide: ['先说“我听到的是……”。', '复述建议和理由中的关键部分。', '只追问自己缺少的一项信息。'], body: '同伴说：“周五午休后，我们在三楼美术室试做纸桥，先带卡纸和胶带。”合适的回应是：“我听到的是，周五午休后去三楼美术室试做纸桥，先带卡纸和胶带。请问需要带剪刀吗？”', questions: [
    { id: 'zh-g4-dialogue-confirm-q1', type: 'choice', prompt: '确认回应中复述了哪些要点？', options: ['时间、地点、活动和材料', '同伴的姓名和爱好', '天气和午餐'], correctAnswer: '时间、地点、活动和材料', explanation: '回应保留了原话的行动要点。再试时逐项核对时间、地点、做什么、带什么。', points: 10 },
    { id: 'zh-g4-dialogue-confirm-q2', type: 'choice', prompt: '哪句追问最具体？', options: ['请问需要带剪刀吗？', '你再说一遍全部内容。', '好玩吗？'], correctAnswer: '请问需要带剪刀吗？', explanation: '它只追问材料这一项。再试时问题要对应真正缺少的信息。', points: 10 },
    { id: 'zh-g4-dialogue-confirm-q3', type: 'choice', prompt: '原话没有说明哪件事？', options: ['是否需要带剪刀', '周五午休后', '三楼美术室'], correctAnswer: '是否需要带剪刀', explanation: '时间和地点已有，剪刀是否需要没有说明。再试时不要把猜想当通知。', points: 10 },
  ] },
  { id: 'zh-g4-dialogue-card', title: '写一张对话回应卡', summary: '把复述、确认和下一步行动写成简短回应。', studyGuide: ['先复述听到的关键信息。', '再写一个礼貌问题。', '最后写自己准备怎样行动。'], body: '回应卡可以写：“我听到的是，周三放学后在图书角整理新书，对吗？我会带标签纸。请问需要带剪刀吗？”它既确认理解，也说明下一步；文字练习不能代替真实对话反馈。', project: { title: '我的对话回应卡', prompt: '根据一个虚构通知写三句回应：复述要点、提出一个具体问题、说明自己的下一步。不填真实姓名。', placeholder: '我听到的是……，对吗？\n请问……？\n我会……。', checklist: ['我复述了时间、地点和事情中的关键要点。', '我只提出一个具体问题。', '我写了下一步行动，没有添加通知没有的要求。'] }, questions: [
    { id: 'zh-g4-dialogue-card-q1', type: 'choice', prompt: '回应卡第一句应做什么？', options: ['复述听到的要点', '直接评价同伴', '讲一件无关的事'], correctAnswer: '复述听到的要点', explanation: '先复述才能确认是否听懂。再试时检查时间、地点和事情。', points: 10 },
    { id: 'zh-g4-dialogue-card-q2', type: 'choice', prompt: '哪项是合适的下一步行动？', options: ['我会带标签纸', '我一定得到老师表扬', '我会把所有东西都带来'], correctAnswer: '我会带标签纸', explanation: '这是材料中明确需要的行动，不夸大也不增加要求。再试时只写自己能确定的行动。', points: 10 },
    { id: 'zh-g4-dialogue-card-q3', type: 'choice', prompt: '文字回应卡不能证明什么？', options: ['已经具备真实对话中的即时回应能力', '能写出一个确认问题', '能复述通知要点'], correctAnswer: '已经具备真实对话中的即时回应能力', explanation: '文字练习不能代替真实听说表现。再试时区分完成记录与能力验收。', points: 10 },
  ] },
];
