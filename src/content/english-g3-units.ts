import type { LanguageLesson } from '@/lib/types';

// 主题对应的新原创练习，非教材全文；来源边界见 languageCatalog.ts。
export const englishG3Lessons = [
  {
    "id": "en-g3a-u2-things",
    "title": "认识学习用品",
    "summary": "认识常见学习用品，用简短问答介绍物品。",
    "studyGuide": [
      "这是学习用品主题的原创对话。Lin和Ben是虚构人物，冒号前的名字说明谁在说话。先读词义，再听英文正文，不需要准备实物。",
      "物品词：pen是用墨水的笔；pencil是铅笔；ruler是尺子；eraser是橡皮；book是书；bag是包。school things表示学习用品，先把中文与英文对应起来。",
      "What's this?是‘这是什么？’，What's = What is；It's ...是‘它是……’，It's = It is。And this?是接着问‘这个呢？’，and在这里连接前后的提问。",
      "正文用a ruler表示一把尺子，an eraser表示一块橡皮。a/an要看后一个词开头的实际发音；这里先跟着完整词组读，不把字母名称当作词里的发音。",
      "Here you are是‘给你’，Thank you是‘谢谢’。自己一个人也可以轮流读两个人的话。听辨会介绍一个新物品，请根据新录音回答，不直接记正文的尺子或橡皮。"
    ],
    "body": "Lin: What's this?\n\nBen: It's a ruler.\n\nLin: And this?\n\nBen: It's an eraser.\n\nLin: Here you are.\n\nBen: Thank you!",
    "speakable": true,
    "questions": [
      {
        "id": "en-g3a-u2-things-q1",
        "type": "choice",
        "prompt": "听一段新介绍：这次录音介绍了什么物品？",
        "listeningText": "It's a pencil.",
        "options": [
          "尺子",
          "铅笔",
          "橡皮"
        ],
        "correctAnswer": "铅笔",
        "explanation": "新录音是It's a pencil，pencil表示铅笔。这次物品与正文不同，要听It's a后面的名称。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-things-q2",
        "type": "choice",
        "prompt": "回到正文，Ben第二次介绍的物品是什么？",
        "options": [
          "尺子",
          "书",
          "橡皮"
        ],
        "correctAnswer": "橡皮",
        "explanation": "Ben第一次说It's a ruler，第二次说It's an eraser。eraser是橡皮，按对话顺序找到第二次回答再选择。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-things-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全‘它是一块橡皮’：It's an ______.（只填一个英文单词）",
        "correctAnswer": "eraser",
        "explanation": "正文中的橡皮是eraser，完整词组为an eraser。回到Ben第二次回答，逐个字母核对这个词。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g3a-u2-bag",
    "title": "书包里的小发现",
    "summary": "看清物品与位置，理解问答，并观察例词里的共同字母。",
    "studyGuide": [
      "先读物品词，再听正文。bag是包，book是书，pen是用墨水的笔，ruler是尺子，eraser是橡皮，cat是猫。cat只出现在末尾词对中，不表示正文书包里装着猫。",
      "my是我的，your是你的，in表示在……里面，too表示也。My book is in my bag是‘我的书在我的包里’；后面一句用pen替换book。",
      "Is this your bag?表示‘这是你的包吗？’；Yes, it is.表示‘是的’；No, it isn't.表示‘不，不是’，isn't = is not。it指正在谈论的包。Thank you表示谢谢；Here you are表示给你，是递物用语。",
      "正文末尾的Word pair表示‘词对’，bag和cat是两个完整单词。听它们，再看拼写，留意共同字母a；这里的a有相似声音，不等于a在所有词里都这样发音。可以在纸上记下字母，不需要网页圈选。",
      "听辨会换成另一位同学包里的物品，按新录音作答。末题只检查你是否认出共同字母，不是对发音正确性的评分。"
    ],
    "body": "Ben: My book is in my bag. My pen is in my bag too.\n\nLin: Is this your bag?\n\nBen: Yes, it is. Thank you!\n\nWord pair: bag, cat.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g3a-u2-bag-q1",
        "type": "choice",
        "prompt": "听另一位同学的新介绍：这次包里提到了什么？",
        "listeningText": "My ruler is in my bag.",
        "options": [
          "尺子",
          "书",
          "橡皮"
        ],
        "correctAnswer": "尺子",
        "explanation": "新录音说My ruler is in my bag，表示尺子在包里。ruler是这次要听清的物品，不能用Ben正文里的书或笔代替。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-bag-q2",
        "type": "choice",
        "prompt": "根据正文，Ben怎样回答‘这是你的包吗’？",
        "options": [
          "No, it isn't.",
          "Here you are.",
          "Yes, it is."
        ],
        "correctAnswer": "Yes, it is.",
        "explanation": "正文Ben回答Yes, it is，表示肯定这个包是自己的。No, it isn't表示否定，Here you are是递物时说‘给你’，不是这次确认的答案。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-bag-q3",
        "type": "choice",
        "prompt": "字形观察：bag和cat都包含哪个小写字母？",
        "options": [
          "e",
          "a",
          "o"
        ],
        "correctAnswer": "a",
        "explanation": "bag的字母是b、a、g，cat的字母是c、a、t，共同的是a。本题只验证共同字母识别；完整词的声音还要继续听读，不能据此认定发音已经正确。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g3a-u2-care-card",
    "title": "我的学习用品卡",
    "summary": "介绍两件物品和存放位置，用一句话表达保管习惯。",
    "studyGuide": [
      "下面是一张原创示例卡。先找介绍了哪两件物品，再找其中一件放在哪里。可以扮演虚构人物，不需要真实姓名、物品照片或实际整理。",
      "物品词：book书；pencil铅笔；pen用墨水的笔；ruler尺子；eraser橡皮；bag包；pencil case笔袋。pencil case是两个词合起来表示一种物品，不是两件物品。",
      "This is my ...表示‘这是我的……’；my表示我的；My pencil is in my pencil case表示铅笔在我的笔袋里，in是在……里面。按‘物品 + is in + 容器’理解位置。",
      "I keep my things safe表示‘我妥善保管自己的物品’。I是我，keep是保管，things是物品，safe在这里表示让物品处于安全、妥善的状态。这是习惯陈述，不是对别人发出提醒。",
      "写三到四句左右，介绍两件物品、一个位置和一句保管习惯。模板是起步提示，可以换词；同一个物品前后要一致。写完自己读一遍再勾自检，不等于系统自动评价语法。"
    ],
    "body": "This is my book. This is my pencil. My pencil is in my pencil case. I keep my things safe.",
    "speakable": true,
    "project": {
      "title": "我的学习用品介绍卡",
      "prompt": "写三到四句左右，介绍两件物品，写清其中一件放在哪里，再加一句保管习惯。可以用虚构人物的口吻，无需真实姓名或照片。",
      "placeholder": "This is my ... .\nThis is my ... .\nMy ... is in my ... .\nI keep my things safe.",
      "checklist": [
        "我介绍了两件物品，英文名称与我想表达的中文相符。",
        "我用in写清了一件物品的位置，前后谈论的是同一件物品。",
        "我写了一句保管习惯，并读过句子、检查大写与标点。"
      ]
    },
    "questions": [
      {
        "id": "en-g3a-u2-care-card-q1",
        "type": "choice",
        "prompt": "听另一张介绍卡：这次笔袋里提到的是哪件物品？",
        "listeningText": "My eraser is in my pencil case.",
        "options": [
          "铅笔",
          "橡皮",
          "尺子"
        ],
        "correctAnswer": "橡皮",
        "explanation": "新录音中的物品是eraser橡皮，位置是pencil case笔袋。正文放的是铅笔，但新介绍已经换了物品。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-care-card-q2",
        "type": "choice",
        "prompt": "回到正文，示例卡中的铅笔放在哪里？",
        "options": [
          "pencil case",
          "bag",
          "book"
        ],
        "correctAnswer": "pencil case",
        "explanation": "My pencil is in my pencil case明确说明铅笔在笔袋里。先找到pencil，再读in后面的容器名称。",
        "points": 10
      },
      {
        "id": "en-g3a-u2-care-card-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全保管习惯：I keep my things ______.（只填一个英文单词）",
        "correctAnswer": "safe",
        "explanation": "正文最后一句是I keep my things safe，表示我妥善保管自己的物品。safe是原词，这句话陈述一种习惯，不是向别人发出的命令。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g3a-u3-colours",
    "title": "听清颜色词",
    "summary": "把颜色和物品对应起来，听懂不同人物的颜色描述。",
    "studyGuide": [
      "这是多彩世界主题的原创对话。Lin和Ben是虚构人物。先看词义，再听正文；只阅读颜色文字也能学习，不需要辨认屏幕色块。",
      "颜色词：red红色；blue蓝色；yellow黄色；green绿色。colour是颜色，colourful是多彩的。先把每个词和中文对应，不用立即背整套颜色表。",
      "物品词：bag包，book书。my是我的，your是你的。What colour is your bag?问‘你的包是什么颜色？’；It's blue表示‘它是蓝色的’，It's = It is。",
      "My bag is red与My book is yellow分别描述包和书。不要只记颜色，还要记是谁的、哪件物品；可在纸上写‘人物—物品—颜色’帮助自己。",
      "听辨会介绍另一位同学的包，颜色不一定与正文相同。阅读题才回到Lin和Ben的对话找依据，不用自己喜欢的颜色代替人物信息。"
    ],
    "body": "Lin: What colour is your bag?\n\nBen: It's blue.\n\nLin: My bag is red. My book is yellow.\n\nBen: My book is green.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g3a-u3-colours-q1",
        "type": "choice",
        "prompt": "听另一位同学的新介绍：这位同学的包是什么颜色？",
        "listeningText": "My bag is yellow.",
        "options": [
          "红色",
          "蓝色",
          "黄色"
        ],
        "correctAnswer": "黄色",
        "explanation": "新录音说My bag is yellow，yellow是黄色。这次不是Lin或Ben的包，要根据新录音回答。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-colours-q2",
        "type": "choice",
        "prompt": "根据正文，Ben的书是什么颜色？",
        "options": [
          "green",
          "blue",
          "red"
        ],
        "correctAnswer": "green",
        "explanation": "Ben最后说My book is green。blue描述的是Ben的包，red描述的是Lin的包，物品和人物都要核对。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-colours-q3",
        "type": "fill-blank",
        "prompt": "按Lin的正文原词补全包的颜色：My bag is ______.（只填一个英文单词）",
        "correctAnswer": "red",
        "explanation": "正文Lin说My bag is red，表示自己的包是红色。题目指定Lin和bag，不能填Ben的颜色或书的颜色。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g3a-u3-find",
    "title": "用颜色找对物品",
    "summary": "听清颜色与肯定、否定回答，观察例词中的共同字母。",
    "studyGuide": [
      "先读颜色词和物品词，再听两人确认物品的对话。red红色，green绿色，yellow黄色，blue蓝色；pen是用墨水的笔，pencil是铅笔。",
      "my是我的，your是你的，this是这。Is this your red pen?问‘这是你的红笔吗？’；red pen中，颜色red放在物品pen前面。",
      "No, it isn't表示‘不，不是’，isn't = is not；Yes, it is表示‘是的’。My pen is green表示我的笔是绿色的。Is this green pen your pen?是在确认‘这支绿笔是你的笔吗？’；Thank you表示谢谢。",
      "末尾Word pair表示词对。red和pen是两个完整单词，可以随正文听，再看拼写中的共同字母e；这两个词里的e有相似声音，不等于所有e都这样发音。不要把字母名称E当作这里的词内声音。",
      "新听辨会换一位同学，录音颜色可能不同。末题只检查共同字母的字形识别，不是对发音的评分；自己可以在纸上写下共同字母。"
    ],
    "body": "Lin: Is this your red pen?\n\nBen: No, it isn't. My pen is green.\n\nLin: Is this green pen your pen?\n\nBen: Yes, it is. Thank you!\n\nWord pair: red, pen.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g3a-u3-find-q1",
        "type": "choice",
        "prompt": "听另一位同学的新说明：这位同学的笔是什么颜色？",
        "listeningText": "My pen is blue. It isn't red.",
        "options": [
          "green",
          "blue",
          "red"
        ],
        "correctAnswer": "blue",
        "explanation": "新录音先说My pen is blue，又说It isn't red，表示笔是蓝色，不是红色。正文Ben的green不能代替这次录音的信息。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-find-q2",
        "type": "choice",
        "prompt": "回到正文，Ben的笔是什么颜色？",
        "options": [
          "red",
          "yellow",
          "green"
        ],
        "correctAnswer": "green",
        "explanation": "Ben先否认红笔是自己的，再说My pen is green，最后确认绿笔。连着看否定和肯定回答，能找到一致的颜色信息。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-find-q3",
        "type": "choice",
        "prompt": "字形观察：red和pen都包含哪个小写字母？",
        "options": [
          "e",
          "a",
          "u"
        ],
        "correctAnswer": "e",
        "explanation": "red的字母是r、e、d，pen的字母是p、e、n，共同的是e。本题只验证字形识别，声音还要继续听完整词，不能据此认定发音已经达标。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g3a-u3-picture-card",
    "title": "写我的多彩小卡",
    "summary": "用短句描述一幅想象画面，让物品和颜色前后一致。",
    "studyGuide": [
      "这是原创的想象画面。只读下面的文字就能开始，作品也可以只写文字，不需要画图、上传图片或购买材料。",
      "物品词：picture图画，ball球，kite风筝，bag包。颜色词：red红色，blue蓝色，green绿色，yellow黄色；colourful表示多彩的。",
      "This is my picture表示‘这是我的图画’；The ball is red表示‘这个球是红色的’。The在这里指画里谈到的物品，is后面接颜色。换物品和颜色时都要一起核对。",
      "I like my colourful picture表示‘我喜欢我的多彩图画’，I是我，like是喜欢，my是我的。自己的想象画面可以有不同颜色，不需要照搬示例。",
      "新听辨描述另一幅画，先听清问的是球还是风筝，再找它的颜色。作品写三到四句左右，至少介绍两个物品及颜色；写完检查同一物品前后是否矛盾，再做自检。"
    ],
    "body": "This is my picture. The ball is red. The kite is blue. The bag is green. I like my colourful picture.",
    "speakable": true,
    "project": {
      "title": "我的多彩画面卡",
      "prompt": "用三到四句左右介绍一幅想象画面，至少描述两个物品和各自的颜色。可以用ball、kite、bag，只写文字也能完成，不需要图片或真实姓名。",
      "placeholder": "This is my picture.\nThe ... is ... .\nThe ... is ... .\nI like my colourful picture.",
      "checklist": [
        "我至少描述了两个物品，分别写清了它们的颜色。",
        "我检查了颜色词与物品的对应，同一物品前后没有矛盾。",
        "我读过自己的英文，检查了句首大写、物品词和句末标点。"
      ]
    },
    "questions": [
      {
        "id": "en-g3a-u3-picture-card-q1",
        "type": "choice",
        "prompt": "听另一幅画的新描述：这幅画里的风筝是什么颜色？",
        "listeningText": "The kite is yellow. The ball is blue.",
        "options": [
          "blue",
          "yellow",
          "red"
        ],
        "correctAnswer": "yellow",
        "explanation": "新录音说The kite is yellow，风筝是黄色；blue描述球。题目问风筝，不能只选最后听到的颜色，也不能套用原正文的蓝风筝。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-picture-card-q2",
        "type": "choice",
        "prompt": "根据正文原示例，哪个物品是绿色的？",
        "options": [
          "ball",
          "kite",
          "bag"
        ],
        "correctAnswer": "bag",
        "explanation": "正文说The bag is green，所以绿色的是包。ball是红色，kite是蓝色，逐句配对能避免混淆。",
        "points": 10
      },
      {
        "id": "en-g3a-u3-picture-card-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全：I like my colourful ______.（只填一个英文单词）",
        "correctAnswer": "picture",
        "explanation": "最后一句是I like my colourful picture，表示喜欢自己的多彩图画。picture是整幅图画，ball、kite、bag是其中的物品。",
        "points": 10
      }
    ]
  }
] satisfies LanguageLesson[];
