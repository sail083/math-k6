import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import KnowledgeDeck from '@/components/KnowledgeDeck';
import explanation from '@/content/knowledge-points/g3-fraction-intro/explain.md?raw';

describe('complete knowledge reference cards', () => {
  it('keeps every section beyond eight reachable without treating a flip as a completed review', () => {
    const markdown = Array.from({ length: 11 }, (_, index) => `## 第${index + 1}节\n\n这里是第${index + 1}节的讲解。`).join('\n\n');
    render(<KnowledgeDeck title="完整讲解" markdown={markdown} textbookRefs={[]} />);
    expect(screen.getByText('已复习 0 / 11')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '第11张卡片' }));
    fireEvent.click(screen.getByRole('button', { name: '查看答案：第11节' }));
    expect(screen.getByRole('button', { name: '查看问题：第11节' })).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('这一张的讲解')).toBeVisible();
    expect(screen.getByText('已复习 0 / 11')).toBeVisible();
    expect(screen.queryByText('这一张已复习')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '想起来了' }));
    expect(screen.getByText('已复习 1 / 11')).toBeVisible();
    expect(screen.getByRole('button', { name: '下一张' })).toBeDisabled();
  });

  it('exposes the added intro scaffolds and the final caution section in both cards and full reference', () => {
    const headings = [...explanation.matchAll(/^## (.+)$/gm)].map(match => match[1]);
    render(<KnowledgeDeck title="分数的初步认识" markdown={explanation} textbookRefs={[]} />);
    expect(headings.length).toBeGreaterThan(8);
    const scaffoldIndex = headings.indexOf('读懂整体与份数的四个小例子');
    fireEvent.click(screen.getByRole('button', { name: `第${scaffoldIndex + 1}张卡片` }));
    fireEvent.click(screen.getByRole('button', { name: '查看答案：读懂整体与份数的四个小例子' }));
    expect(screen.getByRole('heading', { name: '多个物体也能合成一个整体' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '从一份知道怎样补完整' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: `第${headings.length}张卡片` }));
    fireEvent.click(screen.getByRole('button', { name: `查看答案：${headings.at(-1)}` }));
    expect(screen.getByText(/不等大的块不能只靠数块数判断/)).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: '全文' }));
    expect(screen.getByRole('heading', { name: '读懂整体与份数的四个小例子' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '注意事项' })).toBeVisible();
  });
});
