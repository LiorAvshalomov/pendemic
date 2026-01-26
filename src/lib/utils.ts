import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Standard shadcn/ui helper. Even if not currently used,
// keeping it prevents tooling/config drift (components.json aliases).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
