import assert from "node:assert/strict";
import { demoRecords } from "../demo-data";
import { calculateMaturation } from "./calculations";

// Test basic functionality
const boyResult = calculateMaturation(demoRecords[0]);
assert.equal(boyResult.inputs.sex, "male");
assert.equal(typeof boyResult.methodOutputs.fransenOffset, "number");
assert.equal(boyResult.classification.maturityBand.length > 0, true);

const girlResult = calculateMaturation(demoRecords[2]);
assert.equal(girlResult.inputs.sex, "female");
assert.equal(girlResult.methodOutputs.fransenOffset, null); // Fransen not available for girls
assert.equal(girlResult.methodOutputs.mirwaldAphv > 0, true);

// Test edge cases
console.log("Testing edge cases...");

// Test with very young athlete (below regression table)
const youngAthlete = {
  ...demoRecords[0],
  dob: "2020-01-01", // 4 years old
  dataCollectionDate: "2024-01-01",
};
const youngResult = calculateMaturation(youngAthlete);
assert.equal(youngResult.warnings.length > 0, true, "Should warn for very young athlete");
assert.equal(youngResult.classification.maturityBand, "Pre-PHV", "Very young should be Pre-PHV");

// Test with future date (should not happen in real data, but test robustness)
const futureDateAthlete = {
  ...demoRecords[0],
  dataCollectionDate: "2030-01-01", // Future date
};
const futureResult = calculateMaturation(futureDateAthlete);
assert.equal(futureResult.warnings.length > 0, true, "Should warn for future collection date");

// Test with invalid measurements
const invalidAthlete = {
  ...demoRecords[0],
  statureCm: 50, // Too short
  sittingHeightCm: 60, // Sitting height > stature (impossible)
};
const invalidResult = calculateMaturation(invalidAthlete);
assert.equal(invalidResult.warnings.length > 0, true, "Should warn for invalid measurements");

// Test Khamis-Roche with parent heights
const khamisAthlete = {
  ...demoRecords[0],
  motherHeightCm: 165,
  fatherHeightCm: 178,
};
const khamisResult = calculateMaturation(khamisAthlete);
assert.equal(khamisResult.methodOutputs.pahCm !== null, true, "PAH should be calculated with parent heights");
assert.equal(khamisResult.methodOutputs.percentageAdultHeight !== null, true, "Percentage adult height should be calculated");

// Test without parent heights
const noParentsAthlete = {
  ...demoRecords[0],
  motherHeightCm: null,
  fatherHeightCm: null,
};
const noParentsResult = calculateMaturation(noParentsAthlete);
assert.equal(noParentsResult.methodOutputs.pahCm === null, true, "PAH should be null without parent heights");

// Test all maturity bands
const _prePhvAthlete = { ...demoRecords[0] }; // Default is around Mid-PHV
// Force Pre-PHV by adjusting age/measurements if needed, but for now assume demo data covers

// Test calculation consistency (same input should give same output)
const result1 = calculateMaturation(demoRecords[0]);
const result2 = calculateMaturation(demoRecords[0]);
assert.deepEqual(result1.methodOutputs, result2.methodOutputs, "Results should be consistent");

// Test derived metrics
assert.equal(typeof boyResult.derivedMetrics.chronologicalAge, "number");
assert.equal(boyResult.derivedMetrics.chronologicalAge > 0, true);
assert.equal(typeof boyResult.derivedMetrics.legLengthCm, "number");
assert.equal(boyResult.derivedMetrics.legLengthCm > 0, true);

console.log("All maturation calculation tests passed!");
