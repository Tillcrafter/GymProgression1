import { WeekData, DayData, ExerciseData, SetData } from "./types";

// Helper to generate empty sets
const createEmptySets = (count = 3): SetData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `set_${Math.random().toString(36).substr(2, 9)}_${i}`,
    weight: null,
    reps: null,
    completed: false,
  }));
};

// Helper to generate a set with specific values
const createSet = (weight: number | null, reps: number | null, completed = false): SetData => ({
  id: `set_${Math.random().toString(36).substr(2, 9)}`,
  weight,
  reps,
  completed,
});

export const getInitialWeek = (): WeekData => {
  return {
    id: "woche_1",
    name: "Woche 1",
    phase: "Lean Bulk",
    days: [
      {
        id: "montag",
        name: "Montag",
        workoutName: "Brust/Trizeps/Hams 1",
        weight: 74.5,
        calories: 3300,
        steps: 7900,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_m1",
            name: "Bankdrücken",
            sets: [
              createSet(20.0, 6),
              createSet(null, null),
              createSet(null, null),
            ],
          },
          {
            id: "ex_m2",
            name: "Butterfly",
            sets: createEmptySets(3),
          },
          {
            id: "ex_m3",
            name: "Incline Dumbbell Press",
            sets: createEmptySets(3),
          },
          {
            id: "ex_m4",
            name: "Overhead extensions",
            sets: createEmptySets(3),
          },
          {
            id: "ex_m5",
            name: "Pushdowns",
            sets: createEmptySets(3),
          },
          {
            id: "ex_m6",
            name: "Leg Curl",
            sets: createEmptySets(3),
          },
          {
            id: "ex_m7",
            name: "RDL",
            sets: createEmptySets(3),
          },
        ],
      },
      {
        id: "dienstag",
        name: "Dienstag",
        workoutName: "Back/Bizeps/Abs 1",
        weight: 75.25,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_di1",
            name: "Klimmzüge",
            sets: createEmptySets(3),
          },
          {
            id: "ex_di2",
            name: "Preacher Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_di3",
            name: "Upper Back",
            sets: createEmptySets(3),
          },
          {
            id: "ex_di4",
            name: "Hammer Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_di5",
            name: "Lat Row",
            sets: createEmptySets(3),
          },
          {
            id: "ex_di6",
            name: "Crunches",
            sets: createEmptySets(3),
          },
        ],
      },
      {
        id: "mittwoch",
        name: "Mittwoch",
        workoutName: "Schultern/Unterarme/Quads 1",
        weight: null,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_mi1",
            name: "Schulterpresse",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi2",
            name: "Seitenheben",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi3",
            name: "Rear Delt fly",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi4",
            name: "Reverse Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi5",
            name: "Unterarm Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi6",
            name: "Leg Extensions",
            sets: createEmptySets(3),
          },
          {
            id: "ex_mi7",
            name: "Squat Pattern",
            sets: createEmptySets(3),
          },
        ],
      },
      {
        id: "donnerstag",
        name: "Donnerstag",
        workoutName: "REST DAY",
        weight: null,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [],
      },
      {
        id: "freitag",
        name: "Freitag",
        workoutName: "Brust/Trizeps/Hams 2",
        weight: null,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_fr1",
            name: "Dips",
            sets: createEmptySets(3),
          },
          {
            id: "ex_fr2",
            name: "Overhead extensions",
            sets: createEmptySets(3),
          },
          {
            id: "ex_fr3",
            name: "Butterfly",
            sets: createEmptySets(3),
          },
          {
            id: "ex_fr4",
            name: "Pushdowns",
            sets: createEmptySets(3),
          },
          {
            id: "ex_fr5",
            name: "Leg Curl",
            sets: createEmptySets(3),
          },
          {
            id: "ex_fr6",
            name: "RDL",
            sets: createEmptySets(3),
          },
        ],
      },
      {
        id: "samstag",
        name: "Samstag",
        workoutName: "Back/Bizeps/Abs 2",
        weight: null,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_sa1",
            name: "Klimmzüge",
            sets: createEmptySets(3),
          },
          {
            id: "ex_sa2",
            name: "Preacher Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_sa3",
            name: "Upper Back",
            sets: createEmptySets(3),
          },
          {
            id: "ex_sa4",
            name: "Hammer Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_sa5",
            name: "Lat Row",
            sets: createEmptySets(3),
          },
          {
            id: "ex_sa6",
            name: "Crunches",
            sets: createEmptySets(3),
          },
        ],
      },
      {
        id: "sonntag",
        name: "Sonntag",
        workoutName: "Schultern/Unterarme/Quads 2",
        weight: null,
        calories: null,
        steps: null,
        cardio: "",
        cardioKal: null,
        exercises: [
          {
            id: "ex_so1",
            name: "Schulterpresse",
            sets: createEmptySets(3),
          },
          {
            id: "ex_so2",
            name: "Seitenheben",
            sets: createEmptySets(3),
          },
          {
            id: "ex_so3",
            name: "Rear Delt fly",
            sets: createEmptySets(3),
          },
          {
            id: "ex_so4",
            name: "Reverse Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_so5",
            name: "Unterarm Curls",
            sets: createEmptySets(3),
          },
          {
            id: "ex_so6",
            name: "Leg Extensions",
            sets: createEmptySets(3),
          },
        ],
      },
    ],
  };
};

// Helper to generate a new week based on another week's structure
export const cloneWeekStructure = (previousWeek: WeekData, newWeekNum: number): WeekData => {
  return {
    id: `woche_${newWeekNum}`,
    name: `Woche ${newWeekNum}`,
    phase: previousWeek.phase,
    days: previousWeek.days.map((day) => ({
      ...day,
      weight: null,
      calories: null,
      steps: null,
      cardio: "",
      cardioKal: null,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set) => ({
          ...set,
          id: `set_${Math.random().toString(36).substr(2, 9)}`,
          weight: null,
          reps: null,
          completed: false,
        })),
      })),
    })),
  };
};
