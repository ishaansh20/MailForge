const { decrypt } = require("./encryption");

const BREVO_API_BASE = "https://api.brevo.com/v3";

function getApiKey(smtpConfig) {
  return decrypt(smtpConfig.password);
}

async function verifyBrevoApiKey(smtpConfig) {
  const response = await fetch(`${BREVO_API_BASE}/account`, {
    method: "GET",
    headers: {
      "api-key": getApiKey(smtpConfig),
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Brevo rejected the API key (${response.status}): ${body.slice(0, 200)}`,
    );
  }
}

async function sendViaBrevoApi({
  smtpConfig,
  to,
  subject,
  html,
  text,
  campaignId = null,
  recipientId = null,
}) {
  const response = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": getApiKey(smtpConfig),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: smtpConfig.fromName,
        email: smtpConfig.fromEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,

      ...(campaignId && recipientId
        ? {
            headers: {
              "X-Mailin-custom": `campaignId=${campaignId};recipientId=${recipientId}`,
            },
          }
        : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Brevo API send failed (${response.status})`,
    );
  }

  return { messageId: data.messageId };
}

module.exports = { verifyBrevoApiKey, sendViaBrevoApi };
