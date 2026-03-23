// email.templates.js

const base = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hope Link</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { border-radius: 12px !important; }
      .email-content { padding: 24px 20px !important; }
      .email-heading { font-size: 20px !important; }
      .email-cta { padding: 8px 20px 28px !important; }
      .info-label { width: 100px !important; font-size: 12px !important; }
      .info-value { font-size: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-wrapper" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#1e40af;letter-spacing:-0.5px;">Hope Link</p>
              <p style="margin:4px 0 0;font-size:11px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;">Connecting What Matters</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This email was sent by Hope Link.<br/>If you didn't expect this, please ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const divider = `
  <tr>
    <td style="padding:0 32px;">
      <div style="height:1px;background:#f3f4f6;"></div>
    </td>
  </tr>
`;

const badge = (text, color) => {
  const colors = {
    green: { bg: "#ecfdf5", text: "#065f46", dot: "#10b981" },
    red:   { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
    blue:  { bg: "#eff6ff", text: "#1e40af", dot: "#3b82f6" },
  };
  const c = colors[color] || colors.blue;
  return `
    <table cellpadding="0" cellspacing="0" style="display:inline-table;">
      <tr>
        <td style="background:${c.bg};border-radius:999px;padding:5px 12px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:6px;">
                <div style="width:7px;height:7px;border-radius:50%;background:${c.dot};"></div>
              </td>
              <td style="vertical-align:middle;font-size:12px;font-weight:600;color:${c.text};white-space:nowrap;">${text}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

const infoRow = (label, value) => `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td class="info-label" style="font-size:13px;color:#6b7280;width:130px;vertical-align:top;padding-right:12px;">${label}</td>
          <td class="info-value" style="font-size:13px;color:#111827;font-weight:500;text-align:right;vertical-align:top;word-break:break-all;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

// ── Registration Approved 
export function registrationApprovedTemplate({ name, email, tempPassword }) {
  const content = `
    <tr><td style="background:#10b981;height:4px;"></td></tr>

    <tr>
      <td class="email-content" style="padding:32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding-bottom:14px;">${badge("Application Approved", "green")}</td></tr>
          <tr><td class="email-heading" style="font-size:22px;font-weight:700;color:#111827;line-height:1.3;padding-bottom:10px;">Welcome to Hope Link, ${name}!</td></tr>
          <tr><td style="font-size:15px;color:#4b5563;line-height:1.7;">
            Your charity registration has been reviewed and approved. You can now log in and start making an impact.
          </td></tr>
        </table>
      </td>
    </tr>

    ${divider}

    <tr>
      <td class="email-content" style="padding:24px 32px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Your login credentials</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow("Email address", `<span style="word-break:break-all;">${email}</span>`)}
          ${infoRow("Temp. password", `<code style="background:#f3f4f6;padding:3px 8px;border-radius:6px;font-family:monospace;font-size:13px;letter-spacing:0.05em;">${tempPassword}</code>`)}
        </table>
      </td>
    </tr>

    ${divider}

    <tr>
      <td style="padding:20px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>Important:</strong> Please change your password immediately after your first login. This temporary password expires in 24 hours.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="email-cta" style="padding:8px 32px 36px;" align="center">
        <a href="${process.env.FRONTEND_URL}/login"
           style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:0.01em;">
          Log in to your account →
        </a>
      </td>
    </tr>
  `;
  return base(content);
}

// ── Registration Declined 
export function registrationDeclinedTemplate({ name, reviewNote }) {
  const content = `
    <tr><td style="background:#ef4444;height:4px;"></td></tr>

    <tr>
      <td class="email-content" style="padding:32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding-bottom:14px;">${badge("Application Declined", "red")}</td></tr>
          <tr><td class="email-heading" style="font-size:22px;font-weight:700;color:#111827;line-height:1.3;padding-bottom:10px;">Thank you for applying, ${name}</td></tr>
          <tr><td style="font-size:15px;color:#4b5563;line-height:1.7;">
            After reviewing your application, we are unable to approve your registration at this time.
          </td></tr>
        </table>
      </td>
    </tr>

    ${reviewNote ? `
    ${divider}
    <tr>
      <td class="email-content" style="padding:24px 32px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Reason for declining</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;font-size:14px;color:#7f1d1d;line-height:1.7;">${reviewNote}</td>
          </tr>
        </table>
      </td>
    </tr>
    ` : ""}

    ${divider}

    <tr>
      <td class="email-content" style="padding:24px 32px 36px;">
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7;">
          If you believe this was a mistake or have additional information to provide, feel free to contact us or resubmit your application.
        </p>
      </td>
    </tr>
  `;
  return base(content);
}

// ── Verification Approved 
export function verificationApprovedTemplate({ charityName }) {
  const content = `
    <tr><td style="background:#10b981;height:4px;"></td></tr>

    <tr>
      <td class="email-content" style="padding:32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding-bottom:14px;">${badge("Verified", "green")}</td></tr>
          <tr><td class="email-heading" style="font-size:22px;font-weight:700;color:#111827;line-height:1.3;padding-bottom:10px;">Congratulations, ${charityName}!</td></tr>
          <tr><td style="font-size:15px;color:#4b5563;line-height:1.7;">
            Your verification request has been approved. Your charity now displays a verified badge to volunteers across the platform.
          </td></tr>
        </table>
      </td>
    </tr>

    ${divider}

    <tr>
      <td class="email-content" style="padding:24px 32px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">What this means</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${["Your profile now shows a verified badge", "Volunteers can apply to your projects with confidence", "Higher visibility in search results"].map((item) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;color:#10b981;font-size:15px;font-weight:700;">✓</td>
                  <td style="vertical-align:middle;font-size:14px;color:#374151;line-height:1.5;">${item}</td>
                </tr>
              </table>
            </td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>

    <tr>
      <td class="email-cta" style="padding:8px 32px 36px;" align="center">
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:0.01em;">
          View your profile →
        </a>
      </td>
    </tr>
  `;
  return base(content);
}

// ── Verification Declined 
export function verificationDeclinedTemplate({ charityName, reviewNote }) {
  const content = `
    <tr><td style="background:#ef4444;height:4px;"></td></tr>

    <tr>
      <td class="email-content" style="padding:32px 32px 24px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding-bottom:14px;">${badge("Verification Declined", "red")}</td></tr>
          <tr><td class="email-heading" style="font-size:22px;font-weight:700;color:#111827;line-height:1.3;padding-bottom:10px;">Verification update for ${charityName}</td></tr>
          <tr><td style="font-size:15px;color:#4b5563;line-height:1.7;">
            We've reviewed your verification request and are unable to approve it at this time.
          </td></tr>
        </table>
      </td>
    </tr>

    ${reviewNote ? `
    ${divider}
    <tr>
      <td class="email-content" style="padding:24px 32px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Reason for declining</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;font-size:14px;color:#7f1d1d;line-height:1.7;">${reviewNote}</td>
          </tr>
        </table>
      </td>
    </tr>
    ` : ""}

    ${divider}

    <tr>
      <td class="email-content" style="padding:24px 32px 36px;">
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7;">
          You're welcome to address the issues mentioned and resubmit your verification request. Make sure all documents are clear, valid, and up to date.
        </p>
      </td>
    </tr>
  `;
  return base(content);
}