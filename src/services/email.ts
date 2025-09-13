'use server';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using an n8n webhook.
 * This function will throw an error if the webhook call fails.
 * @param params - The email parameters.
 */
export const sendEmail = async (params: EmailParams): Promise<void> => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'YOUR_N8N_WEBHOOK_URL_HERE') {
    const errorMsg = 'N8N_WEBHOOK_URL is not set in the environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`n8n webhook returned a non-200 status: ${response.status}. Body: ${responseBody}`);
    }

  } catch (error) {
    console.error('Failed to trigger n8n webhook:', error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
};
