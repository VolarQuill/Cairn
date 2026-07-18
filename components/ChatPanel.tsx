"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { Icon } from "@/components/icons";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?courseId=${courseId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setErr("");
    const userMsg: Msg = { id: "u" + Date.now(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed.");
      setMessages((m) => [
        ...m,
        { id: data.messageId, role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      setErr(e.message);
      setMessages((m) => [
        ...m,
        {
          id: "e" + Date.now(),
          role: "assistant",
          content: "_Sorry, I hit an error. Please try again._",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, action: "clear" }),
    });
    setMessages([]);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-cream-300 bg-cream-50 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-bark-50">
            <div className="text-forest-200">
              <Icon name="chat" size={32} />
            </div>
            <p className="mt-2 max-w-sm">
              Ask anything about this course. Cairn answers from your own material.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-forest-200 text-cream-50"
                  : "border border-cream-300 bg-cream-100"
              }`}
            >
              {m.role === "assistant" ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <span className="text-sm">{m.content}</span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-cream-300 bg-cream-100 px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-bark-50" />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-bark-50 [animation-delay:200ms]" />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-bark-50 [animation-delay:400ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && <p className="mt-2 text-sm text-terracotta-200">{err}</p>}

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ask about the course…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-amber px-5" disabled={loading}>
          Send
        </button>
        {messages.length > 0 && (
          <button type="button" onClick={clear} className="btn-ghost px-4">
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
