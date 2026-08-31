import type { LanguageLesson } from '@/lib/types';

export const englishLessons = [
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
