import type { LanguageLesson } from '@/lib/types';

export const englishLessons = [
  {
    id: 'en-g3a-u1-meet',
    title: '认识新朋友',
    summary: '用问候、自我介绍和年龄信息认识一位新朋友。',
    body: "Hello! I'm Lin. I'm nine. This is my friend Ben. He's nine too. We meet at school. We smile and say, 'Nice to meet you!'",
    speakable: true,
    questions: [
      {
        id: 'en-g3a-u1-meet-q1',
        type: 'choice',
        prompt: '哪句话可以用来介绍自己？',
        options: ["I'm Lin.", "He's Ben.", 'Nice to meet you!', 'This is my friend.'],
        correctAnswer: "I'm Lin.",
        explanation: "I'm 加名字可以介绍自己。再试时先找主语 I，再找表示“是”的 am。",
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
    body: "A new classmate drops a pencil. Lin says, 'Let's help.' Ben picks it up and says, 'Here you are.' The classmate says, 'Thank you!' Then Lin asks, 'Let's play together.' Everyone says, 'Great!'",
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
    summary: '用姓名、年龄和友谊句完成一张原创朋友卡。',
    body: "Hello! I'm Lin. I'm nine. This is my friend Mia. She's nine too. We read and play together. We are good friends.",
    speakable: true,
    project: {
      title: '我的朋友卡',
      prompt: '参照正文写三句话：介绍自己、介绍朋友，再说说你们是朋友。',
      placeholder: "Hello! I'm ...\nThis is my friend ...\nWe are friends.",
    },
    questions: [
      {
        id: 'en-g3a-u1-friend-card-q1',
        type: 'fill-blank',
        prompt: "请补全朋友的年龄：______ nine too.（填写 She's 或 He's）",
        correctAnswer: "She's",
        explanation: "正文中的朋友 Mia 是女孩，所以用 She's。再试时先确认人物，再选择 He 或 She。",
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
    summary: '认识 cat、dog、bird 和 rabbit 四个动物单词。',
    body: 'cat 是猫，dog 是狗，bird 是小鸟，rabbit 是兔子。\n\n观察单词的拼写，读一读，再把英文单词和动物对应起来。',
    questions: [
      {
        id: 'en-park-animals-q1',
        type: 'choice',
        prompt: 'rabbit 的中文意思是什么？',
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
    summary: '学习 I can see... 和 The...is... 两个句型。',
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
    body: 'Today I am at the park. I can see a brown dog under a tree. A white rabbit is near the flowers. The bird is yellow and small. The animals are quiet. I like the little rabbit best.',
    speakable: true,
    questions: [
      {
        id: 'en-park-listen-read-q1',
        type: 'choice',
        prompt: 'Where is the dog?',
        options: ['Under a tree.', 'Near the flowers.', 'At home.', 'In the water.'],
        correctAnswer: 'Under a tree.',
        explanation: '正文说 a brown dog under a tree，所以狗在树下。再试时，找到 dog 后面的地点短语。',
        points: 10,
      },
      {
        id: 'en-park-listen-read-q2',
        type: 'choice',
        prompt: 'What color is the rabbit?',
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
] satisfies LanguageLesson[];

export const englishLessonIds = englishLessons.map((lesson) => lesson.id);

export const englishUnits = [
  {
    id: 'g3a-u1-friends',
    grade: 3,
    semester: '上册',
    unit: 1,
    title: "Let's be friends!",
    summary: '外研社《英语（新标准）》2022课标新修订版三年级上册 Unit 1。',
    lessonIds: ['en-g3a-u1-meet', 'en-g3a-u1-help', 'en-g3a-u1-friend-card'],
  },
  {
    id: 'g3b-u1-animals',
    grade: 3,
    semester: '下册',
    unit: 1,
    title: 'Animal friends',
    summary: '原“公园里的动物”三课保留为三年级下册 Unit 1 的预备内容。',
    lessonIds: ['en-park-animals', 'en-park-sentences', 'en-park-listen-read'],
  },
] satisfies Array<{
  id: string;
  grade: 3 | 4 | 5 | 6;
  semester: '上册' | '下册';
  unit: number;
  title: string;
  summary: string;
  lessonIds: string[];
}>;
