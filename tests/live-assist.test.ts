import { describe, expect, it } from "vitest";
import { segmenter, wav } from "@/lib/live-assist-audio";

const chunk = (amp: number) => new Int16Array(2048).fill(amp);

describe("live assist audio", () => {
  it("cuts a turn after speech followed by silence, with preroll", () => {
    const turns: number[] = [];
    const feed = segmenter((pcm) => turns.push(pcm.length));
    for (let i = 0; i < 5; i++) feed(chunk(0)); // leading silence
    for (let i = 0; i < 10; i++) expect(feed(chunk(3000))).toBe(true); // ~1.3s speech
    for (let i = 0; i < 8; i++) feed(chunk(0)); // ~1s silence ends the turn
    expect(turns).toEqual([(2 + 10 + 8) * 2048]);
  });

  it("drops clicks that are too short and gated (bleed) sound", () => {
    const turns: number[] = [];
    const feed = segmenter((pcm) => turns.push(pcm.length));
    feed(chunk(3000));
    for (let i = 0; i < 10; i++) feed(chunk(0));
    for (let i = 0; i < 10; i++) expect(feed(chunk(3000), true)).toBe(false);
    expect(turns).toEqual([]);
  });

  it("writes a valid 16kHz mono WAV header", () => {
    const v = new DataView(wav(new Int16Array(10)));
    expect(v.byteLength).toBe(64);
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getUint16(22, true)).toBe(1);
  });
});
