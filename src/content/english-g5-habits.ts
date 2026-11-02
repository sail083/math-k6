import type { LanguageLesson } from '@/lib/types';
export const englishG5HabitsLessons: LanguageLesson[] = [
 {id:'en-g5-habits-read',title:'读懂一天的小习惯',summary:'按顺序理解虚构人物的健康习惯。',studyGuide:['habit是习惯，every day是每天，before bed是睡前；先找动作和时间。','内容是虚构示例，不是医学建议。'],body:'I drink water every day. I wash my hands before bed. I read for ten minutes.',speakable:true,questions:[
  {id:'en-g5-habits-read-q1',type:'choice',prompt:'听到的新习惯是什么？',listeningText:'I stretch for five minutes every morning.',options:['每天早上拉伸五分钟','睡前读书十分钟','每天喝水'],correctAnswer:'每天早上拉伸五分钟',explanation:'录音说stretch for five minutes every morning。再试时抓住动作和时间。',points:10},
  {id:'en-g5-habits-read-q2',type:'choice',prompt:'正文中，什么时候洗手？',options:['before bed','every morning','after lunch'],correctAnswer:'before bed',explanation:'正文写wash my hands before bed。再试时找动作后面的时间短语。',points:10},
  {id:'en-g5-habits-read-q3',type:'fill-blank',prompt:'补全正文：I read for ______ minutes.',options:[],correctAnswer:'ten',explanation:'正文写read for ten minutes。再试时回到最后一句核对数字。',points:10},
 ]},
 {id:'en-g5-habits-compare',title:'比较习惯和理由',summary:'用because说明一个习惯带来的帮助。',studyGuide:['because表示因为，helps me表示帮助我；先区分习惯本身和理由。','理由只来自虚构文本，不是健康效果的科学结论。'],body:'I drink water because it helps me feel fresh. I read before bed because it helps me relax.',speakable:true,questions:[
  {id:'en-g5-habits-compare-q1',type:'choice',prompt:'听到的习惯帮助什么？',listeningText:'I read before bed because it helps me relax.',options:['relax','run fast','feel hungry'],correctAnswer:'relax',explanation:'录音because后说helps me relax。再试时只核对理由部分。',points:10},
  {id:'en-g5-habits-compare-q2',type:'choice',prompt:'正文为什么喝水？',options:['It helps me feel fresh.','It helps me sleep.','It helps me run.'],correctAnswer:'It helps me feel fresh.',explanation:'正文第一句because后是feel fresh。再试时不要把第二句理由混过来。',points:10},
  {id:'en-g5-habits-compare-q3',type:'choice',prompt:'哪句把习惯和理由对应正确？',options:['I read before bed because it helps me relax.','I drink water because it helps me sleep.','I read before bed because it helps me run.'],correctAnswer:'I read before bed because it helps me relax.',explanation:'read与relax在正文同一句对应。再试时分别核对动作和because后的理由。',points:10},
 ]},
 {id:'en-g5-habits-card',title:'写我的习惯建议卡',summary:'写两句习惯说明和一个理由。',studyGuide:['作品可以写虚构或自己的安全日常习惯，不涉及疾病、药物或医疗判断。自检记录写作与听读路径。','先核对动作、时间和because理由是否对应；这张卡用于练习表达，不是医疗建议。'],body:'I take a short walk every day. It helps me feel calm.',speakable:true,project:{title:'我的习惯建议卡',prompt:'写两句英文：一句写习惯，一句用because说明理由。',placeholder:'I ... every day.\nI ... because ... .\n我的核对记录：我检查了动作和时间，还想再听一听……。',checklist:['我写清了一个习惯和时间。','because后的理由与这个习惯对应。','我尝试读过或听过参考，并记录仍需核对的词。']},questions:[
  {id:'en-g5-habits-card-q1',type:'choice',prompt:'听到的建议是什么？',listeningText:'I take a short walk every day because it helps me feel calm.',options:['每天散步','每天喝水','睡前读书'],correctAnswer:'每天散步',explanation:'录音说take a short walk every day。再试时听清动作walk。',points:10},
  {id:'en-g5-habits-card-q2',type:'choice',prompt:'正文中的散步带来什么感受？',options:['calm','hungry','late'],correctAnswer:'calm',explanation:'正文写helps me feel calm。再试时回到第二句找感受词。',points:10},
  {id:'en-g5-habits-card-q3',type:'choice',prompt:'哪组句子适合写在习惯卡上？',options:['I drink water every day. I do it because it helps me feel fresh.','Open the door. Sit down.','The bag is red.'],correctAnswer:'I drink water every day. I do it because it helps me feel fresh.',explanation:'第一组选项同时有习惯、时间和because理由。再试时逐项检查三类信息。',points:10},
 ]},
];
