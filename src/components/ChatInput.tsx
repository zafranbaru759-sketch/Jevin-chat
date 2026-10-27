import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Sparkles, Lightbulb } from "lucide-react";

interface Props {
  onSendMessage: (message: string) => void;
  loading: boolean;
  onQuickPrompt: (prompt: string) => void;
}

export const ChatInput: React.FC<Props> = ({
  onSendMessage,
  loading,
  onQuickPrompt,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser kamu belum mendukung input suara Speech Recognition.");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const quickPills = [
    { label: "Sapa Jevin 👋", prompt: "Halo Jevin, lagi santai ya? Lagi ngapain nih?" },
    { label: "Lagi Gabut 🥱", prompt: "Gue lagi gabut banget nih, ada topik obrolan seru gak buat dibahas bareng?" },
    { label: "Cerita Lucu 🤣", prompt: "Jevin, ceritain sesuatu yang kocak atau jokes santai dong biar mood naik!" },
    { label: "Penyemangat ☕", prompt: "Lagi butuh semangat hari ini, bagi kata-kata penyemangat yang santai tapi ngena dong!" },
    { label: "Tips Anti Overthinking 💡", prompt: "Jevin, menurut lu gimana caranya biar kita gak gampang overthinking dan tetap rileks?" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4">
      {/* Quick Topic Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1 text-[11px] pl-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Ide Obrolan:</span>
        </span>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => onQuickPrompt(pill.prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500/40 text-[11px] whitespace-nowrap transition-all shrink-0 cursor-pointer"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input Container */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-slate-900/95 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-2 shadow-xl shadow-slate-950/60 transition-all"
      >
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title={isListening ? "Sedang mendengarkan... Klik untuk berhenti" : "Ketik lewat suara (Speech-to-Text)"}
        >
          {isListening ? <Mic className="w-5 h-5 text-red-400" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Bicara sekarang... Jevin lagi mendengarkan..."
              : "Tanya Jevin apa aja... Ngobrol santai dan natural"
          }
          rows={1}
          className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-2 px-1 max-h-32"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-md shadow-blue-900/30 shrink-0 cursor-pointer"
          title="Kirim pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-2">
        <span>Tekan Enter untuk kirim, Shift+Enter untuk baris baru</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Didukung Gemini AI & Gaya Bicara Santai
        </span>
      </div>
    </div>
  );
};
