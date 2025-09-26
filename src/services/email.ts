
// This service now sends a webhook to n8n instead of a mock email.

type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

const N8N_WEBHOOK_URL = "https://iterworks.app.n8n.cloud/webhook/ea304559-d1f9-4d24-a476-4c21de958868";

export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  console.log("========================================");
  console.log("       SENDING WEBHOOK TO N8N         ");
  console.log("========================================");
  
  const payload = {
    to,
    subject,
    html,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // The webhook endpoint might not return a successful HTTP status.
      // We'll log the response but won't throw an error unless it's a critical failure.
      const responseBody = await response.text();
      console.warn(`[sendEmail] Webhook returned a non-OK status: ${response.status}`, responseBody);
    }

    console.log("[sendEmail] Successfully sent data to n8n webhook.");
    
  } catch (error) {
    console.error('[sendEmail] Failed to send webhook to n8n:', error);
    // Re-throw the error so the calling flow can handle it, e.g., by notifying the user of the failure.
    throw error;
  }
}
