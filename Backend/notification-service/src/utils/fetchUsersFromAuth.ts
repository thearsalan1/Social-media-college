export async function fetchUserEmail(userId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/auth/internal/user/${userId}`,
      {
        headers: {
          "X-Internal-Secret": process.env.INTERNAL_SERVICE_SECRET as string,
        },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.email;
  } catch (error) {
    return null;
  }
}
