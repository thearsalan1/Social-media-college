import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export async function sendEmail({ toEmail, subject, htmlContent }: { toEmail: string; subject: string; htmlContent: string }) {
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME,
  };

  await tranEmailApi.sendTransacEmail({
    sender,
    to: [{ email: toEmail }],
    subject,
    htmlContent,
  });
}