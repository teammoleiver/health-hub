export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string;
  type: "EGYM" | "Free weights" | "Bodyweight" | "Cable" | "Plate loaded";
  muscleGroups: string[];
  primaryMuscle: string;
  bioAgeTarget: "lower_body" | "upper_body" | "core" | "full_body";
  whyThisExercise: string;
  formTips: string[];
  liverNote: string;
  calories: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  category: "lower_body" | "upper_body";
  sessionNumber: 1 | 2;
  totalKcal: number;
  bioAgeFocus: string;
  weeklySchedule: string;
  exercises: Exercise[];
}

export const GYM_WORKOUTS: WorkoutPlan[] = [
  {
    id: "lower-body-1",
    name: "Lower Body 1",
    category: "lower_body",
    sessionNumber: 1,
    totalKcal: 124,
    bioAgeFocus: "Lower body strength and stability",
    weeklySchedule: "Monday & Thursday",
    exercises: [
      {
        id: "lb1-reverse-lunges",
        name: "Reverse Lunges",
        sets: 2,
        reps: 12,
        type: "Bodyweight",
        muscleGroups: ["Quads", "Glutes"],
        primaryMuscle: "Quads",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Reverse lunges train balance and coordination alongside strength. With your lower body BioAge at 70, stepping backward activates the glutes more than forward lunges and is easier on the knees.",
        formTips: [
          "Stand tall, core engaged",
          "Step BACK until back knee nearly touches floor",
          "Front knee stays above ankle",
          "Push through front heel to return",
        ],
        liverNote:
          "Compound leg exercises burn more glucose and fat than any upper body exercise, directly reducing visceral fat causing your elevated ALT.",
        calories: 30,
      },
      {
        id: "lb1-leg-press",
        name: "Plate Loaded Leg Press",
        sets: 1,
        reps: 10,
        type: "Plate loaded",
        muscleGroups: ["Quads"],
        primaryMuscle: "Quads",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Only 1 set because it follows lunges — quads are pre-fatigued. One heavy set achieves maximum fiber recruitment without overtraining. Currently 100kg improving.",
        formTips: [
          "Feet shoulder-width on platform",
          "Lower to 90° knee angle",
          "Do NOT lock knees at top",
          "Lower back stays against pad",
        ],
        liverNote:
          "Heavy compound leg work triggers growth hormone release which drives fat loss and stimulates liver cell regeneration.",
        calories: 18,
      },
      {
        id: "lb1-calf-press",
        name: "Plate Loaded Calf Press (Extended Knees)",
        sets: 3,
        reps: 12,
        type: "Plate loaded",
        muscleGroups: ["Gastrocnemius"],
        primaryMuscle: "Gastrocnemius",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Calves are the 'second heart' — they pump blood from lower limbs. Extended knee targets the upper calf (gastrocnemius). 3 sets — highest volume in Session 1.",
        formTips: [
          "Full range — heel drops BELOW platform",
          "Pause 1 second at bottom",
          "Rise as high as possible",
          "2 seconds up, 2 seconds down",
        ],
        liverNote:
          "Calf exercises improve venous return and reduce lower extremity inflammation, reducing the systemic inflammatory burden on the liver.",
        calories: 22,
      },
      {
        id: "lb1-leg-curl",
        name: "EGYM Leg Curl",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Hamstrings"],
        primaryMuscle: "Hamstrings",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "EGYM data shows Leg Curl at only 38kg declining — critical imbalance vs quads. The machine adjusts resistance automatically for safe hamstring rebuilding.",
        formTips: [
          "Lie face down, pad above heels",
          "Curl SLOWLY — 3 seconds up",
          "Lower even slower — 4 seconds",
          "Keep hips pressed down",
        ],
        liverNote:
          "Hamstring work improves posterior chain activation reducing lower back compression, linked to your restrictive spirometry pattern.",
        calories: 20,
      },
      {
        id: "lb1-leg-extension",
        name: "EGYM Leg Extension",
        sets: 1,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Quads"],
        primaryMuscle: "Quads",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Single finishing set after heavy compounds. Currently 67kg improving — your best lower body metric. Programmed last to capitalize on what's working.",
        formTips: [
          "Sit fully back, lower back supported",
          "Extend until fully straight, hold 1 second",
          "Control the lowering",
          "Toes pointed slightly up",
        ],
        liverNote:
          "Depleting muscle glycogen ensures muscles absorb glucose from your next meal rather than converting it to liver fat.",
        calories: 12,
      },
      {
        id: "lb1-abductor",
        name: "EGYM Abductor",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Gluteus medius"],
        primaryMuscle: "Gluteus medius",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Outer glutes are critical for stability, universally weak in desk workers. Currently 47kg declining — must be reversed. Final exercise ensures hip stabilizer work every session.",
        formTips: [
          "Sit upright, back flat against pad",
          "Push outward slowly",
          "Hold 1 second at maximum spread",
          "Return slowly, don't let pads slam",
        ],
        liverNote:
          "Hip stability exercises activate core and pelvic floor, improving lymphatic drainage and reducing abdominal inflammation affecting the liver.",
        calories: 22,
      },
    ],
  },
  {
    id: "lower-body-2",
    name: "Lower Body 2",
    category: "lower_body",
    sessionNumber: 2,
    totalKcal: 37,
    bioAgeFocus: "Lower body power and posterior chain",
    weeklySchedule: "Wednesday & Saturday",
    exercises: [
      {
        id: "lb2-hip-thrusts",
        name: "Plate Loaded Hip Thrusts",
        sets: 1,
        reps: 12,
        type: "Plate loaded",
        muscleGroups: ["Glutes"],
        primaryMuscle: "Glutes",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Most effective glute exercise per EMG studies. Placed first when fresh. Glutes are the largest muscle — directly power walking speed, a strong predictor of longevity.",
        formTips: [
          "Upper back on bench at mid-scapula",
          "Feet hip-width, knees bent 90°",
          "Drive hips up until thighs parallel",
          "Squeeze glutes HARD at top 2 seconds",
        ],
        liverNote:
          "Hip thrusts generate the highest post-exercise calorie burn (EPOC) of any lower body exercise — continues burning fat for 24 hours.",
        calories: 8,
      },
      {
        id: "lb2-deadlifts",
        name: "Barbell Deadlifts",
        sets: 3,
        reps: 10,
        type: "Free weights",
        muscleGroups: ["Posterior chain"],
        primaryMuscle: "Posterior chain",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "King of full-body strength. 3 sets of 10 at moderate volume prioritizing technique. Activates more muscle simultaneously than any other exercise. Triggers highest testosterone and growth hormone response.",
        formTips: [
          "Bar over mid-foot, shins nearly touching",
          "Hinge at HIPS first, not knees",
          "Brace core like being punched",
          "Drive floor away, don't pull up",
          "Bar stays against body throughout",
        ],
        liverNote:
          "Deadlifts improve insulin sensitivity for 24-48 hours — same meal creates less glucose spike and less fat storage in the liver.",
        calories: 12,
      },
      {
        id: "lb2-egym-leg-press",
        name: "EGYM Leg Press",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Quads"],
        primaryMuscle: "Quads",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "After deadlifts, re-targets quads in supported machine. Currently 100kg improving. Gets 3 sets here vs 1 in Session 1 — periodization approach.",
        formTips: [
          "Feet shoulder-width, mid platform",
          "3 seconds down",
          "Drive through heels not toes",
          "Don't lock knees at top",
        ],
        liverNote:
          "Progressive overload on EGYM increases muscle mass which is inversely correlated with liver fat in NAFLD research.",
        calories: 5,
      },
      {
        id: "lb2-leg-extension",
        name: "EGYM Leg Extension",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Quads (VMO)"],
        primaryMuscle: "Quads (VMO)",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Gets 3 sets here (vs 1 in S1). Targets vastus medialis (inner knee) — critical for knee stability. Weak VMO causes knee pain and exercise cessation.",
        formTips: [
          "Hold 2 seconds at top, focus on inner quad",
          "Slightly point toes outward for VMO",
          "Slow descent — maximum time under tension",
        ],
        liverNote:
          "Preventing knee pain protects your ability to train consistently — exercise cessation is the primary driver of metabolic deterioration.",
        calories: 3,
      },
      {
        id: "lb2-leg-curl",
        name: "EGYM Leg Curl",
        sets: 1,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Hamstrings"],
        primaryMuscle: "Hamstrings",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Single set AFTER deadlifts which already loaded hamstrings. Provides isolated concentric flush to improve recovery without excessive fatigue.",
        formTips: [
          "Moderate weight — this is recovery, not max effort",
          "Focus on contraction — squeeze hard at peak",
          "Slow 4 second lowering",
        ],
        liverNote:
          "Single isolation sets after compounds flush lactic acid through increased blood flow without new muscle damage.",
        calories: 2,
      },
      {
        id: "lb2-adductor",
        name: "EGYM Adductor",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Inner thigh"],
        primaryMuscle: "Inner thigh",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Complements abductors from Session 1 — complete hip stability. Currently 51kg improving. Equal stimulus across the week for both hip sides.",
        formTips: [
          "Start at maximum comfortable spread",
          "Close legs smoothly, no jerking",
          "Hold 2 seconds at close",
          "Return slowly — 4 seconds",
        ],
        liverNote:
          "Adductor strengthening improves pelvic lymphatic drainage reducing visceral inflammation associated with NAFLD.",
        calories: 3,
      },
      {
        id: "lb2-calf-raises",
        name: "Plate Loaded Calf Raises (Seated, Bent Knees)",
        sets: 3,
        reps: 12,
        type: "Plate loaded",
        muscleGroups: ["Soleus"],
        primaryMuscle: "Soleus",
        bioAgeTarget: "lower_body",
        whyThisExercise:
          "Complement to Session 1's extended-knee calves. Bent knee targets the soleus (deep calf) — the most endurance-dominant muscle. Active in all standing and walking.",
        formTips: [
          "Seated, knees bent 90°",
          "Weight on lower thighs",
          "Heels drop below footrest",
          "Rise high, pause 2 seconds at top",
        ],
        liverNote:
          "Soleus has high mitochondrial density. Training it increases fat oxidation capacity that directly benefits liver function.",
        calories: 4,
      },
    ],
  },
  {
    id: "upper-body-1",
    name: "Upper Body 1",
    category: "upper_body",
    sessionNumber: 1,
    totalKcal: 10,
    bioAgeFocus: "Upper body balance and chest correction",
    weeklySchedule: "Tuesday & Friday",
    exercises: [
      {
        id: "ub1-incline-press",
        name: "Dumbbell Incline Press",
        sets: 3,
        reps: 12,
        type: "Free weights",
        muscleGroups: ["Upper chest"],
        primaryMuscle: "Upper chest",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "EGYM shows chest is WEAK vs back — one of 2 detected imbalances. Incline targets upper chest, placed first when freshest to prioritize weak muscle.",
        formTips: [
          "Bench at 30-45° incline",
          "Elbows at 45° from torso",
          "Press upward and slightly inward",
          "Lower slowly 3 seconds",
          "Shoulder blades retracted throughout",
        ],
        liverNote:
          "Building chest muscles improves respiratory support — beneficial for your restrictive spirometry pattern (FVC 73%).",
        calories: 2,
      },
      {
        id: "ub1-chest-press",
        name: "EGYM Chest Press",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Pectorals"],
        primaryMuscle: "Pectorals",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Following incline press with machine stability. Currently 60kg declining. Machine eliminates stabilization demand, focusing effort on target muscle.",
        formTips: [
          "Handles at mid-chest level",
          "Feet flat on floor",
          "Press until almost extended",
          "Control the return",
        ],
        liverNote:
          "Upper body training drives IGF-1 production — the growth factor most responsible for liver cell regeneration.",
        calories: 1,
      },
      {
        id: "ub1-lat-pulldown",
        name: "EGYM Lat Pulldown",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Lats"],
        primaryMuscle: "Lats",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Your STRONGEST upper body at 96kg improving. Lats are the largest upper body muscle. Corrects desk-posture rounded shoulders.",
        formTips: [
          "Grip wider than shoulders",
          "Lean back slightly, chest up",
          "Pull from ELBOWS not hands",
          "Pull to upper chest, not behind neck",
          "4 second return",
        ],
        liverNote:
          "Strong lats decompress lumbar vertebrae and improve thoracic mobility — addresses postural contributors to spirometry restriction.",
        calories: 2,
      },
      {
        id: "ub1-seated-row",
        name: "EGYM Seated Row",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Mid-back"],
        primaryMuscle: "Mid-back",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Targets rhomboids and mid-traps — the muscles that retract shoulder blades. Currently 82kg improving. Paired with pulldown for complete back training.",
        formTips: [
          "Sit upright, chest tall",
          "Squeeze shoulder blades together at end range",
          "Elbows close to sides",
          "Full arm extension at start",
        ],
        liverNote:
          "Mid-back training opens the ribcage, improving breathing mechanics and potentially improving FVC score from 73%.",
        calories: 2,
      },
      {
        id: "ub1-sit-ups",
        name: "Sit Ups",
        sets: 1,
        reps: "1min",
        type: "Bodyweight",
        muscleGroups: ["Core"],
        primaryMuscle: "Core",
        bioAgeTarget: "core",
        whyThisExercise:
          "Timed core activation between back and arm work. Core BioAge is 63 — directly targeted. Rebuilds endurance component of core function.",
        formTips: [
          "Knees bent, feet flat",
          "Hands behind head not neck",
          "Exhale as you curl up",
          "Lower slowly — where most work happens",
        ],
        liverNote:
          "Core strengthening targets visceral fat around abdominal organs including the liver.",
        calories: 1,
      },
      {
        id: "ub1-french-press",
        name: "Dumbbell French Press Lying",
        sets: 3,
        reps: 12,
        type: "Free weights",
        muscleGroups: ["Triceps"],
        primaryMuscle: "Triceps",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "EGYM Triceps at 69kg declining. French press targets the long head — largest tricep head. Pre-fatigues triceps before bicep work for balance correction.",
        formTips: [
          "Arms vertical, bend only at elbows",
          "Lower to temples not forehead",
          "Don't flare elbows",
          "Use lighter weight than you think",
        ],
        liverNote:
          "Arm isolation maintains fine motor neural pathways linked to cognitive health and neurological BioAge.",
        calories: 1,
      },
      {
        id: "ub1-bicep-curls",
        name: "Dumbbell Biceps Curls Incline",
        sets: 3,
        reps: 12,
        type: "Free weights",
        muscleGroups: ["Biceps"],
        primaryMuscle: "Biceps",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "EGYM shows biceps WEAK vs triceps — second imbalance. Incline position pre-stretches bicep for greater activation. Currently 12kg stable — must improve.",
        formTips: [
          "Bench at 45° incline, arms hanging straight down",
          "Curl without swinging — slow and controlled",
          "Supinate wrists at top (palms face shoulders)",
          "Lower fully — complete stretch",
        ],
        liverNote:
          "Bicep curls create minimal systemic stress while providing meaningful upper body training — ideal for days when recovery is a priority.",
        calories: 1,
      },
    ],
  },
  {
    id: "upper-body-2",
    name: "Upper Body 2",
    category: "upper_body",
    sessionNumber: 2,
    totalKcal: 7,
    bioAgeFocus: "Shoulder stability and core strength",
    weeklySchedule: "Tuesday & Friday",
    exercises: [
      {
        id: "ub2-shoulder-press",
        name: "EGYM Shoulder Press",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Shoulders"],
        primaryMuscle: "Shoulders",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Currently 56kg improving. Overhead pressing builds shoulder stability and improves posture. Placed first for maximum performance on a key compound movement.",
        formTips: [
          "Seat adjusted so handles are at shoulder level",
          "Press straight overhead",
          "Don't arch the back",
          "Control the descent",
        ],
        liverNote:
          "Overhead movements increase heart rate and respiratory demand, supporting cardiovascular fitness linked to liver health.",
        calories: 1,
      },
      {
        id: "ub2-butterfly",
        name: "EGYM Butterfly",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Chest"],
        primaryMuscle: "Chest",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Currently only 22kg stable — your weakest EGYM metric. Butterfly isolates the chest through a flye pattern, addressing the chest weakness from a different angle than pressing.",
        formTips: [
          "Arms slightly bent throughout",
          "Bring pads together in front of chest",
          "Squeeze 2 seconds at close",
          "Open slowly — feel the stretch",
        ],
        liverNote:
          "Chest isolation at low weight builds the mind-muscle connection needed before heavier chest work can be effective.",
        calories: 1,
      },
      {
        id: "ub2-face-pulls",
        name: "Cable Face Pulls",
        sets: 3,
        reps: 15,
        type: "Cable",
        muscleGroups: ["Rear delts", "Rotator cuff"],
        primaryMuscle: "Rear delts",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Face pulls are the most important corrective exercise for desk workers. They strengthen the rear deltoids and external rotators that prevent shoulder injuries.",
        formTips: [
          "Cable at face height, rope attachment",
          "Pull toward face, elbows HIGH",
          "Externally rotate at end — hands end up beside ears",
          "Squeeze shoulder blades",
        ],
        liverNote:
          "Rotator cuff health prevents shoulder injuries that would stop all upper body training — consistency is key for metabolic benefits.",
        calories: 1,
      },
      {
        id: "ub2-seated-row",
        name: "EGYM Seated Row",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Mid-back"],
        primaryMuscle: "Mid-back",
        bioAgeTarget: "upper_body",
        whyThisExercise:
          "Appears in both upper body sessions because back strength is your strongest area and must be maintained. Different rep scheme (10 vs 12) for variety.",
        formTips: [
          "Sit upright, chest proud",
          "Pull elbows back, squeeze shoulder blades",
          "Full extension on return",
          "Controlled tempo throughout",
        ],
        liverNote:
          "Consistent back training maintains the postural improvements that support respiratory function.",
        calories: 1,
      },
      {
        id: "ub2-plank",
        name: "Plank Hold",
        sets: 1,
        reps: "1min",
        type: "Bodyweight",
        muscleGroups: ["Core"],
        primaryMuscle: "Core",
        bioAgeTarget: "core",
        whyThisExercise:
          "Isometric core training complements the dynamic sit-ups in UB1. Plank builds the deep stabilizers (transverse abdominis) that sit-ups miss. Core BioAge 63.",
        formTips: [
          "Forearms on floor, body straight line",
          "Squeeze glutes and brace abs",
          "Don't let hips sag or pike up",
          "Breathe steadily throughout",
        ],
        liverNote:
          "Plank activates the transverse abdominis which compresses the abdominal cavity, improving organ positioning and blood flow to the liver.",
        calories: 1,
      },
      {
        id: "ub2-rotary-torso",
        name: "EGYM Rotary Torso",
        sets: 3,
        reps: 10,
        type: "EGYM",
        muscleGroups: ["Obliques"],
        primaryMuscle: "Obliques",
        bioAgeTarget: "core",
        whyThisExercise:
          "Currently 31kg improving. Rotational core strength is essential for sports, daily function, and protecting the spine during twisting movements.",
        formTips: [
          "Sit centered, knees locked in place",
          "Rotate from the WAIST, not shoulders",
          "Controlled movement — no momentum",
          "Equal work both directions",
        ],
        liverNote:
          "Oblique training increases intra-abdominal pressure cyclically, acting as a natural massage for abdominal organs including the liver.",
        calories: 1,
      },
      {
        id: "ub2-back-extension",
        name: "EGYM Back Extension",
        sets: 3,
        reps: 12,
        type: "EGYM",
        muscleGroups: ["Lower back", "Glutes"],
        primaryMuscle: "Lower back",
        bioAgeTarget: "core",
        whyThisExercise:
          "Currently 47kg stable. Spinal erector strength prevents lower back pain — the number one reason people stop exercising. Placed last as a gentle lower back flush.",
        formTips: [
          "Pad at hip crease level",
          "Lower until torso is roughly 45° from horizontal",
          "Extend back up until body is straight — don't hyperextend",
          "Slow and controlled — 3 seconds each way",
        ],
        liverNote:
          "Strong spinal erectors improve posture during sitting, reducing the chronic lower back tension that contributes to poor sleep quality — and sleep quality directly impacts liver recovery.",
        calories: 1,
      },
    ],
  },
];
