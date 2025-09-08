"use client";
import React from "react";
import TypewriterText from "../../components/TypewriterText";

export default function TypingDemoPage() {
  const question = "User: How does this system answer?";
  const answer =
    "System: I respond one word at a time, like a human typing.";

  return (
    <div className="min-h-screen px-6 py-10 text-white bg-neutral-950">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Typing Demo</h1>
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
          <p className="text-stone-300">{question}</p>
          <p className="text-neutral-100">
            <TypewriterText text={answer} speedMs={240} />
          </p>
        </div>
        <div className="text-sm text-stone-400">
          Tip: Use the <code>TypewriterText</code> component anywhere you need this effect.
        </div>
      </div>
    </div>
  );
}

