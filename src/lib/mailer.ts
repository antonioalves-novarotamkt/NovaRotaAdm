import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 465),
  secure: Number(process.env.EMAIL_SERVER_PORT || 465) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Redefinição de senha — NovaRota",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Redefinir sua senha</h2>
        <p style="color: #475569;">Recebemos uma solicitação para redefinir a senha da sua conta NovaRota.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Redefinir senha
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">Este link expira em 1 hora. Se você não solicitou isso, pode ignorar este email.</p>
      </div>
    `,
  });
}
