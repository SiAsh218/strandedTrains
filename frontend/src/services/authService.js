export const login = async (username, password) => {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: "Login failed due to network error" };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch("/api/me");

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return await response.json();
  } catch (error) {
    console.error(error);

    return {
      role: "viewer",
    };
  }
};
