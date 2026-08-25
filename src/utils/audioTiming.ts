export const STEP_THRESHOLDS = [0.5, 2, 5, 10] as const;
export type StepThreshold = typeof STEP_THRESHOLDS[number];
