export function otpEmailTemplate(name: string, otp: string): string {
  return `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>CampusConnect - Email Verification</h2>
      <p>Hi ${name},</p>
      <p>Tumhara OTP hai:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>Ye OTP ${process.env.OTP_EXPIRY_MINUTES || 10} minute me expire ho jaayega.</p>
    </div>
  `;
}

export function passwordResetEmailTemplate(name: string, otp: string): string {
  return `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>CampusConnect - Password Reset</h2>
      <p>Hi ${name},</p>
      <p>Password reset karne ke liye ye OTP use karo:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>Agar tumne ye request nahi ki, is email ko ignore kar do.</p>
    </div>
  `;
}
