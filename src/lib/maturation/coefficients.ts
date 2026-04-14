export interface KhamisRocheEntry {
  age: number;
  beta: number;
  stature: number;
  weight: number;
  midParentStature: number;
  refMean?: number;
  refSd?: number;
}

export const boysRegressionTable: KhamisRocheEntry[] = [
  { age: 4, beta: -26.0521, stature: 1.23812, weight: -0.48849, midParentStature: 0.50286, refMean: 57.72, refSd: 1.38 },
  { age: 5, beta: -27.9942, stature: 1.10674, weight: -0.36274, midParentStature: 0.53919, refMean: 61.6, refSd: 1.49 },
  { age: 5.5, beta: -28.3354, stature: 1.0748, weight: -0.32344, midParentStature: 0.53691, refMean: 61.6, refSd: 1.49 },
  { age: 6, beta: -28.2291, stature: 1.05923, weight: -0.29649, midParentStature: 0.52513, refMean: 65.31, refSd: 1.58 },
  { age: 6.5, beta: -27.9963, stature: 1.05542, weight: -0.27938, midParentStature: 0.50692, refMean: 65.31, refSd: 1.58 },
  { age: 7, beta: -27.9361, stature: 1.05877, weight: -0.26959, midParentStature: 0.48538, refMean: 69.08, refSd: 1.6 },
  { age: 7.5, beta: -27.9943, stature: 1.06467, weight: -0.26462, midParentStature: 0.46361, refMean: 69.08, refSd: 1.6 },
  { age: 8, beta: -28.1169, stature: 1.06853, weight: -0.26194, midParentStature: 0.44469, refMean: 72.4, refSd: 1.68 },
  { age: 8.5, beta: -28.2499, stature: 1.06572, weight: -0.25905, midParentStature: 0.43171, refMean: 72.4, refSd: 1.68 },
  { age: 9, beta: -28.3392, stature: 1.05166, weight: -0.25341, midParentStature: 0.42776, refMean: 75.61, refSd: 1.68 },
  { age: 9.5, beta: -28.297, stature: 1.02174, weight: -0.24253, midParentStature: 0.43593, refMean: 77.21, refSd: 1.66 },
  { age: 10, beta: -28.0365, stature: 0.97135, weight: -0.22388, midParentStature: 0.45932, refMean: 78.4, refSd: 1.76 },
  { age: 10.5, beta: -27.5047, stature: 0.89589, weight: -0.19495, midParentStature: 0.50101, refMean: 79.82, refSd: 1.77 },
  { age: 11, beta: -26.649, stature: 0.81239, weight: -0.16267, midParentStature: 0.54781, refMean: 81.3, refSd: 1.94 },
  { age: 11.5, beta: -25.4165, stature: 0.74134, weight: -0.13533, midParentStature: 0.58409, refMean: 82.54, refSd: 2 },
  { age: 12, beta: -23.7546, stature: 0.68325, weight: -0.11242, midParentStature: 0.60927, refMean: 84, refSd: 2.23 },
  { age: 12.5, beta: -21.858, stature: 0.63869, weight: -0.09341, midParentStature: 0.62279, refMean: 85.43, refSd: 2.49 },
  { age: 13, beta: -19.9726, stature: 0.60818, weight: -0.07781, midParentStature: 0.62407, refMean: 87.32, refSd: 3.02 },
  { age: 13.5, beta: -18.1225, stature: 0.59228, weight: -0.06509, midParentStature: 0.61253, refMean: 89.22, refSd: 3.57 },
  { age: 14, beta: -16.3319, stature: 0.59151, weight: -0.05474, midParentStature: 0.58762, refMean: 91, refSd: 3.96 },
  { age: 14.5, beta: -14.6249, stature: 0.60643, weight: -0.04626, midParentStature: 0.54875, refMean: 92.6, refSd: 3.85 },
  { age: 15, beta: -13.0256, stature: 0.63757, weight: -0.03913, midParentStature: 0.49536, refMean: 94.6, refSd: 3.74 },
  { age: 15.5, beta: -11.4535, stature: 0.68548, weight: -0.03283, midParentStature: 0.42687, refMean: 96, refSd: 3.31 },
  { age: 16, beta: -9.9801, stature: 0.75069, weight: -0.02685, midParentStature: 0.34271, refMean: 97.09, refSd: 2.71 },
  { age: 16.5, beta: -8.8577, stature: 0.83375, weight: -0.02069, midParentStature: 0.24231, refMean: 97.95, refSd: 2.12 },
  { age: 17, beta: -8.3388, stature: 0.9352, weight: -0.01383, midParentStature: 0.1251, refMean: 98.79, refSd: 1.43 },
  { age: 17.5, beta: -8.6756, stature: 1.05558, weight: -0.00575, midParentStature: -0.0095, refMean: 99.28, refSd: 1.01 },
];

