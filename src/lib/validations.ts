import { z } from "zod";

// Anthropometric validation schema
export const AnthropometricRecordSchema = z.object({
  athleteName: z.string().min(1, "Athlete name is required").max(100, "Name too long"),
  sex: z.enum(["male", "female"]),
  ageGroup: z.string().min(1, "Age group is required").max(20, "Age group too long"),
  clubName: z.string().min(1, "Club name is required").max(50, "Club name too long"),
  teamName: z.string().optional(),
  position: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dataCollectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  statureCm: z.number().min(120, "Stature must be at least 120cm").max(230, "Stature must be at most 230cm"),
  bodyMassKg: z.number().min(20, "Body mass must be at least 20kg").max(150, "Body mass must be at most 150kg"),
  sittingHeightCm: z.number().min(60, "Sitting height must be at least 60cm").max(120, "Sitting height must be at most 120cm"),
  motherHeightCm: z.number().min(140, "Parent height must be at least 140cm").max(220, "Parent height must be at most 220cm").nullable().optional(),
  fatherHeightCm: z.number().min(140, "Parent height must be at least 140cm").max(220, "Parent height must be at most 220cm").nullable().optional(),
}).refine((data) => {
  // Ensure dataCollectionDate is not in the future
  const collectionDate = new Date(data.dataCollectionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return collectionDate <= today;
}, {
  message: "Data collection date cannot be in the future",
  path: ["dataCollectionDate"],
}).refine((data) => {
  // Ensure sitting height is less than stature
  return data.sittingHeightCm < data.statureCm;
}, {
  message: "Sitting height must be less than stature",
  path: ["sittingHeightCm"],
});

// Performance record validation schema
export const PerformanceRecordSchema = z.object({
  athleteName: z.string().min(1, "Athlete name is required").max(100, "Name too long"),
  testCategory: z.enum(["Physical", "Technical-Tactical", "Psychological"]),
  testName: z.string().min(1, "Test name is required").max(50, "Test name too long"),
  testValue: z.number().min(0, "Test value must be non-negative"),
  testUnit: z.string().min(1, "Unit is required").max(20, "Unit too long"),
  dataCollectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

// User preferences validation
export const UserPreferencesSchema = z.object({
  locale: z.enum(["en", "es"]),
});

// Login validation
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type AnthropometricRecordInput = z.infer<typeof AnthropometricRecordSchema>;
export type PerformanceRecordInput = z.infer<typeof PerformanceRecordSchema>;
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
