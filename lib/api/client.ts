export type UserRole = "CLIENT" | "VENDOR" | "ADMIN" | "DELIVERY";
export type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

// CSRF token helpers
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

const pendingRequests = new Map<string, Promise<any>>();

export async function apiFetch<T>(
  path: string,
  role: UserRole,
  options?: { method?: ApiMethod; body?: unknown; cache?: RequestCache },
  retryCount = 0,
): Promise<T> {
  const method = options?.method ?? "GET";
  // Dedupe key includes role so two different roles don't share a response
  // (e.g. admin impersonating a client, or multi-tab role switches).
  const cacheKey = `${role}:${method}:${path}`;

  // Deduplicate GET requests
  if (method === "GET" && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
      const body = options?.body;
      const isFormData = body instanceof FormData;

      const headers: Record<string, string> = {};
      if (!isFormData) {
        headers["Content-Type"] = "application/json; charset=utf-8";
      }

      if (isStateChanging) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          headers[CSRF_HEADER_NAME] = csrfToken;
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        cache: options?.cache ?? "no-store",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isJsonResponse = contentType.includes("application/json");

      if (!isJsonResponse) {
        if (typeof window !== "undefined" && contentType.includes("text/html")) {
          const isLoginRedirect = response.redirected && response.url.includes("/login");
          if (isLoginRedirect || response.status === 401) {
            window.location.href = "/login";
          }
        }
        throw new ApiClientError(
          response.status === 500 ? "حصلت مشكلة في السيرفر عندنا (500)" : 
          response.status === 404 ? "الصفحة أو الرابط ده مش موجود (404)" : 
          "حصلت مشكلة مش متوقعة وإحنا بنكلم السيرفر.", 
          response.status || 500
        );
      }

      const payload = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: string }).error)
            : `فشل الطلب. كود الخطأ: ${response.status}`;

        if (response.status === 403 || response.status === 401) {
          console.error(`[API Error ${response.status}]:`, message, `Path: ${path}`);
        }

        const csrfRequired = response.headers.get('X-CSRF-Required');
        if (response.status === 403 && csrfRequired === 'true' && retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return apiFetch(path, role, options, retryCount + 1);
        }

        if (response.status === 401 && typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiClientError(message, response.status);
      }

      return payload as T;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  if (method === "GET") {
    pendingRequests.set(cacheKey, promise);
  }

  return promise as Promise<T>;
}
