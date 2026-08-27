import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GoalContextBar from '@/components/GoalContextBar';

const mockEmitEvent = vi.fn();

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({ emitEvent: mockEmitEvent }),
}));

const defaultProps = {
  targetSkillId: 'frac.divide_transform',
  goalUpdatedAt: 123456,
  surface: 'home' as const,
  mode: 'repair' as const,
  currentSkillId: 'frac.notation',
};

function renderBar(props = defaultProps) {
  return render(
    <MemoryRouter>
      <GoalContextBar {...props} />
    </MemoryRouter>,
  );
}

describe('GoalContextBar', () => {
  beforeEach(() => {
    mockEmitEvent.mockReset();
  });

  it('renders the goal, current repair context, continuation, and retention copy', () => {
    renderBar();

    expect(screen.getByRole('complementary', { name: '学习目标' })).toBeInTheDocument();
    expect(screen.getByText('我的目标')).toBeInTheDocument();
    expect(screen.getByText('当前在补')).toBeInTheDocument();
    expect(screen.getByText('分子、分母、分数线')).toBeInTheDocument();
    expect(screen.getByText('完成后继续')).toBeInTheDocument();
    expect(screen.getAllByText('除以分数转化为乘倒数')).toHaveLength(2);
    expect(screen.getByText('今天会 · 隔天还会 · 一周后还会')).toBeInTheDocument();
  });

  it('links to the encoded target and emits shown/opened events with minimal context', () => {
    renderBar();

    expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'trs:home:frac.divide_transform:123456',
      eventName: 'target_resume_shown',
      skillId: 'frac.divide_transform',
      properties: { surface: 'home' },
    });

    const link = screen.getByRole('link', { name: '继续我的目标' });
    expect(link).toHaveAttribute('href', '/map?target=frac.divide_transform');
    expect(link).toHaveClass('min-h-11');

    fireEvent.click(link);
    expect(mockEmitEvent).toHaveBeenLastCalledWith({
      clientEventId: 'tro:home:frac.divide_transform:123456',
      eventName: 'target_resume_opened',
      skillId: 'frac.divide_transform',
      properties: { surface: 'home' },
    });
  });

  it('does not emit the shown event again for the same context after rerender', () => {
    const { rerender } = renderBar();

    rerender(
      <MemoryRouter>
        <GoalContextBar {...defaultProps} mode="learning" />
      </MemoryRouter>,
    );

    expect(screen.getByText('当前学习')).toBeInTheDocument();
    expect(mockEmitEvent).toHaveBeenCalledTimes(1);
  });

  it('returns null and emits no event for an invalid target', () => {
    const { container } = renderBar({
      ...defaultProps,
      targetSkillId: 'unknown.skill',
    });

    expect(container.firstChild).toBeNull();
    expect(mockEmitEvent).not.toHaveBeenCalled();
  });
});
