import { Resend } from "resend";
import { SpoilageAlert } from "@/emails/SpoilageAlert";
import { SpoilingItem } from "./getSpoilingItems";
import { PantryReportEmail, PantryReportItem, ReportType } from "@/emails/PantryReportEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSpoilageEmail(
  to: string,
  displayName: string | null,
  items: SpoilingItem[]
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await resend.emails.send({
      from: "Smart Pantry <onboarding@resend.dev>",
      to,
      subject: `🍌 Use these today — ${items.length} items expire tomorrow!`,
      react: SpoilageAlert({ displayName, items, appUrl }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending spoilage email:", error);
    return { success: false, error };
  }
}

export async function sendPantryReportEmail(
  to: string,
  displayName: string | null,
  items: PantryReportItem[],
  reportType: ReportType,
  expiringDays?: number
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const subject =
      reportType === "pantry"
        ? `📦 Your Pantry List — ${items.length} items in stock`
        : `⚠️ ${items.length} items expiring within ${expiringDays ?? 3} day${(expiringDays ?? 3) === 1 ? "" : "s"}`;

    const { data, error } = await resend.emails.send({
      from: "Smart Pantry <onboarding@resend.dev>",
      to,
      subject,
      react: PantryReportEmail({ displayName, items, reportType, expiringDays, appUrl }),
    });

    if (error) {
      console.error("Resend report error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending pantry report email:", error);
    return { success: false, error };
  }
}
