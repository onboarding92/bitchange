import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely convert a value to a number and format it with toFixed()
 * Returns "0.00" (or appropriate zeros based on decimals) if value is undefined/null/NaN
 */
export function safeToFixed(value: any, decimals: number = 2): string {
  const num = Number(value);
  if (isNaN(num) || value === null || value === undefined) {
    return "0." + "0".repeat(decimals);
  }
  return num.toFixed(decimals);
}
