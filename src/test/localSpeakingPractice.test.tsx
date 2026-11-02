import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalSpeakingPractice } from '@/components/LocalSpeakingPractice';

describe('local speaking practice privacy and lifecycle', () => {
  afterEach(() => { vi.restoreAllMocks(); Reflect.deleteProperty(window, 'MediaRecorder'); });

  it('keeps the text path when microphone is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<LocalSpeakingPractice />);
    fireEvent.click(screen.getByRole('button', { name: '开始录音' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('继续文字练习');
    expect(screen.getByText(/不上传/)).toBeVisible();
  });

  it('records, stops, and deletes only the in-memory object URL', async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } });
    const urls = { create: vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test'), revoke: vi.spyOn(URL, 'revokeObjectURL') };
    class Recorder { static instances: Recorder[] = []; mimeType = 'audio/webm'; ondataavailable?: (event: { data: Blob }) => void; onstop?: () => void; constructor() { Recorder.instances.push(this); } start() {} stop() { this.ondataavailable?.({ data: new Blob(['voice']) }); this.onstop?.(); } }
    Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: Recorder });
    render(<LocalSpeakingPractice />);
    fireEvent.click(screen.getByRole('button', { name: '开始录音' }));
    expect(await screen.findByRole('button', { name: '停止录音' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '停止录音' }));
    await waitFor(() => expect(screen.getByLabelText('录音回放')).toBeVisible());
    expect(urls.create).toHaveBeenCalledOnce(); expect(stopTrack).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '删除录音' }));
    expect(urls.revoke).toHaveBeenCalledWith('blob:test'); expect(screen.queryByRole('audio')).toBeNull();
  });
});
