/**
 * knowledgeContextStrip.test.tsx
 *
 * F11 tests:
 * 1. Unmapped course returns null
 * 2. "下一步" courses sorted by grade ascending (G3 before G5/G6)
 * 3. "相关基础" label appears instead of "以前学过"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeContextStrip from '@/components/KnowledgeContextStrip';

// --- Mock ProgressContext ---
const mockGetSkillDisplayStatus = vi.fn<() => 'not_started'>();

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    getSkillDisplayStatus: mockGetSkillDisplayStatus,
  }),
}));

describe('KnowledgeContextStrip', () => {
  beforeEach(() => {
    mockGetSkillDisplayStatus.mockReset();
    mockGetSkillDisplayStatus.mockReturnValue('not_started');
  });

  it('returns null for unmapped course (g3-rect-area)', () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeContextStrip courseId="g3-rect-area" />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null for unknown course', () => {
    const { container } = render(
      <MemoryRouter>
        <KnowledgeContextStrip courseId="unknown-course" />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('g3-fraction-intro: 下一步 courses sorted by grade ascending (G3 before G5/G6)', () => {
    render(
      <MemoryRouter>
        <KnowledgeContextStrip courseId="g3-fraction-intro" />
      </MemoryRouter>,
    );

    // Find the "下一步" section
    const nextLabel = screen.getByText('下一步');
    const nextContainer = nextLabel.closest('div');
    expect(nextContainer).toBeTruthy();

    const links = Array.from(
      nextContainer?.querySelectorAll('a[href]') ?? [],
    ) as HTMLAnchorElement[];

    expect(links.length).toBeGreaterThan(0);

    const hrefs = links.map((a) => a.getAttribute('href') ?? '');

    // Check that G3 courses appear before G5/G6 courses
    const firstG3 = hrefs.findIndex((h) => h.includes('/kp/g3-'));
    const firstG5 = hrefs.findIndex((h) => h.includes('/kp/g5-'));
    const firstG6 = hrefs.findIndex((h) => h.includes('/kp/g6-'));

    expect(firstG3).toBeGreaterThanOrEqual(0);
    if (firstG5 >= 0) {
      expect(firstG3).toBeLessThan(firstG5);
    }
    if (firstG6 >= 0) {
      expect(firstG3).toBeLessThan(firstG6);
    }
  });

  it('shows "相关基础" label instead of "以前学过"', () => {
    render(
      <MemoryRouter>
        <KnowledgeContextStrip courseId="g3-fraction-intro" />
      </MemoryRouter>,
    );

    // "相关基础" should be visible (if reviewSkills exist for this course)
    // g3-fraction-intro has reviewSkills: ["frac.need"]
    expect(screen.getByText('相关基础')).toBeInTheDocument();
    // "以前学过" should NOT be visible
    expect(screen.queryByText('以前学过')).not.toBeInTheDocument();
  });

  it('g3-fraction-compare: renders without crashing', () => {
    render(
      <MemoryRouter>
        <KnowledgeContextStrip courseId="g3-fraction-compare" />
      </MemoryRouter>,
    );
    // Should have "正在学" section (core skills)
    expect(screen.getByText('正在学')).toBeInTheDocument();
  });
});
