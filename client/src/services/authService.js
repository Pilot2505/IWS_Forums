async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

export async function requestPasswordReset(identifier) {
  const response = await fetch("/api/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier }),
  });

  return parseJsonResponse(response);
}

export async function verifyPasswordResetToken(token) {
  const response = await fetch(
    `/api/forgot-password/verify?token=${encodeURIComponent(token)}`
  );

  return parseJsonResponse(response);
}

export async function resetPassword({ token, password, confirmPassword }) {
  const response = await fetch("/api/forgot-password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password, confirmPassword }),
  });

  return parseJsonResponse(response);
}