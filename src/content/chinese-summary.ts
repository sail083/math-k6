import type { LanguageLesson } from '@/lib/types';

// 原创阅读迁移课程，非教材全文或教材同步。
export const chineseSummaryLessons: LanguageLesson[] = [
  { id: 'zh-g6-reading-summary-main', title: '先抓住事情主线', summary: '从短文找出问题、行动和结果，分清主线与细节。', studyGuide: ['先找人物遇到的问题。', '再找解决问题的关键行动。', '最后核对结果，删去不能推动事情的细节。'], body: '校园雨后，小岚发现走廊入口的纸箱被雨水打湿。她先把还能用的画纸搬到窗边，再把湿纸摊开晾着；同学们用旧报纸垫在箱子下面。放学前，画纸已经干了大半，第二天还能继续做海报。概括事情时，要保留人物、问题、办法和结果；“走廊入口”等地点细节若不影响理解，可以删去。', questions: [
    { id: 'zh-g6-reading-summary-main-q1', type: 'choice', prompt: '这段话的主线概括是哪一项？', options: ['纸箱受潮后，小岚和同学想办法保护画纸，第二天还能使用', '雨后走廊入口有一个纸箱', '老师表扬小岚整理得很快'], correctAnswer: '纸箱受潮后，小岚和同学想办法保护画纸，第二天还能使用', explanation: '主线包含问题、行动和结果；老师表扬没有出现在材料中。再试时删去不能推动事情的细节。', points: 10 },
    { id: 'zh-g6-reading-summary-main-q2', type: 'choice', prompt: '哪一项是保护画纸的关键行动？', options: ['把画纸搬到窗边并摊开晾着', '放学前经过走廊', '纸箱在入口旁边'], correctAnswer: '把画纸搬到窗边并摊开晾着', explanation: '这个行动直接解释画纸后来变干。再试时问：哪件事能说明结果为什么发生？', points: 10 },
    { id: 'zh-g6-reading-summary-main-q3', type: 'choice', prompt: '“画纸干了大半”能支持什么？', options: ['第二天可以继续做海报', '全部画纸都已经干了', '纸箱以后不会再受潮'], correctAnswer: '第二天可以继续做海报', explanation: '原文只说干了大半并能继续使用，不能夸大为全部干了。再试时严格按原文范围表达。', points: 10 },
  ] },
  { id: 'zh-g6-reading-summary-order', title: '把信息排成读者听得懂的顺序', summary: '重组打散要点，用因果和时间连接词说清事情。', studyGuide: ['先排发生的问题。', '接着排保留信息和采取的办法。', '最后写结果，并检查每一步能否连起来。'], body: '以下四条原创要点描述一件事：①风把社区公告吹落；②小成先拍下公告内容；③他和保安一起把公告压在透明夹板里；④居民后来能看清周末停水时间。读者需要先知道问题，再知道怎样保住信息，最后才能理解结果。', questions: [
    { id: 'zh-g6-reading-summary-order-q1', type: 'choice', prompt: '四条要点的正确顺序是？', options: ['①→②→③→④', '②→①→④→③', '③→②→①→④'], correctAnswer: '①→②→③→④', explanation: '先发生公告吹落，再拍照、压好，最后居民看清信息。再试时按时间和因果逐步排列。', points: 10 },
    { id: 'zh-g6-reading-summary-order-q2', type: 'choice', prompt: '哪句话把②和③的关系说清楚？', options: ['为了不丢失停水信息，小成先拍照，再和保安把公告压好', '因为已经停水，小成只好拍照', '小成拍照，所以公告一定没有被吹落'], correctAnswer: '为了不丢失停水信息，小成先拍照，再和保安把公告压好', explanation: '材料支持“为了保留信息”这一目的和先后动作。再试时区分目的、事实与自己补出的结论。', points: 10 },
    { id: 'zh-g6-reading-summary-order-q3', type: 'choice', prompt: '对不了解现场的读者来说，哪项信息必须保留？', options: ['公告写着周末停水时间', '透明夹板是什么颜色', '保安当天几点下班'], correctAnswer: '公告写着周末停水时间', explanation: '这项信息能解释居民后来要看清什么；另外两项不影响事件主线。再试时保留理解结果所需的信息。', points: 10 },
  ] },
  { id: 'zh-g6-reading-summary-card', title: '制作一张给别人看的摘要卡', summary: '独立提取关键事实，写出不添油加醋的短摘要。', studyGuide: ['先读完整段，找主要问题。', '按先后写办法和结果。', '逐句核对，不加入原文没有的动机和评价。'], body: '学校准备在午休时开放音乐教室。第一次试行时，门口排队的同学挡住了楼梯。值日生把队伍移到墙边，并在地上贴了等候线；老师又把开放时间写在门牌上。第二天，大家按线排队，楼梯口通畅多了。', project: { title: '给缺席同学的摘要卡', prompt: '根据短文写一张60—100字摘要卡，说明问题、办法和结果。', placeholder: '事情起因是……。后来……。结果……。', checklist: ['我写出了问题、关键办法和结果。', '我使用了表示先后的连接词。', '我没有添加原文没有的动机、心情或评价。'] }, questions: [
    { id: 'zh-g6-reading-summary-card-q1', type: 'choice', prompt: '这段文字要解决的主要问题是什么？', options: ['音乐教室开放时排队挡住楼梯', '老师把开放时间写在门牌上', '第二天大家都很兴奋'], correctAnswer: '音乐教室开放时排队挡住楼梯', explanation: '开头写问题，后面办法和结果都围绕它展开。再试时看办法要解决的是什么。', points: 10 },
    { id: 'zh-g6-reading-summary-card-q2', type: 'choice', prompt: '哪句摘要最合适？', options: ['音乐教室首次开放时排队挡住楼梯，值日生调整队伍并贴等候线，老师补充开放时间，第二天通行改善', '音乐教室开放时大家都很兴奋，老师因此批评了同学', '老师写了门牌，事情就全部结束了'], correctAnswer: '音乐教室首次开放时排队挡住楼梯，值日生调整队伍并贴等候线，老师补充开放时间，第二天通行改善', explanation: '这句保留问题、办法、结果且没有添加事实。再试时逐项检查是否漏掉主线。', points: 10 },
    { id: 'zh-g6-reading-summary-card-q3', type: 'choice', prompt: '哪个说法属于无依据添加？', options: ['老师因为担心被批评才改门牌', '值日生把队伍移到墙边', '第二天楼梯口通畅多了'], correctAnswer: '老师因为担心被批评才改门牌', explanation: '原文没有写老师的动机；其余两项是原文事实。再试时标出“材料写了什么”。', points: 10 },
  ] },
];
