import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessonPractice } from '@/pages/LanguageSubjectPage';
import { chinesePoetryLessons } from '@/content/chinese-poetry';
import { chineseUpperLessons } from '@/content/chinese-upper';
import type { LanguageLesson } from '@/lib/types';

const auth = vi.hoisted(() => ({ user: { id: 'writer-a' } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));
const lesson: LanguageLesson = {
  id: 'writing-flow', title: '写作', summary: '写作自检', body: '示例',
  project: { title: '观察卡', prompt: '写自己观察的事', placeholder: '我的观察', checklist: ['有时间', '有发现', '有行动'] },
  questions: [1, 2, 3].map((number) => ({ id: `p${number}`, type: 'choice', prompt: `第${number}题`,
    options: [`正确${number}`, `错误${number}甲`, `错误${number}乙`], correctAnswer: `正确${number}`, explanation: '答案依据', points: 10 })),
};

function view(onPassed = vi.fn(), item = lesson) {
  return <MemoryRouter><LessonPractice lesson={item} onPassed={onPassed} nextLessonId="following" subject="chinese" /></MemoryRouter>;
}
function write(text = '课间，我发现叶子变黄了，就把它画下来。') {
  fireEvent.change(screen.getByRole('textbox', { name: '作品内容' }), { target: { value: text } });
}
function checkAll() {
  screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
}
function answerAll(pass = true) {
  for (const number of [1, 2, 3]) {
    if (pass || number === 1) fireEvent.click(screen.getByRole('button', { name: new RegExp(`正确${number}`) }));
    else {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`错误${number}甲`) }));
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`错误${number}乙`) }));
    }
    fireEvent.click(screen.getByRole('button', { name: number === 3 ? '查看结果' : '下一题' }));
  }
}
beforeEach(() => { localStorage.clear(); auth.user = { id: 'writer-a' }; });
afterEach(() => vi.restoreAllMocks());

describe('project and practice completion', () => {
  it.each([...chinesePoetryLessons, ...chineseUpperLessons.filter(lesson => lesson.id.startsWith('zh-g6-information-'))])('runs the three reviewed language questions and writing gate for $id', (item) => {
    const onPassed = vi.fn();
    render(view(onPassed, item));
    for (const [index, question] of item.questions.entries()) {
      const answer = Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer;
      if (question.type === 'choice') fireEvent.click(screen.getByRole('button', { name: (name) => name.endsWith(answer) }));
      else {
        fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: answer } });
        fireEvent.click(screen.getByRole('button', { name: '确认' }));
      }
      expect(screen.getByText(question.explanation)).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: index === 2 ? '查看结果' : '下一题' }));
    }
    if (item.project) {
      expect(onPassed).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '完成自检，确认完成本课' })).toBeDisabled();
      write(item.id === 'zh-g6-information-explain'
        ? '根据林老师周五09:20的核实通知，模型制作改为14:15—14:40，仍在一楼美术室，14:50回班。观察活动仍为13:30—13:55，地点是一楼科学室。'
        : '纸页轻轻翻动，\n像一只白色的小船，\n载着我写下的字，\n在桌上等风。');
      checkAll();
      fireEvent.click(screen.getByRole('button', { name: '完成自检，确认完成本课' }));
    }
    expect(onPassed).toHaveBeenCalledTimes(1);
  });
  it('requires a saved draft and all self-checks after passing the exercise', () => {
    const onPassed = vi.fn();
    render(view(onPassed));
    answerAll();
    const finish = screen.getByRole('button', { name: '完成自检，确认完成本课' });
    expect(finish).toBeDisabled();
    expect(onPassed).not.toHaveBeenCalled();
    write('   ');
    expect(screen.getAllByRole('checkbox').every((input) => (input as HTMLInputElement).disabled || input.closest('fieldset')?.disabled)).toBe(true);
    write();
    checkAll();
    expect(finish).toBeEnabled();
    write('修改了正文，需要重新检查。');
    expect(finish).toBeDisabled();
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    checkAll();
    fireEvent.click(finish);
    expect(onPassed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: '本课完成' })).toBeVisible();
  });

  it('accepts a self-checked project before exercise but does not pass a failed exercise', () => {
    const onPassed = vi.fn();
    const mounted = render(view(onPassed));
    write(); checkAll(); answerAll(false);
    expect(onPassed).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '再练一次' })).toBeVisible();
    mounted.unmount();
    render(view(onPassed));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('课间，我发现叶子变黄了，就把它画下来。');
    expect(screen.getAllByRole('checkbox').every((input) => (input as HTMLInputElement).checked)).toBe(true);
    answerAll();
    expect(onPassed).toHaveBeenCalledTimes(1);
  });

  it('isolates accounts on same-route rerender and isolates lessons without losing saved work', () => {
    const onPassed = vi.fn();
    const mounted = render(view(onPassed));
    write('A 的观察记录'); checkAll(); answerAll();
    auth.user = { id: 'writer-b' };
    mounted.rerender(view(onPassed));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('');
    expect(screen.getByText('第1题')).toBeVisible();
    expect(screen.queryByRole('heading', { name: '本课完成' })).not.toBeInTheDocument();
    write('B 的观察记录');
    auth.user = { id: 'writer-a' };
    mounted.rerender(view(onPassed));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('A 的观察记录');
    mounted.rerender(view(onPassed, { ...lesson, id: 'another-lesson' }));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('');
    mounted.rerender(view(onPassed));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('A 的观察记录');
  });

  it('preserves edit-invalidated self-checks across reload and exposes failed saves for retry', () => {
    let mounted = render(view());
    write(); checkAll(); write('新的观察');
    mounted.unmount(); mounted = render(view());
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    write('这段还没保存');
    expect(screen.getByRole('alert')).toHaveTextContent('草稿未保存');
    expect(screen.queryByText('已保存到本机当前账号。')).not.toBeInTheDocument();
    blocked.mockRestore();
    fireEvent.click(screen.getByRole('button', { name: '重试保存' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    mounted.unmount(); render(view());
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('这段还没保存');
  });

  it('does not overwrite unreadable drafts merely by mounting', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{broken');
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    render(view());
    expect(screen.getByRole('alert')).toHaveTextContent('暂时无法读取草稿');
    expect(writes).not.toHaveBeenCalled();
    read.mockReturnValue(JSON.stringify({ text: '恢复原草稿', checked: [] }));
    fireEvent.click(screen.getByRole('button', { name: '重试读取' }));
    expect(screen.getByRole('textbox', { name: '作品内容' })).toHaveValue('恢复原草稿');
    expect(writes).not.toHaveBeenCalled();
    read.mockRestore();
    write('重新写下的观察');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
