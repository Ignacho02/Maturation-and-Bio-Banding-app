import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function dotGet(
  object: Record<string, unknown>,
  path: string,
): string | undefined {
  return path.split(".").reduce<unknown>((result, key) => {
    if (result && typeof result === "object" && key in result) {
      return (result as Record<string, unknown>)[key];
    }

    return undefined;
  }, object) as string | undefined;
}

export function roundHalf(age: number) {
  return Math.floor(age * 2) / 2;
}

export function calculateAge(dob: string, collectedAt: string) {
  const diff =
    new Date(collectedAt).getTime() - new Date(dob).getTime();

  return diff / (1000 * 60 * 60 * 24 * 365.25);
}
