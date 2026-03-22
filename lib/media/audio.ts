import { access, chmod, copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

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

let ffmpegPathCache: string | null = null;
const ffmpegTmpPath = path.join(tmpdir(), 'grimtalk-ffmpeg');

async function ensureExecutable(pathToCheck: string): Promise<boolean> {
  try {
    await access(pathToCheck, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function prepareFfmpegInTmp(sourcePath: string): Promise<string> {
  const alreadyPrepared = await ensureExecutable(ffmpegTmpPath);
  if (alreadyPrepared) {
    return ffmpegTmpPath;
  }

  try {
    await copyFile(sourcePath, ffmpegTmpPath);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new AudioConversionError(
      '오디오 변환 도구(ffmpeg)를 준비하지 못했어. 서버 런타임 설정을 확인해줘.',
      `[ffmpeg-copy-failed] source=${sourcePath}, target=${ffmpegTmpPath}, reason=${detail}`,
    );
  }

  try {
    await chmod(ffmpegTmpPath, 0o755);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new AudioConversionError(
      '오디오 변환 도구(ffmpeg) 실행 권한을 준비하지 못했어. 서버 런타임 설정을 확인해줘.',
      `[ffmpeg-chmod-failed] target=${ffmpegTmpPath}, reason=${detail}`,
    );
  }

  const executable = await ensureExecutable(ffmpegTmpPath);
  if (!executable) {
    throw new AudioConversionError(
      '오디오 변환 도구(ffmpeg) 실행 파일을 준비했지만 실행할 수 없어. 배포 런타임 설정을 확인해줘.',
      `[ffmpeg-not-executable-after-chmod] target=${ffmpegTmpPath}`,
    );
  }

  return ffmpegTmpPath;
}

async function resolveFfmpegPath(): Promise<string> {
  if (ffmpegPathCache) return ffmpegPathCache;

  const envPath = process.env.FFMPEG_PATH || null;

  if (envPath) {
    const envExecutable = await ensureExecutable(envPath);
    if (envExecutable) {
      ffmpegPathCache = envPath;
      return envPath;
    }

    // env 경로가 있으나 실행 불가하면 /tmp로 복사 시도
    ffmpegPathCache = await prepareFfmpegInTmp(envPath);
    return ffmpegPathCache;
  }

  const staticPath = ffmpegStatic || null;
  if (!staticPath) {
    throw new AudioConversionError(
      '오디오 변환 도구(ffmpeg) 경로를 찾지 못했어. ffmpeg-static 설치 상태를 확인해줘.',
      'No ffmpeg binary path found from FFMPEG_PATH or ffmpeg-static.',
    );
  }

  // ffmpeg-static은 배포 번들 경로(/var/task 등)에서 실행 권한 이슈가 날 수 있어
  // 항상 /tmp로 복사 후 실행한다.
  ffmpegPathCache = await prepareFfmpegInTmp(staticPath);
  return ffmpegPathCache;
}

async function runFfmpeg(args: string[]): Promise<void> {
  const ffmpegPath = await resolveFfmpegPath();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      const detail = err instanceof Error ? err.message : String(err);
      reject(new AudioConversionError('오디오 변환 도구(ffmpeg)를 실행하지 못했어. 서버 설정을 확인해줘.', `[ffmpeg-spawn-failed] path=${ffmpegPath}, reason=${detail}`));
    });

    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new AudioConversionError('오디오 변환에 실패했어. 다른 오디오 파일로 다시 시도해줘.', `[ffmpeg-exit-nonzero] code=${code}, stderr=${stderr || '<empty>'}`));
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
    if (e instanceof AudioConversionError) throw e;

    const message = e instanceof Error ? e.message : String(e);

    if (message.includes('ENOENT') || message.includes('ffmpeg')) {
      throw new AudioConversionError(
        '오디오 변환 도구(ffmpeg)를 찾거나 실행하지 못했어. ffmpeg 배포 설정을 확인해줘.',
        `[ffmpeg-runtime-error] ${message}`,
      );
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
