import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetch historical exchange rates from the backend proxy (which fetches from the Bank of Israel API).
 * @param currency 'USD' | 'EUR' | 'GBP'
 * @param from Date (start date)
 * @param to Date (end date)
 * @returns Promise<{ date: string, rate: number }[]>
 */
export async function fetchBoiHistoricalRates(currency: 'USD' | 'EUR' | 'GBP', from: Date, to: Date): Promise<{ date: string, rate: number }[]> {
  const start = from.toISOString().slice(0, 10);
  const end = to.toISOString().slice(0, 10);
  const url = `/api/proxy_boi.php?currency=${currency}&start_date=${start}&end_date=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from backend proxy');
  const data = await res.json();
  if (Array.isArray(data)) return data;
  throw new Error(data.error || 'Unknown error from backend proxy');
}
