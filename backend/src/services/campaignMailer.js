const { createTransporter } = require("../utils/smtp.utils");
const { sendViaBrevoApi } = require("../utils/brevoApi.utils");

const UNSUBSCRIBE_TOKEN_PATTERN = /{{\s*unsubscribe_url\s*}}/gi;

function personalize(body, name) {
  return body.replace(/{{\s*name\s*}}/gi, name);
}

function appendUnsubscribeFooter(html, unsubscribeUrl) {
  return `${html}<hr style="margin-top:24px;border:none;border-top:1px solid #e2e8f0;" /><p style="margin-top:16px;font-size:12px;color:#94a3b8;">If you no longer wish to receive these emails, <a href="${unsubscribeUrl}" style="color:#64748b;">unsubscribe here</a>.</p>`;
}

function injectUnsubscribeUrl(html, unsubscribeUrl) {
  const withTokenReplaced = html.replace(UNSUBSCRIBE_TOKEN_PATTERN, unsubscribeUrl);

  if (withTokenReplaced !== html) {
    return withTokenReplaced;
  }

  return appendUnsubscribeFooter(html, unsubscribeUrl);
}

async function sendCampaignEmailToRecipient({ campaign, smtpConfig, recipient, frontendUrl }) {
  const unsubscribeUrl = `${frontendUrl}/unsubscribe/${recipient.unsubscribeToken}`;
  const html = injectUnsubscribeUrl(personalize(campaign.body, recipient.name), unsubscribeUrl);
  const subject = personalize(campaign.subject, recipient.name);

  if (smtpConfig.transport === "brevo_api") {
    const result = await sendViaBrevoApi({ smtpConfig, to: recipient.email, subject, html });
    return { accepted: [recipient.email], rejected: [], messageId: result.messageId || null };
  }

  const transporter = createTransporter(smtpConfig);

  const info = await transporter.sendMail({
    from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
    to: recipient.email,
    subject,
    html,
  });

  return {
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    messageId: info.messageId || null,
  };
}

module.exports = {
  personalize,
  appendUnsubscribeFooter,
  injectUnsubscribeUrl,
  sendCampaignEmailToRecipient,
};
