export interface SetData {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface ExerciseData {
  id: string;
  name: string;
  sets: SetData[];
}

export interface DayData {
  id: string;
  name: string;
  workoutName: string;
  weight: number | null;
  calories: number | null;
  steps: number | null;
  cardio: string;
  cardioKal: number | null;
  exercises: ExerciseData[];
}

export interface WeekData {
  id: string; // e.g., "woche_1"
  name: string; // e.g., "Woche 1"
  phase: string; // e.g., "Lean Bulk"
  days: DayData[];
}
