import { SavedWorkout } from "./types";
import { getBrustRueckenGymRows, getArmeSchulternGymRows } from "./initialData";

export const DEFAULT_SAVED_WORKOUTS: SavedWorkout[] = [
  {
    id: "sw_brust_ruecken",
    name: "Brust / Rücken (Training 1)",
    focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
    badge: "SPLIT 1",
    exercises: getBrustRueckenGymRows().map((r) => ({
      id: r.id,
      name: r.name,
      setsAndWeight: r.setsAndWeight,
      notes: r.notes || "",
    })),
  },
  {
    id: "sw_arme_schultern",
    name: "Arme / Schultern (Training 2)",
    focusTitle: "ARME / SCHULTERN (TRAINING 2)",
    badge: "SPLIT 2",
    exercises: getArmeSchulternGymRows().map((r) => ({
      id: r.id,
      name: r.name,
      setsAndWeight: r.setsAndWeight,
      notes: r.notes || "",
    })),
  },
  {
    id: "sw_beine_bauch",
    name: "Beine & Bauch (Hypertrophie)",
    focusTitle: "BEINE & BAUCH",
    badge: "LEGS",
    exercises: [
      { id: "ex_b1", name: "Beinpresse 45°", setsAndWeight: "180x8, 180x8, 180x8", notes: "Tiefe Beugung" },
      { id: "ex_b2", name: "Rumänisches Kreuzheben (RDL)", setsAndWeight: "100x8, 100x8", notes: "Hamstrings dehnen" },
      { id: "ex_b3", name: "Beinstrecker (Leg Extension)", setsAndWeight: "60x10, 60x10, 60x10", notes: "1s Pause oben" },
      { id: "ex_b4", name: "Liegender Beinbeuger (Leg Curl)", setsAndWeight: "50x10, 50x9", notes: "Hamstrings" },
      { id: "ex_b5", name: "Wadenheben stehend", setsAndWeight: "80x12, 80x12", notes: "Voller Stretch" },
    ],
  },
  {
    id: "sw_push",
    name: "Push (Brust / Vordere & Seitl. Schulter / Trizeps)",
    focusTitle: "PUSH (BRUST / SCHULTERN / TRIZEPS)",
    badge: "PUSH",
    exercises: [
      { id: "ex_p1", name: "Incline Bench Press Smith", setsAndWeight: "70x8, 70x8, 70x7", notes: "2-3 min Pause" },
      { id: "ex_p2", name: "Butterfly", setsAndWeight: "55x10, 55x10", notes: "Stretch halten" },
      { id: "ex_p3", name: "Schulterdrücken KH", setsAndWeight: "26x8, 26x8", notes: "Saubere Ausführung" },
      { id: "ex_p4", name: "Seitheben am Kabel", setsAndWeight: "12x12, 12x11, 12x10", notes: "90s Pause" },
      { id: "ex_p5", name: "Trizeps Pushdowns", setsAndWeight: "35x10, 35x10, 35x9", notes: "Peak Contraction" },
    ],
  },
  {
    id: "sw_pull",
    name: "Pull (Rückenbreite & Dichte / Bizeps)",
    focusTitle: "PULL (RÜCKEN / BIZEPS)",
    badge: "PULL",
    exercises: [
      { id: "ex_pl1", name: "Latzug zur Brust", setsAndWeight: "75x8, 75x8, 75x7", notes: "Schulterblätter fixieren" },
      { id: "ex_pl2", name: "Upper Back Row (Brustgestützt)", setsAndWeight: "65x8, 65x8, 65x8", notes: "Ellenbogen 45°" },
      { id: "ex_pl3", name: "SA Lat Highrow Kabel", setsAndWeight: "40x9, 40x8", notes: "Latissimus-Fokus" },
      { id: "ex_pl4", name: "Reverse Flys / Facepulls", setsAndWeight: "25x12, 25x12", notes: "Hintere Schulter" },
      { id: "ex_pl5", name: "Preacher Curls", setsAndWeight: "32x9, 32x8, 32x8", notes: "Voller Bewegungsumfang" },
      { id: "ex_pl6", name: "Hammer Curls KH", setsAndWeight: "16x10, 16x9", notes: "Brachialis" },
    ],
  },
];

export function getSavedWorkouts(): SavedWorkout[] {
  try {
    const raw = localStorage.getItem("fittracker_saved_workouts_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading saved workouts:", e);
  }
  return DEFAULT_SAVED_WORKOUTS;
}

export function saveWorkoutsToStorage(workouts: SavedWorkout[]): void {
  try {
    localStorage.setItem("fittracker_saved_workouts_v1", JSON.stringify(workouts));
  } catch (e) {
    console.warn("Error saving workouts:", e);
  }
}
