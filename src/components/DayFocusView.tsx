import React, { useState, useEffect, useRef } from "react";
import { WeekData, DayData, ExerciseData, SetData } from "../types";
import { 
  Check, Plus, Minus, Flame, Scale, Footprints, Play, Pause, 
  RotateCcw, Timer, Sparkles, ChevronRight, ChevronLeft, Dumbbell, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DayFocusViewProps {
  weekData: WeekData;
  onChange: (updatedData: WeekData) => void;
  activeDayId: string;
  setActiveDayId: (dayId: string) => void;
}

export default function DayFocusView({ weekData, onChange, activeDayId, setActiveDayId }: DayFocusViewProps) {
  const currentDayIndex = weekData.days.findIndex((d) => d.id === activeDayId);
  const day = weekData.days[currentDayIndex >= 0 ? currentDayIndex : 0];

  // Rest Timer State
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [initialTime, setInitialTime] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [autoTimerEnabled, setAutoTimerEnabled] = useState<boolean>(true);
  const [timerPreset, setTimerPreset] = useState<number>(90); // default 90s
  const [showRestDayConfirm, setShowRestDayConfirm] = useState<boolean>(false);

  useEffect(() => {
    setShowRestDayConfirm(false);
  }, [activeDayId]);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound generator using Web Audio API (so we don't need external audio files)
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio context not allowed or supported yet", e);
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Play alarm sound at completion
            playBeep(987.77, 0.2); // B5 note
            setTimeout(() => playBeep(987.77, 0.2), 250);
            setTimeout(() => playBeep(1318.51, 0.4), 500); // E6 note (victory sound!)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const startTimer = (seconds: number) => {
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setIsTimerRunning(true);
    playBeep(440, 0.1); // A4 note starting
  };

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      playBeep(523.25, 0.1); // C5 note
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(initialTime);
  };

  const adjustTimer = (amount: number) => {
    setTimeLeft((prev) => Math.max(0, prev + amount));
    setInitialTime((prev) => Math.max(0, prev + amount));
  };

  // State handlers
  const updateDayValue = (field: string, value: any) => {
    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      
      const parsedNum = value === "" ? null : parseFloat(value);
      if (field === "weight") return { ...d, weight: isNaN(parsedNum as number) ? null : parsedNum };
      if (field === "calories") return { ...d, calories: isNaN(parsedNum as number) ? null : parsedNum };
      if (field === "steps") return { ...d, steps: isNaN(parsedNum as number) ? null : parsedNum };
      if (field === "cardio") return { ...d, cardio: value };
      if (field === "cardioKal") return { ...d, cardioKal: isNaN(parsedNum as number) ? null : parsedNum };
      if (field === "workoutName") return { ...d, workoutName: value };

      return d;
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const updateSetValues = (exerciseId: string, setId: string, updates: Partial<SetData>) => {
    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((set) => {
              if (set.id !== setId) return set;
              return { ...set, ...updates };
            }),
          };
        }),
      };
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const handleSetCompletion = (exerciseId: string, setId: string, completed: boolean) => {
    updateSetValues(exerciseId, setId, { completed });
    
    // Auto start rest timer on checking a set!
    if (completed && autoTimerEnabled) {
      startTimer(timerPreset);
    }
  };

  const addSetToExercise = (exerciseId: string) => {
    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          
          // Get last set weight/reps as default values for the new set!
          const lastSet = ex.sets[ex.sets.length - 1];
          const defaultWeight = lastSet ? lastSet.weight : null;
          const defaultReps = lastSet ? lastSet.reps : null;

          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `set_${Math.random().toString(36).substr(2, 9)}`,
                weight: defaultWeight,
                reps: defaultReps,
                completed: false,
              },
            ],
          };
        }),
      };
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((set) => set.id !== setId),
          };
        }),
      };
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const addExerciseToDay = () => {
    const newExName = prompt("Name der neuen Übung:", "Zusatzübung");
    if (!newExName) return;

    const newEx: ExerciseData = {
      id: `ex_${Math.random().toString(36).substr(2, 9)}`,
      name: newExName,
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: `set_${Math.random().toString(36).substr(2, 9)}_${i}`,
        weight: null,
        reps: null,
        completed: false,
      })),
    };

    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      return {
        ...d,
        exercises: [...d.exercises, newEx],
      };
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const removeExerciseFromDay = (exerciseId: string) => {
    if (!confirm("Möchtest du diese Übung wirklich löschen?")) return;
    const updatedDays = weekData.days.map((d) => {
      if (d.id !== day.id) return d;
      return {
        ...d,
        exercises: d.exercises.filter((ex) => ex.id !== exerciseId),
      };
    });
    onChange({ ...weekData, days: updatedDays });
  };

  const switchDay = (direction: "prev" | "next") => {
    const totalDays = weekData.days.length;
    let nextIndex = currentDayIndex;
    if (direction === "prev") {
      nextIndex = (currentDayIndex - 1 + totalDays) % totalDays;
    } else {
      nextIndex = (currentDayIndex + 1) % totalDays;
    }
    setActiveDayId(weekData.days[nextIndex].id);
  };

  // Formatting helper for time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer Progress Percentage
  const progressPercent = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Days list & Day summary (3 cols on lg) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Day Switcher */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => switchDay("prev")}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{day.name}</h3>
            <button 
              onClick={() => switchDay("next")}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekData.days.map((d) => {
              const isActive = d.id === day.id;
              const isRest = d.workoutName === "REST DAY";
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDayId(d.id)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col justify-between items-center transition-all cursor-pointer border ${
                    isActive 
                      ? "bg-slate-850 dark:bg-indigo-600 border-slate-850 dark:border-indigo-600 text-white shadow-sm font-semibold scale-102"
                      : isRest
                        ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
                        : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-150 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {d.name.substring(0, 2)}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isActive 
                      ? "bg-white" 
                      : isRest 
                        ? "bg-amber-400" 
                        : d.exercises.length > 0 
                          ? "bg-emerald-400" 
                          : "bg-slate-200"
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Stats Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-300">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Tägliche Körper- & Vitalwerte
          </h4>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> Körpergewicht (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="Noch nicht gewogen"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:focus:ring-indigo-500/20 focus:border-emerald-400 dark:focus:border-indigo-500 font-semibold text-slate-800 dark:text-white outline-none transition-all"
                value={day.weight === null ? "" : day.weight}
                onChange={(e) => updateDayValue("weight", e.target.value)}
              />
              <span className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 text-xs font-semibold">kg</span>
            </div>
          </div>

          {/* Calories */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Kalorienzufuhr (kcal)
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                placeholder="Zufuhr eintragen"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:focus:ring-indigo-500/20 focus:border-emerald-400 dark:focus:border-indigo-500 font-semibold text-slate-800 dark:text-white outline-none transition-all"
                value={day.calories === null ? "" : day.calories}
                onChange={(e) => updateDayValue("calories", e.target.value)}
              />
              <span className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 text-xs font-semibold">kcal</span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-sky-400" /> Schritte (Steps)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                placeholder="Schrittzahl eintragen"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:focus:ring-indigo-500/20 focus:border-emerald-400 dark:focus:border-indigo-500 font-semibold text-slate-800 dark:text-white outline-none transition-all"
                value={day.steps === null ? "" : day.steps}
                onChange={(e) => updateDayValue("steps", e.target.value)}
              />
              <span className="absolute right-3.5 top-3 text-slate-400 dark:text-slate-500 text-xs font-semibold">Schritte</span>
            </div>
          </div>

          {/* Cardio Text & Cardio Kal */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cardio Übung</label>
              <input
                type="text"
                placeholder="z.B. Laufen / Schwimmen"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:focus:ring-indigo-500/20 focus:border-emerald-400 dark:focus:border-indigo-500 text-slate-800 dark:text-white outline-none text-xs transition-all"
                value={day.cardio}
                onChange={(e) => updateDayValue("cardio", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cardio Kalorien (geschätzt)</label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  placeholder="kcal verbrannt"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20 dark:focus:ring-indigo-500/20 focus:border-emerald-400 dark:focus:border-indigo-500 font-mono text-xs text-slate-800 dark:text-white outline-none transition-all"
                  value={day.cardioKal === null ? "" : day.cardioKal}
                  onChange={(e) => updateDayValue("cardioKal", e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 text-[10px] font-semibold">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* REST TIMER INTEGRATED PANEL */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold flex items-center gap-2 text-sm text-slate-200">
              <Timer className="w-4 h-4 text-emerald-400" />
              Satz-Pausen Timer
            </h4>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 font-medium cursor-pointer flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={autoTimerEnabled}
                  onChange={(e) => setAutoTimerEnabled(e.target.checked)}
                  className="rounded text-emerald-500 border-slate-700 bg-slate-800 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer" 
                />
                Autostart
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Countdown visual */}
            <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  className="stroke-slate-800" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                <motion.circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  className="stroke-emerald-400" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - timeLeft / initialTime)}
                  transition={{ ease: "linear", duration: isTimerRunning ? 1 : 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                  von {formatTime(initialTime)}
                </span>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleTimer}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1 transition-all ${
                    isTimerRunning 
                      ? "bg-rose-500 hover:bg-rose-600 text-white" 
                      : "bg-emerald-400 hover:bg-emerald-500 text-slate-900"
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isTimerRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={handleResetTimer}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer transition-colors"
                  title="Zurücksetzen"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Adjust minutes/seconds */}
              <div className="grid grid-cols-2 gap-1.5 text-center">
                <button 
                  onClick={() => adjustTimer(-30)}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  -30 Sek
                </button>
                <button 
                  onClick={() => adjustTimer(30)}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  +30 Sek
                </button>
              </div>

              {/* Standard presets selection */}
              <div className="flex items-center justify-between gap-1 text-[10px] border-t border-slate-800 pt-2">
                <span className="text-slate-500 font-medium shrink-0">Preset:</span>
                <div className="flex gap-1 overflow-x-auto py-0.5">
                  {[60, 90, 120, 180].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        setTimerPreset(sec);
                        startTimer(sec);
                      }}
                      className={`px-1.5 py-0.5 rounded-md font-mono shrink-0 cursor-pointer ${
                        timerPreset === sec 
                          ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30" 
                          : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-transparent"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Exercises listing (8 cols on lg) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Day Header Info */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aktivität am {day.name}</span>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="text"
                className="text-xl font-black text-slate-800 dark:text-white bg-transparent border-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 rounded px-1 max-w-[280px] sm:max-w-[350px] outline-none"
                value={day.workoutName}
                onChange={(e) => updateDayValue("workoutName", e.target.value)}
              />
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {day.workoutName !== "REST DAY" ? (
              <>
                {showRestDayConfirm ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 px-1">Übungen löschen?</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDays = weekData.days.map((d) => {
                          if (d.id !== day.id) return d;
                          return {
                            ...d,
                            workoutName: "REST DAY",
                            exercises: []
                          };
                        });
                        onChange({ ...weekData, days: updatedDays });
                        setShowRestDayConfirm(false);
                      }}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black transition-colors cursor-pointer"
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRestDayConfirm(false)}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRestDayConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-300 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" /> Als Rest Day festlegen
                  </button>
                )}
                <button
                  onClick={addExerciseToDay}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Übung hinzufügen
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const updatedDays = weekData.days.map((d) => {
                    if (d.id !== day.id) return d;
                    return {
                      ...d,
                      workoutName: "Push / Brust Focus",
                      exercises: [
                        {
                          id: `ex_${Math.random().toString(36).substr(2, 9)}`,
                          name: "Bankdrücken",
                          sets: Array.from({ length: 3 }, (_, i) => ({
                            id: `set_${Math.random().toString(36).substr(2, 9)}_${i}`,
                            weight: null,
                            reps: null,
                            completed: false,
                          })),
                        },
                      ],
                    };
                  });
                  onChange({ ...weekData, days: updatedDays });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Training aktivieren
              </button>
            )}
          </div>
        </div>

        {/* REST DAY Visual Card */}
        {day.workoutName === "REST DAY" || day.exercises.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center rounded-3xl space-y-4 shadow-2xs transition-colors duration-300">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center text-amber-500 mx-auto">
              <Flame className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Rest Day / Trainingsfreier Tag</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Keine Workouts für diesen Tag geplant. Nutze den Tag, um dich gut zu ernähren, spazieren zu gehen (Schritte sammeln!) und ausreichend zu schlafen.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  const updatedDays = weekData.days.map((d) => {
                    if (d.id !== day.id) return d;
                    return {
                      ...d,
                      workoutName: "Push / Brust Focus",
                      exercises: [
                        {
                          id: `ex_${Math.random().toString(36).substr(2, 9)}`,
                          name: "Bankdrücken",
                          sets: Array.from({ length: 3 }, (_, i) => ({
                            id: `set_${Math.random().toString(36).substr(2, 9)}_${i}`,
                            weight: null,
                            reps: null,
                            completed: false,
                          })),
                        },
                      ],
                    };
                  });
                  onChange({ ...weekData, days: updatedDays });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Training für diesen Tag aktivieren
              </button>
            </div>
          </div>
        ) : (
          /* Exercise Cards list */
          <div className="space-y-4">
            {day.exercises.map((ex, exIdx) => {
              const allSetsCompleted = ex.sets.length > 0 && ex.sets.every((s) => s.completed);

              return (
                <div 
                  key={ex.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
                    allSetsCompleted 
                      ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-2xs" 
                      : "border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        allSetsCompleted 
                          ? "bg-emerald-500 text-slate-900" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {allSetsCompleted ? <Check className="w-5 h-5" /> : exIdx + 1}
                      </div>
                      <div>
                        <input
                          type="text"
                          className={`font-extrabold text-base bg-transparent border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 rounded px-1 ${
                            allSetsCompleted ? "text-emerald-800 dark:text-emerald-500 line-through" : "text-slate-800 dark:text-white"
                          }`}
                          value={ex.name}
                          onChange={(e) => {
                            const updatedDays = weekData.days.map((d) => {
                              if (d.id !== day.id) return d;
                              return {
                                ...d,
                                exercises: d.exercises.map((item) => {
                                  if (item.id !== ex.id) return item;
                                  return { ...item, name: e.target.value };
                                }),
                              };
                            });
                            onChange({ ...weekData, days: updatedDays });
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => addSetToExercise(ex.id)}
                        className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        Satz +
                      </button>
                      <button
                        onClick={() => removeExerciseFromDay(ex.id)}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Übung löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content (Sets Layout) */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                      <div className="col-span-1 text-center">Satz</div>
                      <div className="col-span-5 text-center">Gewicht (kg)</div>
                      <div className="col-span-4 text-center">Wiederholungen</div>
                      <div className="col-span-2 text-center">Done</div>
                    </div>

                    {ex.sets.map((set, setIdx) => {
                      return (
                        <div 
                          key={set.id}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border ${
                            set.completed 
                              ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30" 
                              : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {/* Set Index */}
                          <div className="col-span-1 font-bold text-xs text-center text-slate-400">
                            {setIdx + 1}
                          </div>

                          {/* Weight with easy increment buttons */}
                          <div className="col-span-5 flex items-center justify-between gap-1">
                            <button
                              onClick={() => {
                                const currentWeight = set.weight || 0;
                                updateSetValues(ex.id, set.id, { weight: Math.max(0, currentWeight - 2.5) });
                              }}
                              className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="--"
                              className={`w-full text-center bg-transparent border-none text-sm font-mono focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 focus:bg-white dark:focus:bg-slate-800 rounded py-1 font-bold ${
                                set.completed ? "text-emerald-600 dark:text-emerald-450" : "text-slate-800 dark:text-white"
                              }`}
                              value={set.weight === null ? "" : set.weight}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                updateSetValues(ex.id, set.id, { weight: isNaN(val as number) ? null : val });
                              }}
                            />
                            <button
                              onClick={() => {
                                const currentWeight = set.weight || 0;
                                updateSetValues(ex.id, set.id, { weight: currentWeight + 2.5 });
                              }}
                              className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Reps with easy increment buttons */}
                          <div className="col-span-4 flex items-center justify-between gap-1">
                            <button
                              onClick={() => {
                                const currentReps = set.reps || 0;
                                updateSetValues(ex.id, set.id, { reps: Math.max(0, currentReps - 1) });
                              }}
                              className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              step="1"
                              placeholder="--"
                              className={`w-full text-center bg-transparent border-none text-sm font-mono focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 focus:bg-white dark:focus:bg-slate-800 rounded py-1 font-bold ${
                                set.completed ? "text-emerald-600 dark:text-emerald-450" : "text-slate-800 dark:text-white"
                              }`}
                              value={set.reps === null ? "" : set.reps}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                                updateSetValues(ex.id, set.id, { reps: isNaN(val as number) ? null : val });
                              }}
                            />
                            <button
                              onClick={() => {
                                const currentReps = set.reps || 0;
                                updateSetValues(ex.id, set.id, { reps: currentReps + 1 });
                              }}
                              className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Completed toggle checkbox */}
                          <div className="col-span-2 flex items-center justify-center">
                            <button
                              onClick={() => handleSetCompletion(ex.id, set.id, !set.completed)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                                set.completed 
                                  ? "bg-emerald-500 border-emerald-500 text-slate-900 dark:text-slate-900 shadow-sm" 
                                  : "bg-white dark:bg-slate-800 border-slate-250 dark:border-slate-750 hover:border-slate-400 dark:hover:border-slate-600 text-transparent"
                              }`}
                            >
                              <Check className="w-5 h-5 shrink-0" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
