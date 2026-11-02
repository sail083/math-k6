import { useEffect, useState } from 'react';
import type { LanguageLesson, LanguageSubject } from '@/lib/types';

type Project = NonNullable<LanguageLesson['project']>;
interface Draft {
  text: string;
  checked: string[];
}

export default function LessonProject({ project, ownerId, subject, lessonId, onReady }: {
  project: Project;
  ownerId: string | null;
  subject: LanguageSubject;
  lessonId: string;
  onReady: (ready: boolean) => void;
}) {
  const storageKey = JSON.stringify(['learning-project-v1', ownerId, subject, lessonId]);
  const readDraft = () => {
    try {
      const raw: unknown = ownerId ? JSON.parse(localStorage.getItem(storageKey) ?? 'null') : null;
      if (raw && typeof raw === 'object' && 'text' in raw && typeof raw.text === 'string' && raw.text.length <= 2000) {
        const checked = 'checked' in raw && Array.isArray(raw.checked)
          ? raw.checked.filter((item): item is string => typeof item === 'string' && project.checklist.includes(item))
          : [];
        return { draft: { text: raw.text, checked }, error: '' };
      }
      return { draft: { text: '', checked: [] }, error: '' };
    } catch {
      return { draft: { text: '', checked: [] }, error: '暂时无法读取草稿，请确认后重新输入；原存储内容未被自动覆盖。' };
    }
  };
  const [{ draft: initialDraft, error: initialError }] = useState(readDraft);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [error, setError] = useState(initialError);
  const [saved, setSaved] = useState(false);
  const [readFailed, setReadFailed] = useState(!!initialError);
  const ready = !!ownerId && !error && draft.text.trim().length > 0
    && project.checklist.length > 0 && project.checklist.every((item) => draft.checked.includes(item));

  useEffect(() => onReady(ready), [onReady, ready]);

  const save = (next: Draft) => {
    setReadFailed(false);
    setDraft(next);
    setSaved(false);
    if (!ownerId) {
      setError('登录后才能保存作品。请先复制内容留存。');
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setError('');
      setSaved(true);
    } catch {
      setError('草稿未保存，请先复制内容留存，再重试保存。');
    }
  };

  return <section aria-labelledby="lesson-project-title" className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
    <p className="text-xs font-bold text-sky-700">单元任务</p>
    <h2 id="lesson-project-title" className="mt-1 text-xl font-bold text-slate-900">{project.title}</h2>
    <p id="lesson-project-help" className="mt-2 text-sm leading-6 text-slate-600">{project.prompt}</p>
    <label htmlFor="lesson-project-draft" className="mt-5 block text-sm font-bold text-slate-800">作品内容</label>
    <textarea id="lesson-project-draft" lang={subject === 'english' ? 'en' : 'zh-CN'} rows={5} maxLength={2000}
      value={draft.text} placeholder={project.placeholder} aria-describedby="lesson-project-help lesson-project-storage"
      onChange={(event) => save({ text: event.target.value, checked: [] })}
      className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base leading-7 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200" />
    <p id="lesson-project-storage" role="status" className="mt-2 text-sm text-slate-600">
      {error ? '保存状态待确认，请保留当前内容。' : saved ? '已保存到本机当前账号。' : '草稿保存在本机当前账号，可刷新或下次回来继续；暂不跨设备同步。'}
    </p>
    {error ? <div role="alert" className="mt-3 text-sm text-red-700"><p>{error}</p>
      <button type="button" onClick={() => {
        if (!readFailed) { save(draft); return; }
        const restored = readDraft();
        setDraft(restored.draft);
        setError(restored.error);
        setReadFailed(!!restored.error);
      }} className="mt-2 min-h-11 rounded-lg border px-4">{readFailed ? '重试读取' : '重试保存'}</button>
    </div> : null}
    <fieldset className="mt-5" disabled={!draft.text.trim()}>
      <legend className="font-bold text-slate-900">我的作品自检</legend>
      {project.checklist.map((item) => <label key={item} className="flex min-h-11 items-center gap-3 py-2 text-sm leading-6 text-slate-700">
        <input type="checkbox" checked={draft.checked.includes(item)} onChange={(event) => save({
          ...draft, checked: event.target.checked ? [...draft.checked, item] : draft.checked.filter((value) => value !== item),
        })} className="size-5 shrink-0" />{item}
      </label>)}
    </fieldset>
    <p className="mt-3 text-sm text-slate-600">这是你自己的检查，不是自动评分。修改正文后需要重新自检。</p>
  </section>;
}
