import type { LanguageLesson } from '@/lib/types';

// 原创能力拓展，非外研社2022课标版教材同步。
export const englishNoticeChangeLessons: LanguageLesson[] = [
  { id:'en-g4-notice-listen', title:'听通知：先抓时间和地点', summary:'从一则虚构通知中找出日期、地点和开始时间。', studyGuide:['on Monday是星期一，at the library是在图书馆，starts at four是四点开始。先听整段，再回正文找 day、place、time。','通知是虚构练习，不要求真实参加活动；没有声音时可以看文字完成阅读，并按阅读辅助记录。'], body:'Our class meeting is on Monday in the library. It starts at four.', speakable:true, questions:[
    {id:'en-g4-notice-listen-q1',type:'choice',prompt:'听新通知：会议在哪儿？',listeningText:'The meeting is on Tuesday at the classroom. It starts at three.',options:['classroom','library','playground'],correctAnswer:'classroom',explanation:'新录音说at the classroom，地点是classroom。再试时先找at后面的地点，不要套用正文library。',points:10},
    {id:'en-g4-notice-listen-q2',type:'choice',prompt:'根据正文，会议几点开始？',options:['four','three','five'],correctAnswer:'four',explanation:'正文写It starts at four。再试时找到starts at后面的数字。',points:10},
    {id:'en-g4-notice-listen-q3',type:'choice',prompt:'把正文信息配对：Monday、library、four分别是什么？',options:['day、place、time','place、day、time','day、time、place'],correctAnswer:'day、place、time',explanation:'Monday是日期，library是地点，four是时间。再试时逐项核对含义。',points:10},
  ]},
  { id:'en-g4-notice-update', title:'听到变化：比较旧安排和新安排', summary:'区分虚构活动原安排中的日期、地点和时间。', studyGuide:['Friday是星期五，Room 2是2号房间，after school是放学后。先记原安排，再听新句比较变化。','change表示变化；不必背语法术语，只要逐项核对 day、room、time。'], body:'The art show is on Friday in Room 2. We can visit it after school.', speakable:true, questions:[
    {id:'en-g4-notice-update-q1',type:'choice',prompt:'听新通知：哪两项变了？',listeningText:'The art show is on Thursday in Room 3.',options:['day and room','room and food','day and colour'],correctAnswer:'day and room',explanation:'新录音把Friday改为Thursday，把Room 2改为Room 3。再试时分别圈日期和房间。',points:10},
    {id:'en-g4-notice-update-q2',type:'choice',prompt:'根据正文，什么时候参观艺术展？',options:['after school','at lunch time','in the morning'],correctAnswer:'after school',explanation:'正文说We can visit it after school。再试时找visit后面的时间短语。',points:10},
    {id:'en-g4-notice-update-q3',type:'choice',prompt:'正文原安排是星期几、哪个房间？',options:['Thursday, Room 3','Friday, Room 3','Friday, Room 2'],correctAnswer:'Friday, Room 2',explanation:'正文原句是on Friday in Room 2。再试时不要把新录音的变化当成正文答案。',points:10},
  ]},
  { id:'en-g4-notice-confirm', title:'复述并写确认卡', summary:'用日期、地点和时间写两句虚构活动确认信息。', studyGuide:['正文：Wednesday是星期三，music room是音乐教室，book是书，five是五点。先读清谁、何时、何地。','作品可写虚构安排，不需要真实课程、同伴、照片或录音。自检记录学习路径，不自动判定发音正确。'], body:'The music club is on Wednesday at the music room. Bring your book. It starts at five.', speakable:true, project:{title:'我的活动确认卡',prompt:'写两句英文：一句含日期和地点，一句含开始时间；再写中文核对记录。',placeholder:'My activity is on ... at ... .\nIt starts at ... .\n我的核对记录：我先检查了日期和地点，还想再听一听……。',checklist:['我写了两句，分别写清日期地点和开始时间。','我逐项核对day、place、time，没有混写安排。','我尝试复述或听过参考，并诚实记录仍需核对的词。']}, questions:[
    {id:'en-g4-notice-confirm-q1',type:'choice',prompt:'听新通知：活动几点开始？',listeningText:'The music club is on Thursday at the hall. It starts at six.',options:['five','six','seven'],correctAnswer:'six',explanation:'新录音说It starts at six。再试时只核对starts at后面的时间。',points:10},
    {id:'en-g4-notice-confirm-q2',type:'choice',prompt:'根据正文，要带什么？',options:['book','ball','lunch'],correctAnswer:'book',explanation:'正文说Bring your book。再试时找到Bring后面的物品。',points:10},
    {id:'en-g4-notice-confirm-q3',type:'choice',prompt:'哪句同时写清“周三在音乐教室”？',options:['It is on Wednesday at the music room.','It is on Friday at the hall.','It starts at five.'],correctAnswer:'It is on Wednesday at the music room.',explanation:'第一句同时包含日期Wednesday和地点music room。再试时分别核对两项信息。',points:10},
  ]},
];
