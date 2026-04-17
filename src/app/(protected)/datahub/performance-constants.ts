import type { AnthropometricRecordInput, PerformanceArea, PerformanceEntryInput } from "@/lib/types";

export const emptyMaturationForm: AnthropometricRecordInput = {
  athleteName: "",
  sex: "male",
  ageGroup: "",
  clubName: "",
  teamName: "",
  position: "",
  dob: "",
  dataCollectionDate: "",
  statureCm: 0,
  bodyMassKg: 0,
  sittingHeightCm: 0,
  motherHeightCm: null,
  fatherHeightCm: null,
};

export const performanceAreaLabels: Record<PerformanceArea, string> = {
  physical: "datahub.performancePhysical",
  technicalTactical: "datahub.performanceTechnicalTactical",
  psychological: "datahub.performancePsychological",
  motorSkills: "datahub.performanceMotorSkills",
};

export const performancePresets: Record<PerformanceArea, Array<{ name: string; nameKey: string; unit: string; descriptionKey: string; isRating: boolean; scoringStrategy: "best" | "average"; interpretation: "higher_better" | "lower_better" }>> = {
  physical: [
    { name: "10 m Sprint", nameKey: "datahub.presetName.sprint10m", unit: "s", descriptionKey: "datahub.presetSprintDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "30 m Sprint", nameKey: "datahub.presetName.sprint30m", unit: "s", descriptionKey: "datahub.preset30mSprintDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "CMJ", nameKey: "datahub.presetName.cmj", unit: "cm", descriptionKey: "datahub.presetCmjDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "SJ (Squat Jump)", nameKey: "datahub.presetName.sj", unit: "cm", descriptionKey: "datahub.presetSjDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "Yo-Yo IR1", nameKey: "datahub.presetName.yoyo", unit: "m", descriptionKey: "datahub.presetYoyoDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "505 COD", nameKey: "datahub.presetName.cod505", unit: "s", descriptionKey: "datahub.presetCodDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "Illinois Agility", nameKey: "datahub.presetName.illinois", unit: "s", descriptionKey: "datahub.presetIllinoisDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "RSA (Repeated Sprint)", nameKey: "datahub.presetName.rsa", unit: "s", descriptionKey: "datahub.presetRsaDesc", isRating: false, scoringStrategy: "average", interpretation: "lower_better" },
    { name: "Handgrip Strength", nameKey: "datahub.presetName.handgrip", unit: "kg", descriptionKey: "datahub.presetHandgripDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "Wall Sit Test", nameKey: "datahub.presetName.wallSit", unit: "s", descriptionKey: "datahub.presetWallSitDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
  ],
  technicalTactical: [
    { name: "Passing Accuracy", nameKey: "datahub.presetName.passing", unit: "%", descriptionKey: "datahub.presetPassingDesc", isRating: false, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Shooting Accuracy", nameKey: "datahub.presetName.shootingAcc", unit: "%", descriptionKey: "datahub.presetShootingAccDesc", isRating: false, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Shooting Speed", nameKey: "datahub.presetName.shootingSpeed", unit: "km/h", descriptionKey: "datahub.presetShootingSpeedDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "Dribbling Slalom", nameKey: "datahub.presetName.dribbling", unit: "s", descriptionKey: "datahub.presetDribblingDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "Ball Control (Juggling)", nameKey: "datahub.presetName.juggling", unit: "reps", descriptionKey: "datahub.presetJugglingDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "First Touch Quality", nameKey: "datahub.presetName.firstTouch", unit: "/10", descriptionKey: "datahub.presetFirstTouchDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Heading Accuracy", nameKey: "datahub.presetName.heading", unit: "%", descriptionKey: "datahub.presetHeadingDesc", isRating: false, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Video Tactical Decisions", nameKey: "datahub.presetName.videoDecision", unit: "/10", descriptionKey: "datahub.presetVideoDecisionDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Small-Sided Decision Rating", nameKey: "datahub.presetName.ssgDecision", unit: "/10", descriptionKey: "datahub.presetSsgDecisionDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Positional Awareness", nameKey: "datahub.presetName.positional", unit: "/10", descriptionKey: "datahub.presetPositionalDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
  ],
  psychological: [
    { name: "Confidence Score", nameKey: "datahub.presetName.confidence", unit: "/10", descriptionKey: "datahub.presetConfidenceDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Motivation Score", nameKey: "datahub.presetName.motivation", unit: "/10", descriptionKey: "datahub.presetMotivationDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Competitive Anxiety", nameKey: "datahub.presetName.anxiety", unit: "/10", descriptionKey: "datahub.presetAnxietyDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Coachability Rating", nameKey: "datahub.presetName.coachability", unit: "/10", descriptionKey: "datahub.presetCoachabilityDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Resilience Score", nameKey: "datahub.presetName.resilience", unit: "/10", descriptionKey: "datahub.presetResilienceDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Focus & Concentration", nameKey: "datahub.presetName.focus", unit: "/10", descriptionKey: "datahub.presetFocusDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Leadership Rating", nameKey: "datahub.presetName.leadership", unit: "/10", descriptionKey: "datahub.presetLeadershipDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
    { name: "Teamwork & Communication", nameKey: "datahub.presetName.teamwork", unit: "/10", descriptionKey: "datahub.presetTeamworkDesc", isRating: true, scoringStrategy: "average", interpretation: "higher_better" },
  ],
  motorSkills: [
    { name: "Star Excursion Balance", nameKey: "datahub.presetName.starBalance", unit: "cm", descriptionKey: "datahub.presetStarBalanceDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "Coordination Ladder", nameKey: "datahub.presetName.coordLadder", unit: "s", descriptionKey: "datahub.presetCoordLadderDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "Ruler Drop Test", nameKey: "datahub.presetName.rulerDrop", unit: "cm", descriptionKey: "datahub.presetRulerDropDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
    { name: "Sit & Reach", nameKey: "datahub.presetName.sitReach", unit: "cm", descriptionKey: "datahub.presetSitReachDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "Single-Leg Hop", nameKey: "datahub.presetName.singleLegHop", unit: "cm", descriptionKey: "datahub.presetSingleLegHopDesc", isRating: false, scoringStrategy: "best", interpretation: "higher_better" },
    { name: "T-Test (Lateral Agility)", nameKey: "datahub.presetName.ttest", unit: "s", descriptionKey: "datahub.presetTTestDesc", isRating: false, scoringStrategy: "best", interpretation: "lower_better" },
  ],
};

export const emptyPerformanceForm: PerformanceEntryInput = {
  athleteName: "",
  area: "physical",
  teamName: undefined,
  position: undefined,
  testName: "",
  unit: "",
  value: 0,
  measurementDate: "",
  notes: undefined,
  ratingLevel: undefined,
  ratingValue: undefined,
  attemptCount: 1,
};
