import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import type { LanguageLesson } from '@/lib/types';
import { loadHanziData } from '@/lib/hanziData';

type Character = NonNullable<LanguageLesson['characters']>[number];

export default function CharacterStrokeStudy({ characters }: { characters: Character[] }) {
  const [selected, setSelected] = useState(characters[0]);
  const [loadingError, setLoadingError] = useState(false);
  const writerHost = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);

  useEffect(() => {
    const host = writerHost.current;
    if (!host) return;
    host.replaceChildren();
    setLoadingError(false);
    let active = true;
    const next = HanziWriter.create(host, selected.character, {
      width: 208,
      height: 208,
      padding: 12,
      showCharacter: false,
      showOutline: true,
      strokeColor: '#be123c',
      outlineColor: '#fecdd3',
      delayBetweenStrokes: 180,
      strokeAnimationSpeed: 1.2,
      charDataLoader: (character, onLoad, onError) => {
        void loadHanziData(character).then(onLoad).catch((error: unknown) => {
          if (active) setLoadingError(true);
          onError(error);
        });
      },
    });
    writer.current = next;
    return () => {
      active = false;
      next.cancelQuiz();
      if (writer.current === next) writer.current = null;
    };
  }, [selected]);

  return (
    <section aria-labelledby="character-study-title" className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold tracking-wider text-rose-700">生字笔顺</p>
      <h2 id="character-study-title" className="mt-1 text-xl font-bold text-slate-900">先看清，再动笔</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">点选一个生字，观看真实笔画顺序；动画结束后请在田字格里自己写一遍。</p>
      <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="本课生字">
        {characters.map((item) => (
          <button key={item.character} type="button" onClick={() => setSelected(item)} aria-pressed={item.character === selected.character} className={`grid size-11 place-items-center rounded-xl border-2 text-xl font-bold transition ${item.character === selected.character ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 bg-white text-rose-800 hover:border-rose-400'}`}>
            {item.character}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-[208px_1fr] sm:items-center">
        <div ref={writerHost} aria-label={`${selected.character}的笔顺动画`} className="mx-auto size-[208px] rounded-2xl bg-white" />
        <div>
          <p className="text-4xl font-bold text-rose-700">{selected.character}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{selected.pinyin} · {selected.meaning}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">组词：{selected.words.join('、')}</p>
          <button type="button" onClick={() => void writer.current?.animateCharacter()} className="mt-4 min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">播放笔顺</button>
          {loadingError ? <p role="status" className="mt-3 text-sm font-semibold text-amber-800">笔顺动画暂时不可用，请先按生字卡练习书写。</p> : null}
          <p className="mt-3 text-xs leading-5 text-slate-500">笔顺数据来自 Hanzi Writer Data；<a className="font-semibold text-rose-700 underline" href="/licenses/ARPHICPL.txt" target="_blank" rel="noreferrer">查看许可</a>。</p>
        </div>
      </div>
    </section>
  );
}
