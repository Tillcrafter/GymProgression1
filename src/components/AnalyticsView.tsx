import React, { useState, useMemo } from "react";
import { WeekData } from "../types";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, ComposedChart, Area
} from "recharts";
import { TrendingUp, Scale, Flame, Footprints, Award, Dumbbell } from "lucide-react";

interface AnalyticsViewProps {
  allWeeks: WeekData[];
}

export default function AnalyticsView({ allWeeks }: AnalyticsViewProps) {
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");

  // 1. Prepare Daily Stats for the current / selected weeks
  // We'll flatten days of all weeks to get a continuous progress timeline
  const timelineData = useMemo(() => {
    const data: any[] = [];
    allWeeks.forEach((week) => {
      week.days.forEach((day) => {
        // Only push days that have at least some recorded metrics
        if (day.weight !== null || day.calories !== null || day.steps !== null) {
          data.push({
            name: `${week.name.substring(5)} - ${day.name.substring(0, 3)}`,
            weight: day.weight,
            calories: day.calories,
            steps: day.steps,
            cardioKal: day.cardioKal || 0,
            fullDayName: `${week.name}, ${day.name}`,
          });
        }
      });
    });
    return data;
  }, [allWeeks]);

  // 2. Extract all exercise names across all weeks to populate the dropdown
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    allWeeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((ex) => {
          if (ex.name && ex.name !== "Neue Übung") {
            names.add(ex.name);
          }
        });
      });
    });
    const sortedNames = Array.from(names).sort();
    
    // Set default selected exercise if none selected
    if (sortedNames.length > 0 && !selectedExerciseName) {
      setSelectedExerciseName(sortedNames[0]);
    }
    
    return sortedNames;
  }, [allWeeks, selectedExerciseName]);

  // 3. Prepare Progression Data for the selected exercise
  // Plots maximum weight lifted for this exercise across all weeks/days
  const exerciseProgressData = useMemo(() => {
    if (!selectedExerciseName) return [];

    const progress: any[] = [];
    allWeeks.forEach((week) => {
      week.days.forEach((day) => {
        const foundEx = day.exercises.find((ex) => ex.name.toLowerCase() === selectedExerciseName.toLowerCase());
        if (foundEx) {
          // Find max weight lifted in any completed/logged set of this exercise
          let maxWeight = 0;
          let maxReps = 0;
          let volume = 0;

          foundEx.sets.forEach((set) => {
            if (set.weight !== null && set.weight > maxWeight) {
              maxWeight = set.weight;
              maxReps = set.reps || 0;
            }
            if (set.weight !== null && set.reps !== null) {
              volume += set.weight * set.reps;
            }
          });

          if (maxWeight > 0 || volume > 0) {
            progress.push({
              dateLabel: `${week.name.substring(5)} - ${day.name.substring(0, 3)}`,
              maxWeight,
              reps: maxReps,
              volume,
              dayLabel: `${week.name}, ${day.name}`,
            });
          }
        }
      });
    });
    return progress;
  }, [allWeeks, selectedExerciseName]);

  // Format tick labels for clean UI
  const formatStepsTick = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {timelineData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center rounded-3xl shadow-2xs transition-colors duration-300">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150">Keine Analysedaten verfügbar</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-1">
            Trage zuerst Körpergewicht, Kalorien oder Schritte in der Tabellen- oder Tages-Fokus Ansicht ein, um Analysen zu generieren.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Body Weight Trend */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-500" />
                  Gewichtsverlauf (kg)
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Erfasste Gewichtsschwankungen über die Zeit</p>
              </div>
            </div>

            <div className="h-[280px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis 
                    domain={["dataMin - 1", "dataMax + 1"]} 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    name="Gewicht" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Calories vs Steps */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Kalorien & Aktivität (Steps)
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Zusammenhang zwischen Energiezufuhr und Bewegung</p>
              </div>
            </div>

            <div className="h-[280px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                    label={{ value: "kcal", angle: -90, position: "insideLeft", fill: "#94a3b8", offset: 10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#94a3b8" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={formatStepsTick}
                    label={{ value: "Steps", angle: 90, position: "insideRight", fill: "#94a3b8", offset: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar yAxisId="left" dataKey="calories" name="Kalorien (kcal)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="steps" name="Schritte" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Exercise Progression Trend */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 lg:col-span-2 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Kraftentwicklung je Übung
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Plotte deine Steigerungen (Max. Gewicht) über die Trainingswochen</p>
              </div>

              {exerciseNames.length > 0 && (
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Übung wählen:</span>
                  <select
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 font-bold outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 cursor-pointer"
                    value={selectedExerciseName}
                    onChange={(e) => setSelectedExerciseName(e.target.value)}
                  >
                    {exerciseNames.map((name) => (
                      <option key={name} value={name} className="dark:bg-slate-900 dark:text-white">{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedExerciseName && exerciseProgressData.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Keine Sätze für "{selectedExerciseName}" erfasst</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-0.5">Trage für diese Übung in einem Satz Gewicht & Wiederholungen ein, um das Diagramm zu zeichnen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chart component */}
                <div className="lg:col-span-3 h-[280px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-10" />
                      <XAxis dataKey="dateLabel" stroke="#94a3b8" tickLine={false} />
                      <YAxis 
                        stroke="#94a3b8" 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `${v}kg`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                        labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="maxWeight" 
                        name="Max. Gewicht (kg)" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        dot={{ r: 5, strokeWidth: 2, fill: "#fff" }} 
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Micro Stats panel */}
                {exerciseProgressData.length > 0 && (
                  <div className="lg:col-span-1 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 p-4 rounded-xl flex flex-col justify-center space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500 uppercase tracking-widest block">Übungs-Rekord</span>
                      <span className="text-3xl font-black text-slate-800 dark:text-white">
                        {Math.max(...exerciseProgressData.map((d) => d.maxWeight))} kg
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        mit {exerciseProgressData.reduce((max, d) => d.maxWeight > max.weight ? { weight: d.maxWeight, reps: d.reps } : max, { weight: 0, reps: 0 }).reps} Wdh.
                      </span>
                    </div>

                    <div className="border-t border-amber-100 dark:border-amber-900/40 pt-3">
                      <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500 uppercase tracking-widest block">Trainiertes Gesamtvolumen</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">
                        {exerciseProgressData.reduce((acc, d) => acc + d.volume, 0).toLocaleString("de-DE")} kg
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Kumuliert über alle eingetragenen Sätze</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
