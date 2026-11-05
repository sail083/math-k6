(() => {
  'use strict';
  const KEY = 'learning-qing-lesson-v1';
  const DAY = 24 * 60 * 60 * 1000;
  const root = document.getElementById('lesson-app');
  const stages = ['开始', '读课文', '校园场景', '寻找依据', '字词练习', '我的发现', '独立检查', '学习回顾'];
  const source = window.CHINESE_TEXTBOOK.find(item => item.id === 'zh-g3-text-1');
  const characters = [...new Set(source?.targets || '')];
  const initial = () => ({ stage: 0, unlocked: 0, reading: '', sceneIndex: 0, sceneAnswers: {}, evidenceIndex: 0, evidenceAnswers: {}, wordAnswer: null, selectedChar: characters[0] || '', viewedChars: [], wroteOnPaper: false, phrase: '', reason: '', place: '', expression: '', expressionSkipped: false, checkAnswers: {}, checkForm: 'A', tests: [], completedAt: null, reviewAnswers: {}, reviewResult: null });
  let state;
  try { state = { ...initial(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { state = initial(); }
  if (!Number.isInteger(state.stage) || state.stage < 0 || state.stage > 8) state.stage = 0;
  let saveError = false;
  let writer = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); saveError = false; }
    catch { saveError = true; }
  };
  const button = (action, label, cls = 'lesson-main-btn', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const goto = n => { state.stage = n; if (n <= 7) state.unlocked = Math.max(state.unlocked, n); save(); render(); window.scrollTo(0, 0); };
  const scenes = [
    { prompt: '早晨，同学们来到学校后做了什么？', options: ['在教室里准备午饭', '在操场举行运动比赛', '向老师、小鸟和国旗问好'], answer: 2, hint: '回到课文开头，看看孩子们来到学校后向谁打招呼。', explanation: '同学们向校园里的小鸟、老师和国旗问好。' },
    { prompt: '上课时，孩子们主要在做什么？', options: ['一起读课文', '一起跳孔雀舞', '各自回家'], answer: 0, hint: '回到写上课的部分，听一听教室里传出了什么声音。', explanation: '上课时，同学们一起朗读课文。' },
    { prompt: '下课后，大青树下发生了什么？', options: ['孩子们在山坡上种树', '孩子们跳舞、做游戏', '所有人都在教室里睡觉'], answer: 1, hint: '回到写下课的部分，找一找孩子们的活动。', explanation: '下课后，孩子们在大青树下玩耍，也有跳舞等活动。' }
  ];
  const evidence = [
    { prompt: '要说明这所学校的学生来自不同民族，应该找哪一部分？', options: ['中间：描写窗外很安静', '开头：介绍孩子们来到学校', '结尾：介绍古老的大树'], answer: 1, hint: '先想一想：作者在哪里介绍了同学们？', explanation: '开头介绍了不同民族的孩子一起来到学校。' },
    { prompt: '上课时作者写窗外安静，这些细节让你感受到什么？', options: ['孩子们读书的情景很吸引人，小动物仿佛也在听', '小动物走进教室教同学们读书', '学校里没有同学上课'], answer: 0, hint: '想想安静的树枝、小鸟和蝴蝶，和教室里的读书声有什么关系。', explanation: '窗外的安静衬托出孩子们读书的情景，让人仿佛看到小动物也在认真听。' }
  ];
  const word = { prompt: '“山坡”通常指哪一种地方？', options: ['平静的湖面', '山上倾斜的地面', '天上的云朵'], answer: 1, hint: '想一想：这个词里的“山”和地形有什么关系？', explanation: '山坡是山上倾斜的地方。课文里孩子们从山坡上来到学校。' };
  const tests = {
    A: [
      { id: 'a1', prompt: '哪句话最符合课文中孩子们的情况？', options: ['来自不同民族的孩子在同一所学校学习', '所有孩子只在家里学习', '学校里只有老师没有学生'], answer: 0, section: 2, topic: '课文内容' },
      { id: 'a2', prompt: '作者描写树枝、小鸟和蝴蝶安静下来，主要帮助读者想象什么？', options: ['它们在教室里给孩子们上课', '同学们已经放学回家', '它们仿佛也被孩子们的读书声吸引'], answer: 2, section: 3, topic: '课文细节' },
      { id: 'a3', prompt: '哪句话正确用到了“山坡”？', options: ['一朵白云在山坡上飘过天空', '小路沿着山上倾斜的地面伸向山坡', '鱼在山坡里游来游去'], answer: 1, section: 4, topic: '字词运用' }
    ],
    B: [
      { id: 'b1', prompt: '同学们下课后，课文描写了哪种活动？', options: ['到电影院看电影', '坐船回到家', '在大青树下玩耍'], answer: 2, section: 2, topic: '课文内容' },
      { id: 'b2', prompt: '想进一步了解同学们上课时的情景，应该回看哪部分？', options: ['孩子们早晨来学校的部分', '孩子们一起读书、窗外很安静的部分', '写课文题目的地方'], answer: 1, section: 3, topic: '寻找依据' },
      { id: 'b3', prompt: '下面哪个词最适合形容山上倾斜的地面？', options: ['山坡', '天空', '河水'], answer: 0, section: 4, topic: '字词运用' }
    ]
  };
  const reviewQuestions = [
    { id: 'd1', prompt: '隔了一天，还记得这所学校的孩子们有什么特点吗？', options: ['他们都来自同一个家庭', '他们来自不同民族，一起学习', '他们从来不在学校读书'], answer: 1, topic: '课文内容' },
    { id: 'd2', prompt: '课文描写窗外安静时，更可能让人想到哪种画面？', options: ['孩子读书，窗外的小动物仿佛也在听', '小动物们在教室里写作业', '校园里没有任何人'], answer: 0, topic: '课文细节' }
  ];
  function layout(body) {
    const n = Math.min(state.stage, 7);
    const nav = stages.map((label, i) => button('jump', `<span class="num">${i + 1}</span>${label}`, `${i === n ? 'active' : ''}`, `data-stage="${i}" ${i > state.unlocked ? 'disabled' : ''} ${i === n ? 'aria-current="step"' : ''}`)).join('');
    return `<header class="lesson-header"><div class="lesson-header-in"><div class="lesson-brand"><span class="logo">文</span><span>语文学习</span></div><a class="backlink" href="index.html?resume=chinese-g3">← 返回课程列表</a></div></header><main class="lesson-shell"><div class="lesson-path"><span>人教版 · 三年级上册</span><span>/</span><span>第一单元</span><span>/</span><strong>第 1 课</strong></div><div class="lesson-top"><div><span class="lesson-kicker">一起来读课文</span><h1>大青树下的小学</h1><p>读懂校园里的画面，发现有新鲜感的表达。</p></div><div class="lesson-progress" aria-label="学习进度：第 ${n + 1} 步，共 8 步">${stages.map((_, i) => `<i class="${i <= n ? 'done' : ''}"></i>`).join('')}</div></div><div class="lesson-grid"><nav class="lesson-nav" aria-label="学习步骤">${nav}</nav><section class="lesson-card" aria-live="polite">${body}<div class="save-note ${saveError ? 'save-error' : ''}" role="status">${saveError ? '本机保存失败，刷新后进度可能丢失。请检查浏览器存储。' : '样课进度保存在本机当前浏览器；作品不自动评价，也不会同步到账号。'}</div></section></div></main>`;
  }
  function intro() { return `<span class="mini-tag">第 1 课 · 一起探索</span><h2>走进一所特别的小学</h2><p class="lead">早晨，孩子们从不同的地方来到学校。跟着课文，我们去看看他们怎样一起学习、玩耍。</p><div class="lesson-callout"><strong>这次我们会：</strong><br>读课文、找到校园里的画面、认识字词，再用自己的话说说校园生活。</div><div class="lesson-callout warm">请准备人教版三年级上册语文课本。页面提供的是帮助理解的内容提示，不是教材正文。暂时没有课本，也可以先体验。</div><div class="lesson-actions end">${button('next','开始学习 →')}</div>`; }
  function reading() { return `<span class="mini-tag">第一步 · 读课文</span><h2>带着问题读一读</h2><p>打开课本，读《大青树下的小学》。边读边想：这所学校有哪些特别的地方？</p><h3>读完后，想想这三个画面</h3><div class="scene-card"><b>来到学校</b>来自不同民族的孩子们一起走进校园，向周围的人和事物问好。</div><div class="scene-card"><b>一起上课</b>同学们一起读书，窗外的景物和小动物也让人忍不住去想象。</div><div class="scene-card"><b>下课以后</b>孩子们在大青树下玩耍，校园里热闹起来。</div><p class="hint">以上是学习提示，用自己的话概括了课文内容。朗读需要自己或家长检查，本页面不判断读得是否正确。</p><h3>你现在的情况是？</h3><div class="choice-list">${['我已经读了课本','暂时没有课本，先体验内容提示'].map((x,i)=>button('read-choice',`<span class="dot">${i+1}</span>${x}`,`choice ${state.reading === (i ? 'summary' : 'book') ? 'selected' : ''}`,`data-value="${i?'summary':'book'}" aria-pressed="${state.reading === (i?'summary':'book')}"`)).join('')}</div><div class="lesson-actions">${button('previous','上一步','lesson-light-btn')}${button('next','继续：看看校园 →','lesson-main-btn',state.reading?'':'disabled')}</div>`; }
  function singleQuestion(question, group, index, total) {
    const record = state[group][index] || { selected: null, attempts: 0, solved: false, feedback: '' };
    return `<div class="step-meta"><span>${index + 1} / ${total}</span><span>·</span><span>先想一想，再选择</span></div><h2>${escape(question.prompt)}</h2><div class="choice-list">${question.options.map((o,i)=>button('pick',`<span class="dot">${String.fromCharCode(65+i)}</span><span>${escape(o)}</span>`,`choice ${record.selected === i ? 'selected' : ''} ${record.solved && i === question.answer ? 'correct' : ''}`,`data-group="${group}" data-index="${index}" data-value="${i}" aria-pressed="${record.selected === i}" ${record.solved?'disabled':''}`)).join('')}</div>${record.feedback ? `<div class="feedback ${record.solved?'ok':'err'}" role="status">${escape(record.feedback)}</div>` : ''}<div class="lesson-actions">${index>0?button('question-back','上一题','lesson-light-btn',`data-group="${group}"`):button('previous','上一步','lesson-light-btn')}${record.solved?button('question-next',index+1===total?'完成这组练习 →':'下一题 →','lesson-main-btn',`data-group="${group}"`):button('check-practice','检查一下','lesson-main-btn',`data-group="${group}" data-index="${index}" ${record.selected===null?'disabled':''}`)}</div>`;
  }
  function scenePage() { return `<span class="mini-tag">第二步 · 校园场景</span><h3>把课文里的画面连起来</h3><p>回想同学们来到学校、上课、下课时的情景；不记得可以翻看课本或返回上一步。</p>${singleQuestion(scenes[state.sceneIndex], 'sceneAnswers', state.sceneIndex, scenes.length)}`; }
  function evidencePage() { return `<span class="mini-tag">第三步 · 寻找依据</span><h3>答案藏在课文里</h3><p>想一想，哪些内容能帮助你回答问题。</p>${singleQuestion(evidence[state.evidenceIndex], 'evidenceAnswers', state.evidenceIndex, evidence.length)}`; }
  function wordsPage() {
    const record = state.wordAnswer || { selected: null, attempts: 0, solved: false, feedback: '' };
    return `<span class="mini-tag">第四步 · 字词练习</span><h2>在词语里认识生字</h2><p>课文写到同学们从山坡上来到学校。“坡”可以组成“山坡”。先看一看它怎么写，再动手试试。</p><div class="lesson-charlist" aria-label="本课生字">${characters.map(c=>button('character',escape(c),`lesson-char ${state.selectedChar === c?'selected':''}`,`data-value="${escape(c)}" aria-label="生字 ${escape(c)}" aria-pressed="${state.selectedChar === c}"`)).join('')}</div><div class="lesson-charrow"><div id="lesson-writer" class="lesson-tian" aria-label="${escape(state.selectedChar)}的笔顺动画"></div><div><h3>${escape(state.selectedChar)}</h3><p>${window.STROKE_DATA[state.selectedChar]?.strokes.length || 0} 画 · 先观察笔顺，再在纸上练习。</p>${button('stroke','▶ 播放笔顺')}<p id="stroke-status" class="hint" role="status"></p></div></div><div class="lesson-callout">${button('wrote',state.wroteOnPaper?'✓ 我在纸上练过了':'我在纸上练过了','lesson-light-btn')}<br>这是自己记录练习，系统不会自动判断纸上的书写是否正确。</div><h3>回到词语</h3><p>${word.prompt}</p><div class="choice-list">${word.options.map((o,i)=>button('word-pick',`<span class="dot">${String.fromCharCode(65+i)}</span>${escape(o)}`,`choice ${record.selected===i?'selected':''} ${record.solved&&i===word.answer?'correct':''}`,`data-value="${i}" aria-pressed="${record.selected===i}" ${record.solved?'disabled':''}`)).join('')}</div>${record.feedback?`<div class="feedback ${record.solved?'ok':'err'}" role="status">${escape(record.feedback)}</div>`:''}<div class="lesson-actions">${button('previous','上一步','lesson-light-btn')}${record.solved?button('next','继续：说说发现 →'):button('word-check','检查一下','lesson-main-btn',record.selected===null?'disabled':'')}</div><p class="hint">笔顺数据：Hanzi Writer Data · <a href="assets/ARPHICPL.txt" target="_blank">数据许可</a></p>`;
  }
  function expressPage() { return `<span class="mini-tag">第五步 · 我的发现</span><h2>找一处你喜欢的表达</h2><p>课文里有哪些词语让你觉得新鲜、有趣，或者让你想到了画面？下面只是帮助你回忆的几个词，也可以直接填写自己的发现。</p><div class="chip-options">${['绒球花','凤尾竹','大青树'].map(x=>button('phrase',escape(x),`chip-btn ${state.phrase===x?'selected':''}`,`data-value="${escape(x)}" aria-pressed="${state.phrase===x}"`)).join('')}</div><label for="reason"><h3>它为什么吸引你？</h3></label><textarea class="writing" id="reason" data-field="reason" maxlength="500" placeholder="可以说说它让你想到了什么画面……">${escape(state.reason)}</textarea><h3>再说说你的校园</h3><p>选择一个地方，想想什么时候、有哪些人、大家在做什么。</p><div class="chip-options">${['教室里','操场上','图书室里','其他地方'].map(x=>button('place',escape(x),`chip-btn ${state.place===x?'selected':''}`,`data-value="${escape(x)}" aria-pressed="${state.place===x}"`)).join('')}</div><label for="expression"><h3>用一两句话记录你的场景</h3></label><textarea class="writing" id="expression" data-field="expression" maxlength="500" placeholder="例如：下课后，我和朋友在操场上……">${escape(state.expression)}</textarea><p class="hint">这是你的发现和表达，没有唯一答案。系统保存文字，但不会自动评价内容或朗读。</p><div class="lesson-actions">${button('previous','上一步','lesson-light-btn')}${button('express-next','继续独立检查 →')}${button('express-skip','稍后再写','skip-link')}</div>`; }
  function quizFields(questions, group) { return questions.map((q,qi)=>`<fieldset class="checkgroup"><legend>${qi+1}. ${escape(q.prompt)}</legend>${q.options.map((opt,i)=>`<label class="answer-label"><input type="radio" name="${group}-${escape(q.id)}" data-field="${group}" data-question="${escape(q.id)}" value="${i}" ${state[group][q.id]===i?'checked':''}><span>${escape(opt)}</span></label>`).join('')}</fieldset>`).join(''); }
  const activeForm = () => state.checkForm === 'B' ? 'B' : 'A';
  function checkPage() { const form=activeForm(), questions=tests[form], all=questions.every(q=>Number.isInteger(state.checkAnswers[q.id]));if(state.tests.some(t=>t.form===form))return `<span class="mini-tag">独立检查</span><h2>这组题已经提交</h2><p>你的检查结果已记录，可以回到学习回顾查看。</p>${button('back-result','查看学习回顾','lesson-light-btn')}`;return `<span class="mini-tag">第六步 · 独立检查</span><h2>${form==='A'?'自己来试一试':'换一组题，再试一次'}</h2><p>先不看学习提示，自己完成下面三题。提交后会显示结果。可以回看课本，但本页面无法判断是否独立作答。</p><div class="questions">${quizFields(questions,'checkAnswers')}</div><div class="lesson-actions">${button('previous','上一步','lesson-light-btn')}${button('submit-check','提交检查','lesson-main-btn',all?'':'disabled')}</div>`; }
  function resultPage() {
    const latest=state.tests[state.tests.length-1];
    const date=state.completedAt ? new Date(state.completedAt+DAY) : null;
    const due=!!date && Date.now()>=date.getTime();
    return `<span class="mini-tag">第七步 · 学习回顾</span><h2>${latest?.correct===latest?.total?'当堂检查已完成':'已经完成一次检查'}</h2><p>下面是本次实际记录。多做一次练习，有助于发现还需要回看的地方。</p><div class="result-row"><span class="result-icon">01</span><div><b>课文阅读</b><br>${state.reading==='book'?'你选择了已读课本；系统未检查朗读。':'你选择先看内容提示；还需结合课本阅读。'}</div></div><div class="result-row"><span class="result-icon">02</span><div><b>校园场景与寻找依据</b><br>已完成练习；遇到错误后可以回看并重试。</div></div><div class="result-row"><span class="result-icon">03</span><div><b>字词与书写</b><br>看过 ${state.viewedChars.length} 个字的笔顺卡；${state.wroteOnPaper?'你记录了纸上练习，书写未自动检查':'未记录纸上练习'}。</div></div><div class="result-row"><span class="result-icon">04</span><div><b>我的发现与表达</b><br>${state.reason.trim()||state.expression.trim()?'文字已保存在本机，未自动评价。':'本次没有填写，可以回去补充。'}</div></div><div class="result-row"><span class="result-icon">05</span><div><b>独立检查</b><br>${state.tests.map((x,i)=>`${i?'换题补测':'首次检查'} ${x.correct} / ${x.total} 题`).join('；')}。结果反映本次题目，不代表已经全面掌握课文。</div></div>${latest&&latest.correct<latest.total?`<div class="lesson-callout warm"><strong>建议再看看：</strong>${[...new Set(latest.missed.map(x=>x.topic))].map(escape).join('、')}。你可以返回相应步骤，${state.tests.length===1?'再做一组不同的题。':'并结合课本继续练习。'}</div><div class="chip-options">${[...new Map(latest.missed.map(x=>[x.section,x])).values()].map(x=>button('jump',`回看${escape(x.topic)}`,'lesson-light-btn',`data-stage="${x.section}"`)).join('')}${state.tests.length===1?button('retry-check','换题再检查','lesson-main-btn'):''}</div>`:''}<div class="divider"></div><h3>稍后复习</h3><p>${due?'可以做两道不同的复习题，看看隔一段时间后是否还记得。':`本机将在 ${date?escape(date.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})):'稍后'} 开放复习。请到时重新打开本课；不会自动发送提醒。`}</p>${button('review','进入稍后复习','lesson-light-btn',due?'':'disabled')}<div class="lesson-actions">${button('jump','回看我的发现','lesson-light-btn','data-stage="5"')}<a class="lesson-main-btn" href="index.html?resume=chinese-g3" style="text-decoration:none;display:inline-flex;align-items:center">返回课程列表</a></div>`;
  }
  function reviewPage() {
    const due=state.completedAt && Date.now()>=state.completedAt+DAY;
    if(!due)return `<h2>复习还没到时间</h2><p>请稍后回到这节课，再做不同的复习题。</p>${button('back-result','返回学习回顾','lesson-light-btn')}`;
    if(state.reviewResult)return `<span class="mini-tag">稍后复习 · 已完成</span><h2>复习记录</h2><p>本次答对 ${state.reviewResult.correct} / ${state.reviewResult.total} 题。这是本次复习的结果，不代表整篇课文已经全面掌握。</p>${button('back-result','返回学习回顾','lesson-light-btn')}`;
    const all=reviewQuestions.every(q=>Number.isInteger(state.reviewAnswers[q.id]));
    return `<span class="mini-tag">稍后复习</span><h2>隔一段时间，再想一想</h2><p>这两道题和当堂检查不同。请先独立选择，再提交查看结果。</p><div class="questions">${quizFields(reviewQuestions,'reviewAnswers')}</div><div class="lesson-actions">${button('back-result','返回学习回顾','lesson-light-btn')}${button('submit-review','提交复习','lesson-main-btn',all?'':'disabled')}</div>`;
  }
  function render() {
    if(writer){writer.pauseAnimation();writer=null;}
    const pages=[intro,reading,scenePage,evidencePage,wordsPage,expressPage,checkPage,resultPage,reviewPage];
    root.innerHTML=layout(pages[state.stage]());
    if(state.stage===4 && state.selectedChar && window.STROKE_DATA[state.selectedChar]) {
      writer=window.HanziWriter.create('lesson-writer',state.selectedChar,{width:200,height:200,padding:16,showOutline:true,showCharacter:false,strokeColor:'#c66e62',outlineColor:'#efdcd8',delayBetweenStrokes:250,strokeAnimationSpeed:1.1,charDataLoader:(c,ok,fail)=>{if(window.STROKE_DATA[c])ok(window.STROKE_DATA[c]);else fail(new Error('笔顺数据不可用'));}});
    }
  }
  root.addEventListener('click', event => {
    const el=event.target.closest('button[data-action]'); if(!el||el.disabled)return;
    const {action,value,group,index}=el.dataset;
    if(action==='next'){goto(state.stage+1);return;}
    if(action==='previous'){goto(Math.max(0,state.stage-1));return;}
    if(action==='jump'){const target=Number(el.dataset.stage);if(target<=state.unlocked){if(target===2)state.sceneIndex=0;if(target===3)state.evidenceIndex=0;goto(target);}return;}
    if(action==='back-result'){goto(7);return;}
    if(action==='read-choice')state.reading=value;
    else if(action==='pick'){const n=Number(index);const old=state[group][n]||{selected:null,attempts:0,solved:false,feedback:''};state[group][n]={...old,selected:Number(value),feedback:''};}
    else if(action==='check-practice'){const n=Number(index),q=group==='sceneAnswers'?scenes[n]:evidence[n],record=state[group][n];record.attempts++;record.solved=record.selected===q.answer;record.feedback=record.solved?q.explanation:q.hint;}
    else if(action==='question-back'){if(group==='sceneAnswers')state.sceneIndex=Math.max(0,state.sceneIndex-1);else state.evidenceIndex=Math.max(0,state.evidenceIndex-1);}
    else if(action==='question-next'){if(group==='sceneAnswers'){if(state.sceneIndex+1<scenes.length)state.sceneIndex++;else{goto(3);return;}}else if(state.evidenceIndex+1<evidence.length)state.evidenceIndex++;else{goto(4);return;}}
    else if(action==='character'){state.selectedChar=value;if(!state.viewedChars.includes(value))state.viewedChars.push(value);}
    else if(action==='stroke'){if(writer){const status=document.getElementById('stroke-status');if(status)status.textContent='正在播放……';if(!state.viewedChars.includes(state.selectedChar))state.viewedChars.push(state.selectedChar);save();writer.animateCharacter({onComplete:()=>{const node=document.getElementById('stroke-status');if(node)node.textContent='播放完成，可以试着自己写一遍。';}});}return;}
    else if(action==='wrote')state.wroteOnPaper=!state.wroteOnPaper;
    else if(action==='word-pick'){state.wordAnswer={...(state.wordAnswer||{attempts:0,solved:false}),selected:Number(value),feedback:''};}
    else if(action==='word-check'){state.wordAnswer.attempts++;state.wordAnswer.solved=state.wordAnswer.selected===word.answer;state.wordAnswer.feedback=state.wordAnswer.solved?word.explanation:word.hint;}
    else if(action==='phrase')state.phrase=value;
    else if(action==='place')state.place=value;
    else if(action==='express-next'||action==='express-skip'){state.expressionSkipped=action==='express-skip';goto(6);return;}
    else if(action==='submit-check'){
      const form=activeForm(),questions=tests[form];if(state.tests.some(t=>t.form===form)||!questions.every(q=>Number.isInteger(state.checkAnswers[q.id])))return;
      const missed=questions.filter(q=>state.checkAnswers[q.id]!==q.answer).map(q=>({section:q.section,topic:q.topic}));
      state.tests.push({form,correct:questions.length-missed.length,total:questions.length,missed});state.completedAt ||= Date.now();goto(7);return;
    }
    else if(action==='retry-check'){if(state.tests.length!==1||state.tests[0].correct===state.tests[0].total)return;state.checkAnswers={};state.checkForm='B';goto(6);return;}
    else if(action==='review'){if(!state.completedAt||Date.now()<state.completedAt+DAY)return;state.stage=8;save();render();return;}
    else if(action==='submit-review'){if(!state.completedAt||Date.now()<state.completedAt+DAY||!reviewQuestions.every(q=>Number.isInteger(state.reviewAnswers[q.id])))return;state.reviewResult={correct:reviewQuestions.filter(q=>state.reviewAnswers[q.id]===q.answer).length,total:reviewQuestions.length,at:Date.now()};save();render();return;}
    else return;
    save();render();
  });
  root.addEventListener('input', event => {
    const el=event.target,field=el.dataset.field;if(!field)return;
    if(field==='reason'||field==='expression'){state[field]=el.value;save();}
    else if((field==='checkAnswers'||field==='reviewAnswers')&&el.dataset.question){state[field][el.dataset.question]=Number(el.value);save();const form=field==='checkAnswers'?tests[activeForm()]:reviewQuestions;const btn=root.querySelector(`[data-action="${field==='checkAnswers'?'submit-check':'submit-review'}"]`);if(btn)btn.disabled=!form.every(q=>Number.isInteger(state[field][q.id]));}
  });
  render();
})();
