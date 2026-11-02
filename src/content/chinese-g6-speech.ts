import type { LanguageLesson } from '@/lib/types';

// 原创观点表达练习，非教材同步；文字稿不等同真实口语测评。
export const chineseG6SpeechLessons: LanguageLesson[] = [
  { id: 'zh-g6-speech-claim', title: '先说清自己的观点', summary: '区分观点、事实和理由，避免只喊口号。', studyGuide: ['先找“我认为”后的观点。', '再找能核对的事实。', '最后看理由是否真的支持观点。'], body: '小组讨论“午间是否保留安静阅读时间”。小安说：“我认为应该保留。上周三的记录显示，安静时段里有18人完成阅读卡。”观点是“应该保留”，18人完成阅读卡是事实，事实可以作为理由的一部分。', questions: [
    { id: 'zh-g6-speech-claim-q1', type: 'choice', prompt: '小安的观点是什么？', options: ['应该保留安静阅读时间', '上周三有18人', '完成阅读卡需要记录'], correctAnswer: '应该保留安静阅读时间', explanation: '“我认为”后面是观点。再试时先找说话人主张什么。', points: 10 },
    { id: 'zh-g6-speech-claim-q2', type: 'choice', prompt: '哪项是材料中的事实？', options: ['上周三有18人完成阅读卡', '大家一定永远喜欢阅读', '安静时段全校最好'], correctAnswer: '上周三有18人完成阅读卡', explanation: '这项带有时间和数字，能回到记录核对。再试时不要把评价当事实。', points: 10 },
    { id: 'zh-g6-speech-claim-q3', type: 'choice', prompt: '哪种说法缺少依据？', options: ['保留时段能让所有人都进步', '记录显示18人完成阅读卡', '小安主张保留时段'], correctAnswer: '保留时段能让所有人都进步', explanation: '材料没有支持“所有人都进步”的范围。再试时检查结论是否超出证据。', points: 10 },
  ] },
  { id: 'zh-g6-speech-reason', title: '让理由真正支持观点', summary: '用相关、具体的理由说明主张，并承认材料边界。', studyGuide: ['理由要回答“为什么”。', '优先使用具体记录或例子。', '证据不足时用“可能、还需观察”。'], body: '观点：学校应在雨天把湿伞放在门口的伞架上。理由：上周雨天，门口地面有三处积水，值日记录写着两名同学差点滑倒。这个理由与安全直接相关；不能据此说“以后绝不会有人摔倒”。', questions: [
    { id: 'zh-g6-speech-reason-q1', type: 'choice', prompt: '哪项理由最直接支持把湿伞放到伞架？', options: ['门口有积水且有人差点滑倒', '伞架是蓝色的', '大家都喜欢下雨'], correctAnswer: '门口有积水且有人差点滑倒', explanation: '它直接关联安全问题。再试时问理由能否回答“为什么这样做”。', points: 10 },
    { id: 'zh-g6-speech-reason-q2', type: 'choice', prompt: '材料能支持哪项结论？', options: ['设置伞架可能减少门口积水，还需继续观察', '设置伞架后绝不会有人摔倒', '所有同学都同意这个办法'], correctAnswer: '设置伞架可能减少门口积水，还需继续观察', explanation: '材料提供线索但没有保证结果。再试时给结论保留合适范围。', points: 10 },
    { id: 'zh-g6-speech-reason-q3', type: 'choice', prompt: '哪句话与观点关系最弱？', options: ['伞架的颜色很好看', '湿伞会带来地面积水', '门口曾有人差点滑倒'], correctAnswer: '伞架的颜色很好看', explanation: '颜色不能说明安全问题。再试时删去与主张无关的装饰信息。', points: 10 },
  ] },
  { id: 'zh-g6-speech-card', title: '写一张简短发言卡', summary: '用观点、理由和行动建议组成一段可读发言。', studyGuide: ['第一句直接说观点。', '第二句给一个具体依据。', '最后提出可执行的下一步。'], body: '发言卡可以这样写：“我建议在楼梯口贴上慢行提醒。上周记录显示，课间有多人奔跑，转弯处容易拥挤。我们可以先试行一周，再看看通行情况。”这段话没有把试行结果提前说成事实。', project: { title: '我的观点发言卡', prompt: '围绕一个校园小问题写60—100字发言卡，包含观点、一个依据和一条可执行建议。可使用虚构情境，不填写真实姓名。', placeholder: '我建议……。因为……。我们可以先……，再……。', checklist: ['我第一句说清了观点。', '我写了材料或观察能支持的具体依据。', '我把建议和结果分开，没有夸大或补造事实。'] }, questions: [
    { id: 'zh-g6-speech-card-q1', type: 'choice', prompt: '发言卡第一句最应完成什么？', options: ['直接说出观点', '先讲一个无关故事', '先评价所有同学'], correctAnswer: '直接说出观点', explanation: '读者先知道主张，才能判断后面的理由。再试时找“我建议/我认为”。', points: 10 },
    { id: 'zh-g6-speech-card-q2', type: 'choice', prompt: '哪项是具体依据？', options: ['课间有多人奔跑，转弯处容易拥挤', '大家都觉得这样最好', '这个建议一定成功'], correctAnswer: '课间有多人奔跑，转弯处容易拥挤', explanation: '它描述了可观察的情况，能支持提醒慢行。再试时把空泛评价换成事实。', points: 10 },
    { id: 'zh-g6-speech-card-q3', type: 'choice', prompt: '哪项属于把建议误写成结果？', options: ['贴提醒后楼梯口一定不会拥挤', '先试行一周', '再看看通行情况'], correctAnswer: '贴提醒后楼梯口一定不会拥挤', explanation: '材料只提出试行和观察，不能保证一定不拥挤。再试时区分计划与已发生结果。', points: 10 },
  ] },
];
