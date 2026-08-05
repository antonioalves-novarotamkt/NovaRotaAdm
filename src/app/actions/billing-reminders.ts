"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { runBillingReminders } from "@/lib/billing-reminders";

export async function sendBillingRemindersNow() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  const result = await runBillingReminders();
  revalidatePath("/financeiro");
  return result;
}
