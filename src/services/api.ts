
const API_URL = "http://localhost:5000/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  const token = localStorage.getItem("clinic_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected API response (${response.status} ${response.statusText}). Expected JSON, received ${contentType || "no content type"}.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
