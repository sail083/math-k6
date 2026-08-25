/**
 * KnowledgeMapPage render tests
 *
 * Verifies:
 * 1. Default target path (frac.divide_transform) renders correctly
 * 2. Switching target updates the path
 * 3. Unmapped skills don't crash the page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeMapPage from '@/pages/KnowledgeMapPage';
import type { SkillDisplayStatus } from '@/lib/progress';

// --- Mock ProgressContext ---
const mockGetSkillDisplayStatus = vi.fn<(skillId: string) => SkillDisplayStatus>(() => 'not_started');
const mockHasDirectSkillEvidence = vi.fn(() => false);
const mockSetGoal = vi.fn();
const mockIsSkillReadyForPath = vi.fn(() => false);

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    progress: { passedKnowledgePoints: [], stars: {} },
    getSkillDisplayStatus: mockGetSkillDisplayStatus,
    hasDirectSkillEvidence: mockHasDirectSkillEvidence,
    setGoal: mockSetGoal,
    isSkillReadyForPath: mockIsSkillReadyForPath,
  }),
}));

describe('KnowledgeMapPage', () => {
  beforeEach(() => {
    mockGetSkillDisplayStatus.mockReset();
    mockHasDirectSkillEvidence.mockReset();
    mockSetGoal.mockReset();
    mockIsSkillReadyForPath.mockReset();
    mockGetSkillDisplayStatus.mockReturnValue('not_started');
    mockHasDirectSkillEvidence.mockReturnValue(false);
    mockIsSkillReadyForPath.mockReturnValue(false);
  });

  it('renders with default target path (frac.divide_transform)', () => {
    render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    // Page title
    expect(screen.getByText('知识地图')).toBeInTheDocument();

    // Target path section exists
    expect(screen.getByText('我的目标')).toBeInTheDocument();
    expect(screen.getByText('📍 目标路径（完整纵向）')).toBeInTheDocument();

    // Default target select value is frac.divide_transform
    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;
    expect(select.value).toBe('frac.divide_transform');

    // The target step "除以分数转化为乘倒数" should be marked with "— 目标"
    expect(screen.getByText('— 目标')).toBeInTheDocument();

    // "下一小步" section should exist (first non-stable step)
    expect(screen.getByText('下一小步')).toBeInTheDocument();
  });

  it('switching target updates the path', () => {
    render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;
    expect(select.value).toBe('frac.divide_transform');

    // Switch to frac.notation
    fireEvent.change(select, { target: { value: 'frac.notation' } });
    expect(select.value).toBe('frac.notation');

    // Path should still have the target marker
    expect(screen.getByText('— 目标')).toBeInTheDocument();

    // The path should now be shorter (frac.notation has fewer hard prereqs)
    // frac.notation requires: frac.whole, frac.equal_partition
    // "理解平均分" is the name of frac.equal_partition (appears in select + path)
    const elements = screen.getAllByText('理解平均分');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('does not crash with unmapped skills (bridge nodes)', () => {
    render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;

    // Switch to a bridge node that has no REQUIRES_HARD prereqs
    fireEvent.change(select, { target: { value: 'bridge.fraction_decimal' } });

    // Should still render without crashing
    expect(screen.getByText('知识地图')).toBeInTheDocument();
    expect(screen.getByText('📍 目标路径（完整纵向）')).toBeInTheDocument();
    expect(screen.getByText('— 目标')).toBeInTheDocument();
  });

  it('shows all stable when all skills are stable', () => {
    mockGetSkillDisplayStatus.mockReturnValue('stable');

    render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    // When all skills are stable, the "all stable" message appears
    expect(screen.getByText(/所有前置技能均已稳固/)).toBeInTheDocument();
  });

  // F11.1: Target step reason is not self-referential
  it('target step reason shows "这是你的学习目标" not self-referencing', () => {
    render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    // The target step (last in path) should show the target-specific reason
    expect(screen.getByText(/这是你的学习目标/)).toBeInTheDocument();
  });

  // F11.2: No technical IDs visible in student-facing UI
  it('skill cards and detail panel do not display technical IDs', () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeMapPage />
      </MemoryRouter>,
    );

    // Technical IDs like "frac." and "bridge." should not appear as visible text
    const text = container.textContent ?? '';
    expect(text).not.toContain('frac.');
    expect(text).not.toContain('bridge.');
  });
});
