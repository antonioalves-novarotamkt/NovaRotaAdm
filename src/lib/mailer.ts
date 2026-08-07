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

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const brDate = (date: Date) => new Intl.DateTimeFormat("pt-BR").format(date);

export async function sendInvoiceDueSoonEmail(
  to: string,
  params: { clientName: string; agencyName: string; invoiceNumber: string; total: number; dueDate: Date }
) {
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Fatura ${params.invoiceNumber} vence em breve — ${params.agencyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Lembrete de pagamento</h2>
        <p style="color: #475569;">Olá, ${params.clientName}! Passando para lembrar que a fatura <strong>${params.invoiceNumber}</strong> no valor de <strong>${brl(params.total)}</strong> vence em <strong>${brDate(params.dueDate)}</strong>.</p>
        <p style="color: #475569;">Qualquer dúvida, é só responder este e-mail.</p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">${params.agencyName}</p>
      </div>
    `,
  });
}

export async function sendInvoiceOverdueEmailToClient(
  to: string,
  params: { clientName: string; agencyName: string; invoiceNumber: string; total: number; dueDate: Date }
) {
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Fatura ${params.invoiceNumber} em atraso — ${params.agencyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Fatura em atraso</h2>
        <p style="color: #475569;">Olá, ${params.clientName}. A fatura <strong>${params.invoiceNumber}</strong> no valor de <strong>${brl(params.total)}</strong>, com vencimento em ${brDate(params.dueDate)}, ainda consta em aberto.</p>
        <p style="color: #475569;">Por favor, regularize o pagamento assim que possível. Qualquer dúvida, é só responder este e-mail.</p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">${params.agencyName}</p>
      </div>
    `,
  });
}

export async function sendMonthlyReportEmail(
  to: string,
  params: { clientName: string; agencyName: string; monthLabel: string; bodyHtml: string }
) {
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Relatório de Performance — ${params.monthLabel} — ${params.agencyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Relatório de Performance</p>
        <h2 style="color: #1e293b; margin-top: 4px;">${params.clientName} · ${params.monthLabel}</h2>
        ${params.bodyHtml}
        <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">${params.agencyName}</p>
      </div>
    `,
  });
}

export async function sendOverdueSummaryToAgency(
  to: string[],
  invoices: { clientName: string; invoiceNumber: string; total: number; dueDate: Date }[]
) {
  if (to.length === 0) return;
  const rows = invoices
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${i.clientName}</td><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${i.invoiceNumber}</td><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${brDate(i.dueDate)}</td><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${brl(i.total)}</td></tr>`
    )
    .join("");
  const totalOverdue = invoices.reduce((s, i) => s + i.total, 0);

  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${invoices.length} fatura(s) em atraso — total ${brl(totalOverdue)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Faturas em atraso</h2>
        <p style="color: #475569;">Existem ${invoices.length} fatura(s) em atraso, totalizando <strong>${brl(totalOverdue)}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:6px 12px;">Cliente</th>
              <th style="text-align:left;padding:6px 12px;">Fatura</th>
              <th style="text-align:left;padding:6px 12px;">Venceu em</th>
              <th style="text-align:right;padding:6px 12px;">Valor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  });
}
