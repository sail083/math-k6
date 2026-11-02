import type { LanguageLesson } from '@/lib/types';
import { englishUpperLessons } from './english-upper';
import { englishG3Lessons } from './english-g3-units';
import { englishShortWordLessons } from './english-short-word';
import { englishNoticeChangeLessons } from './english-notice-change';
import { englishG6ReflectLessons } from './english-g6-reflect';
import { englishG5HabitsLessons } from './english-g5-habits';
import { englishG4WeatherLessons } from './english-g4-weather';
import { englishG3RoutineLessons } from './english-g3-routine';
import { englishG6OpinionsLessons } from './english-g6-opinions';
import { englishShortVowelILessons } from './english-short-vowel-i';
import { englishShortVowelOLessons } from './english-short-vowel-o';
import { englishG5LongListeningLessons } from './english-g5-long-listening';
import { englishG4CommunityLessons } from './english-g4-community';

export const englishLessons: LanguageLesson[] = [
  {
    id: 'en-g3a-u1-meet',
    title: '认识新朋友',
    summary: '用问候、自我介绍和年龄信息认识一位新朋友。',
    studyGuide: [
      '情境：林在学校认识朋友 Ben。先看英文，找到谁在介绍自己、谁在介绍朋友。',
      "I'm = I am，表示“我是”。后面接名字介绍自己，接年龄数字说明几岁；nine 是九。He's = He is，表示“他是”；too 表示“也”。",
      'Nice to meet you! 表示“很高兴认识你”。先听一遍，再一句一句跟读。meet 是见面，smile 是微笑，at school 是在学校。',
      "轮到你：把 I'm Lin. 中的 Lin 换成自己的昵称，说给一位家人听，再练习问候。昵称不用填入网站。",
    ],
    body: "Hello! I'm Lin. I'm nine. This is my friend Ben. He's nine too. We meet at school. We smile and say, 'Nice to meet you!'",
    speakable: true,
    questions: [
      {
        id: 'en-g3a-u1-meet-q1',
        type: 'choice',
        prompt: '刚才听到的是哪句自我介绍？',
        listeningText: "Hello! I'm May.",
        options: ["I'm May.", "He's Ben.", 'Nice to meet you!', 'This is my friend.'],
        correctAnswer: "I'm May.",
        explanation: "音频用 I'm May. 介绍自己，May 是这位新朋友的名字。再试时注意 I'm 后面的名字。",
        points: 10,
      },
      {
        id: 'en-g3a-u1-meet-q2',
        type: 'fill-blank',
        prompt: "请补全林的年龄：I'm ______.（只填一个英文单词）",
        correctAnswer: 'nine',
        explanation: "正文写着 I'm nine，nine 表示九岁。再试时回到第二句寻找年龄数字。",
        points: 10,
      },
      {
        id: 'en-g3a-u1-meet-q3',
        type: 'choice',
        prompt: '初次见到新朋友时，哪句话最合适？',
        options: ['Nice to meet you!', 'Close the book.', 'Good night!', 'Sit down.'],
        correctAnswer: 'Nice to meet you!',
        explanation: 'Nice to meet you 表示“很高兴认识你”。再试时先判断场景是初次见面。',
        points: 10,
      },
    ],
  },
  {
    id: 'en-g3a-u1-help',
    title: '一起帮助、一起玩',
    summary: '用邀请、递物和感谢表达友好。',
    studyGuide: [
      '情境：新同学 Mia 掉了铅笔，林和 Ben 帮忙捡起，之后邀请她一起玩。每段开头是说话人的名字。',
      "Let's help. 是“我们来帮忙吧”；Let's play together. 是“我们一起玩吧”。Let's 后面接动作词，help 是帮助，play 是玩，together 是一起。",
      '递给别人东西时说 Here you are.，收到帮助时说 Thank you!。Great! 表示“太好了”，可以回应邀请。',
      '先听读，再和家人模拟递铅笔：一个人说“给你”，另一个人说“谢谢”。最后换角色，试着不看正文说出来。',
    ],
    body: "Lin: Let's help.\n\nBen: Here you are.\n\nMia: Thank you!\n\nLin: Let's play together.\n\nMia: Great!",
    speakable: true,
    questions: [
      {
        id: 'en-g3a-u1-help-q1',
        type: 'choice',
        prompt: '别人把铅笔递给你并说 Here you are，应该怎样回应？',
        options: ['Thank you!', 'Goodbye!', 'I am nine.', 'Sit down.'],
        correctAnswer: 'Thank you!',
        explanation: '收到别人递来的物品时可以说 Thank you。再试时抓住“别人帮助了我”这个场景。',
        points: 10,
      },
      {
        id: 'en-g3a-u1-help-q2',
        type: 'fill-blank',
        prompt: "请补全邀请：Let's ______ together.（只填一个英文单词）",
        correctAnswer: 'play',
        explanation: "正文用 Let's play together 邀请大家一起玩。再试时寻找 play together 这个词组。",
        points: 10,
      },
      {
        id: 'en-g3a-u1-help-q3',
        type: 'choice',
        prompt: '哪句话表示“让我们帮忙吧”？',
        options: ["Let's help.", "Let's go home.", 'Here you are.', 'Thank you!'],
        correctAnswer: "Let's help.",
        explanation: "Let's 后接动作，help 表示帮助。再试时先找到含有 help 的句子。",
        points: 10,
      },
    ],
  },
  {
    id: 'en-g3a-u1-friend-card',
    title: '制作我的朋友卡',
    summary: '用三句话介绍自己、介绍朋友和你们的关系。',
    studyGuide: [
      '情境：林要向大家介绍朋友 Mia。先找出两个人的名字，再读表示年龄和友谊的句子。',
      "This is my friend ... 表示“这是我的朋友……”；正文用 She's nine too. 告诉我们她也九岁。She's = She is，He's = He is。不要只根据名字猜人物称呼。",
      'We are good friends. 表示“我们是好朋友”。read and play together 是一起阅读和玩耍；We 表示我们，所以这里用 are。',
      '朋友卡写三句：介绍自己、介绍朋友、说明你们的关系。可以使用虚构名字。写完检查句首大写和句末标点，再读给家人听。',
    ],
    body: "Hello! I'm Lin. I'm nine. This is my friend Mia. She's nine too. We read and play together. We are good friends.",
    speakable: true,
    project: {
      title: '我的朋友卡',
      checklist: ['我介绍了自己。', '我介绍了一位朋友（可以用虚构名字）。', '我说明了我们的关系，并读了一遍检查句首大写和句末标点。'],
      prompt: '参照正文写三句话：介绍自己、介绍朋友，再说说你们是朋友。',
      placeholder: "Hello! I'm ...\nThis is my friend ...\nWe are friends.",
    },
    questions: [
      {
        id: 'en-g3a-u1-friend-card-q1',
        type: 'fill-blank',
        prompt: "请补全朋友的年龄：______ nine too.（填写 She's 或 He's）",
        correctAnswer: "She's",
        explanation: "正文直接写了 She's nine too，所以填 She's。再试时回到描述 Mia 的那一句，不根据名字猜称呼。",
        points: 10,
      },
      {
        id: 'en-g3a-u1-friend-card-q2',
        type: 'fill-blank',
        prompt: '请补全句子：We are good ______.（只填一个英文单词）',
        correctAnswer: 'friends',
        explanation: 'We are good friends 表示“我们是好朋友”。再试时注意主语 We 对应复数 friends。',
        points: 10,
      },
      {
        id: 'en-g3a-u1-friend-card-q3',
        type: 'choice',
        prompt: '哪组句子适合写在朋友卡上？',
        options: [
          "I'm Lin. This is my friend Mia. We are friends.",
          'Open the door. Sit down. Goodbye.',
          'One, two, three. It is red.',
          'The dog is brown. It is under a tree.',
        ],
        correctAnswer: "I'm Lin. This is my friend Mia. We are friends.",
        explanation: '朋友卡需要介绍自己、朋友和两人的关系。再试时逐句检查这三个信息。',
        points: 10,
      },
    ],
  },
  {
    id: 'en-park-animals',
    title: '认识公园里的动物',
    readAloudText: 'cat. dog. bird. rabbit.',
    summary: '认识 cat、dog、bird 和 rabbit 四个动物单词。',
    studyGuide: [
      '先把四个英文单词和中文意思对应起来，再用纸画出你喜欢的一种动物并写上英文。',
      '遮住中文，试着认出英文；再遮住英文，尝试写出 dog。写错时对照原词逐个字母检查。',
    ],
    body: 'cat 是猫，dog 是狗，bird 是小鸟，rabbit 是兔子。\n\n观察单词的拼写，读一读，再把英文单词和动物对应起来。',
    questions: [
      {
        id: 'en-park-animals-q1',
        type: 'choice',
        prompt: '听到的动物是哪一种？',
        listeningText: 'rabbit',
        options: ['猫', '狗', '小鸟', '兔子'],
        correctAnswer: '兔子',
        explanation: 'rabbit 的中文意思是“兔子”。再试时，可以回到正文寻找 rabbit 后面的中文解释。',
        points: 10,
      },
      {
        id: 'en-park-animals-q2',
        type: 'choice',
        prompt: 'bird 的中文意思是什么？',
        options: ['兔子', '小鸟', '猫', '狗'],
        correctAnswer: '小鸟',
        explanation: 'bird 的中文意思是“小鸟”。再试时，可以回到正文逐个对应四个动物单词。',
        points: 10,
      },
      {
        id: 'en-park-animals-q3',
        type: 'fill-blank',
        prompt: '“狗”的英文单词是______。（只填一个英文单词）',
        correctAnswer: 'dog',
        explanation: 'dog 的中文意思是“狗”。再试时，注意正文中 dog 和“狗”是一组对应词。',
        points: 10,
      },
    ],
  },
  {
    id: 'en-park-sentences',
    title: '用句子说说动物',
    readAloudText: 'I can see a dog. The dog is brown.',
    summary: '学习 I can see... 和 The...is... 两个句型。',
    studyGuide: [
      '先复习动物词 cat、dog、bird、rabbit。brown 是棕色，white 是白色，yellow 是黄色。',
      'I can see a dog. 先告诉别人看见了什么；The dog is brown. 再补充这只动物的颜色。两句话可以描述同一只动物。',
      '在纸上画一只棕色的狗，说出这两句话；换成一只小鸟，再试着更换句子里的动物词。',
    ],
    body: 'I can see a dog. 的意思是“我能看见一只狗”。The dog is brown. 的意思是“这只狗是棕色的”。\n\n本课的 cat、dog、bird、rabbit 都以辅音音素开头。表示“一只”时，可以说 a cat、a dog、a bird、a rabbit。',
    questions: [
      {
        id: 'en-park-sentences-q1',
        type: 'choice',
        prompt: '哪句话表示“我能看见一只小鸟”？',
        options: [
          'I can see a bird.',
          'I can see a dog.',
          'The bird is brown.',
          'The dog is yellow.',
        ],
        correctAnswer: 'I can see a bird.',
        explanation: 'I can see 表示“我能看见”，a bird 表示“一只小鸟”。再试时，先找 I can see，再确认动物词是 bird。',
        points: 10,
      },
      {
        id: 'en-park-sentences-q2',
        type: 'fill-blank',
        prompt: '请补全句子：The dog ______ brown.（只填一个英文单词）',
        correctAnswer: 'is',
        explanation: 'The dog is brown. 表示“这只狗是棕色的”，缺少的词是 is。再试时，可以回看正文中的完整句子。',
        points: 10,
      },
      {
        id: 'en-park-sentences-q3',
        type: 'choice',
        prompt: '哪句话表示“这只狗是棕色的”？',
        options: [
          'The dog is brown.',
          'I can see a brown bird.',
          'The rabbit is white.',
          'I can see a dog.',
        ],
        correctAnswer: 'The dog is brown.',
        explanation: 'The dog 指“这只狗”，is brown 指“是棕色的”。再试时，按“动物 + is + 颜色”的顺序检查句子。',
        points: 10,
      },
    ],
  },
  {
    id: 'en-park-listen-read',
    title: '听读公园里的动物',
    summary: '点击朗读，边听边读一段公园见闻。',
    studyGuide: [
      '阅读任务：找到狗的位置、兔子的颜色和小鸟的特点。正文可以一直看，不需要一次记住整段。',
      'at the park 是在公园；under a tree 是在树下；near the flowers 是在花朵附近；quiet 是安静，small 是小，like ... best 是最喜欢。',
      '先听读一遍，再找到 dog、rabbit、bird 所在的句子。回答时回到对应句找证据；最后试着用一句英文描述自己画的动物。',
    ],
    body: 'Today I am at the park. I can see a brown dog under a tree. A white rabbit is near the flowers. The bird is yellow and small. The animals are quiet. I like the little rabbit best.',
    speakable: true,
    questions: [
      {
        id: 'en-park-listen-read-q1',
        type: 'choice',
        prompt: 'Where is the dog?（狗在哪里？）',
        options: ['Under a tree.', 'Near the flowers.', 'At home.', 'In the water.'],
        correctAnswer: 'Under a tree.',
        explanation: '正文说 a brown dog under a tree，所以狗在树下。再试时，找到 dog 后面的地点短语。',
        points: 10,
      },
      {
        id: 'en-park-listen-read-q2',
        type: 'choice',
        prompt: 'What colour is the rabbit?（兔子是什么颜色？）',
        options: ['Brown.', 'Yellow.', 'White.', 'Black.'],
        correctAnswer: 'White.',
        explanation: '正文中的 A white rabbit 说明兔子是白色的。再试时，寻找 rabbit 前面的颜色词。',
        points: 10,
      },
      {
        id: 'en-park-listen-read-q3',
        type: 'fill-blank',
        prompt: '请补全正文：The bird is yellow and ______.（只填一个英文单词）',
        correctAnswer: 'small',
        explanation: '正文写着 The bird is yellow and small，缺少的词是 small。再试时，回到正文找到描述 bird 的两个词。',
        points: 10,
      },
    ],
  },
  ...englishUpperLessons,
  ...englishG3Lessons,
  ...englishShortWordLessons,
  ...englishNoticeChangeLessons,
  ...englishG6ReflectLessons,
  ...englishG5HabitsLessons,
  ...englishG4WeatherLessons,
  ...englishG3RoutineLessons,
  ...englishG6OpinionsLessons,
  ...englishShortVowelILessons,
  ...englishShortVowelOLessons,
  ...englishG5LongListeningLessons,
  ...englishG4CommunityLessons,
] satisfies LanguageLesson[];

export { englishUnits, englishLessonIds } from './languageCatalog';
