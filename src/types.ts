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
  meal: string; // "Frühstück", "Mittagessen", "Pre-Workout", "Post-Workout", "Abendessen", "Snacks"
  food: string;
  amount: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  notes?: string;
  per100g?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}


/**
 * Universal safe parser for German and English numbers.
 * Correctly handles:
 * - German decimals: "76,9" -> 76.9
 * - German thousands: "1.200" or "3.340" -> 1200 or 3340
 * - Combined: "1.250,50" -> 1250.5
 * - English numbers: "76.9", "1,200.5" -> 1200.5
 * - Empty / text strings like "1200 kcal", "25 min", "10.000 Schritte"
 */
export function parseGermanOrEnglishNumber(val: any): number {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  // Strip trailing unit text (e.g. "kcal", "min", "g", "Schritte", "kg")
  str = str.replace(/[a-zA-Z%]/g, "").trim();
  if (!str) return 0;

  // Handle both comma and dot present
  if (str.includes(".") && str.includes(",")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // German format: 1.250,50 -> 1250.50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // English format: 1,250.50 -> 1250.50
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(".")) {
    // Check if dot is a thousands separator, e.g. "1.200" or "3.340"
    // (exact 3 digits after dot, integer before dot)
    const parts = str.split(".");
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      str = str.replace(".", "");
    }
  } else if (str.includes(",")) {
    // Check if comma is thousand separator (e.g. "1,200")
    const parts = str.split(",");
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1 && parseInt(parts[0], 10) >= 1) {
      // Could be thousands, but in German diet "76,900" is rare. If length is 3 and integer >= 10:
      // In German context, calories are usually whole numbers or 1 decimal.
      // If parts[0].length <= 2 (e.g. "76,500"), it's likely decimal. If parts[0] is like "1,000", it's 1000.
      if (parts[0].length >= 1 && parseInt(parts[0], 10) >= 1 && parseInt(parts[0], 10) < 10 && parts[1] === "000") {
        str = str.replace(",", "");
      } else {
        str = str.replace(",", ".");
      }
    } else {
      str = str.replace(",", ".");
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
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

export interface CustomWorkoutPlan {
  id: string; // e.g. "plan_beine" or `custom_${Date.now()}`
  name: string; // e.g. "Beine / Bauch"
  focusTitle: string; // e.g. "BEINE / BAUCH (TRAINING 3)"
  badge?: string; // e.g. "TRAINING 3"
  colorClass?: string;
  exercises: {
    id: string;
    name: string;
    setsAndWeight: string; // e.g. "80x8, 80x8, 80x7"
    notes?: string;
  }[];
}

export interface SavedWorkout {
  id: string;
  name: string;
  focusTitle: string;
  badge?: string;
  exercises: {
    id: string;
    name: string;
    setsAndWeight: string;
    notes?: string;
  }[];
  createdAt?: string;
}

// Legacy type compatibility aliases
export type WeekData = any;
export type DayData = any;
export type ExerciseData = any;
export type SetData = any;
