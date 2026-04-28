/**
 * Shared plan duration utility.
 * Works on both client (BookingModal preview) and server (verify route).
 *
 * Supported plan name formats:
 *   - Number + unit: "2 days", "1 week", "3 months", "2 years"
 *   - Word forms: "daily", "weekly", "monthly", "annual", "quarterly"
 *   - Mixed:   "2 Days Pass", "3 Weeks Plan", "1 Year Membership"
 *
 * @param startDate The membership start date
 * @param planName  The plan name string (e.g. "2 Weeks Pass")
 * @returns         Computed end date
 */
export function computeEndDate(startDate: Date, planName: string): Date {
  const end = new Date(startDate);
  const lower = planName.toLowerCase();

  // ── 1. Try "N unit" pattern first ────────────────────────────────────────
  // Matches: "2 days", "1 week", "3 months", "2 years", "10 day pack", etc.
  const numericMatch = lower.match(/(\d+)\s*(year|month|week|day)/);

  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    const unit = numericMatch[2];

    switch (unit) {
      case "year":
        end.setFullYear(end.getFullYear() + num);
        break;
      case "month":
        end.setMonth(end.getMonth() + num);
        break;
      case "week":
        end.setDate(end.getDate() + num * 7);
        break;
      case "day":
        end.setDate(end.getDate() + num);
        break;
    }
    return end;
  }

  // ── 2. Fall back to keyword matching ─────────────────────────────────────
  if (lower.includes("annual") || lower.includes("yearly")) {
    end.setFullYear(end.getFullYear() + 1);
  } else if (lower.includes("quarter")) {
    end.setDate(end.getDate() + 90);
  } else if (lower.includes("monthly") || lower.includes("month")) {
    end.setMonth(end.getMonth() + 1);
  } else if (lower.includes("weekly") || lower.includes("week")) {
    end.setDate(end.getDate() + 7);
  } else if (lower.includes("daily") || lower.includes("day")) {
    end.setDate(end.getDate() + 1);
  } else {
    // Default: 30 days
    end.setDate(end.getDate() + 30);
  }

  return end;
}

/**
 * Human-readable label for a plan duration.
 * E.g. "2 Weeks Pass" → "14 Days"
 */
export function planDurationLabel(planName: string): string {
  const lower = planName.toLowerCase();
  const numericMatch = lower.match(/(\d+)\s*(year|month|week|day)/);

  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    const unit = numericMatch[2];
    if (unit === "week") return `${num * 7} Day${num * 7 > 1 ? "s" : ""}`;
    if (unit === "year") return `${num} Year${num > 1 ? "s" : ""}`;
    if (unit === "month") return `${num} Month${num > 1 ? "s" : ""}`;
    if (unit === "day") return `${num} Day${num > 1 ? "s" : ""}`;
  }

  if (lower.includes("annual") || lower.includes("yearly")) return "1 Year";
  if (lower.includes("quarter")) return "3 Months";
  if (lower.includes("monthly") || lower.includes("month")) return "1 Month";
  if (lower.includes("weekly") || lower.includes("week")) return "7 Days";
  if (lower.includes("daily") || lower.includes("day")) return "1 Day";

  return "30 Days";
}
