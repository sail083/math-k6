import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseGeometryModel from '@/components/CourseGeometryModel';

type Point = [number, number];
const numbers = (text: string) => (text.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []).map(Number);
const cross = (a: Point, b: Point, p: Point) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const area = (points: Point[]) => Math.abs(points.reduce((sum, p, index) => {
  const next = points[(index + 1) % points.length];
  return sum + p[0] * next[1] - p[1] * next[0];
}, 0)) / 2;
function vertices(polygon: Element): Point[] {
  const [dx = 0, dy = 0, rotation = 0] = numbers(polygon.getAttribute('transform') ?? '');
  const angle = rotation * Math.PI / 180;
  return polygon.getAttribute('points')!.split(' ').map(point => {
    const [x, y] = point.split(',').map(Number);
    return [x * Math.cos(angle) - y * Math.sin(angle) + dx, x * Math.sin(angle) + y * Math.cos(angle) + dy];
  });
}

describe('area-preserving geometry demonstrations', () => {
  it.each(['g5-triangle-area', 'g5-trapezoid-area'] as const)('%s uses one scale and rotates an identical copy into a non-overlapping parallelogram', (type) => {
    render(<CourseGeometryModel type={type} />);
    const svg = screen.getByRole('img');
    const original = vertices(svg.querySelector('polygon')!);
    const trapezoid = type === 'g5-trapezoid-area';
    expect(original[1][0] - original[0][0]).toBe((trapezoid ? 7 : 6) * 25);
    expect(original[0][1] - original[2][1]).toBe(4 * 25);
    if (trapezoid) expect(original[2][0] - original[3][0]).toBe(3 * 25);
    expect(area(original) / 25 ** 2).toBe(trapezoid ? 20 : 12);
    for (const step of ['复制一个', '旋转拼接']) {
      fireEvent.click(screen.getByRole('button', { name: step }));
      const elements = svg.querySelectorAll('polygon');
      expect(elements).toHaveLength(2);
      expect(elements[1].getAttribute('points')).toBe(elements[0].getAttribute('points'));
      const copy = vertices(elements[1]);
      expect(area(copy)).toBeCloseTo(area(original), 8);
      for (let index = 0; index < original.length; index++) {
        const next = (index + 1) % original.length;
        expect(Math.hypot(copy[index][0] - copy[next][0], copy[index][1] - copy[next][1])).toBeCloseTo(Math.hypot(original[index][0] - original[next][0], original[index][1] - original[next][1]), 8);
      }
      if (step === '复制一个') expect(Math.min(...copy.map(p => p[0]))).toBeGreaterThan(Math.max(...original.map(p => p[0])));
      else {
        const [a, b] = [original[1], original[2]];
        expect(original.every(p => cross(a, b, p) <= 1e-8)).toBe(true);
        expect(copy.every(p => cross(a, b, p) >= -1e-8)).toBe(true);
        const corners = trapezoid ? [original[0], copy[3], copy[0], original[3]] : [original[0], original[1], copy[0], original[2]];
        expect(area(corners)).toBeCloseTo(2 * area(original), 8);
        for (const axis of [0, 1]) expect(corners[0][axis] + corners[2][axis]).toBeCloseTo(corners[1][axis] + corners[3][axis], 8);
      }
    }
  });
  it('keeps a fixed base and height through slant changes and moves, rather than duplicates, the cut piece', () => {
    render(<CourseGeometryModel type="g5-parallelogram-area" />);
    for (const shift of [20, 45, 70]) {
      fireEvent.change(screen.getByRole('slider'), { target: { value: shift } });
      fireEvent.click(screen.getByRole('button', { name: '原图' }));
      const svg = screen.getByRole('img');
      expect(svg.querySelectorAll('polygon')).toHaveLength(1);
      const original = vertices(svg.querySelector('polygon')!);
      const base = original[1][0] - original[0][0];
      const height = original[0][1] - original[2][1];
      expect(base / height).toBe(6 / 4);
      expect(area(original)).toBe(210 * 140);
      for (const step of ['切开', '补成长方形']) {
        fireEvent.click(screen.getByRole('button', { name: step }));
        const polygons = Array.from(svg.querySelectorAll('polygon')).map(vertices);
        expect(polygons).toHaveLength(2);
        expect(polygons.reduce((sum, polygon) => sum + area(polygon), 0)).toBe(area(original));
        if (step === '切开') {
          const cutX = Number(svg.querySelector('.geo-cut')!.getAttribute('x1'));
          expect(polygons[0].every(p => p[0] >= cutX)).toBe(true);
          expect(polygons[1].every(p => p[0] <= cutX)).toBe(true);
        }
        if (step === '补成长方形') {
          const [rest, moved] = polygons;
          // 两块位于共同斜边的两侧，边界相接但内部不重叠。
          const [a, b] = [rest[1], rest[2]];
          expect(rest.every(p => cross(a, b, p) <= 1e-8)).toBe(true);
          expect(moved.every(p => cross(a, b, p) >= -1e-8)).toBe(true);
          const points = polygons.flat();
          const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
          const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
          expect((maxX - minX) * (maxY - minY)).toBe(area(original));
          for (const corner of [[minX, minY], [maxX, minY], [minX, maxY], [maxX, maxY]]) {
            expect(points).toContainEqual(corner);
          }
        }
      }
    }
  });

  it('rearranges congruent curved sectors without overlap, preserving circle area as the boundary flattens', () => {
    render(<CourseGeometryModel type="g6-circle-area" />);
    let previousSag = Infinity;
    for (const count of [8, 12, 16, 20, 24]) {
      fireEvent.change(screen.getByRole('slider'), { target: { value: count } });
      const original = screen.getByLabelText('原圆扇形').querySelectorAll('path');
      const arranged = screen.getByLabelText('重排扇形').querySelectorAll('path');
      expect(original).toHaveLength(count);
      expect(arranged).toHaveLength(count);
      const polygons = Array.from(arranged).map((path, index) => {
        expect(path.getAttribute('d')).toBe(original[index].getAttribute('d'));
        expect(original[index].getAttribute('transform')).toBe(`translate(85 125) rotate(${index * 360 / count})`);
        const values = numbers(path.getAttribute('d')!);
        expect(values.slice(0, 2)).toEqual([0, 0]);
        const [radius, radiusY, largeArc, sweep] = [values[4], values[5], values[7], values[8]];
        expect(radius).toBe(58); expect(radiusY).toBe(radius);
        expect(largeArc).toBe(0); expect(sweep).toBe(1);
        const start = Math.atan2(values[3], values[2]), end = Math.atan2(values[10], values[9]);
        expect(end - start).toBeCloseTo(2 * Math.PI / count, 10);
        expect(Math.hypot(values[2], values[3])).toBeCloseTo(radius, 10);
        expect(Math.hypot(values[9], values[10])).toBeCloseTo(radius, 10);
        const [tx, ty, rotation] = numbers(path.getAttribute('transform')!);
        expect(path.getAttribute('transform')).toMatch(/^translate\([^)]*\) rotate\([^)]*\)$/);
        expect(rotation).toBe(index % 2 ? 180 : 0);
        const angle = rotation * Math.PI / 180;
        const local: Point[] = [[0, 0], ...Array.from({ length: 257 }, (_, sample): Point => {
          const theta = start + (end - start) * sample / 256;
          return [radius * Math.cos(theta), radius * Math.sin(theta)];
        })];
        return local.map(([x, y]): Point => [tx + x * Math.cos(angle) - y * Math.sin(angle), ty + x * Math.sin(angle) + y * Math.cos(angle)]);
      });
      const circleArea = Math.PI * 58 ** 2;
      expect(Math.abs(polygons.reduce((sum, polygon) => sum + area(polygon), 0) - circleArea) / circleArea).toBeLessThan(2e-6);
      for (let index = 0; index < polygons.length - 1; index++) {
        const current = polygons[index], next = polygons[index + 1];
        // 相邻两片共用一条半径边；取当前片最右端的弧端点。
        const endpoint = current[1][0] > current.at(-1)![0] ? current[1] : current.at(-1)!;
        expect(next[0][0]).toBeCloseTo(endpoint[0], 8);
        expect(next[0][1]).toBeCloseTo(endpoint[1], 8);
        const side = Math.sign(cross(current[0], endpoint, current[128]));
        expect(current.every(p => side * cross(current[0], endpoint, p) >= -1e-8)).toBe(true);
        expect(next.every(p => side * cross(current[0], endpoint, p) <= 1e-8)).toBe(true);
        for (let other = index + 2; other < polygons.length; other++) {
          expect(Math.max(...current.map(p => p[0]))).toBeLessThanOrEqual(Math.min(...polygons[other].map(p => p[0])) + 1e-8);
        }
      }
      const values = numbers(arranged[0].getAttribute('d')!);
      const sag = values[4] + values[3];
      expect(sag).toBeGreaterThan(0); expect(sag).toBeLessThan(previousSag);
      previousSag = sag;
      expect(Math.max(...polygons.flat().map(p => p[0]))).toBeLessThan(430);
      expect(Math.min(...polygons.flat().map(p => p[1]))).toBeGreaterThan(0);
    }
  });
});
