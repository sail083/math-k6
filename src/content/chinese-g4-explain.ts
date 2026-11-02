import type { LanguageLesson } from '@/lib/types';

// 原创说明表达课程，非教材同步。
export const chineseG4ExplainLessons: LanguageLesson[] = [
  { id: 'zh-g4-explain-main', title: '一句话说清主题', summary: '从短段落找出介绍对象和最重要的特点。', studyGuide: ['先问“这段主要介绍谁或什么”。', '再找反复出现或能统领其他句子的内容。', '删去只举一个例子的细节。'], body: '校园里的香樟树一年四季都有变化。春天长出浅绿的新叶，夏天树冠很茂密，秋天会落下褐色果实，冬天仍能为路边挡风。这段话介绍的是香樟树的四季变化，后面各句都是具体表现。', questions: [
    { id: 'zh-g4-explain-main-q1', type: 'choice', prompt: '这段话主要介绍什么？', options: ['香樟树四季的变化', '校园路边很宽', '秋天果实的颜色'], correctAnswer: '香樟树四季的变化', explanation: '开头提出四季变化，后面分写各季特点。再试时看哪项能统领全部句子。', points: 10 },
    { id: 'zh-g4-explain-main-q2', type: 'choice', prompt: '哪项是支持主题的具体表现？', options: ['夏天树冠很茂密', '同学们喜欢散步', '学校有三座教学楼'], correctAnswer: '夏天树冠很茂密', explanation: '它直接写香樟树夏季的特点。再试时排除材料没有出现的信息。', points: 10 },
    { id: 'zh-g4-explain-main-q3', type: 'choice', prompt: '只读这段话，不能确定哪件事？', options: ['香樟树由谁种下', '冬天能挡风', '春天长新叶'], correctAnswer: '香樟树由谁种下', explanation: '材料写了季节特点，没有种植者信息。再试时不把常识当作本文事实。', points: 10 },
  ] },
  { id: 'zh-g4-explain-order', title: '按顺序组织要点', summary: '用总说、分说和连接词写出清楚的介绍。', studyGuide: ['先放总的介绍句。', '再按时间或步骤排列分项信息。', '读一遍检查每句是否回答前一句的问题。'], body: '介绍“种一盆薄荷”可以这样安排：先说薄荷喜欢有阳光的地方；接着写把土装进花盆、插入枝条并浇少量水；最后写一周后长出新叶。先总说条件，再写步骤，最后写结果，读者更容易跟上。', questions: [
    { id: 'zh-g4-explain-order-q1', type: 'choice', prompt: '哪项顺序最清楚？', options: ['喜欢阳光→装土插枝浇水→一周后长新叶', '长新叶→喜欢阳光→装土', '浇水→长新叶→插枝'], correctAnswer: '喜欢阳光→装土插枝浇水→一周后长新叶', explanation: '这项是条件、步骤、结果的顺序。再试时找“最后”发生的结果。', points: 10 },
    { id: 'zh-g4-explain-order-q2', type: 'choice', prompt: '哪句最适合放在步骤前作总说？', options: ['薄荷喜欢有阳光的地方', '一周后长出新叶', '我今天看见了一个花盆'], correctAnswer: '薄荷喜欢有阳光的地方', explanation: '它先交代种植条件，能引出后面的做法。再试时问这句话能否统领介绍。', points: 10 },
    { id: 'zh-g4-explain-order-q3', type: 'choice', prompt: '材料没有说明哪件事？', options: ['薄荷花朵是什么颜色', '插入枝条', '浇少量水'], correctAnswer: '薄荷花朵是什么颜色', explanation: '原文只写种植步骤和结果，没有花朵颜色。再试时不补入额外观察。', points: 10 },
  ] },
  { id: 'zh-g4-explain-card', title: '写一张事物介绍卡', summary: '选择关键特点和顺序，写给没见过它的人看。', studyGuide: ['确定介绍对象和两个关键特点。', '用“先、再、最后”或分类词组织。', '删掉材料没有依据的夸张评价。'], body: '介绍一把可折叠雨伞，要让读者知道它有什么特点、怎样使用。可以写：伞面能挡雨；伞柄可以收短，放进书包；使用后要打开晾干。只写“它特别好”不能让读者了解具体情况。', project: { title: '我的事物介绍卡', prompt: '选一个身边物品，写60—100字介绍：它的两个特点、使用步骤或注意事项。可写虚构物品，不填真实姓名。', placeholder: '这是……。它有……和……的特点。使用时先……，再……。', checklist: ['我写明了介绍对象和至少两个具体特点。', '我用顺序词或分类把信息组织清楚。', '我没有写材料或观察无法支持的夸张评价。'] }, questions: [
    { id: 'zh-g4-explain-card-q1', type: 'choice', prompt: '介绍雨伞时，哪项是具体特点？', options: ['伞柄可以收短，放进书包', '它非常棒', '大家一定都喜欢'], correctAnswer: '伞柄可以收短，放进书包', explanation: '这是读者能理解和检查的具体特点。再试时把空泛评价换成可观察细节。', points: 10 },
    { id: 'zh-g4-explain-card-q2', type: 'choice', prompt: '哪项使用顺序符合材料？', options: ['挡雨后打开晾干', '先晾干再打开使用', '把伞柄剪短'], correctAnswer: '挡雨后打开晾干', explanation: '材料要求使用后打开晾干。再试时按“使用后”检查步骤。', points: 10 },
    { id: 'zh-g4-explain-card-q3', type: 'choice', prompt: '哪种表达最适合写进介绍卡？', options: ['伞面能挡雨，伞柄能收短', '这把伞全世界第一', '用了它就永远不会淋湿'], correctAnswer: '伞面能挡雨，伞柄能收短', explanation: '这句包含材料支持的具体特点，没有夸大效果。再试时删去“永远、全世界”等无依据词。', points: 10 },
  ] },
];
