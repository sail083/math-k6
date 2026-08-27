import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ProgressData } from '@/lib/types';
import KnowledgePointPage from '@/pages/KnowledgePointPage';

const mockSetGoal = vi.fn();
const mockEmitEvent = vi.fn();
let mockProgress: ProgressData;
let latestKnowledgePointProps: Record<string, unknown> = {};

const makeCourse = (id: string, title: string) => ({
  meta: {
    id,
    title,
    grade: 3,
    unit: 1,
    objectives: [],
    prerequisites: [],
    textbookRefs: [],
    vizType: 'fraction-pie' as const,
    hasFormula: false,
  },
  explanation: '',
});

const previousCourse = makeCourse('course-previous', '上一课标题');
const currentCourse = makeCourse('g3-fraction-intro', '当前课标题');
const nextCourse = makeCourse('course-next', '下一课标题');

vi.mock('@/lib/content', () => ({
  loadKnowledgePointDetail: vi.fn(async () => currentCourse),
  getTextbookRef: vi.fn(() => undefined),
  getCurriculum: vi.fn(() => [previousCourse, currentCourse, nextCourse]),
}));

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    progress: mockProgress,
    setGoal: mockSetGoal,
    emitEvent: mockEmitEvent,
  }),
}));

vi.mock('@/components/KnowledgePoint', () => ({
  default: (props: Record<string, unknown>) => {
    latestKnowledgePointProps = props;
    return (
      <div data-testid="knowledge-point">
        <span>{String(props.nextCourseTitle ?? '')}</span>
        <span>{String(props.nextActionLabel ?? '')}</span>
        <button type="button" onClick={() => (props.onNextCourse as (() => void) | undefined)?.()}>
          mocked-next
        </button>
        <button type="button" onClick={() => (props.onCoursePassed as (() => void) | undefined)?.()}>
          mocked-pass
        </button>
      </div>
    );
  },
}));

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}{useLocation().search}</output>;
}

function renderPage(search = '', goal?: ProgressData['learningGoal']) {
  mockProgress = {
    passedKnowledgePoints: [],
    stars: {},
    learningGoal: goal,
  };
  return render(
    <MemoryRouter initialEntries={[`/kp/g3-fraction-intro${search}`]}>
      <Routes>
        <Route path="/kp/:id" element={<><KnowledgePointPage /><LocationProbe /></>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const homeGoal = {
  skillId: 'frac.notation',
  startedAt: 100,
  updatedAt: 200,
  source: 'home' as const,
};

describe('KnowledgePointPage goal continuity', () => {
  beforeEach(() => {
    mockSetGoal.mockReset();
    mockEmitEvent.mockReset();
    latestKnowledgePointProps = {};
  });

  it('renders active goal context, preserves target/version links, and continues to the map', async () => {
    renderPage('?version=人教版&target=frac.notation', homeGoal);

    expect(await screen.findByRole('complementary', { name: '学习目标' })).toBeInTheDocument();
    expect(screen.getByText('继续我的目标', { selector: '[data-testid="knowledge-point"] span' })).toBeInTheDocument();
    expect(latestKnowledgePointProps.targetSkillId).toBe('frac.notation');

    const previous = screen.getByRole('link', { name: /上一课标题/ });
    const next = screen.getByRole('link', { name: /下一课标题/ });
    for (const link of [previous, next]) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toContain('version=%E4%BA%BA%E6%95%99%E7%89%88');
      expect(href).toContain('target=frac.notation');
    }

    fireEvent.click(screen.getByRole('button', { name: 'mocked-next' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/map?target=frac.notation');
  });

  it('emits started exactly once and completed with the goal identity', async () => {
    const { rerender } = renderPage('?target=frac.notation', homeGoal);
    await screen.findByTestId('knowledge-point');

    const started = () => mockEmitEvent.mock.calls.filter(([event]) => event.eventName === 'target_learning_started');
    expect(started()).toEqual([[{
      clientEventId: 'tls:g3-fraction-intro:frac.notation:200',
      eventName: 'target_learning_started',
      skillId: 'frac.notation',
      courseId: 'g3-fraction-intro',
      properties: { surface: 'course' },
    }]]);

    rerender(
      <MemoryRouter initialEntries={['/kp/g3-fraction-intro?target=frac.notation']}>
        <Routes>
          <Route path="/kp/:id" element={<><KnowledgePointPage /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(started()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'mocked-pass' }));
    expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'tlc:g3-fraction-intro:frac.notation:200',
      eventName: 'target_learning_completed',
      skillId: 'frac.notation',
      courseId: 'g3-fraction-intro',
      properties: { surface: 'course' },
    });
  });

  it('sets a different published URL target with course source', async () => {
    renderPage('?target=frac.unit_fraction', homeGoal);
    await screen.findByTestId('knowledge-point');
    expect(mockSetGoal).toHaveBeenCalledTimes(1);
    expect(mockSetGoal).toHaveBeenCalledWith('frac.unit_fraction', 'course');
  });

  it('does not overwrite a same-skill home goal', async () => {
    renderPage('?target=frac.notation', homeGoal);
    await screen.findByTestId('knowledge-point');
    expect(mockSetGoal).not.toHaveBeenCalled();
  });

  it('falls back from an invalid URL target to valid stored goal without overwriting or propagating invalid input', async () => {
    renderPage('?version=苏教版&target=not-a-skill', homeGoal);
    await screen.findByTestId('knowledge-point');

    expect(mockSetGoal).not.toHaveBeenCalled();
    expect(latestKnowledgePointProps.targetSkillId).toBe('frac.notation');
    expect(screen.getByRole('link', { name: /上一课标题/ })).toHaveAttribute(
      'href',
      '/kp/course-previous?version=%E8%8B%8F%E6%95%99%E7%89%88&target=frac.notation',
    );
  });

  it('keeps the original continuous-course action when there is no active goal', async () => {
    renderPage('?version=全部');
    await screen.findByTestId('knowledge-point');

    expect(latestKnowledgePointProps.nextCourseTitle).toBe('下一课标题');
    expect(latestKnowledgePointProps.nextActionLabel).toBeUndefined();
    expect(latestKnowledgePointProps.targetSkillId).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'mocked-next' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/kp/course-next?version=%E5%85%A8%E9%83%A8'));
  });
});
