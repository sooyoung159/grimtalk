'use client';

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

function encodePcm16ToWav(params: {
  pcm16: Int16Array;
  sampleRate: number;
  channels: number;
}): Blob {
  const { pcm16, sampleRate, channels } = params;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcm16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i += 1) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function convertRecordedBlobToWav16kMono(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error('Web Audio API가 지원되지 않는 환경이야.');
  }

  const decodeContext = new AudioContextCtor();

  try {
    const decoded = await decodeContext.decodeAudioData(arrayBuffer);

    const targetSampleRate = 16000;
    const targetChannels = 1;
    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));

    const offline = new OfflineAudioContext(targetChannels, frameCount, targetSampleRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start(0);

    const rendered = await offline.startRendering();
    const mono = rendered.getChannelData(0);
    const pcm16 = floatTo16BitPCM(mono);

    return encodePcm16ToWav({
      pcm16,
      sampleRate: targetSampleRate,
      channels: targetChannels,
    });
  } finally {
    await decodeContext.close();
  }
}
