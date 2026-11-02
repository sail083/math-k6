import { describe, expect, it } from 'vitest';
import { loadKnowledgePointDetail } from '@/lib/content';

describe('fraction question correctness', () => {
  it('states the equal-part conditions and measured whole consistently in the teaching text', async () => {
    const course = await loadKnowledgePointDetail('g3-fraction-intro');
    expect(course!.explanation).toContain('蛋糕平均分成 2 份');
    expect(course!.explanation).toContain('甘蔗切成 4 段等长');
    expect(course!.explanation).toContain('吃掉的长度占原来全长');
    expect(course!.explanation).toContain('不等大的块不能只靠数块数判断');
    expect(course!.explanation).not.toContain('分数必须是**平均分**的结果');
  });
  it('offers only one mathematically correct option for a sum of one whole', async () => {
    const course = await loadKnowledgePointDetail('g3-fraction-add-sub');
    const question = course!.game!.questions.find((item) => item.id === 'q4')!;
    const value = (text: string) => {
      const [numerator, denominator = 1] = text.split('/').map(Number);
      return numerator / denominator;
    };
    const correct = question.options!.filter((option) => value(option) === 1 / 3 + 2 / 3);
    expect(correct).toHaveLength(1);
    expect(correct[0]).toBe(question.correctAnswer);
    expect(question.explanation).toContain('7/7=1');
  });

  it('requires equal parts and keeps a collection as the named whole in the fresh assessment', async () => {
    const course = await loadKnowledgePointDetail('g3-fraction-intro');
    const partition = course!.game!.questions.find((item) => item.id === 'q1')!;
    expect(partition.correctAnswer).toBe('不对，大小不等，不能把每块都叫作1/6');
    expect(partition.explanation).toContain('不等大的块仍可测量');
    const whole = course!.game!.questions.find((item) => item.id === 'q4')!;
    expect(whole.prompt).toContain('两条同样长的纸带合起来看作一个整体');
    expect(whole.correctAnswer).toBe('1/2');
    expect(course!.explanation).toContain('多个物体也能合成一个整体');
    expect(course!.explanation).toContain('按同一种小份数分子和分母');
    expect(course!.explanation).toContain('从一份知道怎样补完整');
    expect(course!.explanation).toContain('部分变了，比较的整体可以不变');
  });

  it('accepts equivalent fraction aliases for fill-blank answers', async () => {
    const course = await loadKnowledgePointDetail('g3-fraction-add-sub');
    const question = course!.game!.questions.find((item) => item.id === 'q6')!;
    expect(question.type).toBe('fill-blank');
    expect(question.correctAnswer).toEqual(['6/10', '3/5']);
  });
});
