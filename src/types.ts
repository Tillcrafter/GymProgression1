export interface GymTableRow {
  id: string;
  name: string;
  setsAndWeight: string; // e.g. "35x7, 35x7, 35x6" or "35x7"
  notes?: string;
  // Legacy fields for backward compatibility
  sets?: string;
  reps?: string;
  weight?: string;
  details?: string;
}

export interface CardioTableRow {
  id: string;
  activity: string;
  duration: string;
  intensity: string;
  steps: string;
  calories: string;
  notes: string;
}

export interface NutritionTableRow {
  id: string;
  meal: string; // "Frühstück", "Mittagessen", "Pre-Workout", "Post-Workout", "Abendessen", "Snack"
  food: string;
  amount: string;
  calories: number | "";
  protein: number | "";
  carbs: number | "";
  fat: number | "";
  notes?: string;
}

export interface WeightRow {
  id: string;
  dayLabel: string; // "Montag", "Dienstag", etc.
  shortDay: string; // "MO", "DI", etc.
  date: string; // e.g. "13.10."
  weight: number | string; // in kg (e.g. 78.4 or "")
  time?: string; // e.g. "07:30" or "Nüchtern"
  notes?: string; // e.g. "Nach Restday", "Viel Wasser"
}

export interface DayPlan {
  id: string; // "mo", "di", "mi", "do", "fr", "sa", "so"
  label: string; // "MO", "DI", "MI", "DO", "FR", "SA", "SO"
  name: string; // "Montag", "Dienstag", ...
  focusTitle: string; // e.g. "ARME / SCHULTERN"
  date?: string; // e.g. "16.10."
  gymRows: GymTableRow[];
  cardioRows: CardioTableRow[];
  nutritionRows: NutritionTableRow[];
  // Legacy migration compatibility:
  exercises?: any[];
  cardioList?: any[];
  nutritionMeals?: any[];
}

export interface WeekPlan {
  id: string; // "woche_1", "woche_2"
  name: string; // "Woche 1"
  phase: string; // "AUFBAU"
  days: DayPlan[];
  weightRows?: WeightRow[];
}

export type WorkoutPresetType = "offen" | "brust_ruecken" | "arme_schultern" | "rest_run" | "krank_pause" | "custom";

// Legacy type compatibility aliases
export type WeekData = any;
export type DayData = any;
export type ExerciseData = any;
export type SetData = any;
