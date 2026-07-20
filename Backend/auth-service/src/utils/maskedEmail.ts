export const maskedEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");
  const maskedLocal =
    localPart[0] + "*".repeat(Math.max(localPart.length - 1, 1));
  return `${maskedLocal}@${domain}`;
};
