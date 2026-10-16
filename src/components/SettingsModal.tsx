import React, { useState } from "react";
import { DayPlan } from "../types";
import {
  X,
  Settings,
  Dumbbell,
  Footprints,
  Coffee,
  RotateCcw,
  Sparkles,
  Check,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  getBrustRueckenGymRows,
  getArmeSchulternGymRows,
  getRestdayGymRows,
  getRestdayCardioRows,
  getTrainingDayCardioRows,
  getInitialWeek
} from "../initialData";

export type WorkoutPresetType = "brust_ruecken" | "arme_schultern" | "rest_run" | "krank_pause" | "custom";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayPlan[];
  onUpdateDayTraining: (dayId: string, preset: WorkoutPresetType, customTitle?: string) => void;
  onResetEntirePlan: () => void;
  onApplyTTRepeatPattern: () => void;
}

export const WORKOUT_PRESETS: {
  id: WorkoutPresetType;
  label: string;
  badge: string;
  description: string;
  icon: "dumbbell" | "cardio" | "rest" | "sick";
}[] = [
  {
    id: "brust_ruecken",
    label: "Brust / Rücken",
    badge: "TRAINING 1",
    description: "Latzug, Incline Bench smith, Upper back row, Butterfly, SA Lat highrow, RDL, Leg curl",
    icon: "dumbbell",
  },
  {
    id: "arme_schultern",
    label: "Arme / Schultern",
    badge: "TRAINING 2",
    description: "Schulterdrücken KH, Seitheben, Preacher curl, Pushdowns, Hammer curl, Reverse curl",
    icon: "dumbbell",
  },
  {
    id: "rest_run",
    label: "Restday: Laufen",
    badge: "RESTDAY",
    description: "Erholungstag mit Zone 2 Laufen (30-45 min, 6k-8k Schritte) im Cardio-Tab",
    icon: "cardio",
  },
  {
    id: "krank_pause",
    label: "Krank / Pause / Schonung",
    badge: "RECOVERY",
    description: "Komplette Ruhe & Regeneration (kein Krafttraining, nur Erholung)",
    icon: "sick",
  },
];

export function SettingsModal({
  isOpen,
  onClose,
  days,
  onUpdateDayTraining,
  onResetEntirePlan,
  onApplyTTRepeatPattern,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"days" | "split" | "general">("days");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18181d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#141418] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Plan-Einstellungen & Trainingstage
              </h3>
              <p className="text-xs text-zinc-400">
                Passe an, welches Workout an welchem Tag stattfindet (z.B. bei Krankheit oder Verschiebungen).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 bg-[#16161a] border-b border-white/5 flex gap-2">
          <button
            onClick={() => setActiveTab("days")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "days"
                ? "bg-[#18181d] text-cyan-300 border-white/10"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Tage anpassen (MO - SO)
          </button>
          <button
            onClick={() => setActiveTab("split")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "split"
                ? "bg-[#18181d] text-cyan-300 border-white/10"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Schnellmuster & Vorlagen
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "general"
                ? "bg-[#18181d] text-cyan-300 border-white/10"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Zurücksetzen & Infos
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "days" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Wähle pro Tag das passende Training aus:</span>
                <span className="text-[11px] font-mono text-zinc-500">Änderungen werden sofort übernommen</span>
              </div>

              <div className="space-y-2">
                {days.map((day) => {
                  // Determine current preset selection
                  const isBrust = day.focusTitle.includes("Brust");
                  const isArme = day.focusTitle.includes("Arme") || day.focusTitle.includes("Schultern");
                  const isKrank = day.focusTitle.includes("Krank") || day.focusTitle.includes("Schonung");
                  const isRest = !isBrust && !isArme && !isKrank;

                  let currentPreset: WorkoutPresetType = "rest_run";
                  if (isBrust) currentPreset = "brust_ruecken";
                  else if (isArme) currentPreset = "arme_schultern";
                  else if (isKrank) currentPreset = "krank_pause";

                  return (
                    <div
                      key={day.id}
                      className="p-3 rounded-xl bg-[#1d1d23] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black text-white">{day.label}</span>
                          <span className="text-[9px] font-mono text-zinc-400">{day.date || ""}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{day.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Aktuell: <span className="font-semibold text-zinc-200">{day.focusTitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown selector for this day's workout */}
                      <div className="flex items-center gap-2">
                        <select
                          value={currentPreset}
                          onChange={(e) => {
                            const val = e.target.value as WorkoutPresetType;
                            onUpdateDayTraining(day.id, val);
                            showFeedback(`${day.name} auf "${WORKOUT_PRESETS.find(p => p.id === val)?.label}" geändert!`);
                          }}
                          className="bg-[#141418] border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer w-full sm:w-auto"
                        >
                          <option value="brust_ruecken">🏋️ Brust / Rücken (Training 1)</option>
                          <option value="arme_schultern">🏋️ Arme / Schultern (Training 2)</option>
                          <option value="rest_run">🏃 Restday: Laufen (Restday)</option>
                          <option value="krank_pause">🛌 Krank / Pause / Schonung</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "split" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Standard Training-Training-Rest-Repeat Prinzip</span>
                </div>
                <div>
                  Setzt die gesamte Woche auf deinen Wunsch-Rhythmus zurück:
                  <ul className="list-disc list-inside mt-1.5 text-zinc-400 font-mono text-[11px] space-y-0.5">
                    <li>MO: Brust/Rücken (Training 1)</li>
                    <li>DI: Arme/Schultern (Training 2)</li>
                    <li>MI: Restday (Laufen)</li>
                    <li>DO: Brust/Rücken (Training 1)</li>
                    <li>FR: Arme/Schultern (Training 2)</li>
                    <li>SA: Restday (Laufen)</li>
                    <li>SO: Brust/Rücken (Training 1)</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    onApplyTTRepeatPattern();
                    showFeedback("Woche erfolgreich auf Training-Training-Rest-Repeat gesetzt!");
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-sm"
                >
                  Dieses Muster jetzt auf die aktuelle Woche anwenden
                </button>
              </div>

              {/* Sick / Recovery Week Option */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Schnell-Aktion: Komplette Krankheits- / Deload-Woche</span>
                </div>
                <div className="text-zinc-400 text-[11px] mb-2.5">
                  Du bist die ganze Woche krank oder im Deload? Setzt alle Tage von MO bis SO auf Schonung / Pause.
                </div>
                <button
                  onClick={() => {
                    days.forEach(d => onUpdateDayTraining(d.id, "krank_pause"));
                    showFeedback("Alle Tage auf 'Krank / Schonung' gesetzt!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
                >
                  Alle Tage auf Pause / Krank setzen
                </button>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div className="font-bold text-white mb-1">Flexibles Training-Tracking</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Deine Übungen und Sätze in den Tabellen bleiben auch bei spontanen Verschiebungen erhalten. 
                  Wenn du krank bist oder einen Trainingstag auf den nächsten Tag verschiebst, kannst du hier 
                  einfach den Tag neu zuweisen oder in der Tabelle direkt Übungen anpassen.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Kompletten Plan zurücksetzen</span>
                </div>
                <p className="text-zinc-400 text-[11px] mb-3">
                  Setzt alle Tabellen (Gym-Übungen, Ernährungsplan 3.340 kcal, Cardio, Gewichtstrack) auf den Ursprungszustand zurück.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Bist du sicher? Alle Änderungen der Woche werden auf den Standard zurückgesetzt.")) {
                      onResetEntirePlan();
                      showFeedback("Woche wurde auf den Standardplan zurückgesetzt!");
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Auf Standard zurücksetzen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#141418] border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md"
          >
            Fertig & Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
