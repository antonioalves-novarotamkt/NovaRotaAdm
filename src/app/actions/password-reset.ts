"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/redefinir-senha/${token}`;

      await sendPasswordResetEmail(user.email, resetUrl);
    }
  }

  // Always redirect to the same confirmation screen, whether or not the email exists,
  // so the form can't be used to check which emails are registered.
  redirect("/esqueci-senha/enviado");
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token || !password || password.length < 6) {
    redirect(`/redefinir-senha/${token}?error=weak`);
  }
  if (password !== confirmPassword) {
    redirect(`/redefinir-senha/${token}?error=mismatch`);
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    redirect(`/redefinir-senha/${token}?error=expired`);
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hash },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  redirect("/login?reset=success");
}
