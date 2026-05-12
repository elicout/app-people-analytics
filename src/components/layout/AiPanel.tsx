"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRightIcon, SparklesIcon } from "@heroicons/react/24/solid";
import type { ChatMessage } from "@/types";

const STRIP_WIDTH = 36;
const MIN_WIDTH = 350;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = MIN_WIDTH;

interface AiPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  teamId: string;
}

export default function AiPanel({ collapsed, onToggle, teamId }: AiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const panelWidthRef = useRef(DEFAULT_WIDTH);
  panelWidthRef.current = panelWidth;
  const bottomRef = useRef<HTMLDivElement>(null);

  void teamId;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidthRef.current;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json() as { response?: string; error?: string };
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.response ?? data.error ?? "Something went wrong.",
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Failed to reach the AI.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const totalWidth = collapsed ? STRIP_WIDTH : STRIP_WIDTH + panelWidth;

  return (
    <div
      className="shrink-0 h-full bg-white border-r border-slate-200 overflow-hidden"
      style={{
        width: totalWidth,
        transition: !mounted || isDragging ? "none" : "width 300ms ease-in-out",
      }}
    >
      <div className="h-full flex" style={{ width: STRIP_WIDTH + panelWidth }}>

        {/* ── Permanent left strip ── */}
        <div
          className={`shrink-0 h-full flex flex-col items-center pt-3 gap-1.5 border-r ${collapsed ? "border-transparent" : "border-slate-200"}`}
          style={{ width: STRIP_WIDTH }}
        >
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
            title={collapsed ? "Expandir" : "Minimizar"}
          >
            <ChevronRightIcon
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${collapsed ? "rotate-0" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* ── Chat content ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ display: collapsed ? "none" : undefined }}>
          {/* Header */}
          <div className="shrink-0 px-4 py-3 flex items-center gap-2">
            <p className="text-[14px] font-semibold text-gray-600">Assistente IA</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col space-y-3">
            {messages.length === 0 && (
              <>
                <div className="pt-6 text-center space-y-2">
                  <SparklesIcon className="w-6 h-6 text-gray-200 mx-auto" />
                  <p className="text-sm text-gray-400">Pergunte algo sobre a sua equipe.</p>
                </div>
                <div className="mt-auto pb-2 space-y-1">
                  {[
                    "Quem tem mais horas extras este mês?",
                    "Qual é a pontuação média de performance?",
                    "Mostra a distribuição de tempo de casa",
                  ].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="block w-full text-left text-xs text-gray-400 hover:text-purple-400 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-white text-gray-800"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre a equipa..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>

        {/* Drag handle on the right edge */}
        <div
          className="w-1.5 shrink-0 cursor-col-resize group"
          style={{ display: collapsed ? "none" : undefined }}
          onMouseDown={handleDragStart}
        >
          <div className="w-px h-full mx-auto group-hover:bg-gray-300 transition-colors" />
        </div>

      </div>
    </div>
  );
}
