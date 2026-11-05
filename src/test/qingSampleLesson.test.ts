import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import script from '../../public/review/learning-journey/lesson-qing.js?raw';
import directoryScript from '../../public/review/learning-journey/app.js?raw';
import catalog from '../../public/review/learning-journey/assets/chinese-textbook.js?raw';
import strokes from '../../public/review/learning-journey/assets/stroke-data.js?raw';

function openLesson() {
  document.body.innerHTML = '<div id="lesson-app"></div>';
  window.eval(catalog);
  window.eval(strokes);
  Object.defineProperty(window, 'HanziWriter', { configurable: true, value: { create: () => ({ pauseAnimation: () => {}, animateCharacter: ({ onComplete }: { onComplete: () => void }) => onComplete() }) } });
  window.eval(script);
}
function click(action: string, value?: string | number) {
  const elements = Array.from(document.querySelectorAll<HTMLButtonElement>(`button[data-action="${action}"]`));
  const target = elements.find((button) => value === undefined || button.dataset.value === String(value) || button.dataset.stage === String(value));
  expect(target, `missing ${action} ${String(value)}: ${document.body.textContent}`).toBeTruthy();
  expect(target?.disabled).toBe(false);
  target!.click();
}
function answer(question: string, value: number) {
  const el = document.querySelector<HTMLInputElement>(`input[data-question="${question}"][value="${value}"]`);
  expect(el).toBeTruthy();
  el!.checked = true;
  el!.dispatchEvent(new Event('input', { bubbles: true }));
}
function write(field: string, value: string) {
  const el = document.querySelector<HTMLTextAreaElement>(`textarea[data-field="${field}"]`)!;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
function solvePractice(action: string, value: number) {
  click(action, value);
  click(action === 'pick' ? 'check-practice' : 'word-check');
}
function getSaved() { return JSON.parse(localStorage.getItem('learning-qing-lesson-v1') || '{}'); }

beforeEach(() => { localStorage.clear(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); openLesson(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('大青树下的小学样课', () => {
  it('保留错误与续学记录，独立检查与换题补测分别计分', () => {
    click('next');
    expect(document.querySelector<HTMLButtonElement>('[data-action="next"]')!.disabled).toBe(true);
    click('read-choice', 'summary'); click('next');
    solvePractice('pick', 0);
    expect(document.body.textContent).toContain('回到课文开头');
    expect(getSaved().sceneAnswers['0'].attempts).toBe(1);
    openLesson();
    expect(document.body.textContent).toContain('回到课文开头');
    solvePractice('pick', 2); click('question-next');
    click('question-back'); expect(document.body.textContent).toContain('早晨，同学们来到学校后做了什么'); click('question-next');
    solvePractice('pick', 0); click('question-next');
    solvePractice('pick', 1); click('question-next');
    solvePractice('pick', 1); click('question-next');
    solvePractice('pick', 0); click('question-next');
    click('character', '球'); click('stroke'); click('wrote');
    solvePractice('word-pick', 1); click('next');
    click('phrase', '绒球花'); write('reason', '让我想到圆圆的花');
    click('place', '操场上'); write('expression', '下课后，我们在操场上跳绳。');
    click('express-next');
    answer('a1', 0); answer('a2', 0); answer('a3', 1); click('submit-check');
    expect(document.body.textContent).toContain('首次检查 2 / 3 题');
    expect(document.body.textContent).toContain('还需结合课本阅读');
    expect(document.body.textContent).toContain('书写未自动检查');
    expect(document.querySelector<HTMLButtonElement>('[data-action="review"]')!.disabled).toBe(true);
    click('jump', 3); expect(document.body.textContent).toContain('要说明这所学校的学生来自不同民族'); click('jump', 7);
    click('retry-check'); answer('b1', 2); answer('b2', 1); answer('b3', 0); click('submit-check');
    expect(document.body.textContent).toContain('首次检查 2 / 3 题；换题补测 3 / 3 题');
    expect(getSaved().tests).toHaveLength(2);
    expect(getSaved().expression).toBe('下课后，我们在操场上跳绳。');
    click('jump', 6);
    expect(document.body.textContent).toContain('这组题已经提交');
    expect(document.querySelector('[data-action="submit-check"]')).toBeNull();
  });

  it('样课和语文三年级目录之间提供可恢复的入口', () => {
    expect(document.querySelector<HTMLAnchorElement>('a[href="index.html?resume=chinese-g3"]')).toBeTruthy();
    localStorage.setItem('learning-journey-prototype-v1', JSON.stringify({ profile: { stage: '小学', grade: 4 } }));
    window.history.replaceState({}, '', '?resume=chinese-g3');
    document.body.innerHTML = '<div id="app"></div>';
    window.eval(directoryScript);
    const link = document.querySelector<HTMLAnchorElement>('a[href="lesson-qing.html"]');
    expect(link?.textContent).toContain('大青树下的小学');
    expect(document.body.textContent).toContain('人教版');
    expect(document.body.textContent).toContain('三年级');
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('24 小时后开放不同复习题，并保存复习结果', () => {
    const record = { ...getSaved(), stage: 7, unlocked: 7, reading: 'book', completedAt: Date.now() - 25 * 60 * 60 * 1000,
      viewedChars: [], tests: [{ form: 'A', correct: 3, total: 3, missed: [] }], reviewAnswers: {}, reviewResult: null };
    localStorage.setItem('learning-qing-lesson-v1', JSON.stringify(record));
    openLesson(); click('review'); answer('d1', 1); answer('d2', 0); click('submit-review');
    expect(document.body.textContent).toContain('本次答对 2 / 2 题');
    expect(getSaved().reviewResult.correct).toBe(2);
    openLesson();
    expect(document.body.textContent).toContain('本次答对 2 / 2 题');
  });
});
