import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GradePage from '@/pages/GradePage';

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    progress: { passedKnowledgePoints: [], stars: {}, currentLearning: null },
    isPassed: () => false,
    getStars: () => 0,
    getMasteryStatus: () => null,
  }),
}));

describe('challenge course track', () => {
  it('renders the grade challenge list without textbook controls', () => {
    render(
      <MemoryRouter initialEntries={['/grade/3?track=challenge']}>
        <Routes>
          <Route path="/grade/:grade" element={<GradePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '三年级思维挑战' })).toBeInTheDocument();
    expect(screen.getByText('周期问题')).toBeInTheDocument();
    expect(screen.getByText('分类枚举')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '人教版' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /周期问题/ })).toHaveAttribute(
      'href',
      '/kp/g3-cycle-pattern?track=challenge',
    );
  });
});
