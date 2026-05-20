class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401: return "Please log in to continue.";
      case 403: return "You don't have permission to do this.";
      case 404: return "The requested item was not found.";
      case 409: return "This conflicts with existing data.";
      case 429: return "Too many requests. Please wait.";
      default: return error.body?.error || "Something went wrong. Please try again.";
    }
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Cannot connect to server. Check your internet connection.";
  }
  return "An unexpected error occurred.";
}
