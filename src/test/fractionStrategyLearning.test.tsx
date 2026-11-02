import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadKnowledgePointDetail } from '@/lib/content';
import InteractivePractice from '@/components/InteractivePractice';
import DiscoveryLesson from '@/components/DiscoveryLesson';

describe('fraction strategy teaching route', () => {
  it('renders the actual multiplication model and updates the overlapping amount', async () => {
    const course = (await loadKnowledgePointDetail('g6-fraction-strategy'))!;
    const onInteract = vi.fn();
    render(<InteractivePractice knowledgePointId={course.meta.id} vizType={course.meta.vizType} title={course.meta.title} onInteract={onInteract} />);
    const vertical = await screen.findByRole('slider', { name: /纵向取/ });
    fireEvent.change(vertical, { target: { value: '2' } });
    expect(screen.getByText('1/2 × 2/3 = 2/6')).toBeInTheDocument();
    expect(screen.getAllByText('重叠')).toHaveLength(2);
    fireEvent.change(vertical, { target: { value: '1' } });
    expect(screen.getByText('1/2 × 1/3 = 1/6')).toBeInTheDocument();
    expect(screen.getAllByText('重叠')).toHaveLength(1);
    expect(onInteract).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('不同大小的分数单位可以直接相加吗？')).not.toBeInTheDocument();
  });

  it('requires applying the reference-whole distinction before the next challenge', async () => {
    const course = (await loadKnowledgePointDetail('g6-fraction-strategy'))!;
    const complete = vi.fn();
    const startChallenge = vi.fn();
    render(<DiscoveryLesson meta={course.meta} explanation={course.explanation} prediction="要先看剩下多少" interactionCount={2} onComplete={complete} onStartChallenge={startChallenge} />);
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: '继续学习' }));
    expect(screen.getByRole('heading', { name: '先走全程的1/3，再走剩余路程的1/4。最后剩全程的几分之几？' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '5/12，因为1−1/3−1/4。' }));
    fireEvent.click(screen.getByRole('button', { name: '看看选得对不对' }));
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '1/2，因为2/3×3/4。' }));
    fireEvent.click(screen.getByRole('button', { name: '看看选得对不对' }));
    expect(complete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '继续学习' }));
    fireEvent.click(screen.getByRole('button', { name: '去试一题' }));
    expect(startChallenge).toHaveBeenCalledTimes(1);
  });
});
