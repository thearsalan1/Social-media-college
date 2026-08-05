interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function fetchUsersFromAuth(
  collegeName: string,
  branch?: string,
  role?: string,
): Promise<AuthUser[]> {
  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/auth/internal/students`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.INTERNAL_SERVICE_SECRET as string,
        },
        body: JSON.stringify({ collegeName, branch, role }),
      },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}
