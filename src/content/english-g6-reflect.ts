import type { LanguageLesson } from '@/lib/types';

export const englishG6ReflectLessons: LanguageLesson[] = [
  {id:'en-g6-reflect-notice',title:'读懂反馈里的重点',summary:'从同伴反馈中找出优点和一个可改进处。',studyGuide:['feedback是反馈，good point是优点，change是修改。先找对方明确说了什么。','这是虚构学习作品，不要求真实同伴或上传文件。'],body:'Your story has a clear beginning. Good point! Please add one detail about the place.',speakable:true,questions:[
    {id:'en-g6-reflect-notice-q1',type:'choice',prompt:'听反馈：对方认为哪一点清楚？',listeningText:'Your story has a clear ending. Good point!',options:['beginning','ending','place'],correctAnswer:'ending',explanation:'录音说clear ending，重点是结尾清楚。再试时抓住clear后面的名词。',points:10},
    {id:'en-g6-reflect-notice-q2',type:'choice',prompt:'正文建议补充什么？',options:['a detail about the place','a new title','more characters'],correctAnswer:'a detail about the place',explanation:'正文写Please add one detail about the place。再试时找add后面的内容。',points:10},
    {id:'en-g6-reflect-notice-q3',type:'choice',prompt:'哪句是优点反馈？',options:['Good point!','Please add one detail.','Change the place.'],correctAnswer:'Good point!',explanation:'Good point表示“优点/说得好”。再试时区分表扬和修改建议。',points:10},
  ]},
  {id:'en-g6-reflect-revise',title:'按建议改一处',summary:'比较原句和修改句，确认建议是否落实。',studyGuide:['add one detail表示增加一个细节，because可说明修改理由。先找建议，再检查新句是否真的增加信息。','修改可以是虚构例句，不代表原作品有错。'],body:'Original: The park is nice.\nRevision: The park is quiet and green. I can hear birds there.',speakable:true,questions:[
    {id:'en-g6-reflect-revise-q1',type:'choice',prompt:'听修改后的句子，公园新增了什么特点？',listeningText:'The park is quiet and green.',options:['quiet and green','big and busy','old and red'],correctAnswer:'quiet and green',explanation:'录音直接说quiet and green。再试时听清is后面的两个特点。',points:10},
    {id:'en-g6-reflect-revise-q2',type:'choice',prompt:'修改句比原句多了哪类信息？',options:['声音和环境细节','人物年龄','活动价格'],correctAnswer:'声音和环境细节',explanation:'Revision增加quiet、green和hear birds，都是环境或声音细节。再试时对照两句。',points:10},
    {id:'en-g6-reflect-revise-q3',type:'choice',prompt:'哪句真正落实“增加地点细节”的建议？',options:['I can hear birds there.','The park is nice.','Good point!'],correctAnswer:'I can hear birds there.',explanation:'there指公园，hear birds提供了具体地点感受。再试时找新增的具体信息。',points:10},
  ]},
  {id:'en-g6-reflect-card',title:'写一张修改说明卡',summary:'用两句英文说明修改内容与理由。',studyGuide:['作品写一处修改和一句理由；可以用because。没有录音时可阅读参考并记录。自检不等于口语评分。','先读参考句，再检查修改对象和理由是否对应；不确定的词保留在核对记录中。'],body:'I changed my place detail. I added a quiet park because it helps readers see the story.',speakable:true,project:{title:'我的修改说明卡',prompt:'写两句英文：说明你改了什么，再用because说明理由。',placeholder:'I changed ... .\nI added ... because ... .\n我的核对记录：我依据了……，还想再听一听……。',checklist:['我写清了一处具体修改。','because后的理由与我的修改有关。','我尝试读过或听过参考，并记录仍需核对的词。']},questions:[
    {id:'en-g6-reflect-card-q1',type:'choice',prompt:'听说明：作者增加了什么？',listeningText:'I added a short ending because it helps readers remember the story.',options:['a short ending','a new character','a price'],correctAnswer:'a short ending',explanation:'录音说added a short ending。再试时抓住added后的对象。',points:10},
    {id:'en-g6-reflect-card-q2',type:'choice',prompt:'正文中，作者为什么加入安静的公园？',options:['It helps readers see the story.','It is expensive.','It is far away.'],correctAnswer:'It helps readers see the story.',explanation:'正文because后说明理由。再试时回到because后半句。',points:10},
    {id:'en-g6-reflect-card-q3',type:'choice',prompt:'哪句同时说明修改和理由？',options:['I added a detail because it helps readers.','The story is long.','Good point!'],correctAnswer:'I added a detail because it helps readers.',explanation:'第一句有修改对象和because理由。再试时检查两部分是否都出现。',points:10},
  ]},
];
