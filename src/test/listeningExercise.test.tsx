import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ListeningExercise from '@/components/ListeningExercise';
import ChoiceGame from '@/components/games/ChoiceGame';
import { LessonPractice } from '@/pages/LanguageSubjectPage';
import { englishUpperLessons } from '@/content/english-upper';
import { englishG3Lessons } from '@/content/english-g3-units';
import type { LanguageLesson } from '@/lib/types';

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'listener' } }) }));
class Utterance {
  lang = ''; rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  text: string;
  constructor(text: string) { this.text = text; }
}
let spoken: Utterance[];
let speak: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  spoken = []; speak = vi.fn((item: Utterance) => spoken.push(item));
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel: vi.fn(), speak } });
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
});
afterEach(() => { vi.unstubAllGlobals(); Reflect.deleteProperty(window, 'speechSynthesis'); });
const question = { id: 'listen', type: 'choice' as const, prompt: '听到的动物是哪一种？', options: ['兔子', '狗'], correctAnswer: '兔子', explanation: 'rabbit是兔子。', points: 10 };

describe('listening exercise', () => {
  it.each([...englishUpperLessons, ...englishG3Lessons])('runs all three questions and the project gate for $id', (lesson) => {
    const onPassed = vi.fn();
    render(<MemoryRouter><LessonPractice lesson={lesson} subject="english" nextLessonId={null} onPassed={onPassed} /></MemoryRouter>);
    for (const [index, question] of lesson.questions.entries()) {
      if (question.listeningText) {
        fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
        expect(spoken.at(-1)?.text).toBe(question.listeningText);
        act(() => spoken.at(-1)?.onend?.());
      }
      if (question.type === 'choice') {
        fireEvent.click(screen.getByRole('button', { name: (name) => name.endsWith(question.correctAnswer) }));
      } else {
        fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: question.correctAnswer } });
        fireEvent.click(screen.getByRole('button', { name: '确认' }));
      }
      expect(screen.getByText(question.explanation)).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: index === 2 ? '查看结果' : '下一题' }));
    }
    if (lesson.project) {
      expect(onPassed).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '完成自检，确认完成本课' })).toBeDisabled();
      fireEvent.change(screen.getByRole('textbox', { name: '作品内容' }), { target: { value: lesson.body } });
      screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
      fireEvent.click(screen.getByRole('button', { name: '完成自检，确认完成本课' }));
    }
    expect(onPassed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: '本课完成' })).toBeVisible();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
  it('does not mount shortcut-enabled answers before audio ends and ignores stale playback callbacks', () => {
    const answer = vi.fn();
    render(<ListeningExercise text="rabbit" onReadingHelp={vi.fn()}><ChoiceGame question={question} onAnswer={answer} /></ListeningExercise>);
    expect(screen.queryByText('rabbit')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /兔子/ })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'a' });
    expect(answer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
    const oldEnd = spoken[0].onend!;
    fireEvent.click(screen.getByRole('button', { name: '正在朗读' }));
    act(() => oldEnd());
    expect(screen.queryByRole('button', { name: /兔子/ })).not.toBeInTheDocument();
    expect(spoken[1]).toMatchObject({ text: 'rabbit', lang: 'en-US', rate: 0.85 });
    act(() => spoken[1].onend?.());
    fireEvent.click(screen.getByRole('button', { name: /兔子/ }));
    expect(answer).toHaveBeenCalledWith('兔子', true, true);
  });

  it('keeps unsupported or failed playback locked until an explicit reading fallback', () => {
    speak.mockImplementation(() => { throw new Error('unavailable'); });
    const fallback = vi.fn();
    render(<ListeningExercise text="rabbit" onReadingHelp={fallback}><button>作答</button></ListeningExercise>);
    fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
    expect(screen.queryByRole('button', { name: '作答' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '没听到？改为阅读练习' }));
    expect(screen.getByText('rabbit')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('阅读辅助练习')).toBeVisible();
    expect(screen.getByRole('button', { name: '作答' })).toBeVisible();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '播放听辨内容' })).not.toBeInTheDocument();
  });

  it('does not unlock another question after leaving the previous audio', () => {
    const mounted = render(<ListeningExercise key="one" text="rabbit" onReadingHelp={vi.fn()}><button>第一题</button></ListeningExercise>);
    fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
    const stale = spoken[0].onend!;
    mounted.rerender(<ListeningExercise key="two" text="dog" onReadingHelp={vi.fn()}><button>第二题</button></ListeningExercise>);
    act(() => stale());
    expect(screen.queryByRole('button', { name: '第二题' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
    act(() => spoken[1].onerror?.());
    expect(screen.queryByRole('button', { name: '第二题' })).not.toBeInTheDocument();
  });

  it('can stop speech explicitly without unlocking the answer', () => {
    const answer = vi.fn();
    render(<ListeningExercise text="rabbit" onReadingHelp={vi.fn()}><button>作答</button></ListeningExercise>);
    fireEvent.click(screen.getByRole('button', { name: '播放听辨内容' }));
    fireEvent.click(screen.getByRole('button', { name: '停止朗读' }));
    expect(screen.queryByRole('button', { name: '作答' })).not.toBeInTheDocument();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    expect(answer).not.toHaveBeenCalled();
  });

  it('carries reading assistance into the lesson result without claiming independent listening', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    const lesson: LanguageLesson = { id: 'audio-result', title: '听读', summary: '', body: '', questions: [
      { ...question, listeningText: 'rabbit' }, { ...question, id: 'q2' }, { ...question, id: 'q3' },
    ] };
    const onPassed = vi.fn();
    render(<MemoryRouter><LessonPractice lesson={lesson} subject="english" nextLessonId={null} onPassed={onPassed} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: '播放听辨内容' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '没听到？改为阅读练习' }));
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /兔子/ }));
      fireEvent.click(screen.getByRole('button', { name: i === 2 ? '查看结果' : '下一题' }));
    }
    expect(onPassed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('note')).toHaveTextContent('本次使用了阅读辅助');
  });
});
