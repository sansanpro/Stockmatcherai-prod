import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "healthcare" -> "Healthcare" (sectors are stored lowercase)
export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
