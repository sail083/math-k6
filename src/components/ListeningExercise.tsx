import { useCallback, useState, type ReactNode } from 'react';
import { ReadAloudButton } from './ReadAloudButton';

export default function ListeningExercise({ text, prompt, children, onReadingHelp }: {
  text?: string;
  prompt?: string;
  children: ReactNode;
  onReadingHelp: () => void;
}) {
  const [heard, setHeard] = useState(false);
  const [reading, setReading] = useState(false);
  const finishListening = useCallback(() => setHeard(true), []);
  if (!text) return children;
  return <div className="space-y-4">
    <p className="font-semibold text-slate-800">{reading ? '阅读辅助练习' : '先听一句英文，再作答'}</p>
    {!heard && !reading && prompt ? <p className="text-lg leading-7">{prompt}</p> : null}
    {reading ? <p lang="en" className="rounded-xl bg-sky-50 p-4 text-lg leading-8">{text}</p> : <>
      <ReadAloudButton key={text} text={text} label="播放听辨内容" onFinished={finishListening}
        instructions="先播放，结束后选择答案。没听清可以重播；没听到声音时可改为阅读。"
        fallback="可以重试播放，或选择改为阅读练习。" />
      <button type="button" className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-sky-200"
        onClick={() => { setReading(true); onReadingHelp(); }}>没听到？改为阅读练习</button>
    </>}
    {heard && !reading ? <p role="status" className="text-sm text-slate-600">播放已结束，可以作答。若没听到声音，可以重播或改为阅读。</p> : null}
    {heard || reading ? children : <p role="status" className="text-sm text-slate-600">听完后开放答题，也可以主动改为阅读练习。</p>}
  </div>;
}
