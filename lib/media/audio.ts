import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

export type WavConversionResult = {
  buffer: Buffer;
  mimeType: 'audio/wav';
  format: 'wav';
  byteSize: number;
};

export class AudioConversionError extends Error {
  constructor(public readonly userMessage: string, public readonly detail?: string) {
    super(userMessage);
    this.name = 'AudioConversionError';
  }
}

function extFromMime(mimeType: string): string {
  const m = mimeType.toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('x-m4a') || m.includes('m4a')) return 'm4a';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('aac')) return 'aac';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'bin';
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function convertAudioToWav(input: { buffer: Buffer; mimeType: string }): Promise<WavConversionResult> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'grimtalk-audio-'));
  const inputPath = path.join(workDir, `input.${extFromMime(input.mimeType)}`);
  const outputPath = path.join(workDir, 'output.wav');

  try {
    await writeFile(inputPath, input.buffer);

    // wav 표준화: pcm_s16le, mono, 16kHz
    await runFfmpeg(['-y', '-i', inputPath, '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', outputPath]);

    const wavBuffer = await readFile(outputPath);
    return {
      buffer: wavBuffer,
      mimeType: 'audio/wav',
      format: 'wav',
      byteSize: wavBuffer.length,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    if (message.includes('spawn ffmpeg ENOENT')) {
      throw new AudioConversionError('오디오 변환 도구(ffmpeg)를 찾지 못했어. 서버 설정을 확인해줘.', message);
    }

    throw new AudioConversionError('오디오를 읽을 수 있는 형식(wav)으로 변환하지 못했어. 다시 녹음해서 시도해줘.', message);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export function wrapPcm16ToWav(input: {
  pcm: Buffer;
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
}): Buffer {
  const sampleRate = input.sampleRate ?? 24000;
  const channels = input.channels ?? 1;
  const bitsPerSample = input.bitsPerSample ?? 16;
  const pcm = input.pcm;

  // TODO: sampleRate/channels/bitsPerSample(24000/1/16)은 현재 Kanana 예시 기반 가정값.
  //       실제 스펙이 확인되면 상수화/동기화 필요.

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);

  return buffer;
}
