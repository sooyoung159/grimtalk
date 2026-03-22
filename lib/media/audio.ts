// Server-side media helper
// NOTE: 서버 ffmpeg 변환 전략은 Vercel 런타임 이슈로 중단(deprecated)되었고,
//       현재 입력 오디오는 클라이언트에서 WAV(16kHz mono)로 인코딩해 전달한다.

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
