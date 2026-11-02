import type { LanguageLesson } from '@/lib/types';

// 原创练习；教材主题的证据边界见 languageCatalog.ts。
export const englishUpperLessons = [
  {
    "id": "en-g4-sports-abilities",
    "title": "我会什么，还想练什么",
    "summary": "听清can和can't，表达会做的事和想学的事。",
    "studyGuide": [
      "这是原创运动对话。Lin和Ben是虚构人物，冒号前的名字告诉你谁在说话。先听正文，再分别找两人会做和暂时不会做的事。",
      "词块：play table tennis 打乒乓球；swim 游泳；play basketball 打篮球；run 跑。可以只听、读和想象，不需要实际运动。",
      "I can ... 是‘我会……’；I can't ... 是‘我不会……’，can't = cannot。yet放在这里表示‘还’；先听出can还是can't，再找后面的动作。",
      "Let's learn together. 是‘我们一起学吧’：Let's表示邀请，learn是学，together是一起。Good idea! 是‘好主意！’。",
      "听辨题会播放另一位同学的新介绍，信息可能与正文不同。按刚听到的话选择，再用I can ...或I want to learn ...介绍自己或虚构人物。want to learn表示想学，不需要说明真实身体情况。"
    ],
    "body": "Lin: I can play table tennis. I can't swim yet.\n\nBen: I can swim. I can't play table tennis yet.\n\nLin: Let's learn together.\n\nBen: Good idea!",
    "speakable": true,
    "questions": [
      {
        "id": "en-g4-sports-abilities-q1",
        "type": "choice",
        "prompt": "听另一位同学的新介绍：这位同学会做哪件事？",
        "listeningText": "I can run. I can't swim yet.",
        "options": [
          "游泳",
          "跑步",
          "跑步和游泳都会"
        ],
        "correctAnswer": "跑步",
        "explanation": "新录音说I can run，表示会跑步；I can't swim yet表示还不会游泳。先听can或can't，再对应动作，不能用正文里Lin或Ben的信息代替。",
        "points": 10
      },
      {
        "id": "en-g4-sports-abilities-q2",
        "type": "choice",
        "prompt": "回到正文，谁说自己会游泳？",
        "options": [
          "Lin",
          "Lin和Ben都说了",
          "Ben"
        ],
        "correctAnswer": "Ben",
        "explanation": "正文Ben说I can swim；Lin说I can't swim yet。注意can和can't的意思相反。",
        "points": 10
      },
      {
        "id": "en-g4-sports-abilities-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全邀请：Let's ______ together.（只填一个英文单词）",
        "correctAnswer": "learn",
        "explanation": "正文是Let's learn together，表示我们一起学吧。回到Lin的邀请，找出表示‘学’的词learn。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g4-sports-invitation",
    "title": "一起选一种活动",
    "summary": "对照时间、活动和参与方式，读懂一次友好邀请。",
    "studyGuide": [
      "先读完整段，再在纸上记下today和tomorrow。today是今天，tomorrow是明天；after school是放学后。把‘今天做什么’和‘明天做什么’分开。",
      "活动词块：play basketball 打篮球；table tennis 乒乓球；a swimming race 一场游泳比赛；watch your race 观看你的比赛。swimming是游泳，race是比赛，watch是观看，your是你的。",
      "want to play 想玩；has 在这里表示有；can play 会打；too表示也；choose表示选择。Lin has a basketball是Lin有一个篮球，不是说Lin正在打篮球。",
      "Let's ... 是‘我们……吧’，用来邀请。I can watch ...是‘我可以观看……’。Great! 是‘太好了！’。and表示和，they表示他们，says表示说；人物后面的引号里是他或她说的话。",
      "读题时区分正文和新录音；新录音的活动和时间不一定一样。自己学习时可以轮流读两个角色，不要求找人陪练或真的出门。"
    ],
    "body": "Lin and Ben want to play after school. Lin has a basketball today. Ben can play basketball too. They choose basketball today.\n\nBen has a swimming race tomorrow. Lin says, \"Let's play basketball today. I can watch your race tomorrow.\" Ben says, \"Great!\"",
    "speakable": true,
    "questions": [
      {
        "id": "en-g4-sports-invitation-q1",
        "type": "choice",
        "prompt": "听一条新邀请：对方建议什么时候做什么？",
        "listeningText": "Let's play table tennis tomorrow.",
        "options": [
          "明天打乒乓球",
          "今天打乒乓球",
          "明天打篮球"
        ],
        "correctAnswer": "明天打乒乓球",
        "explanation": "新录音里的活动是play table tennis，时间是tomorrow，所以是明天打乒乓球。分别核对活动和时间，两个信息都要符合。",
        "points": 10
      },
      {
        "id": "en-g4-sports-invitation-q2",
        "type": "choice",
        "prompt": "根据正文，为什么两人今天选择篮球？",
        "options": [
          "Ben今天有游泳比赛",
          "Lin今天有篮球，而且Ben也会打",
          "Lin今天只能观看比赛"
        ],
        "correctAnswer": "Lin今天有篮球，而且Ben也会打",
        "explanation": "第一段先说明Lin今天有篮球，再说明Ben也会打，因此两人选了篮球。正文把游泳比赛安排在明天，没有说Lin只能观看。",
        "points": 10
      },
      {
        "id": "en-g4-sports-invitation-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全：I can ______ your race tomorrow.（只填一个英文单词）",
        "correctAnswer": "watch",
        "explanation": "正文里Lin说I can watch your race tomorrow，意思是明天可以观看你的比赛。表示观看的词是watch。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g4-sports-card",
    "title": "写一张活动邀请卡",
    "summary": "写清活动、时间和参与方式，给朋友一个友好邀请。",
    "studyGuide": [
      "下面是虚构邀请，不需要填写真实地点或发布活动。先找活动，再找星期，最后看朋友有哪些参与方式。",
      "词块：play table tennis 打乒乓球；on Saturday 在星期六；on Sunday 在星期日；on Friday 在星期五。先读三个星期词的中文意思，再听正文；听辨时不要只记正文的日期。",
      "I can play是‘我会打’；I want to learn more是‘我想多学一些’，learn是学，more是更多。You can play or watch是‘你可以参加或观看’，or表示或者，and连接前后的信息。",
      "We can have fun together表示‘我们可以一起享受乐趣’；We是我们，have fun是玩得开心，together是一起。用Let's ...邀请别人，再说明可以怎样参加。",
      "在作品里写四句左右。可以用虚构人物，也可以安排观看或谈论运动，不要求实际运动。写完按清单自检；这不是自动语法评分。"
    ],
    "body": "Let's play table tennis on Saturday. I can play, and I want to learn more. You can play or watch. We can have fun together.",
    "speakable": true,
    "project": {
      "title": "我的友好邀请卡",
      "prompt": "给虚构朋友写四句左右的邀请：说明活动和时间、自己能做的事，并给朋友一种参与选择。可以安排观看或谈论运动，不需要真实姓名或地点。",
      "placeholder": "Let's ... on ... .\nI can ... .\nYou can ... or ... .\nWe can ... together.",
      "checklist": [
        "我写清了活动和时间，可以使用虚构安排。",
        "我用can说明参与方式，并写出一句友好邀请。",
        "我读过自己的句子，检查了句首大写、活动词和句末标点。"
      ]
    },
    "questions": [
      {
        "id": "en-g4-sports-card-q1",
        "type": "choice",
        "prompt": "听另一张邀请卡：这次活动安排在哪天？",
        "listeningText": "Let's play table tennis on Sunday.",
        "options": [
          "星期六",
          "星期五",
          "星期日"
        ],
        "correctAnswer": "星期日",
        "explanation": "新录音说on Sunday，表示星期日。正文是Saturday，但这题问的是另一张邀请卡，要根据这次录音作答。",
        "points": 10
      },
      {
        "id": "en-g4-sports-card-q2",
        "type": "choice",
        "prompt": "正文里的邀请给朋友哪些选择？",
        "options": [
          "参加或观看",
          "必须参加比赛",
          "只能观看"
        ],
        "correctAnswer": "参加或观看",
        "explanation": "You can play or watch中的or给出了两种选择：参加或观看。邀请没有要求对方必须参加比赛。",
        "points": 10
      },
      {
        "id": "en-g4-sports-card-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全：We can have fun ______.（只填一个英文单词）",
        "correctAnswer": "together",
        "explanation": "正文最后一句是We can have fun together，together表示一起。把完整句子再读一遍，想想这句话怎样回应友好邀请。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g5-plate-food",
    "title": "餐盘里有什么",
    "summary": "听懂食物词，从两人的午餐描述中找出不同信息。",
    "studyGuide": [
      "这是围绕餐盘主题的原创对话。冒号前是说话人的名字。先读食物词的中文意思，再听英文正文，不把两个人的食物混在一起。",
      "食物词：rice 米饭；fish 鱼肉；vegetables 蔬菜；apple 苹果；noodles 面条；soup 汤；egg 鸡蛋。and表示和，把它前后的食物连起来；不需要实际准备食物。",
      "plate 餐盘；bowl 碗；lunch 午餐。What's on your plate?是‘你的餐盘里有什么？’，What's = What is，on表示在……上，your是你的。",
      "some表示一些；an apple是一个苹果；too表示也。I have ...表示我有……；There is some soup in my bowl表示我的碗里有一些汤，in表示在……里面，my是我的。Let's enjoy lunch表示我们享用午餐吧。",
      "听辨题是一份新的餐盘介绍，与正文食物不完全相同。先听清三种食物，再选对应组合，不要把自己喜欢吃什么当成答案。"
    ],
    "body": "Lin: What's on your plate, Ben?\n\nBen: Some rice, fish and vegetables. I have an apple too.\n\nLin: I have some noodles and vegetables. There is some soup in my bowl.\n\nBen: Let's enjoy lunch.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g5-plate-food-q1",
        "type": "choice",
        "prompt": "听一份新的餐盘介绍：录音提到了哪三种食物？",
        "listeningText": "I have some rice, an egg and vegetables.",
        "options": [
          "米饭、鱼肉、蔬菜",
          "米饭、鸡蛋、蔬菜",
          "面条、鸡蛋、蔬菜"
        ],
        "correctAnswer": "米饭、鸡蛋、蔬菜",
        "explanation": "新录音中的rice、egg、vegetables分别是米饭、鸡蛋、蔬菜。正文Ben吃鱼肉，但新录音换成了鸡蛋，要逐个核对。",
        "points": 10
      },
      {
        "id": "en-g5-plate-food-q2",
        "type": "choice",
        "prompt": "正文中，谁明确说自己的碗里有汤？",
        "options": [
          "Ben",
          "Lin和Ben都说了",
          "Lin"
        ],
        "correctAnswer": "Lin",
        "explanation": "Lin说There is some soup in my bowl，明确说明自己的碗里有汤。Ben的对话没有提供这一信息，不能自行补充。",
        "points": 10
      },
      {
        "id": "en-g5-plate-food-q3",
        "type": "fill-blank",
        "prompt": "按Ben的正文原词补全：I have an ______ too.（只填一个英文单词）",
        "correctAnswer": "apple",
        "explanation": "Ben在正文里说I have an apple too，表示也有一个苹果。这题问正文，不是听辨录音中的鸡蛋。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g5-plate-menu",
    "title": "读菜单，再表达选择",
    "summary": "对照两份菜单，理解人物选择和礼貌更换饮品。",
    "studyGuide": [
      "先读Menu A和Menu B，再读Lin和Ben的选择。menu是菜单，Menu A和Menu B分别是A、B两份菜单；today是今天，Today's lunch表示今天的午餐。",
      "食物复习：rice 米饭；fish 鱼肉；carrots 胡萝卜；noodles 面条；egg 鸡蛋；tomatoes 番茄；soup 汤；water 水；milk 牛奶。选项可能只差一种食物，要分别核对。",
      "has在这里表示有，both menus have soup表示两份菜单都有汤；two是二，and表示和。would like表示想要；Lin would like Menu B表示Lin想选B菜单。but表示但是，He在最后一句指Ben。",
      "does not want表示不想要；asks for water表示请求水；instead表示改选来代替。I would like ... instead of ...是‘我想要……来代替……’，先听清两样东西的顺序。",
      "正文人物可以调整饮品，但不会改变原菜单列了什么。听辨题会换一位新顾客，不根据Ben的选择替这位顾客作答。这是语言练习，不把某份菜单作为必须照吃的规定。"
    ],
    "body": "Today's lunch has two menus. Menu A has rice, fish and carrots. Menu B has noodles, an egg and tomatoes. Both menus have soup.\n\nLin would like Menu B. Ben would like Menu A, but he does not want soup today. He asks for water instead.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g5-plate-menu-q1",
        "type": "choice",
        "prompt": "听一位新顾客的请求：这位顾客最终想要什么？",
        "listeningText": "I would like soup instead of water today.",
        "options": [
          "汤",
          "水",
          "牛奶"
        ],
        "correctAnswer": "汤",
        "explanation": "新录音是soup instead of water，意思是想要汤来代替水。它与正文Ben的选择相反，听清instead of前后顺序很重要。",
        "points": 10
      },
      {
        "id": "en-g5-plate-menu-q2",
        "type": "choice",
        "prompt": "根据正文原菜单，哪一种是Menu A和Menu B都有的？",
        "options": [
          "rice",
          "fish",
          "soup"
        ],
        "correctAnswer": "soup",
        "explanation": "Both menus have soup直接告诉我们两份菜单都有汤。Ben后来改要水，不会改变原菜单共同包含汤这一信息。",
        "points": 10
      },
      {
        "id": "en-g5-plate-menu-q3",
        "type": "choice",
        "prompt": "正文中，Lin选择的Menu B包含哪组食物？",
        "options": [
          "米饭、鱼肉、胡萝卜",
          "面条、鸡蛋、番茄",
          "面条、鱼肉、胡萝卜"
        ],
        "correctAnswer": "面条、鸡蛋、番茄",
        "explanation": "Lin选择Menu B；第一段列出Menu B有noodles、an egg和tomatoes。先确定菜单，再核对其中的食物。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g5-plate-plan",
    "title": "写一张午餐选择卡",
    "summary": "说明菜单和饮品选择，写出一句礼貌请求。",
    "studyGuide": [
      "这是虚构的午餐选择卡。先看清示例的菜单：Menu A有rice米饭、fish鱼肉、carrots胡萝卜。可直接使用这个示例菜单，不需要买食材或提供真实饮食信息。",
      "would like表示想要，today是今天；It has ...表示它有……，这里It指前一句的Menu A。water是水，lunch是午餐，with my lunch是配我的午餐，and表示和。",
      "May I have ... , please? 是礼貌地请求‘请给我……好吗？’；some表示一些，please表示请。May I have some rice, please?也是同一句式，请自己替换食物练习。",
      "听辨可能用到的词：rice米饭、water水、apple苹果；Thank you是谢谢。听清真正请求的物品，不只听到please就作答。",
      "写四到五句左右，说明菜单、其中的食物、饮品与请求。也可以自拟虚构菜单，先把菜单食物写在草稿中，方便自己检查前后是否一致。"
    ],
    "body": "I would like Menu A today. It has rice, fish and carrots. I would like water with my lunch. May I have some water, please? Thank you.",
    "speakable": true,
    "project": {
      "title": "我的午餐选择卡",
      "prompt": "使用本课Menu A，或自己写明一份虚构菜单，再写四到五句左右：说明选择、菜单里的食物、饮品，并加一句礼貌请求。无需提供真实身体或饮食信息。",
      "placeholder": "I would like ... .\nIt has ... .\nI would like ... with my lunch.\nMay I have ... , please?\nThank you.",
      "checklist": [
        "我说明了菜单和其中的食物，前后信息一致。",
        "我写出了饮品选择，并使用了一句礼貌请求。",
        "我读了一遍，检查了食物单词、句首大写和句末标点。"
      ]
    },
    "questions": [
      {
        "id": "en-g5-plate-plan-q1",
        "type": "choice",
        "prompt": "听一条新的礼貌请求：对方想要什么？",
        "listeningText": "May I have an apple, please?",
        "options": [
          "一些米饭",
          "一些水",
          "一个苹果"
        ],
        "correctAnswer": "一个苹果",
        "explanation": "新录音中的an apple表示一个苹果。正文请求的是水，但这次换了物品；May I have ... , please?中间的词才是本题要听清的信息。",
        "points": 10
      },
      {
        "id": "en-g5-plate-plan-q2",
        "type": "choice",
        "prompt": "正文第二句It has rice, fish and carrots中的It指什么？",
        "options": [
          "Menu A",
          "water",
          "carrots"
        ],
        "correctAnswer": "Menu A",
        "explanation": "前一句刚介绍Menu A，后一句It has接着说明这份菜单里有什么，所以It指Menu A，不指饮品或某种食物。",
        "points": 10
      },
      {
        "id": "en-g5-plate-plan-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全礼貌请求：May I have some water, ______?（只填一个英文单词）",
        "correctAnswer": "please",
        "explanation": "正文用please让请求更礼貌。填入后再读整句，注意请求内容是water，please是表示‘请’的礼貌用语。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-money-choices",
    "title": "买、存与询价",
    "summary": "听懂价格问答，分清买了什么和存下多少。",
    "studyGuide": [
      "这是虚构的classroom game课堂游戏，不需要真实购物。先把物品与价格对应，再读Lin实际买了什么；不要把商店里出现的所有物品都算成她买过的。",
      "物品与人物：notebook笔记本；pencil铅笔，two pencils是两支铅笔；shopkeeper售货员；yuan元。数字：four四、six六、eight八、twelve十二、twenty二十。先核对数字意思，听录音时尤其分清six和eight。",
      "has在这里表示有；cost表示花费，Two pencils cost four yuan表示两支铅笔合计4元。How much is the notebook?用来问笔记本多少钱；It's ... yuan回答价格，It's = It is。",
      "buy/buys表示买；save/saves在这里表示存下。Lin buys ... and saves ...说的是她的选择；does not buy表示没有买；today是今天。for a classroom game表示用于课堂游戏；asks是问，says是说，She在末句指Lin。",
      "正文有20元、笔记本8元、存下12元。听辨换到另一家模拟商店，价格可能不同，只按新报价回答。最后用How much is ...?和It's ... yuan自己读一问一答。"
    ],
    "body": "Lin has twenty yuan for a classroom game. A notebook is eight yuan. Two pencils cost four yuan.\n\nLin asks, \"How much is the notebook?\" The shopkeeper says, \"It's eight yuan.\" Lin buys the notebook and saves twelve yuan. She does not buy the pencils today.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g6-money-choices-q1",
        "type": "choice",
        "prompt": "听另一家模拟商店的新报价：这家的笔记本多少钱？",
        "listeningText": "How much is the notebook? It's six yuan.",
        "options": [
          "eight yuan",
          "six yuan",
          "twelve yuan"
        ],
        "correctAnswer": "six yuan",
        "explanation": "新报价是It's six yuan，表示6元。正文那家商店是8元，本题明确换了商店，必须根据新录音回答。",
        "points": 10
      },
      {
        "id": "en-g6-money-choices-q2",
        "type": "choice",
        "prompt": "根据正文，Lin最后实际买了什么？",
        "options": [
          "笔记本",
          "两支铅笔",
          "笔记本和两支铅笔"
        ],
        "correctAnswer": "笔记本",
        "explanation": "正文说Lin buys the notebook，并明确说does not buy the pencils today。列出价格不等于已经购买，要找到实际选择的句子。",
        "points": 10
      },
      {
        "id": "en-g6-money-choices-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全：Lin buys the notebook and ______ twelve yuan.（只填一个英文单词）",
        "correctAnswer": "saves",
        "explanation": "正文是saves twelve yuan，表示存下12元。主语是Lin，原句用saves；别把表示买的buys填在存下的钱前面。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-money-reason",
    "title": "看清需要，再改计划",
    "summary": "从原因和转折理解人物改变计划，区分想要与当前需要。",
    "studyGuide": [
      "这是虚构商店游戏，不评价谁的零用钱多或谁喜欢玩具。先找Ben最初想买什么，再找他后来选了什么，最后回正文寻找改变计划的原因。",
      "物品与金额：toy car玩具车；two toy cars两辆玩具车；school bag书包；notebook笔记本；pencils铅笔；yuan元。thirty是三十，twenty是二十，six是六，twenty-four是二十四，ten是十。in a classroom shop game表示在课堂商店游戏中。",
      "want/wants表示想要，need表示需要。has表示有；checks表示检查；full表示满了，His notebook is full在这里是他的笔记本写满了；already表示已经，at home是在家。",
      "chooses表示选择；new表示新的；saves表示存下；still like表示仍然喜欢。I need ... for my writing today是‘我今天写作需要……’；drawing是画画；for在这些句子中说明用途。",
      "Then表示接着，but表示转折，and表示和，says表示说；I can think about the toy later是‘我可以以后再考虑玩具’，think about是考虑，later是以后。故事不是说喜欢玩具不对，而是说明这一次怎样选择。",
      "听辨会换成另一位同学的需要，按新录音里的物品和用途作答。阅读题才回到Ben的故事。自己复述时可用‘先想要……，后来发现……，所以选择……’检查逻辑。"
    ],
    "body": "Ben has thirty yuan in a classroom shop game. He wants a toy car for twenty yuan. Then he checks his school bag. His notebook is full, but he already has two toy cars at home.\n\nHe chooses a new notebook for six yuan and saves twenty-four yuan. \"I still like the toy car,\" he says, \"but I need a notebook for my writing today. I can think about the toy later.\"",
    "speakable": true,
    "questions": [
      {
        "id": "en-g6-money-reason-q1",
        "type": "choice",
        "prompt": "听另一位同学的新说明：这位同学今天需要什么？",
        "listeningText": "Today, I need two pencils for my drawing.",
        "options": [
          "一本笔记本",
          "一个玩具车",
          "两支铅笔"
        ],
        "correctAnswer": "两支铅笔",
        "explanation": "新录音说I need two pencils，表示需要两支铅笔；for my drawing说明用途是画画。正文Ben需要笔记本，但这题是另一位同学。",
        "points": 10
      },
      {
        "id": "en-g6-money-reason-q2",
        "type": "choice",
        "prompt": "哪项是正文中Ben改买笔记本的直接原因？",
        "options": [
          "旧笔记本写满，今天写作需要新的",
          "玩具车已经卖完",
          "他已经不喜欢玩具车"
        ],
        "correctAnswer": "旧笔记本写满，今天写作需要新的",
        "explanation": "正文说His notebook is full，又说I need a notebook for my writing today。这两处支持改买笔记本；他仍然喜欢玩具车，也没有说玩具卖完。",
        "points": 10
      },
      {
        "id": "en-g6-money-reason-q3",
        "type": "choice",
        "prompt": "根据正文，Ben买完笔记本后存下多少？",
        "options": [
          "20 yuan",
          "24 yuan",
          "10 yuan"
        ],
        "correctAnswer": "24 yuan",
        "explanation": "正文写saves twenty-four yuan，也可以用原有30元减去笔记本6元核对。20元是想买但没有买的玩具价格，不能当作已花费金额。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-money-plan",
    "title": "写一份有理由的小计划",
    "summary": "用will表达假想安排，说明理由，并核对金额和行动前的检查。",
    "studyGuide": [
      "下面只是一份pretend shop game假想商店游戏计划。可以使用虚构金额，不需要购物、捐赠或说明家庭收入。先找计划买什么、为什么，再找计划存多少。",
      "词块：have有；twenty yuan二十元；notebook笔记本；eight yuan八元；twelve yuan十二元；buy买；save存下；all全部；story故事；plan计划；price价格；colour颜色；shopkeeper售货员；name名字。",
      "I will ...表示我将会或打算……，will后接动作原形，例如will buy、will save。will not buy表示打算不买；I need it for a story表示我需要它来写故事，it指笔记本；because表示因为。",
      "I will check the price before I buy it表示购买前会核对价格：check是核对，before是在……之前。I have not bought anything yet表示我还没买任何东西，anything是任何东西，yet在这里表示还。This is my plan是‘这是我的计划’，today是今天。计划不等于已经完成的消费。",
      "新录音会提出另一种安排，可能选择全部存下；按录音区分‘以后打算’与‘已经发生’。不要把正文的8元和12元直接套进去。",
      "作品写五到六句左右：假想总额、具体安排、理由、存下的金额、行动前要核实什么。花费加存下的数额不能超过总额；可以全部存下。写完读一遍，再逐项自检，不用真实姓名。",
      "全部存下也可以：In this game, I have twenty yuan. I will save all twenty yuan because I do not need to buy anything today. I will count my money before I save it. This is my plan. 意思是：游戏里有20元；今天不需要购买，所以计划全部存下；存之前先数清钱。do not need是不需要，count my money是数一数我的钱，it在这里指这笔钱。这也是假想安排，不要求实际操作。"
    ],
    "body": "For this pretend shop game, I have twenty yuan. I will buy a notebook for eight yuan because I need it for a story. I will save twelve yuan.\n\nI will check the price before I buy it. This is my plan. I have not bought anything yet.",
    "speakable": true,
    "project": {
      "title": "我的假想零用钱计划",
      "prompt": "给假想商店游戏写五到六句左右的计划：说明总额、一个用途和理由、存下的金额，以及行动前要核实的一件事。可以全部存下，不要求实际购买或捐赠，不填写真实钱款和家庭信息。",
      "placeholder": "In this game, I have ... yuan.\nI will ... because ... .\nI will save ... yuan.\nBefore ..., I will ... .\nThis is my plan.",
      "checklist": [
        "我说明了这是假想计划，用will表达具体安排并给出理由。",
        "我核对了金额：花费加存下的金额不超过假想总额，也可以全部存下。",
        "我写出了行动前要核实的一件事，没有把计划说成已经买过的事实。"
      ]
    },
    "questions": [
      {
        "id": "en-g6-money-plan-q1",
        "type": "choice",
        "prompt": "听另一份新计划：这位同学打算怎样安排？",
        "listeningText": "I will save all twenty yuan. I will not buy anything today.",
        "options": [
          "计划花8元买笔记本、存12元",
          "已经花完20元",
          "计划存下全部20元，今天不买东西"
        ],
        "correctAnswer": "计划存下全部20元，今天不买东西",
        "explanation": "新录音用will save all twenty yuan说明打算存下全部20元；will not buy anything today表示今天不买东西。will说明计划，不是已经发生的结果。",
        "points": 10
      },
      {
        "id": "en-g6-money-plan-q2",
        "type": "choice",
        "prompt": "根据正文，购买前准备核实什么？",
        "options": [
          "price",
          "colour",
          "shopkeeper's name"
        ],
        "correctAnswer": "price",
        "explanation": "正文说I will check the price before I buy it，明确准备核实价格。colour是颜色，shopkeeper's name是售货员的名字，原文没有安排核实它们。",
        "points": 10
      },
      {
        "id": "en-g6-money-plan-q3",
        "type": "fill-blank",
        "prompt": "按正文原词补全：This is my ______.（只填一个英文单词）",
        "correctAnswer": "plan",
        "explanation": "正文写This is my plan，表示这是我的计划；下一句还说明尚未买任何东西。plan能提醒读者不要把将来安排当作已发生的事实。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g4-helping-ask",
    "title": "我能帮什么忙",
    "summary": "在原创合作情境中，把“我会做”变成请求，读懂肯定和否定回应。",
    "studyGuide": [
      "Lin和Ben是虚构角色。先读词义，再听英文正文。book是书，books是多本书；pen是用墨水的笔，pens是多支笔；pencil case是笔袋，bag是包，help是帮助。",
      "I can help是‘我可以帮忙’，I是我，can是能。Can you help?是‘你能帮忙吗？’，you是你。问句把Can放在前面；Yes, I can表示可以，No, I can't表示不可以，can't = cannot。",
      "put ... in ...表示把……放进……；put the books in the bag是把这些书放进这个包；the指当前谈论的物品。I can put the pens in the pencil case表示我可以把笔放进笔袋。Thank you表示谢谢。",
      "一个人能做一件事，也可能暂时不能做另一件事。先看他没有答应哪项，再看他提出了什么替代帮助；不根据一次can't判断他不愿帮助别人。正文没有解释不能放书的原因，不需要猜测身体情况。",
      "一个人也可以轮流读两人的话，不需要真的移动物品。听辨里是新的请求和回应，回应可能不同，请根据新录音回答。"
    ],
    "body": "Lin: Can you help?\n\nBen: Yes, I can.\n\nLin: Can you put the books in the bag?\n\nBen: No, I can't. I can put the pens in the pencil case.\n\nLin: Thank you!",
    "speakable": true,
    "questions": [
      {
        "id": "en-g4-helping-ask-q1",
        "type": "choice",
        "prompt": "听一段新对话：对方答应帮忙做哪件事？",
        "listeningText": "Can you put the books in the bag? Yes, I can.",
        "options": [
          "把笔放进笔袋",
          "把书放进包",
          "两件事都答应了"
        ],
        "correctAnswer": "把书放进包",
        "explanation": "新对话先问把书放进包，对方用Yes, I can答应这一请求。正文Ben对同样请求的回应不同，本题要根据新录音判断。",
        "points": 10
      },
      {
        "id": "en-g4-helping-ask-q2",
        "type": "choice",
        "prompt": "根据正文，Ben没有答应放书，但提出了什么替代帮助？",
        "options": [
          "把笔袋放进包",
          "把书和笔都放进包",
          "把笔放进笔袋"
        ],
        "correctAnswer": "把笔放进笔袋",
        "explanation": "Ben说I can put the pens in the pencil case，提出把笔放进笔袋。不能只看前一句No, I can't就认定他没有提出其他帮助。",
        "points": 10
      },
      {
        "id": "en-g4-helping-ask-q3",
        "type": "choice",
        "prompt": "你想询问对方能否帮忙，哪句话是本课学过的问句？",
        "options": [
          "Can you help?",
          "I can help.",
          "Yes, I can."
        ],
        "correctAnswer": "Can you help?",
        "explanation": "Can you help?询问对方；I can help.陈述自己可以帮助；Yes, I can.是肯定回应。注意句子在对话中的作用，不只看有没有help。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g4-helping-order",
    "title": "先做什么，再做什么",
    "summary": "根据两步安排理解物品位置，分清先后顺序与动作结果。",
    "studyGuide": [
      "用虚构用品想象即可，不需要实际收拾。book是一本书，books是多本书；pen是笔，pens是多支笔；pencil case是笔袋，bag是包。先看清移动的是哪件物品。",
      "First表示先，Then表示然后。先在心里或纸上记第一步、第二步，不用在网页拖拽物品。put是放，in是在……里面；put ... in ...是把物品放进容器。",
      "Put the pens in the pencil case是把笔放进笔袋；Put the pencil case in the bag是把笔袋放进包。第二步移动的是整个笔袋，没有把笔取出来。the指这里谈论的物品。",
      "The pens are in the pencil case表示这些笔在笔袋里；The pencil case is in the bag表示这个笔袋在包里。本例多支笔用are，一个笔袋用is。on是在……上面；on the book是放在书的上面，与in the pencil case的位置不同。",
      "First和Then的句子告诉你做什么，末尾is和are的句子告诉你做完后在哪里。听辨会换一份安排，第二步可能不同；阅读题再回到正文核对。"
    ],
    "body": "First, put the pens in the pencil case.\n\nThen, put the pencil case in the bag.\n\nThe pens are in the pencil case. The pencil case is in the bag.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g4-helping-order-q1",
        "type": "choice",
        "prompt": "听一份新的两步安排：这次第二步直接放进包的物品是什么？",
        "listeningText": "First, put the pens in the pencil case. Then, put the book in the bag.",
        "options": [
          "一本书",
          "笔袋",
          "多支笔"
        ],
        "correctAnswer": "一本书",
        "explanation": "新录音Then后面是put the book in the bag，所以第二步放书。正文第二步放笔袋，两份安排不同，要听清Then后的物品。",
        "points": 10
      },
      {
        "id": "en-g4-helping-order-q2",
        "type": "choice",
        "prompt": "根据正文，哪组顺序正确？",
        "options": [
          "先把笔袋放进包，再把笔放进笔袋",
          "先把笔放进笔袋，再把笔袋放进包",
          "先把书放进包，再把笔放进笔袋"
        ],
        "correctAnswer": "先把笔放进笔袋，再把笔袋放进包",
        "explanation": "正文First后面放笔，Then后面放笔袋。第一项颠倒顺序，第三项添加正文没有的放书动作；都不是这份安排。",
        "points": 10
      },
      {
        "id": "en-g4-helping-order-q3",
        "type": "choice",
        "prompt": "按正文完成两步后，哪句话符合这些笔的存放位置？",
        "options": [
          "The pens are on the book.",
          "The pens are on the bag.",
          "The pens are in the pencil case."
        ],
        "correctAnswer": "The pens are in the pencil case.",
        "explanation": "笔一直放在笔袋里面，第二步只是移动整个笔袋。on the book是书上，on the bag是包上，这两个位置都与正文的in the pencil case不同。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g4-helping-card",
    "title": "写一份两人小计划",
    "summary": "写清角色分工、一次请求和两个有顺序的步骤。",
    "studyGuide": [
      "这是另一次虚构合作，人物的回应可以与前课不同。先读计划，再写自己的版本，不需要找同伴或真的整理。help是帮助；books是多本书；pens是多支笔；pencil case是笔袋；bag是包；put是放，in是在……里面。",
      "I是我，you是你。Let's help together表示我们一起帮忙吧，Let's用于邀请，together是一起。I can put ...陈述自己能做什么；Can you put ...?请求对方帮忙；Yes, I can表示对方答应。",
      "First是先，Then是然后。本课步骤写出谁来做：First, I put ...是先由我来放；Then, you put ...是然后由你来放。在Lin说的步骤中，I指Lin，you指Ben。the指计划中谈论的物品。",
      "自己可以扮演Lin和Ben两个虚构角色，用名字作标签。先写请求，再由另一角色写回应；步骤里I和you要与角色对应，不要把两人的任务写反。虚构角色的答应不代表现实中的人已经答应。",
      "写四到六句左右，可选笔进笔袋和书进包，也可以改变先后。先确定谁做哪件事，再写First和Then。这里用现在时按顺序说明各自怎么做，作品是安排，不是已经实际完成的记录。"
    ],
    "body": "Lin: Let's help together. I can put the pens in the pencil case. Can you put the books in the bag?\n\nBen: Yes, I can.\n\nLin: First, I put the pens in the pencil case. Then, you put the books in the bag.",
    "speakable": true,
    "project": {
      "title": "我的两人合作小计划",
      "prompt": "给两个虚构人物写四到六句左右：一人说自己能帮的事，向另一人请求帮助并得到回应，再写出谁先做什么、谁后做什么。可用笔进笔袋和书进包，不需要实际整理或联系他人。",
      "placeholder": "Lin: I can put ... in ... . Can you put ... in ... ?\nBen: Yes, I can.\nLin: First, I put ... in ... . Then, you put ... in ... .",
      "checklist": [
        "我标明了两个虚构角色，写清各自任务以及请求和回应。",
        "我用First和Then安排两个不同步骤，I和you与角色分工一致。",
        "我读过对话和步骤，确认物品、容器和顺序没有矛盾，并检查大写与标点。"
      ]
    },
    "questions": [
      {
        "id": "en-g4-helping-card-q1",
        "type": "choice",
        "prompt": "听另一份新计划：说话者请求对方帮忙做什么？",
        "listeningText": "I can put the books in the bag. Can you put the pens in the pencil case?",
        "options": [
          "把书放进包",
          "把笔袋放进包",
          "把笔放进笔袋"
        ],
        "correctAnswer": "把笔放进笔袋",
        "explanation": "录音第一句I can ...说自己能放书；第二句Can you ...才是请求对方放笔。不能只记第一个动作，要分清陈述和请求。",
        "points": 10
      },
      {
        "id": "en-g4-helping-card-q2",
        "type": "choice",
        "prompt": "根据正文，Ben答应完成哪件事？",
        "options": [
          "把书放进包",
          "把笔放进笔袋",
          "把笔袋放进包"
        ],
        "correctAnswer": "把书放进包",
        "explanation": "Lin问Can you put the books in the bag?，Ben接着用Yes, I can答应。最后Lin的you仍指Ben，与前面请求的放书任务一致。",
        "points": 10
      },
      {
        "id": "en-g4-helping-card-q3",
        "type": "choice",
        "prompt": "不改变正文分工，只改成Ben先放书、Lin后放笔。Lin应该怎样说明新顺序？",
        "options": [
          "First, I put the pens in the pencil case. Then, you put the books in the bag.",
          "First, you put the books in the bag. Then, I put the pens in the pencil case.",
          "First, I put the books in the bag. Then, you put the pens in the pencil case."
        ],
        "correctAnswer": "First, you put the books in the bag. Then, I put the pens in the pencil case.",
        "explanation": "Lin说话时you指Ben，I指Lin，所以先you放书、再I放笔。第一项没有调整先后；第三项改变了两人的任务。新要求只改顺序，不改分工。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-story-compare",
    "title": "先比较两份方案",
    "summary": "在原创情境中比较同一故事的讲述与写卡方案，找到共同目标和不同方式。",
    "studyGuide": [
      "下面是两个虚构方案，假设同一篇短故事和写卡用的纸都已准备好，只讨论方案文字与是否有笔。只读本课即可做题，不需要真的准备故事、纸或笔。Plan A和Plan B是A、B两个方案，plan是方案，choose是选择。",
      "read是读，a short story是一篇短故事，short是短的；tell是讲述，write是写，sentence是句子，three sentences是三个句子，three是三，sentences是复数，card是卡片。",
      "share是分享，share the story在这里指向听众或读者表达故事内容。可以设定虚构听众或读者，自己练习也能开始，不必联系别人或实际发送。",
      "First表示先，Then表示然后。Plan A后一步是讲述，Plan B后一步是写卡。in three sentences表示用三个句子，on a card表示写在卡片上，about the story表示关于这个故事。写任意三句不一定符合B方案。",
      "Both plans表示两份方案都；start with表示以……开始；start with reading表示从阅读开始；the same story表示同一个故事，same是相同。Plan B needs a pencil表示B方案需要一支笔，needs是需要，pencil是铅笔。",
      "比较时先问共同要分享什么，再看采用什么方式。I want to ...表示我想……；I will choose ...表示我打算选择……；because表示因为。听辨会有一位新角色说明自己的选择和理由，不能仅凭方案介绍猜他的决定。"
    ],
    "body": "I want to share a short story.\n\nPlan A: First, read the story. Then, tell the story in three sentences.\n\nPlan B: First, read the same story. Then, write three sentences about the story on a card.\n\nBoth plans start with reading. Plan B needs a pencil.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g6-story-compare-q1",
        "type": "choice",
        "prompt": "听一位新角色的选择：这位角色打算选哪个方案，为什么？",
        "listeningText": "I will choose Plan B because I want to write three sentences about the story on a card.",
        "options": [
          "选A，因为想讲述故事",
          "选B，因为想写一张故事卡",
          "选B，因为想换一篇故事"
        ],
        "correctAnswer": "选B，因为想写一张故事卡",
        "explanation": "录音说choose Plan B，because后面是想把关于故事的三个句子写到卡片上。要同时核对方案和理由，不能只听到B就忽略后面的说明。",
        "points": 10
      },
      {
        "id": "en-g6-story-compare-q2",
        "type": "choice",
        "prompt": "根据正文，两个方案共同的第一步是什么？",
        "options": [
          "先写三句故事卡",
          "先找一位同伴",
          "阅读同一篇短故事"
        ],
        "correctAnswer": "阅读同一篇短故事",
        "explanation": "两份First都从读故事开始，第二份还用same说明是同一篇。写卡片是B的后续步骤；正文没有要求先找同伴。",
        "points": 10
      },
      {
        "id": "en-g6-story-compare-q3",
        "type": "choice",
        "prompt": "新要求是‘读完后，用三个句子口头讲述’。哪个方案的后续步骤符合要求？",
        "options": [
          "Plan A，因为它用三个句子讲述故事",
          "Plan B，因为它把三个句子写到卡片上",
          "两个方案都要求写卡片"
        ],
        "correctAnswer": "Plan A，因为它用三个句子讲述故事",
        "explanation": "tell是讲述，write是写。两份方案都用三个句子，但表达方式不同；新要求是口头讲述，所以选A，不能只看three sentences就认为两者一样。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-story-conditions",
    "title": "理由和条件不是一回事",
    "summary": "用because找选择理由，用if区分条件与已经说明的实际情况。",
    "studyGuide": [
      "本课仍用两个虚构方案：A先读故事再讲述，B先读故事再写卡。假想故事和卡片纸都已准备好，只讨论方案与是否有笔，不需要真实准备。read是读，tell是讲述，write是写，story是故事，card是卡片，pencil是铅笔。Lin是虚构人物，不需要你真的检查物品。",
      "I want to share the story表示我想分享故事内容，share是分享，这是两份方案的共同目标。I like writing表示我喜欢写，是方式偏好；because I like writing说明优先选B的理由，不意味着口头讲述不能分享故事。",
      "I will choose ...表示我打算选择……，will表示打算，choose是选择，plan是方案。before是在……之前，start是开始，Before I start表示开始之前；check是检查，my是我的，I will check my pencil表示我会检查我的铅笔。",
      "have是有，have no pencil是没有笔，today是今天。If表示如果，先读条件，再读逗号后的安排。If I have a pencil, I will choose Plan B表示如果有笔，打算选B；If I have no pencil, I will choose Plan A表示如果没有笔，打算改选A。",
      "because回答为什么想选，if回答在什么条件下选。条件句不自动说明条件已经成立。文末Lin has a pencil today才明确今天的情况；has在这里表示有，She按正文指Lin，I在Lin的引语中也是Lin。and表示和或并且，把前后动作连起来。",
      "这只是Lin的安排：她喜欢写，因此有笔时优先选B；没有笔时仍能用A讲故事，但不算完成写卡。有笔的人也可以因为喜欢讲述而选A，不把Lin的条件句当成所有人的规定。听辨会换另一份信息，按新录音回答。"
    ],
    "body": "Lin: I want to share the story. I will choose Plan B because I like writing.\n\nBefore I start, I will check my pencil. If I have a pencil, I will choose Plan B. If I have no pencil, I will choose Plan A.\n\nLin has a pencil today. She will choose Plan B.",
    "speakable": true,
    "questions": [
      {
        "id": "en-g6-story-conditions-q1",
        "type": "choice",
        "prompt": "听一位新角色今天的情况和决定：哪项符合这次录音？",
        "listeningText": "I have no pencil today. I will choose Plan A and tell the story.",
        "options": [
          "今天有笔，选B写卡",
          "今天没有笔，选A讲故事",
          "今天没有笔，选B写卡"
        ],
        "correctAnswer": "今天没有笔，选A讲故事",
        "explanation": "录音先说have no pencil，再说choose Plan A和tell the story。新角色今天的情况与正文Lin不同，不能套用Lin的B方案。",
        "points": 10
      },
      {
        "id": "en-g6-story-conditions-q2",
        "type": "choice",
        "prompt": "正文中，哪项是Lin想选B的理由，而不是工具条件或检查动作？",
        "options": [
          "她喜欢用写的方式分享故事",
          "她今天有笔",
          "她准备开始前检查笔"
        ],
        "correctAnswer": "她喜欢用写的方式分享故事",
        "explanation": "because I like writing给出优先选择写卡的理由；有没有笔是实行方案的条件，检查笔是行动。三者都有关，但作用不同；共同目标仍是分享故事内容。",
        "points": 10
      },
      {
        "id": "en-g6-story-conditions-q3",
        "type": "choice",
        "prompt": "只看到‘If I have no pencil, I will choose Plan A.’，尚未读到今天实际情况时，可以确定什么？",
        "options": [
          "说话者今天一定没有笔",
          "说话者已经完成A方案",
          "如果没有笔，说话者计划选A"
        ],
        "correctAnswer": "如果没有笔，说话者计划选A",
        "explanation": "If说明假设条件，will说明计划。单凭这一句不能确定今天有没有笔，也不能说已经完成任务；要把条件安排和实际情况分开。",
        "points": 10
      }
    ]
  },
  {
    "id": "en-g6-story-flexible-plan",
    "title": "给计划留一个调整办法",
    "summary": "围绕分享故事的共同目标，写清偏好、条件、替代安排和结果检查。",
    "studyGuide": [
      "这是虚构表达练习，假想故事和卡片纸都已准备好，只讨论方案与是否有笔，不要求真实准备。Plan A先读后讲，Plan B先读后写卡。read是读，tell是讲述，write是写，story是故事，card是卡片，pencil是铅笔，share是分享。共同目标是分享同一故事内容；可用虚构听众或读者，不需要实际同伴或用品。",
      "want是想要，choose是选择，plan是计划，I like writing是我喜欢写。I will choose ... because ...把决定和理由连起来，will表示打算，because表示因为。可先用中文列共同目标、偏好及理由、条件和替代办法。不能把只讲过故事说成已经完成写卡。",
      "before是在……之前，start是开始，check是检查，have是有，no是没有。If I have no pencil, I will ...表示如果没有笔就打算……。If后面只是设定的条件，不要求寻找现实中的物品来证明。",
      "after是在……之后，after reading是读完后。three sentences是三个句子，three是三，sentence是句子，sentences是复数；about是关于。Are my three sentences about the story?表示‘我的三个句子是在说这个故事吗？’。I will check是我将核对，检查围绕故事内容，不只检查卡片外观。",
      "也可以优先选口述：I want to share the story. I will choose Plan A because I want to tell it. Before I tell the story, I will read it. If I want a card and have a pencil, I will choose Plan B. 意思是：想分享故事，偏好讲所以选A；讲之前先读；如果后来想留卡片且有笔，可转B。it指同一篇故事，and连接两个条件。",
      "听辨与选项补充：but表示但是；Do I have a pencil?是‘我有铅笔吗？’；Is my card green?是‘我的卡片是绿色吗？’，green是绿色。工具条件和卡片颜色不等于表达的故事内容。听辨可能是有笔但偏好讲述的新角色，要把工具和偏好分开听。",
      "写五到六句左右，理由和替代办法要与共同目标一致；最后说明怎样核对表达结果。这些是计划，不是已经完成的成绩。This is my plan表示这是我的计划，my是我的；作品自检只检查自己是否把安排表达清楚，不是系统自动评价语法。"
    ],
    "body": "I want to share the story. I will choose Plan B because I like writing.\n\nBefore I start, I will check my pencil. If I have no pencil, I will choose Plan A and tell the story after reading.\n\nI will check: Are my three sentences about the story? This is my plan.",
    "speakable": true,
    "project": {
      "title": "我的可调整表达计划",
      "prompt": "以分享同一个故事内容为共同目标，选择虚构方案A口头讲述或B写卡，写五到六句左右：优先方式及理由、开始前检查什么、条件变化时怎样调整，以及怎样检查故事表达。替代方式也要服务于共同目标，不能把口述当作已经写卡。无需真实钱款、出行、同伴或用品。",
      "placeholder": "I want to share the story.\nI will choose Plan ... because ... .\nBefore I start, I will ... .\nIf ..., I will ... .\nI will check: ... ?\nThis is my plan.",
      "checklist": [
        "我写清分享故事的共同目标、优先方式和理由，没有混淆A讲述与B写卡。",
        "我写了开始前的检查和条件变化时的替代安排，替代方式仍能分享同一故事，没有把口述当作已经写卡。",
        "我说明怎样检查表达结果，读过整份计划确认前后一致，没有把计划写成已经完成的成绩。"
      ]
    },
    "questions": [
      {
        "id": "en-g6-story-flexible-plan-q1",
        "type": "choice",
        "prompt": "听另一位角色的工具、偏好和决定：这次为什么选择A？",
        "listeningText": "I have a pencil, but I want to tell the story. I will choose Plan A.",
        "options": [
          "因为没有笔，只能改选A",
          "因为想写卡片，所以选A",
          "因为想练讲述，虽然有笔仍选A"
        ],
        "correctAnswer": "因为想练讲述，虽然有笔仍选A",
        "explanation": "录音明确have a pencil，但want to tell the story，所以选A。工具是否具备与本人偏好是两项信息，不能把有笔自动等同选B。",
        "points": 10
      },
      {
        "id": "en-g6-story-flexible-plan-q2",
        "type": "choice",
        "prompt": "根据正文，如果没有笔，替代办法是什么？",
        "options": [
          "改选A，读完后讲故事",
          "仍然要求先写卡片",
          "换故事，不再进行表达"
        ],
        "correctAnswer": "改选A，读完后讲故事",
        "explanation": "If I have no pencil后面明确choose Plan A，再说明tell the story after reading。替代方案仍服务于分享故事内容，只是由写换成讲；不能说写卡也已经完成。",
        "points": 10
      },
      {
        "id": "en-g6-story-flexible-plan-q3",
        "type": "choice",
        "prompt": "哪一句最直接检查两份方案共同的‘表达故事内容’目标？",
        "options": [
          "Do I have a pencil?",
          "Are my three sentences about the story?",
          "Is my card green?"
        ],
        "correctAnswer": "Are my three sentences about the story?",
        "explanation": "这句话检查三个句子是否围绕故事内容；有没有笔是工具条件，卡片颜色不是本课表达目标。检查结果不能只检查工具或外观。",
        "points": 10
      }
    ]
  }
] satisfies LanguageLesson[];
