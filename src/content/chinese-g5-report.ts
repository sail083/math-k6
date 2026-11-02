import type { LanguageLesson } from '@/lib/types';

// 文字模拟口头汇报，非教材同步，不等同真实听说达标。
export const chineseG5ReportLessons: LanguageLesson[] = [
  { id: 'zh-g5-report-select', title: '为汇报选要点', summary: '围绕听众的问题筛选资料事实。', studyGuide: ['先确定汇报要回答什么。', '选时间、数字和结果等关键事实。', '删去与主题无关的细节。'], body: '班级要汇报“本周图书角使用情况”。记录显示：周一借出12本，周三借出18本，周五借出15本；周三新增两张坐垫；窗帘是蓝色。若重点是借阅变化，应选三天数字，不必介绍窗帘颜色。', questions: [
    { id: 'zh-g5-report-select-q1', type: 'choice', prompt: '汇报借阅变化最需要哪组资料？', options: ['周一12本、周三18本、周五15本', '窗帘是蓝色', '坐垫有花边'], correctAnswer: '周一12本、周三18本、周五15本', explanation: '三天数字能直接比较变化。再试时先看资料是否回答汇报主题。', points: 10 },
    { id: 'zh-g5-report-select-q2', type: 'choice', prompt: '哪条资料与借阅变化关系最弱？', options: ['窗帘是蓝色', '周三借出18本', '周五借出15本'], correctAnswer: '窗帘是蓝色', explanation: '颜色不能说明借阅量。再试时删去装饰性细节。', points: 10 },
    { id: 'zh-g5-report-select-q3', type: 'choice', prompt: '根据记录能确定什么？', options: ['周三借出本数最多', '新增坐垫一定让借阅增加', '所有同学都借过书'], correctAnswer: '周三借出本数最多', explanation: '12、18、15中18最大；原因和全员情况没有记录。再试时不超出数字证据。', points: 10 },
  ] },
  { id: 'zh-g5-report-order', title: '按顺序讲述资料', summary: '用先、再、最后把事实讲成听众能跟上的一段话。', studyGuide: ['先交代主题和资料范围。', '再按时间或大小比较。', '最后说出资料支持的结论。'], body: '汇报三天借阅记录，可以这样说：“本周图书角记录了周一、周三和周五的借阅量，分别是12本、18本和15本。先看周一，再看周三、周五，周三的18本最多。”先说明范围，再报数字，最后下结论。', questions: [
    { id: 'zh-g5-report-order-q1', type: 'choice', prompt: '汇报开头最应先说什么？', options: ['记录的是哪几天的借阅量', '窗帘的颜色', '自己最喜欢的书'], correctAnswer: '记录的是哪几天的借阅量', explanation: '听众先知道范围，数字才有意义。再试时先交代“什么资料”。', points: 10 },
    { id: 'zh-g5-report-order-q2', type: 'choice', prompt: '哪句结论符合三天数字？', options: ['周三的18本最多', '周一以后每天都增加', '周五没有人借书'], correctAnswer: '周三的18本最多', explanation: '18大于12和15；其他说法与记录不符。再试时逐个比较原数字。', points: 10 },
    { id: 'zh-g5-report-order-q3', type: 'choice', prompt: '哪种讲述加入了材料没有的内容？', options: ['大家因为坐垫舒服才借得多', '周三借出18本', '记录包括周一、周三、周五'], correctAnswer: '大家因为坐垫舒服才借得多', explanation: '材料没有记录借阅增加的原因。再试时区分事实和推测。', points: 10 },
  ] },
  { id: 'zh-g5-report-card', title: '写一张口述提纲卡', summary: '把资料、比较和结论压缩成可照着讲的提纲。', studyGuide: ['第一行写主题和范围。', '第二行列关键数字或事实。', '第三行写谨慎结论，不把猜测当事实。'], body: '口述提纲不必写成长文章，可以用三行提醒自己：“主题：三天借阅量；数字：12、18、15本；结论：周三最多，原因还需继续记录。”提纲帮助讲述，但文字练习不能代替真实听众反馈。', project: { title: '我的资料口述提纲卡', prompt: '根据本课图书角记录写三行提纲：主题范围、关键资料、结论或待核问题。可使用虚构数据，不填写真实姓名。', placeholder: '主题：……\n资料：……\n结论/待核：……', checklist: ['我写明了资料范围和主题。', '我保留了至少两个关键数字或事实。', '我把结论与待核原因分开，没有夸大。'] }, questions: [
    { id: 'zh-g5-report-card-q1', type: 'choice', prompt: '提纲第一行应写什么？', options: ['主题和资料范围', '无关的个人感受', '尚未查到的原因'], correctAnswer: '主题和资料范围', explanation: '这能帮助自己和听众定位内容。再试时先回答“汇报什么”。', points: 10 },
    { id: 'zh-g5-report-card-q2', type: 'choice', prompt: '哪项结论写得最稳妥？', options: ['周三借阅最多，原因还需继续记录', '周三最多一定因为坐垫', '周三最多说明所有人都爱读书'], correctAnswer: '周三借阅最多，原因还需继续记录', explanation: '它保留已知数字，并承认原因未知。再试时把“还需”留给没有证据的部分。', points: 10 },
    { id: 'zh-g5-report-card-q3', type: 'choice', prompt: '这张提纲不能证明什么？', options: ['学生已经具备真实口头汇报能力', '周三借阅量为18本', '三天记录可以比较'], correctAnswer: '学生已经具备真实口头汇报能力', explanation: '文字提纲和题目不能代替真实听说表现。再试时区分完成练习与能力验收。', points: 10 },
  ] },
];
