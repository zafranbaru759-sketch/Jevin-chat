import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
  Mic,
  MicOff,
  Copy,
  Check,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { ChatMessage, PersonaType } from "./types";
import { sounds, speakText, stopSpeaking } from "./utils/audio";

const STORAGE_KEY_CHAT = "jevin_chat_history_v1";
const STORAGE_KEY_PERSONA = "jevin_persona_v1";
const STORAGE_KEY_SOUND = "jevin_sound_enabled_v1";

const PERSONA_CONFIG: Record<
  PersonaType,
  { label: string; emoji: string; desc: string }
> = {
  santai: {
    label: "Santai Gaul",
    emoji: "🤙",
    desc: "Bestie tongkrongan yang asik & santuy",
  },
  kalem: {
    label: "Sahabat Kalem",
    emoji: "🍵",
    desc: "Adem, hangat, enak buat curhat",
  },
  humor: {
    label: "Mode Lucu",
    emoji: "🤣",
    desc: "Suka bercanda, receh & bikin happy",
  },
  kritis: {
    label: "Pengulas Kritis",
    emoji: "🧐",
    desc: "Wawasan mendalam & opini lugas",
  },
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [
      {
        id: "init-1",
        role: "user",
        text: "Halo Jevin, lagi santai ya? Lagi ngapain nih?",
        timestamp: Date.now() - 1000 * 60 * 5,
      },
      {
        id: "init-2",
        role: "model",
        text: "Yoi, lagi santai maksimal nih gue! Lagi chill aja sambil ngopi santuy biar makin dapet vibes rileksnya.\n\nAda cerita seru atau pertanyaan apa nih yang mau diobrolin bareng?",
        timestamp: Date.now() - 1000 * 60 * 4,
      },
    ];
  });

  const [persona, setPersona] = useState<PersonaType>(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem(STORAGE_KEY_PERSONA) as PersonaType;
      if (p && ["santai", "kalem", "humor", "kritis"].includes(p)) {
        return p;
      }
    }
    return "santai";
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(STORAGE_KEY_SOUND);
      return s !== "false";
    }
    return true;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  // Sync sounds state
  useEffect(() => {
    sounds.enabled = soundEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
  }, [soundEnabled]);

  // Persist messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
  }, [messages]);

  // Persist persona
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERSONA, persona);
  }, [persona]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Close persona dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setIsPersonaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "id-ID";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser belum mendukung input suara Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;

    sounds.playSend();
    if (!textToSend) setInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          persona,
        }),
      });

      const data = await res.json();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: data.reply || "Santai bro, tadi agak ada gangguan dikit. Boleh diulang?",
        timestamp: Date.now(),
      };

      sounds.playReceive();
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "model",
        text: "Waduh koneksi Jevin lagi agak kepentok nih bro! Coba cek jaringan atau kirim ulang ya.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const handleResetChat = () => {
    if (window.confirm("Mulai sesi obrolan baru dengan Jevin?")) {
      setMessages([]);
      stopSpeaking();
      setSpeakingId(null);
    }
  };

  const quickBadges = [
    { label: "Sapa Jevin 👋", prompt: "Halo Jevin, lagi santai ya? Lagi ngapain nih?" },
    { label: "Lagi Gabut 🥱", prompt: "Jevin, gue lagi agak gabut nih. Ceritain sesuatu yang seru atau kocak dong!" },
    { label: "Cerita Lucu 🤣", prompt: "Jevin, ceritain jokes santai atau kejadian kocak yang bikin senyum dong!" },
    { label: "Penyemangat ☕", prompt: "Lagi butuh semangat hari ini, bagi kata-kata penyemangat yang santai tapi kena di hati dong!" },
    { label: "Tips Anti Overthinking 💡", prompt: "Jevin, menurut lu gimana caranya biar kita gak gampang overthinking dan tetap rileks?" },
  ];

  const formatMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formatted = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-[#1a2a3a]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <p key={idx} className="my-1 leading-relaxed">
          {formatted}
        </p>
      );
    });
  };

  return (
    <div className="w-full h-screen flex justify-center items-center p-0 md:p-6 select-text">
      {/* App Window container */}
      <div className="w-full h-full md:w-[1100px] md:h-[88vh] bg-white border border-[rgba(26,42,58,0.08)] md:shadow-[0_20px_50px_rgba(0,50,150,0.1)] flex flex-col md:grid md:grid-cols-[280px_1fr] overflow-hidden md:rounded-[4px] relative">
        {/* Left Sidebar (Aside) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-[#fdfdfe] border-r border-[rgba(26,42,58,0.08)] p-8 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
            isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end mb-2">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded text-[#1a2a3a]/60 hover:text-[#1a2a3a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Jevin Avatar Circle */}
          <div className="w-20 h-20 bg-[#2272ff] rounded-full mb-6 overflow-hidden p-0.5 border-2 border-[#2272ff] shadow-sm">
            <img
              src="/assets/aistudio/1792631452438_9ef1bea0.png"
              alt="Jevin Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="font-mono-meta text-[0.65rem] uppercase tracking-[0.15em] text-[#1a2a3a] opacity-50 mb-2">
            AGENT ID: JV-01
          </div>

          <h1 className="font-syne font-extrabold text-[1.6rem] tracking-[-0.04em] text-[#1a2a3a] mb-6">
            Jevin
          </h1>

          <div className="font-mono-meta text-[0.65rem] uppercase tracking-[0.15em] text-[#1a2a3a] opacity-50 mt-auto pt-6 border-t border-[rgba(26,42,58,0.08)]">
            Quick Actions
          </div>

          <nav className="mt-4 flex flex-col gap-2">
            {quickBadges.map((badge, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleSendMessage(badge.prompt);
                  setIsMobileSidebarOpen(false);
                }}
                disabled={loading}
                className="font-mono-meta text-[0.7rem] text-[#1a2a3a] opacity-70 hover:opacity-100 hover:text-[#2272ff] py-2 border-b border-[rgba(26,42,58,0.08)] text-left transition-all cursor-pointer truncate"
              >
                {badge.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
          {/* Header */}
          <header className="px-5 py-5 md:px-12 md:py-8 flex justify-between items-center border-b border-[rgba(26,42,58,0.08)] bg-white z-10 shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile menu hamburger */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-1.5 rounded text-[#1a2a3a]/70 hover:text-[#1a2a3a]"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <span className="font-mono-meta text-[0.65rem] uppercase tracking-[0.15em] text-[#1a2a3a] opacity-50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  STATUS: ONLINE
                </span>
                <h2 className="font-syne font-bold text-base md:text-[1.15rem] text-[#1a2a3a] mt-1">
                  Teman Ngobrol Santai
                </h2>
              </div>
            </div>

            {/* Persona Selector Badge */}
            <div className="relative" ref={personaRef}>
              <button
                onClick={() => setIsPersonaMenuOpen((prev) => !prev)}
                className="font-mono-meta text-[0.7rem] bg-[#2272ff] hover:bg-[#1a5ed8] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Pilih Gaya Bicara Jevin"
              >
                <span>{PERSONA_CONFIG[persona].emoji}</span>
                <span>{PERSONA_CONFIG[persona].label}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {/* Persona dropdown menu */}
              {isPersonaMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[rgba(26,42,58,0.12)] rounded-md shadow-xl p-1.5 z-50">
                  <div className="font-mono-meta text-[0.65rem] uppercase tracking-[0.1em] text-[#1a2a3a] opacity-50 px-2 py-1">
                    Gaya Bicara Jevin
                  </div>
                  {(Object.keys(PERSONA_CONFIG) as PersonaType[]).map((key) => {
                    const item = PERSONA_CONFIG[key];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setPersona(key);
                          setIsPersonaMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center gap-2 transition-colors ${
                          persona === key
                            ? "bg-[#f0f4ff] text-[#2272ff] font-semibold"
                            : "text-[#1a2a3a] hover:bg-[#f8faff]"
                        }`}
                      >
                        <span className="text-base">{item.emoji}</span>
                        <div>
                          <div className="font-medium text-[#1a2a3a]">{item.label}</div>
                          <div className="text-[10px] text-[#1a2a3a] opacity-50">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </header>

          {/* Floating Actions on Top-Right (Sound & Reset) */}
          <div className="absolute right-4 md:right-8 top-20 md:top-24 z-20 flex flex-col gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="w-9 h-9 border border-[rgba(26,42,58,0.08)] bg-white hover:bg-[#f8faff] shadow-sm flex items-center justify-center text-[#1a2a3a] rounded-sm transition-colors cursor-pointer"
              title={soundEnabled ? "Efek Suara Aktif (Klik untuk matikan)" : "Efek Suara Mati (Klik untuk aktifkan)"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#2272ff]" />
              ) : (
                <VolumeX className="w-4 h-4 opacity-40" />
              )}
            </button>

            <button
              onClick={handleResetChat}
              className="w-9 h-9 border border-[rgba(26,42,58,0.08)] bg-white hover:bg-[#f8faff] shadow-sm flex items-center justify-center text-[#1a2a3a] rounded-sm transition-colors cursor-pointer"
              title="Mulai Sesi Baru"
            >
              <RotateCcw className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>

          {/* Chat Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-6 md:px-12 md:py-8 flex flex-col gap-6 md:gap-7"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[72%] ${
                    isUser
                      ? "self-end items-end"
                      : "self-start items-start"
                  }`}
                >
                  <div
                    className={`p-4 md:px-6 md:py-5 text-[0.95rem] leading-[1.6] rounded-[2px] ${
                      isUser
                        ? "bg-[#1a2a3a] text-white"
                        : "bg-[#f0f4ff] text-[#1a2a3a] border-l-4 border-[#2272ff]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      formatMessageText(msg.text)
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <span className="font-mono-meta text-[0.6rem] text-[#1a2a3a] opacity-40">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className={`p-1 rounded transition-colors ${
                            speakingId === msg.id
                              ? "text-[#2272ff]"
                              : "text-[#1a2a3a] opacity-35 hover:opacity-80"
                          }`}
                          title="Dengarkan suara"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 rounded text-[#1a2a3a] opacity-35 hover:opacity-80 transition-colors"
                          title="Salin teks"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="self-start flex flex-col gap-1.5 max-w-[70%]">
                <div className="p-4 px-6 text-[0.95rem] bg-[#f0f4ff] text-[#1a2a3a] border-l-4 border-[#2272ff] rounded-[2px] flex items-center gap-2">
                  <span className="font-mono-meta text-xs text-[#2272ff]">
                    Jevin lagi mikir
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#2272ff] animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#2272ff] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#2272ff] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Composer */}
          <footer className="p-4 md:px-12 md:py-7 border-t border-[rgba(26,42,58,0.08)] bg-white shrink-0">
            <div className="flex items-center gap-2 bg-[#f8faff] p-2 rounded-lg border border-[rgba(26,42,58,0.08)] focus-within:border-[#2272ff]/50 transition-colors">
              {/* Mic button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-500/15 text-red-500 animate-pulse"
                    : "text-[#1a2a3a]/40 hover:text-[#1a2a3a]"
                }`}
                title={isListening ? "Mendengarkan..." : "Input suara (Speech-to-Text)"}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-red-500" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Mendengarkan ucapanmu..."
                    : "Ketik pesan santai kamu..."
                }
                className="flex-1 bg-transparent border-none py-2 px-2 text-[#1a2a3a] placeholder-[rgba(26,42,58,0.4)] text-[0.95rem] outline-none"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                className="bg-[#2272ff] hover:bg-[#1a5ed8] disabled:opacity-40 text-white font-syne font-bold text-[0.9rem] px-6 py-2.5 rounded-[4px] border-none transition-all cursor-pointer"
              >
                Kirim
              </button>
            </div>

            <div className="mt-3.5 flex justify-between items-center px-1">
              <span className="font-mono-meta text-[0.6rem] text-[#1a2a3a] opacity-40">
                Shift+Enter to add a line
              </span>
              <span className="font-mono-meta text-[0.6rem] text-[#2272ff] flex items-center gap-1">
                Powered by Gemini AI ✦
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
