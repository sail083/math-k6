import { useEffect, useRef, useState } from 'react';

export function ReadAloudButton({ text, label = '朗读英文正文', instructions = '朗读用于辅助听读，英文正文始终显示在下方。', fallback = '请直接阅读下方英文正文。', onFinished }: {
  text: string;
  label?: string;
  instructions?: string;
  fallback?: string;
  onFinished?: () => void;
}) {
  const synthesis = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  const supported = !!synthesis && typeof SpeechSynthesisUtterance !== 'undefined';
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    synthesis?.cancel();
  }, [synthesis, text]);

  const readAloud = () => {
    if (!supported || !synthesis) return;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    synthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeaking(false);
        onFinished?.();
      };
      utterance.onerror = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeaking(false);
        setError(`朗读暂时不可用，${fallback}`);
      };
      utteranceRef.current = utterance;
      setError('');
      setSpeaking(true);
      synthesis.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setSpeaking(false);
      setError(`朗读暂时不可用，${fallback}`);
    }
  };

  const stopReading = () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    synthesis?.cancel();
    setSpeaking(false);
  };

  return (
    <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
      <button
        type="button"
        onClick={readAloud}
        disabled={!supported}
        aria-busy={speaking}
        className="inline-flex min-h-11 items-center rounded-xl bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {speaking ? '正在朗读' : label}
      </button>
      {speaking ? <button type="button" onClick={stopReading}
        className="ml-2 inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200">
        停止朗读
      </button> : null}
      <p className="mt-2 text-sm leading-6 text-slate-600">{instructions}</p>
      {!supported ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">当前浏览器不支持朗读，{fallback}</p>
      ) : error ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">{error}</p>
      ) : null}
    </div>
  );
}
