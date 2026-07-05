import React from "react";
import { WeekData } from "../types";
import { Scale, Flame, Footprints, Dumbbell, Percent } from "lucide-react";

interface DashboardProps {
  weekData: WeekData;
}

export default function Dashboard({ weekData }: DashboardProps) {
  // Calculate stats for this week
  const daysWithWeight = weekData.days.filter((d) => d.weight !== null && d.weight > 0);
  const avgWeight = daysWithWeight.length > 0 
    ? daysWithWeight.reduce((acc, d) => acc + (d.weight || 0), 0) / daysWithWeight.length 
    : null;

  const daysWithCalories = weekData.days.filter((d) => d.calories !== null && d.calories > 0);
  const avgCalories = daysWithCalories.length > 0 
    ? daysWithCalories.reduce((acc, d) => acc + (d.calories || 0), 0) / daysWithCalories.length 
    : null;

  const daysWithSteps = weekData.days.filter((d) => d.steps !== null && d.steps > 0);
  const avgSteps = daysWithSteps.length > 0 
    ? daysWithSteps.reduce((acc, d) => acc + (d.steps || 0), 0) / daysWithSteps.length 
    : null;

  const totalCardioKal = weekData.days.reduce((acc, d) => acc + (d.cardioKal || 0), 0);

  // Calculate workout completion rate
  // An exercise set is completed if completed is true
  let totalSets = 0;
  let completedSets = 0;
  let activeWorkoutDaysCount = 0;
  let completedWorkoutDaysCount = 0;

  weekData.days.forEach((day) => {
    if (day.workoutName !== "REST DAY" && day.exercises.length > 0) {
      activeWorkoutDaysCount++;
      let dayCompleted = true;
      let dayHasSets = false;

      day.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          // If the set has logged weight/reps, we count it as a tracked set
          if (set.weight !== null || set.reps !== null) {
            dayHasSets = true;
            totalSets++;
            if (set.completed) {
              completedSets++;
            } else {
              dayCompleted = false;
            }
          }
        });
      });

      if (dayHasSets && dayCompleted) {
        completedWorkoutDaysCount++;
      }
    }
  });

  const setCompletionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Weight Card */}
      <div id="stat-weight" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ø Gewicht</p>
          <p className="text-2xl font-bold font-sans text-slate-800 dark:text-white mt-1">
            {avgWeight ? `${avgWeight.toFixed(2)} kg` : "Keine Daten"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {daysWithWeight.length} von 7 Tagen eingetragen
          </p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <Scale className="w-6 h-6" />
        </div>
      </div>

      {/* Calories Card */}
      <div id="stat-calories" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ø Kalorien</p>
          <p className="text-2xl font-bold font-sans text-slate-800 dark:text-white mt-1">
            {avgCalories ? `${Math.round(avgCalories)} kcal` : "Keine Daten"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ziel: {weekData.phase === "Lean Bulk" ? "3300+ kcal" : "Defizit"}
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
          <Flame className="w-6 h-6" />
        </div>
      </div>

      {/* Steps Card */}
      <div id="stat-steps" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ø Schritte</p>
          <p className="text-2xl font-bold font-sans text-slate-800 dark:text-white mt-1">
            {avgSteps ? `${Math.round(avgSteps).toLocaleString("de-DE")}` : "Keine Daten"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gesamt: {weekData.days.reduce((acc, d) => acc + (d.steps || 0), 0).toLocaleString("de-DE")}
          </p>
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl">
          <Footprints className="w-6 h-6" />
        </div>
      </div>

      {/* Cardio Calories Card */}
      <div id="stat-cardio" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cardio Aktivität</p>
          <p className="text-2xl font-bold font-sans text-slate-800 dark:text-white mt-1">
            {totalCardioKal > 0 ? `${totalCardioKal} kcal` : "0 kcal"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[150px]">
            {weekData.days.filter((d) => d.cardio).map((d) => d.cardio).join(", ") || "Keine Cardio-Sitzungen"}
          </p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
          <Flame className="w-6 h-6" />
        </div>
      </div>

      {/* Progress Card */}
      <div id="stat-progress" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Satz-Abschluss</p>
          <p className="text-2xl font-bold font-sans text-slate-800 dark:text-white mt-1">
            {setCompletionPercentage}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedSets} von {totalSets} Sätzen erledigt
          </p>
        </div>
        <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl">
          <Percent className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
