import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

interface SendEmailParams {
  toEmail: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({
  toEmail,
  subject,
  htmlContent,
}: SendEmailParams) {
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME,
  };

  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject,
      htmlContent,
    });
    console.log(`📧 Email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw error;
  }
}
