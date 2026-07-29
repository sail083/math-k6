import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { TextbookRef } from '@/lib/types';
import UiIcon from '@/components/UiIcon';

interface Props { title: string; markdown: string; textbookRefs: TextbookRef[] }
interface Slide { title: string; content: string }

function buildSlides(title: string, markdown: string): Slide[] {
  const sections = markdown.split(/(?=^##\s+)/m).map(value => value.trim()).filter(Boolean);
  const content = sections.map((section) => {
    const lines = section.split('\n');
    const heading = lines[0].replace(/^#+\s*/, '');
    return { title: heading, content: lines.slice(1).join('\n').trim() };
  }).filter(slide => slide.content.length > 0);
  const unique = content.filter((slide, index, all) => index === 0 || slide.title !== all[index - 1].title || slide.content !== all[index - 1].content);
  return unique.slice(0, 8).length > 0 ? unique.slice(0, 8) : [{ title, content: markdown }];
}

export default function KnowledgeDeck({ title, markdown, textbookRefs }: Props) {
  const slides = useMemo(() => buildSlides(title, markdown), [title, markdown]);
  const [mode, setMode] = useState<'deck' | 'reference'>('deck');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<number[]>([]);

  useEffect(() => { setIndex(0); setPlaying(false); setFlipped(false); setReviewed([]); }, [title]);
  useEffect(() => {
    if (!playing || mode !== 'deck') return;
    const timer = window.setTimeout(() => setIndex(current => {
      if (current >= slides.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 4200);
    return () => window.clearTimeout(timer);
  }, [index, mode, playing, slides.length]);
  useEffect(() => {
    if (!playing) return;
    setFlipped(true);
    setReviewed(current => current.includes(index) ? current : [...current, index]);
  }, [index, playing]);

  const showBack = () => {
    setFlipped(true);
    setReviewed(current => current.includes(index) ? current : [...current, index]);
  };
  const changeSlide = (next: number) => {
    setIndex(next);
    setFlipped(false);
    setPlaying(false);
  };
  const togglePlay = () => {
    if (!playing && index === slides.length - 1) setIndex(0);
    if (!playing) showBack();
    setPlaying(value => !value);
  };
  const reviewPercent = Math.round((reviewed.length / slides.length) * 100);

  return <section className="knowledge-deck" aria-label="知识档案播放器">
    <header className="knowledge-deck__head">
      <div><span>课后回顾</span><strong>{mode === 'deck' ? '翻卡片复习' : '知识点全文'}</strong><small>{mode === 'deck' ? `已复习 ${reviewed.length} / ${slides.length}` : '按自己的节奏慢慢读'}</small></div>
      <div className="segmented-control" role="tablist" aria-label="复习模式"><button type="button" role="tab" aria-selected={mode === 'deck'} className={mode === 'deck' ? 'is-active' : ''} onClick={() => setMode('deck')}>卡片</button><button type="button" role="tab" aria-selected={mode === 'reference'} className={mode === 'reference' ? 'is-active' : ''} onClick={() => { setMode('reference'); setPlaying(false); }}>全文</button></div>
    </header>
    {mode === 'deck' ? <>
      <div className="deck-stage" aria-live="polite">
        {playing && <div className="deck-timer-bar" key={`timer-${index}`} />}
        <div className="deck-page-number">卡片 {index + 1} / {slides.length}</div>
        <div className={`flip-card ${flipped ? 'is-flipped' : ''}`} role="button" tabIndex={0} aria-label={`${flipped ? '查看问题' : '查看答案'}：${slides[index].title}`} onClick={() => { if (flipped) setFlipped(false); else showBack(); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (flipped) setFlipped(false); else showBack(); } }}>
          <div className="flip-card__inner">
            <article className="flip-card__face flip-card__front"><span>{index === 0 ? '今天学会了什么？' : '先在心里想一想'}</span><h3>{slides[index].title}</h3><p className="flip-hint">点击翻面查看讲解</p></article>
            <article className="flip-card__face flip-card__back"><span><UiIcon name="check" size={16}/> 这一张已复习</span><h3>{slides[index].title}</h3><div className="prose"><ReactMarkdown>{slides[index].content}</ReactMarkdown></div><p className="flip-hint">点击返回问题</p></article>
          </div>
        </div>
      </div>
      <div className="deck-review-progress" aria-label={`复习进度 ${reviewPercent}%`}><div><span style={{ width: `${reviewPercent}%` }}/></div><strong>{reviewPercent}%</strong></div>
      <div className="deck-dots">{slides.map((_, slideIndex) => <button type="button" aria-label={`第${slideIndex + 1}张卡片${reviewed.includes(slideIndex) ? '，已复习' : ''}`} key={slideIndex} className={`${slideIndex === index ? 'is-active' : ''} ${reviewed.includes(slideIndex) ? 'is-reviewed' : ''}`} onClick={() => changeSlide(slideIndex)}><i/></button>)}</div>
      <div className="deck-controls"><button type="button" className="icon-control" aria-label="上一张" disabled={index === 0} onClick={() => changeSlide(index - 1)}><UiIcon name="arrow-left"/></button><button type="button" className="primary-control" aria-pressed={playing} onClick={togglePlay}>{playing ? <UiIcon name="pause" size={18}/> : <UiIcon name="play" size={18}/>} {playing ? '暂停播放' : index === slides.length - 1 ? '从头播放' : '帮我播放'}</button><span className="playback-status" aria-live="polite">{playing ? '正在播放' : `${index + 1} / ${slides.length}`}</span><button type="button" className="icon-control" aria-label="下一张" disabled={index === slides.length - 1} onClick={() => changeSlide(index + 1)}><UiIcon name="arrow-right"/></button></div>
    </> : <div className="knowledge-reference"><div className="textbook-reference-row">{textbookRefs.map((ref, index) => <span key={index}>{ref.version} · {ref.chapter}</span>)}</div><div className="prose"><ReactMarkdown>{markdown}</ReactMarkdown></div></div>}
  </section>;
}
