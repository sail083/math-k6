import type { LanguageLesson } from "@/lib/types";
export const englishG4WeatherLessons: LanguageLesson[] = [
  {
    id: "en-g4-weather-read",
    title: "看懂天气小报告",
    summary: "从简短天气报告中找出天气和温度。",
    studyGuide: [
      "sunny晴朗，rainy下雨，cold冷，warm暖，degrees度。报告是虚构练习。",
      "先听天气词，再找温度数字；没有声音时看正文核对。",
    ],
    body: "Today is sunny. It is warm, twenty degrees.",
    speakable: true,
    questions: [
      {
        id: "en-g4-weather-read-q1",
        type: "choice",
        prompt: "听到的天气是什么？",
        listeningText: "Today is rainy. It is cold.",
        options: ["晴朗", "下雨", "多云"],
        correctAnswer: "下雨",
        explanation: "录音说rainy，表示下雨。再试时先抓天气词。",
        points: 10,
      },
      {
        id: "en-g4-weather-read-q2",
        type: "choice",
        prompt: "正文有多少度？",
        options: ["twelve", "twenty", "thirty"],
        correctAnswer: "twenty",
        explanation: "正文写twenty degrees。再试时找degrees前的数字。",
        points: 10,
      },
      {
        id: "en-g4-weather-read-q3",
        type: "choice",
        prompt: "正文天气是冷还是暖？",
        options: ["warm", "cold", "rainy"],
        correctAnswer: "warm",
        explanation: "It is warm表示天气暖。再试时区分温度词和天气词。",
        points: 10,
      },
    ],
  },
  {
    id: "en-g4-weather-advice",
    title: "根据天气给建议",
    summary: "读懂天气条件和穿着建议的对应关系。",
    studyGuide: [
      "coat外套，hat帽子，umbrella雨伞，because因为。建议根据虚构天气，不是健康或安全保证。",
      "先找天气条件，再核对Wear或Take后的物品。",
    ],
    body: "It is cold today. Wear a coat and a hat. Take an umbrella because it may rain.",
    speakable: true,
    questions: [
      {
        id: "en-g4-weather-advice-q1",
        type: "choice",
        prompt: "听到的建议要带什么？",
        listeningText: "It is rainy. Take an umbrella.",
        options: ["雨伞", "太阳镜", "短裤"],
        correctAnswer: "雨伞",
        explanation: "录音说Take an umbrella。再试时找动作后面的物品。",
        points: 10,
      },
      {
        id: "en-g4-weather-advice-q2",
        type: "choice",
        prompt: "正文为什么穿外套？",
        options: ["It is cold.", "It may rain.", "It is sunny."],
        correctAnswer: "It is cold.",
        explanation:
          "正文先说It is cold today，再建议Wear a coat。再试时把条件和建议对应。",
        points: 10,
      },
      {
        id: "en-g4-weather-advice-q3",
        type: "choice",
        prompt: "哪句把下雨和雨伞对应正确？",
        options: [
          "Take an umbrella because it may rain.",
          "Wear a hat because it is rainy.",
          "Wear a coat because it is sunny.",
        ],
        correctAnswer: "Take an umbrella because it may rain.",
        explanation: "第一句同时有雨伞和下雨理由。再试时核对because后的条件。",
        points: 10,
      },
    ],
  },
  {
    id: "en-g4-weather-card",
    title: "写天气建议卡",
    summary: "写两句天气和穿着建议，完成事实自检。",
    studyGuide: [
      "作品可写虚构天气；自检关注天气词、物品和建议是否对应，不自动评价发音。",
      "先核对天气条件，再检查Wear或Take后的物品是否与建议对应。",
    ],
    body: "It is sunny and warm. Wear a hat.",
    speakable: true,
    project: {
      title: "我的天气建议卡",
      prompt: "写两句英文：一句天气，一句穿着或携带建议。",
      placeholder:
        "It is ... .\nWear/Take ... .\n我的核对记录：我检查了天气和建议，还想再听一听……。",
      checklist: [
        "我写清了天气情况。",
        "我的建议物品与天气条件相符。",
        "我尝试读过或听过参考，并记录仍需核对的词。",
      ],
    },
    questions: [
      {
        id: "en-g4-weather-card-q1",
        type: "choice",
        prompt: "听到的天气建议穿什么？",
        listeningText: "It is windy. Wear a jacket.",
        options: ["夹克", "雨靴", "围巾"],
        correctAnswer: "夹克",
        explanation: "录音说Wear a jacket。再试时听清建议动作和物品。",
        points: 10,
      },
      {
        id: "en-g4-weather-card-q2",
        type: "choice",
        prompt: "正文天气是什么？",
        options: ["sunny and warm", "rainy and cold", "windy and cool"],
        correctAnswer: "sunny and warm",
        explanation:
          "正文第一句是It is sunny and warm。再试时找is后面的两个词。",
        points: 10,
      },
      {
        id: "en-g4-weather-card-q3",
        type: "choice",
        prompt: "哪张卡同时写清天气和建议？",
        options: [
          "It is rainy. Take an umbrella.",
          "It is red. Open the book.",
          "I am nine. Goodbye.",
        ],
        correctAnswer: "It is rainy. Take an umbrella.",
        explanation:
          "第一项有天气rainy和对应建议umbrella。再试时逐句检查两类信息。",
        points: 10,
      },
    ],
  },
];
