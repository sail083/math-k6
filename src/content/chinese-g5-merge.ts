import type { LanguageLesson } from '@/lib/types';

// 原创说明表达迁移，非教材同步。
export const chineseG5MergeLessons: LanguageLesson[] = [
  { id: 'zh-g5-merge-select', title: '先选有用的要点', summary: '从多条材料中挑出能回答问题的事实。', studyGuide: ['先确定读者要解决的问题。', '只选与问题直接相关的要点。', '把猜测和装饰性细节暂时放下。'], body: '为新同学介绍校园饮水处，材料有：①一楼东侧有直饮水机；②每次接水前先冲洗杯口；③水机旁有三盆绿萝；④接水后关紧水龙头。若问题是“怎样安全接水”，应选②和④，并补充地点①，不能把绿萝当作步骤。', questions: [
    { id: 'zh-g5-merge-select-q1', type: 'choice', prompt: '回答“怎样安全接水”最需要哪组要点？', options: ['先冲洗杯口，接水后关紧水龙头', '水机旁有三盆绿萝', '一楼东侧有一扇窗'], correctAnswer: '先冲洗杯口，接水后关紧水龙头', explanation: '这两项直接说明接水步骤。再试时先圈出能回答问题的动作。', points: 10 },
    { id: 'zh-g5-merge-select-q2', type: 'choice', prompt: '哪条信息能帮助新同学找到饮水处？', options: ['一楼东侧有直饮水机', '冲洗杯口', '关紧水龙头'], correctAnswer: '一楼东侧有直饮水机', explanation: '它交代地点和设施。再试时区分地点信息与操作步骤。', points: 10 },
    { id: 'zh-g5-merge-select-q3', type: 'choice', prompt: '哪项与“怎样安全接水”关系最弱？', options: ['水机旁有三盆绿萝', '接水后关紧水龙头', '接水前冲洗杯口'], correctAnswer: '水机旁有三盆绿萝', explanation: '绿萝是环境细节，不能说明安全操作。再试时问这条信息能否帮助完成任务。', points: 10 },
  ] },
  { id: 'zh-g5-merge-connect', title: '用连接词合并要点', summary: '用因为、先、还要等词，把零散事实连成说明。', studyGuide: ['先按时间或因果排列。', '选择能说明关系的连接词。', '读回合并后的句子，检查意思是否改变。'], body: '三条要点：操场地面刚洒过水；地面容易打滑；体育课先绕场慢走。可以合并为“因为地面刚洒过水，容易打滑，所以体育课先绕场慢走。”连接词让读者明白原因和办法。', questions: [
    { id: 'zh-g5-merge-connect-q1', type: 'choice', prompt: '哪句正确表达原因和办法？', options: ['因为地面刚洒过水，容易打滑，所以体育课先绕场慢走', '地面刚洒水，所以一定有人摔倒了', '体育课先慢走，因为操场很漂亮'], correctAnswer: '因为地面刚洒过水，容易打滑，所以体育课先绕场慢走', explanation: '这句只使用材料已有的原因和办法。再试时检查“因为—所以”两边是否有依据。', points: 10 },
    { id: 'zh-g5-merge-connect-q2', type: 'choice', prompt: '“还要”最适合连接哪两项？', options: ['戴好帽子，还要带上水壶', '操场很大，还要昨天放学', '我看见树，还要树很高'], correctAnswer: '戴好帽子，还要带上水壶', explanation: '“还要”连接同一任务中的并列要求。再试时看两项是否都属于要做的事。', points: 10 },
    { id: 'zh-g5-merge-connect-q3', type: 'choice', prompt: '合并说明时不能加入哪项？', options: ['同学一定会摔倒', '地面容易打滑', '先绕场慢走'], correctAnswer: '同学一定会摔倒', explanation: '材料只说容易打滑，没有写已经摔倒。再试时不要把可能性写成事实。', points: 10 },
  ] },
  { id: 'zh-g5-merge-card', title: '写一段连贯说明', summary: '面向具体读者，把地点、步骤和提醒写在一段话里。', studyGuide: ['先写对象和地点。', '再按顺序写两步操作。', '最后核对每句话都来自材料或自己的真实观察。'], body: '为第一次参加社团的同学介绍美术工具柜：工具柜在教室后墙；取用前先登记；用完擦干净并放回原格；找不到位置时看格子标签。说明要让读者能按文字行动。', project: { title: '写给新同学的工具柜说明', prompt: '写60—100字说明，交代地点、取用步骤和归还提醒。可以使用虚构教室，不填写真实姓名。', placeholder: '工具柜在……。取用前先……，用完……。如果找不到……，可以……。', checklist: ['我写明了地点和至少两步操作。', '我使用了“先、用完、如果”等连接词。', '我没有添加材料没有的处罚、价格或评价。'] }, questions: [
    { id: 'zh-g5-merge-card-q1', type: 'choice', prompt: '哪句适合放在说明开头？', options: ['工具柜在教室后墙', '用完擦干净并放回原格', '找不到位置时看格子标签'], correctAnswer: '工具柜在教室后墙', explanation: '开头先交代地点，读者才知道去哪里。再试时先找“在哪里”的信息。', points: 10 },
    { id: 'zh-g5-merge-card-q2', type: 'choice', prompt: '正确的操作顺序是什么？', options: ['先登记→取用→擦干净并放回原格', '先放回原格→登记→取用', '先看标签→把工具带回家'], correctAnswer: '先登记→取用→擦干净并放回原格', explanation: '材料明确先登记，使用后归还。再试时按“前、后”检查步骤。', points: 10 },
    { id: 'zh-g5-merge-card-q3', type: 'choice', prompt: '哪项属于材料外添加？', options: ['找不到工具要罚款', '用完擦干净', '看格子标签'], correctAnswer: '找不到工具要罚款', explanation: '原文没有处罚规定，不能自行加入。再试时逐句对照材料。', points: 10 },
  ] },
];
