// Lesson text uses a tiny line format so content stays plain text in the DB:
// "## Heading", "- bullet", "> key takeaway", "SAY: good phrase", "AVOID: bad phrase", anything else is a paragraph.
export type Block =
  | { k: "h"; text: string } | { k: "p"; text: string } | { k: "ul"; items: string[] }
  | { k: "tip"; items: string[] } | { k: "say"; good: string[]; bad: string[] };

export function parseLesson(src: string): Block[] {
  const out: Block[] = [];
  const last = () => out[out.length - 1];
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^##\s+(.*)/))) out.push({ k: "h", text: m[1] });
    else if ((m = line.match(/^-\s+(.*)/))) { const b = last(); b?.k === "ul" ? b.items.push(m[1]) : out.push({ k: "ul", items: [m[1]] }); }
    else if ((m = line.match(/^>\s*(.*)/))) { const b = last(); b?.k === "tip" ? b.items.push(m[1]) : out.push({ k: "tip", items: [m[1]] }); }
    else if ((m = line.match(/^(SAY|AVOID):\s*(.*)/))) {
      let b = last();
      if (b?.k !== "say") { b = { k: "say", good: [], bad: [] }; out.push(b); }
      (m[1] === "SAY" ? b.good : b.bad).push(m[2]);
    } else out.push({ k: "p", text: line });
  }
  return out;
}
