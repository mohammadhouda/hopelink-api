import { Resend } from "resend";
import {
  registrationApprovedTemplate,
  registrationDeclinedTemplate,
  verificationApprovedTemplate,
  verificationDeclinedTemplate,
} from "../templates/email.templates.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL || "onboarding@resend.dev";

// ── Generic send email function
async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject,
    html,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

// ── Registration emails
export async function sendRegistrationApprovedEmail({ name, email, tempPassword }) {
  return sendEmail({
    to:      email,
    subject: "🎉 Your Hope Link application has been approved",
    html:    registrationApprovedTemplate({ name, email, tempPassword }),
  });
}

export async function sendRegistrationDeclinedEmail({ name, email, reviewNote }) {
  return sendEmail({
    to:      email,
    subject: "Update on your Hope Link application",
    html:    registrationDeclinedTemplate({ name, reviewNote }),
  });
}

// ── Verification emails
export async function sendVerificationApprovedEmail({ charityName, email }) {
  return sendEmail({
    to:      email,
    subject: "✅ Your charity is now verified on Hope Link",
    html:    verificationApprovedTemplate({ charityName }),
  });
}

export async function sendVerificationDeclinedEmail({ charityName, email, reviewNote }) {
  return sendEmail({
    to:      email,
    subject: "Update on your Hope Link verification request",
    html:    verificationDeclinedTemplate({ charityName, reviewNote }),
  });
}