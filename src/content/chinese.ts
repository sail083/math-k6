import type { LanguageLesson } from '@/lib/types';

export const chineseLessons = [
  {
    id: 'zh-campus-words',
    title: '会观察，也会用词',
    summary: '认识观察、嫩芽、湿润，并分清“在”和“再”。',
    body: '观察，是有目的地仔细看，把看到的特点记下来。嫩芽是植物刚长出的幼小芽叶，常常颜色较浅、样子柔嫩。泥土含有一些水分、不干燥时，可以说它很湿润。\n\n“在”常表示地点或正在做什么，例如“我在花坛边观察”；“再”表示又一次或下一次，例如“明天我再来看看”。',
    questions: [
      {
        id: 'zh-campus-words-q1',
        type: 'choice',
        prompt: '刚长出的幼小芽叶叫______；有目的地仔细看叫______。',
        options: ['嫩芽；观察', '水珠；发现', '嫩芽；记录', '花坛；观察'],
        correctAnswer: '嫩芽；观察',
        explanation: '“嫩芽”指刚长出的幼小芽叶，“观察”指有目的地仔细看。再试时先辨认事物名称，再辨认动作名称。',
        points: 10,
      },
      {
        id: 'zh-campus-words-q2',
        type: 'fill-blank',
        prompt: '请用本课词语填空：雨后泥土里有水分，显得很______。（只填词语，不加标点）',
        correctAnswer: '湿润',
        explanation: '泥土含有较多水分时会显得“湿润”。再试时抓住“雨后”和“有水分”两个线索。',
        points: 10,
      },
      {
        id: 'zh-campus-words-q3',
        type: 'choice',
        prompt: '放学后，我______来观察。',
        options: ['在', '再'],
        correctAnswer: '再',
        explanation: '这里表示放学后又来一次，要用“再”。“在”通常表示地点或正在进行的动作。再试时先判断句子是在说地点，还是又做一次。',
        points: 10,
      },
    ],
  },
  {
    id: 'zh-campus-reading',
    title: '叶尖上的小水珠',
    summary: '按顺序读懂林一怎样观察、记录并保护嫩芽。',
    body: '清晨，雨刚停，花坛里的泥土还很湿润。林一走进校园，发现小树的枝头长出了几片嫩芽。嫩芽浅绿浅绿的，像刚张开的小手。\n\n他弯下腰仔细观察。一颗小水珠挂在叶尖上，风一吹，水珠便落进泥土里。林一想：嫩芽还要慢慢长大。于是，他没有伸手去摘，只把看到的样子写进观察卡。\n\n放学前，林一又来到花坛。他站在小路边，没有踩进花坛，只在卡上补了一句：“明天，我再来看看。”',
    questions: [
      {
        id: 'zh-campus-reading-q1',
        type: 'choice',
        prompt: '这篇短文主要写了什么？',
        options: [
          '林一雨后观察、记录并保护嫩芽',
          '林一在花坛里摘下了嫩芽',
          '林一只看见一颗小水珠',
          '林一放学后忘记了观察卡',
        ],
        correctAnswer: '林一雨后观察、记录并保护嫩芽',
        explanation: '短文从发现嫩芽写到仔细观察、记录和不踩花坛，主旨是“观察、记录并保护嫩芽”。再试时把开头、经过和结尾连起来看。',
        points: 10,
      },
      {
        id: 'zh-campus-reading-q2',
        type: 'choice',
        prompt: '林一做这些事的先后顺序是哪一项？',
        options: [
          '发现嫩芽→看见水珠→写进观察卡',
          '写进观察卡→发现嫩芽→看见水珠',
          '看见水珠→写进观察卡→发现嫩芽',
          '发现嫩芽→写进观察卡→看见水珠',
        ],
        correctAnswer: '发现嫩芽→看见水珠→写进观察卡',
        explanation: '第一段先写发现嫩芽，第二段再写看见水珠，随后写进观察卡。再试时按自然段寻找表示动作的词。',
        points: 10,
      },
      {
        id: 'zh-campus-reading-q3',
        type: 'fill-blank',
        prompt: '林一把看到的样子写进了什么？请填短文中的原词：______。（不加标点）',
        correctAnswer: '观察卡',
        explanation: '原文写“只把看到的样子写进观察卡”。再试时回到第二段，寻找“写进”后面的词。',
        points: 10,
      },
    ],
  },
  {
    id: 'zh-campus-speaking',
    title: '把小发现说清楚',
    summary: '用“时间—发现—行动”的顺序表达一次校园观察。',
    body: '把小发现说清楚，可以使用“时间—发现—行动”三个支架：先说什么时候，再说发现了什么，最后说自己做了什么。\n\n例如：“课间，我发现花坛里有嫩芽，就把样子画在观察卡上。”一句话里有时间、有发现，也有行动。',
    questions: [
      {
        id: 'zh-campus-speaking-q1',
        type: 'choice',
        prompt: '哪句话把时间、发现和行动都说清楚了？',
        options: [
          '课间，我发现花坛里有嫩芽，就把样子画在观察卡上。',
          '花坛里真好看。',
          '我画了一张画。',
          '嫩芽，课间，观察卡。',
        ],
        correctAnswer: '课间，我发现花坛里有嫩芽，就把样子画在观察卡上。',
        explanation: '完整句依次说出了时间“课间”、发现“有嫩芽”和行动“画在观察卡上”。再试时逐项检查三个支架。',
        points: 10,
      },
      {
        id: 'zh-campus-speaking-q2',
        type: 'fill-blank',
        prompt: '在“清晨，我发现叶尖上有水珠，就把它记在观察卡上”中，表示时间的词是______。（只填原词，不加标点）',
        correctAnswer: '清晨',
        explanation: '“清晨”是时间词，放在句首能先交代观察发生的时间。再试时找表示一天中时间的词。',
        points: 10,
      },
      {
        id: 'zh-campus-speaking-q3',
        type: 'choice',
        prompt: '按“时间—发现—行动”排列：①我把嫩芽的样子画在观察卡上。②课间，我走到花坛边。③我发现枝头长出了嫩芽。',
        options: ['①→②→③', '②→③→①', '③→①→②', '②→①→③'],
        correctAnswer: '②→③→①',
        explanation: '②交代时间和到达地点，③说明发现，①说明行动，所以顺序是②→③→①。再试时先给三句话分别贴上“时间、发现、行动”标签。',
        points: 10,
      },
    ],
  },
] satisfies LanguageLesson[];

export const chineseLessonIds = chineseLessons.map((lesson) => lesson.id);
