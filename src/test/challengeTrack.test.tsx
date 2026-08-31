import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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
  const LocationProbe = () => <output data-testid="location">{useLocation().pathname}{useLocation().search}</output>;
  it('renders the grade challenge list without textbook controls', () => {
    render(
      <MemoryRouter initialEntries={['/grade/3?track=challenge']}>
        <Routes>
          <Route path="/grade/:grade" element={<GradePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '三年级浅奥挑战' })).toBeInTheDocument();
    expect(screen.getByText('周期问题')).toBeInTheDocument();
    expect(screen.queryByText('分类枚举')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '人教版' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /周期问题/ })).toHaveAttribute(
      'href',
      '/kp/g3-cycle-pattern?track=challenge',
    );
  });

  it('renders extension courses in the middle tab', () => {
    render(
      <MemoryRouter initialEntries={['/grade/3?track=extension']}>
        <Routes>
          <Route path="/grade/:grade" element={<GradePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '三年级能力拓展' })).toBeInTheDocument();
    expect(screen.getByText('分类枚举')).toBeInTheDocument();
    expect(screen.getByText('巧算与验算')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '能力拓展' })).toHaveAttribute('aria-selected', 'true');
  });

  it('hides unimplemented grade tracks and redirects a direct empty-track URL to base', async () => {
    render(
      <MemoryRouter initialEntries={['/grade/6?track=extension']}>
        <Routes>
          <Route path="/grade/:grade" element={<><GradePage /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '六年级课程' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '能力拓展' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '浅奥挑战' })).not.toBeInTheDocument();
    expect(await screen.findByTestId('location')).toHaveTextContent('/grade/6');
  });
});
