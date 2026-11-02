import { useEffect, useRef, useState } from 'react';

/** 本地口语练习：录音只留内存，不上传、不自动评分。 */
export function LocalSpeakingPractice({ prompt = '先读提示，再录一段自己的回答。' }: { prompt?: string }) {
  const [state, setState] = useState<'idle' | 'recording' | 'ready' | 'unsupported'>('idle');
  const [error, setError] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopStream = useRef<MediaStream | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (stopTimer.current) clearTimeout(stopTimer.current); recorder.current?.stop(); stopStream.current?.getTracks().forEach((track) => track.stop()); if (url) URL.revokeObjectURL(url); }, [url]);

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setState('unsupported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stopStream.current = stream; chunks.current = [];
      const next = new MediaRecorder(stream); recorder.current = next;
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => { if (stopTimer.current) clearTimeout(stopTimer.current); const blob = new Blob(chunks.current, { type: next.mimeType || 'audio/webm' }); setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); }); setState('ready'); stream.getTracks().forEach((track) => track.stop()); stopStream.current = null; };
      next.start(); setState('recording'); stopTimer.current = setTimeout(() => next.stop(), 60_000);
    } catch { setError('未获得麦克风权限。你仍可继续文字练习。'); setState('idle'); }
  };
  const stop = () => { recorder.current?.stop(); recorder.current = null; };
  const remove = () => { if (url) URL.revokeObjectURL(url); setUrl(null); setState('idle'); chunks.current = []; };
  return <section aria-label="本地口语练习" className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
    <p className="text-sm font-bold text-slate-800">口语练习（本机临时录音）</p><p className="mt-1 text-sm leading-6 text-slate-600">{prompt} 录音只保存在当前页面内，不上传、不自动评分。</p>
    {state === 'unsupported' ? <p role="alert" className="mt-3 text-sm text-amber-700">当前浏览器不支持录音，你可以继续文字练习。</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-amber-700">{error}</p> : null}
    {state === 'recording' ? <p role="status" className="mt-3 text-sm text-rose-700">正在录音，最多 60 秒；停止后可回放或删除。</p> : null}
    <div className="mt-3 flex flex-wrap gap-2">{state === 'recording' ? <button type="button" onClick={stop} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white">停止录音</button> : <button type="button" onClick={start} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">开始录音</button>}{url ? <><audio controls src={url} className="h-11 max-w-full" aria-label="录音回放" /><button type="button" onClick={remove} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">删除录音</button></> : null}</div>
  </section>;
}
