import React from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { PersonaType } from "../types";

interface Props {
  persona: PersonaType;
  onSelectPersona: (p: PersonaType) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetChat: () => void;
}

export const Navbar: React.FC<Props> = ({
  persona,
  onSelectPersona,
  soundEnabled,
  onToggleSound,
  onResetChat,
}) => {
  const personaLabels: Record<PersonaType, { label: string; emoji: string; desc: string }> = {
    santai: { label: "Santai Gaul", emoji: "🤙", desc: "Bestie tongkrongan yang asik & santuy" },
    kalem: { label: "Sahabat Kalem", emoji: "🍵", desc: "Adem, hangat, enak buat curhat" },
    humor: { label: "Mode Lucu", emoji: "🤣", desc: "Suka bercanda, receh & bikin happy" },
    kritis: { label: "Pengulas Kritis", emoji: "🧐", desc: "Wawasan mendalam & lugas" },
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Left: Jevin Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-blue-500/80 p-0.5 bg-blue-950 shadow-md shadow-blue-500/20">
              <img
                src="/assets/aistudio/1792631452438_9ef1bea0.png"
                alt="Jevin Mascot"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-sm animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                Jevin
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              <span>Teman Ngobrol Santai & Asik</span>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Persona selector dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 hover:border-blue-500/50 text-xs font-medium text-slate-200 transition-all shadow-sm"
              title="Ubah gaya bicara Jevin"
            >
              <span>{personaLabels[persona].emoji}</span>
              <span className="hidden sm:inline">{personaLabels[persona].label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-xl hidden group-hover:block hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Gaya Bicara Jevin
              </div>
              {(Object.keys(personaLabels) as PersonaType[]).map((key) => {
                const item = personaLabels[key];
                return (
                  <button
                    key={key}
                    onClick={() => onSelectPersona(key)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                      persona === key
                        ? "bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <div className="leading-tight">
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              soundEnabled
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-400"
            }`}
            title={soundEnabled ? "Efek Suara Aktif" : "Efek Suara Mati"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset chat */}
          <button
            onClick={onResetChat}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors"
            title="Mulai obrolan baru"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
