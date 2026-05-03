import { NextRequest, NextResponse } from "next/server";
import { getSpoilingItems } from "@/lib/getSpoilingItems";
import { sendSpoilageEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch users and items expiring tomorrow
    const userGroups = await getSpoilingItems();
    console.log(`Found ${userGroups.size} users with items expiring tomorrow.`);
    let emailsSent = 0;
    const errors: any[] = [];

    // 3. Send emails
    for (const [userId, group] of userGroups.entries()) {
      const result = await sendSpoilageEmail(group.email, group.displayName, group.items);
      
      if (result.success) {
        emailsSent++;
      } else {
        errors.push({ userId, error: result.error });
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
