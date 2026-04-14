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
  physical: "datahub.physical",
  technicalTactical: "datahub.technicalTactical",
  psychological: "datahub.psychological",
  motorSkills: "datahub.performanceMotorSkills",
};

export const performancePresets: Record<PerformanceArea, Array<{ name: string; unit: string; descriptionKey: string; isRating: boolean; calculation: "best_min" | "best_max" | "average" }>> = {
  physical: [
    { name: "10 m Sprint", unit: "s", descriptionKey: "datahub.presetSprintDesc", isRating: false, calculation: "best_min" },
    { name: "CMJ", unit: "cm", descriptionKey: "datahub.presetCmjDesc", isRating: false, calculation: "best_max" },
    { name: "Yo-Yo IR1", unit: "m", descriptionKey: "datahub.presetYoyoDesc", isRating: false, calculation: "best_max" },
    { name: "505 COD", unit: "s", descriptionKey: "datahub.presetCodDesc", isRating: false, calculation: "best_min" },
    { name: "Wall Sit Test", unit: "s", descriptionKey: "datahub.presetWallSitDesc", isRating: false, calculation: "best_max" },
  ],
  technicalTactical: [
    { name: "Passing Accuracy", unit: "%", descriptionKey: "datahub.presetPassingDesc", isRating: false, calculation: "average" },
    { name: "Dribbling Slalom", unit: "s", descriptionKey: "datahub.presetDribblingDesc", isRating: false, calculation: "best_min" },
    { name: "Video Tactical Decisions", unit: "/10", descriptionKey: "datahub.presetVideoDecisionDesc", isRating: true, calculation: "average" },
    { name: "Small-Sided Decision Rating", unit: "/10", descriptionKey: "datahub.presetSsgDecisionDesc", isRating: true, calculation: "average" },
  ],
  psychological: [
    { name: "Confidence Score", unit: "/10", descriptionKey: "datahub.presetConfidenceDesc", isRating: true, calculation: "average" },
    { name: "Motivation Score", unit: "/10", descriptionKey: "datahub.presetMotivationDesc", isRating: true, calculation: "average" },
    { name: "Competitive Anxiety", unit: "/10", descriptionKey: "datahub.presetAnxietyDesc", isRating: true, calculation: "average" },
    { name: "Coachability Rating", unit: "/10", descriptionKey: "datahub.presetCoachabilityDesc", isRating: true, calculation: "average" },
  ],
  motorSkills: [],
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
