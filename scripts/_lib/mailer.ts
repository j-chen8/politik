import nodemailer from "nodemailer";

export type MailResult = { sent: boolean; reason?: string };

/**
 * Versendet eine Mail über SMTP. Liest AUSSCHLIESSLICH aus process.env (per
 * process.loadEnvFile vorab geladen): SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/
 * SMTP_PASS/MAIL_FROM/MAIL_TO. Sind die Pflichtfelder nicht gesetzt → kein Versand
 * (sent:false, reason), KEIN Crash — so läuft die Pipeline auch ohne Creds durch.
 */
export async function sendMail(subject: string, text: string, html?: string): Promise<MailResult> {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    return { sent: false, reason: "SMTP nicht konfiguriert (.env: SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_TO)" };
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    secure: (SMTP_SECURE ?? "true") !== "false", // 465→true; bei 587 SMTP_SECURE=false setzen
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to: MAIL_TO, subject, text, ...(html ? { html } : {}) });
  return { sent: true };
}
