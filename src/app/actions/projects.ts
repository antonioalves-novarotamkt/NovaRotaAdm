"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus, Priority } from "@prisma/client";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "PLANNING") as ProjectStatus;
  const priority = String(formData.get("priority") || "MEDIUM") as Priority;
  const budgetRaw = String(formData.get("budget") || "");
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");

  if (!name || !clientId) {
    throw new Error("Nome e cliente são obrigatórios.");
  }

  await prisma.project.create({
    data: {
      name,
      clientId,
      description: description || null,
      status,
      priority,
      budget: budgetRaw ? Number(budgetRaw) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/projetos");
  redirect("/projetos");
}
