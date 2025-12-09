import { z } from "zod";

const durationSchema = z.object({
  years: z.number().optional(),
  months: z.number().optional(),
  days: z.number().optional(),
  hours: z.number().optional(),
  minutes: z.number().optional(),
  seconds: z.number().optional(),
});

export type Duration = z.infer<typeof durationSchema>;

export const validateDuration = (duration: Duration | string): Duration => {
  if (typeof duration === "string") {
    duration = JSON.parse(duration);
  }
  const result = durationSchema.safeParse(duration);
  if (!result.success) {
    throw new Error("Invalid duration");
  }
  return result.data;
};

export const formatDurationToTimestamp = (
  duration: Duration | string,
): number => {
  const validatedDuration = validateDuration(duration);
  let total = 0;
  if (validatedDuration.years) {
    total += validatedDuration.years * 365 * 24 * 60 * 60;
  }
  if (validatedDuration.months) {
    total += validatedDuration.months * 30 * 24 * 60 * 60;
  }
  if (validatedDuration.days) {
    total += validatedDuration.days * 24 * 60 * 60;
  }
  if (validatedDuration.hours) {
    total += validatedDuration.hours * 60 * 60;
  }
  if (validatedDuration.minutes) {
    total += validatedDuration.minutes * 60;
  }
  if (validatedDuration.seconds) {
    total += validatedDuration.seconds;
  }
  return total;
};
