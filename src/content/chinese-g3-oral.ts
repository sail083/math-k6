import type { LanguageLesson } from '@/lib/types';

// 原创口语交际能力练习，非教材同步；文字模拟对话不等同真实听说测评。
export const chineseG3OralLessons: LanguageLesson[] = [
  { id: 'zh-g3-oral-listen', title: '先听清楚再行动', summary: '从一段提醒中找出时间、地点和要做的事。', studyGuide: ['读完提醒再行动。', '圈出时间、地点、动作三个要点。', '不确定时请对方再说一遍。'], body: '小林对同桌说：“午休后两点，我们在教室后面的阅读角集合，把借阅卡交给值日生。”要听清一件事，可以抓住什么时候、在哪里、做什么三个要点。只记住“午休”或“借阅卡”还不完整。', questions: [
    { id: 'zh-g3-oral-listen-q1', type: 'choice', prompt: '提醒中的集合时间是什么？', options: ['午休后两点', '放学后五点', '明天早上'], correctAnswer: '午休后两点', explanation: '原话明确说“午休后两点”。再试时先找表示时间的词。', points: 10 },
    { id: 'zh-g3-oral-listen-q2', type: 'choice', prompt: '他们在哪里集合？', options: ['教室后面的阅读角', '操场入口', '校门外'], correctAnswer: '教室后面的阅读角', explanation: '“教室后面的阅读角”是地点。再试时不要把借阅卡当成地点。', points: 10 },
    { id: 'zh-g3-oral-listen-q3', type: 'choice', prompt: '如果只听清“把借阅卡交给值日生”，还缺少什么？', options: ['时间和地点', '值日生的姓名', '卡片的颜色'], correctAnswer: '时间和地点', explanation: '行动对象听清了，但何时何地还不知道。再试时按时间、地点、事情逐项核对。', points: 10 },
  ] },
  { id: 'zh-g3-oral-retell', title: '用自己的话复述要点', summary: '按先后顺序复述一件小事，不凭空添加细节。', studyGuide: ['先说事情发生的时间或场景。', '再说人物做了什么。', '最后说结果，没听到的信息不要补写。'], body: '通知说：“今天放学前，阿宁先把窗台上的花盆移到阴凉处，再给每盆土浇半杯水，最后把记录表放回抽屉。”复述时可以说：“放学前，阿宁先移花盆，再浇水，最后收好记录表。”', questions: [
    { id: 'zh-g3-oral-retell-q1', type: 'choice', prompt: '阿宁第一步做什么？', options: ['把花盆移到阴凉处', '给每盆土浇水', '把记录表放回抽屉'], correctAnswer: '把花盆移到阴凉处', explanation: '“先”后面是第一步。再试时找先、再、最后这些顺序词。', points: 10 },
    { id: 'zh-g3-oral-retell-q2', type: 'choice', prompt: '哪句复述最完整？', options: ['放学前先移花盆，再浇水，最后收好记录表', '阿宁照顾花盆', '阿宁把花盆搬到教室外并浇一大壶水'], correctAnswer: '放学前先移花盆，再浇水，最后收好记录表', explanation: '这句保留时间和三步行动，没有改动数量或地点。再试时逐项对照通知。', points: 10 },
    { id: 'zh-g3-oral-retell-q3', type: 'choice', prompt: '通知没有说明哪件事？', options: ['花盆是什么颜色', '先移花盆', '最后收记录表'], correctAnswer: '花盆是什么颜色', explanation: '原文没有颜色信息，复述不能自行添加。再试时区分听到的事实和猜想。', points: 10 },
  ] },
  { id: 'zh-g3-oral-respond', title: '礼貌地确认和回应', summary: '用简短句子确认听懂，并在不清楚时提出具体问题。', studyGuide: ['先复述自己听到的要点。', '不清楚时只问缺少的那一项。', '回应后说出下一步行动。'], body: '同学说：“明天带上剪刀和胶棒，第二节课后到美术室做纸桥。”合适的回应可以是：“我确认一下：明天第二节课后，我带剪刀和胶棒去美术室，对吗？”如果不知道地点，就问“请问在哪里集合？”不要只说“啊？”让对方猜你的疑问。', project: { title: '写一段确认对话', prompt: '根据本课通知，写两句确认对话：第一句复述时间、物品和地点，第二句提出一个具体确认问题。', placeholder: '我确认一下：……，对吗？\n请问……？', checklist: ['我复述了时间、物品和地点。', '我的问题只针对一个不确定点。', '我没有添加通知没有说的原因或要求。'] }, questions: [
    { id: 'zh-g3-oral-respond-q1', type: 'choice', prompt: '哪句是合适的确认回应？', options: ['我确认一下：明天第二节课后带剪刀和胶棒去美术室，对吗？', '啊？', '我明天带水彩笔去操场。'], correctAnswer: '我确认一下：明天第二节课后带剪刀和胶棒去美术室，对吗？', explanation: '这句复述了时间、物品、地点并礼貌确认。再试时检查三项要点是否都在。', points: 10 },
    { id: 'zh-g3-oral-respond-q2', type: 'choice', prompt: '如果不知道集合地点，最具体的问法是？', options: ['请问在哪里集合？', '你再说一遍所有内容。', '是不是很好玩？'], correctAnswer: '请问在哪里集合？', explanation: '只问缺少的地点，最省力也最清楚。再试时让问题直接对应不确定的信息。', points: 10 },
    { id: 'zh-g3-oral-respond-q3', type: 'choice', prompt: '通知没有要求带哪样东西？', options: ['水彩笔', '剪刀', '胶棒'], correctAnswer: '水彩笔', explanation: '通知只提到剪刀和胶棒。再试时不要把熟悉的学习用品补进通知。', points: 10 },
  ] },
];
