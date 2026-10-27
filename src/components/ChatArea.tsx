import React, { useRef, useEffect, useState } from "react";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  MessageCircle,
  Coffee,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { ChatMessage } from "../types";
import { speakText, stopSpeaking } from "../utils/audio";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
}

export const ChatArea: React.FC<Props> = ({
  messages,
  loading,
  onSendMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      const ok = speakText(text, () => setSpeakingId(null));
      if (ok) {
        setSpeakingId(id);
      }
    }
  };

  // Render formatted markdown text
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Format bold (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-1">
            {formattedLine}
          </li>
        );
      }

      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex gap-2 my-1 text-slate-200">
            <span className="font-semibold text-blue-400 shrink-0">{numMatch[1]}.</span>
            <span>{numMatch[2]}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed text-slate-200 my-1">
          {formattedLine}
        </p>
      );
    });
  };

  const starterCards = [
    {
      icon: <MessageCircle className="w-5 h-5 text-blue-400" />,
      title: "Sapa & Kenalan",
      desc: "Mulai obrolan santai bareng Jevin",
      prompt: "Halo Jevin! Kenalan dong, gaya ngobrol lu asik banget.",
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-400" />,
      title: "Lagi Gabut",
      desc: "Topik seru buat ngisi waktu luang",
      prompt: "Jevin, gue lagi agak gabut nih. Ceritain sesuatu yang seru atau kocak dong!",
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-emerald-400" />,
      title: "Tanya Pendapat",
      desc: "Diskusi santai soal apa aja",
      prompt: "Jevin, menurut lu gimana tips biar hari gak kerasa boring dan tetap santuy?",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      title: "Curhat Ringan",
      desc: "Obrolan hangat tanpa basa-basi",
      prompt: "Jevin, capek juga nih seharian. Bagi kata-kata penyemangat yang santai tapi kena di hati dong.",
    },
  ];

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 sm:px-4 py-6 space-y-6 max-w-4xl mx-auto w-full"
    >
      {/* Empty State / Welcome Screen */}
      {messages.length === 0 && (
        <div className="text-center py-8 sm:py-12 animate-in fade-in duration-300">
          {/* Big Jevin Avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-blue-500/80 p-1 bg-blue-950 shadow-2xl shadow-blue-500/30 mx-auto">
              <img
                src="/assets/aistudio/1792631452438_9ef1bea0.png"
                alt="Jevin Mascot"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-blue-600 border-2 border-slate-900 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
              <span>🎧 Chill Mode</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Yo! Gue Jevin 🤙
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            Teman ngobrol santai dan natural lu. Mau nanya apa aja, diskusi ringan, atau sekadar
            curhat santuy? Let's talk!
          </p>

          {/* Starter Prompts Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
            {starterCards.map((card, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(card.prompt)}
                className="group p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md hover:shadow-blue-950/40 flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-slate-800/80 group-hover:bg-blue-600/20 border border-slate-700/60 group-hover:border-blue-500/30 transition-colors">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              isUser ? "flex-row-reverse" : "flex-row"
            } animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            {/* Avatar */}
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                Lu
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-blue-500/60 p-0.5 bg-blue-950 shrink-0 shadow-md shadow-blue-500/20">
                <img
                  src="/assets/aistudio/1792631452438_9ef1bea0.png"
                  alt="Jevin"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            )}

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`relative px-4 py-3 rounded-2xl shadow-md text-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-bl-none"
                }`}
              >
                {/* Text Content */}
                <div className="space-y-1">
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedText(msg.text)
                  )}
                </div>
              </div>

              {/* Message Footer Actions */}
              <div
                className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-500 ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {!isUser && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        speakingId === msg.id ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                      }`}
                      title={speakingId === msg.id ? "Hentikan suara" : "Dengarkan suara Jevin"}
                    >
                      {speakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Salin pesan"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {loading && (
        <div className="flex items-start gap-3 animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-500/60 p-0.5 bg-blue-950 shrink-0">
            <img
              src="/assets/aistudio/1792631452438_9ef1bea0.png"
              alt="Jevin"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Jevin lagi ngetik...</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
