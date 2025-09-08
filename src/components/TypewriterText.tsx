"use client";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  text: string;
  speedMs?: number; // delay between words
  autoStart?: boolean; // start automatically
  loop?: boolean; // restart when finished
  className?: string;
  showCursor?: boolean;
  onDone?: () => void;
  mode?: "word" | "instant"; // instant == copy/paste style
  progressive?: boolean; // do not reset when text grows (for streaming)
  wordPerLine?: boolean; // render each word on its own line
  callOnDone?: boolean; // invoke onDone when all tokens are shown
  firstDelayMs?: number; // initial pause before first token
  pauseOnPunctMs?: number; // extra pause when token ends with punctuation
  pauseOnNewlineMs?: number; // extra pause when token contains newline
  jitterRatio?: number; // +/- jitter percentage (0.0 - 1.0)
};

export default function TypewriterText({
  text,
  speedMs = 220,
  autoStart = true,
  loop = false,
  className,
  showCursor = true,
  onDone,
  mode = "word",
  progressive = false,
  wordPerLine = false,
  callOnDone = true,
  firstDelayMs = 220,
  pauseOnPunctMs = 160,
  pauseOnNewlineMs = 260,
  jitterRatio = 0.3,
}: Props) {
  // Split text into tokens
  // - wordPerLine: only words (one per step)
  // - default: preserve whitespace so inline text looks natural
  const tokens = useMemo(() => {
    if (mode === "instant") return [text];
    // Treat punctuation as a valid boundary even without trailing whitespace
    const punctBoundary = /[\.!?,;:\)\]\}\>\"'`]/;

    if (wordPerLine) {
      // Words only, one per line; only commit completed words.
      const raw = text.split(/\s+/).filter(Boolean);
      if (raw.length === 0) return [];
      const endsWithSpace = /\s$/.test(text);
      if (endsWithSpace) return raw;
      const last = raw[raw.length - 1];
      if (last && punctBoundary.test(last.slice(-1))) return raw; // accept if ends with punctuation
      return raw.slice(0, -1);
    }

    // Inline paragraph style: group each word with its following whitespace
    // so we reveal one "word group" at a time and keep paragraphs intact.
    const groups: string[] = [];
    const re = /(\S+)(\s*)/g; // word + following spaces (if any)
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const word = m[1] ?? "";
      const spaces = m[2] ?? "";
      groups.push(word + spaces);
    }
    if (groups.length === 0) return groups;
    const lastGroup = groups[groups.length - 1];
    const endsWithSpace = /\s$/.test(lastGroup);
    if (endsWithSpace) return groups;
    // No trailing space: only include last token if it ends with punctuation
    const lastChar = lastGroup.slice(-1);
    if (punctBoundary.test(lastChar)) return groups;
    return groups.slice(0, -1);
  }, [text, mode, wordPerLine]);
  const [idx, setIdx] = useState(0);

  // Reset when text changes
  useEffect(() => {
    if (!progressive) setIdx(0);
  }, [text, progressive]);

  useEffect(() => {
    if (!autoStart) return;
    if (tokens.length === 0) return;

    // Instant paste-style rendering
    if (mode === "instant") {
      // small delay to feel like a paste
      const t = setTimeout(() => setIdx(tokens.length), 60);
      return () => clearTimeout(t);
    }

    if (idx >= tokens.length) {
      if (callOnDone) onDone?.();
      if (!loop) return; // stop if not looping
      // restart after a short pause
      const t = setTimeout(() => setIdx(0), 600);
      return () => clearTimeout(t);
    }

    // Compute human-like delay: base speed + small jitter, longer on punctuation/newlines
    const currentToken = tokens[idx] ?? "";
    const endsWithPunct = /[\.!?;:,]$/.test(currentToken.trim());
    const hasNewline = /\n/.test(currentToken);
    const longWord = currentToken.trim().length > 12;
    const jitter = Math.max(1 - jitterRatio, Math.min(1 + jitterRatio, 1 + (Math.random() - 0.5) * (2 * jitterRatio)));
    let delay = Math.max(30, Math.round(speedMs * jitter));
    if (idx === 0) delay += firstDelayMs;
    if (endsWithPunct) delay += pauseOnPunctMs;
    if (hasNewline) delay += pauseOnNewlineMs;
    if (longWord) delay += 60;

    const timer = setTimeout(() => setIdx((n) => Math.min(n + 1, tokens.length)), delay);
    return () => clearTimeout(timer);
  }, [idx, autoStart, loop, onDone, speedMs, tokens, tokens.length, mode, callOnDone]);

  const visible = useMemo(() => (wordPerLine ? "" : (tokens.slice(0, idx).join("") || "")), [tokens, idx, wordPerLine]);

  return (
    wordPerLine ? (
      <div className={className}>
        {tokens.slice(0, idx).map((w, i) => (
          <div key={i}>{w}</div>
        ))}
        {showCursor && mode !== "instant" && (
          <div className="inline-block w-[1ch] text-current animate-pulse">|</div>
        )}
      </div>
    ) : (
      <span className={className}>
        {visible}
        {showCursor && mode !== "instant" && (
          <span className="inline-block w-[1ch] ml-1 text-current animate-pulse">|</span>
        )}
      </span>
    )
  );
}