export const girlsRegressionTable: KhamisRocheEntry[] = [
  { age: 4, beta: -20.6566, stature: 1.24768, weight: -1.0883, midParentStature: 0.44774 },
  { age: 4.5, beta: -16.4505, stature: 1.22177, weight: -1.03701, midParentStature: 0.41381 },
  { age: 5, beta: -13.045, stature: 1.19932, weight: -0.98161, midParentStature: 0.38467 },
  { age: 5.5, beta: -10.5103, stature: 1.1788, weight: -0.92307, midParentStature: 0.36039 },
  { age: 6, beta: -8.9164, stature: 1.15866, weight: -0.86236, midParentStature: 0.34105 },
  { age: 6.5, beta: -7.9838, stature: 1.13737, weight: -0.80043, midParentStature: 0.32672 },
  { age: 7, beta: -7.3062, stature: 1.11342, weight: -0.73826, midParentStature: 0.31748 },
  { age: 7.5, beta: -6.7638, stature: 1.08525, weight: -0.6768, midParentStature: 0.3134 },
  { age: 8, beta: -6.2372, stature: 1.05135, weight: -0.11019, midParentStature: 0.31457 },
  { age: 8.5, beta: -5.6065, stature: 1.01018, weight: -0.55993, midParentStature: 0.32105 },
  { age: 9, beta: -4.7523, stature: 0.9602, weight: -0.50644, midParentStature: 0.33291 },
  { age: 9.5, beta: -2.7008, stature: 0.89989, weight: -0.45754, midParentStature: 0.35025 },
  { age: 10, beta: 0.8501, stature: 0.82771, weight: -0.41419, midParentStature: 0.37312 },
  { age: 10.5, beta: 5.0131, stature: 0.74213, weight: -0.37736, midParentStature: 0.40161 },
  { age: 11, beta: 8.9011, stature: 0.67173, weight: -0.34357, midParentStature: 0.42042 },
  { age: 11.5, beta: 11.6268, stature: 0.6415, weight: -0.30898, midParentStature: 0.4186 },
  { age: 12, beta: 12.3029, stature: 0.64452, weight: 0.27405, midParentStature: 0.3949 },
  { age: 12.5, beta: 10.8679, stature: 0.67386, weight: -0.23924, midParentStature: 0.3585 },
  { age: 13, beta: 8.164, stature: 0.7226, weight: -0.20499, midParentStature: 0.31163 },
  { age: 13.5, beta: 4.6598, stature: 0.78383, weight: -0.17175, midParentStature: 0.25826 },
  { age: 14, beta: 0.8236, stature: 0.85062, weight: -0.13999, midParentStature: 0.20235 },
  { age: 14.5, beta: -2.8759, stature: 0.91605, weight: -0.11015, midParentStature: 0.14787 },
  { age: 15, beta: -5.9704, stature: 0.97319, weight: -0.08268, midParentStature: 0.0988 },
  { age: 15.5, beta: -7.8823, stature: 1.01514, weight: -0.05805, midParentStature: 0.05909 },
  { age: 16, beta: -8.0743, stature: 1.03496, weight: -0.03669, midParentStature: 0.03272 },
  { age: 16.5, beta: -6.1381, stature: 1.02573, weight: -0.01906, midParentStature: 0.02364 },
  { age: 17, beta: -1.6657, stature: 0.98054, weight: -0.00562, midParentStature: 0.03584 },
  { age: 17.5, beta: 5.7513, stature: 0.89246, weight: 0.00318, midParentStature: 0.07327 },
];
