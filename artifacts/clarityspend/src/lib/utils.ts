import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO, getDate, startOfDay, setDate, isBefore, setMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRM(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("MYR", "RM");
}

export function getRollingDueDate(dateStr: string): Date {
  const originalDate = parseISO(dateStr);
  const dayOfMonth = getDate(originalDate);
  const now = startOfDay(new Date());
  
  const thisMonthDue = startOfDay(setDate(new Date(), dayOfMonth));
  
  if (isBefore(thisMonthDue, now)) {
    return setMonth(thisMonthDue, thisMonthDue.getMonth() + 1);
  }
  
  return thisMonthDue;
}
