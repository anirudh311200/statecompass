function getSiteUrl() {
  return (process.env.SITE_URL || "https://statecompass.app").replace(/\/$/, "");
}

function getFromAddress() {
  return process.env.PROFILE_FROM_EMAIL || "StateCompass <hello@statecompass.app>";
}

export function buildMagicLink(sessionToken) {
  const url = new URL("/me", getSiteUrl());
  url.searchParams.set("token", sessionToken);
  return url.href;
}

export async function sendMagicLinkEmail({ email, sessionToken, topStateName, matchScore100 }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_NOT_CONFIGURED" };
  }

  const magicLink = buildMagicLink(sessionToken);
  const headline =
    topStateName && matchScore100 != null
      ? `Your top match is ${topStateName} (${matchScore100}%)`
      : "Your StateCompass results are ready";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [email],
      subject: "Your StateCompass founder profile",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #111;">
          <p style="font-size: 18px; font-weight: 600;">${headline}</p>
          <p>Tap below to reopen your personalized top 3 states on any device. No password needed.</p>
          <p><a href="${magicLink}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">Open my results</a></p>
          <p style="font-size: 13px; color: #555;">This link restores your quiz answers and match results. Not legal, tax, or compliance advice.</p>
          <p style="font-size: 12px; color: #777;">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`RESEND_FAILED:${response.status}:${detail}`);
  }

  return { sent: true, magicLink };
}
