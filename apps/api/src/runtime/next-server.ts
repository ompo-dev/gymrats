type RequestCookie = {
  name: string;
  value: string;
};

type ResponseCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [rawName, ...rest] = cookiePart.trim().split("=");
    if (!rawName) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rest.join("=")));
  }

  return cookies;
}

function serializeCookie(
  name: string,
  value: string,
  options: ResponseCookieOptions = {},
) {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  segments.push(`Path=${options.path ?? "/"}`);

  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }

  if (typeof options.maxAge === "number") {
    segments.push(`Max-Age=${Math.trunc(options.maxAge)}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.httpOnly) {
    segments.push("HttpOnly");
  }

  if (options.secure) {
    segments.push("Secure");
  }

  if (options.sameSite) {
    const normalizedSameSite =
      options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
    segments.push(`SameSite=${normalizedSameSite}`);
  }

  return segments.join("; ");
}

class RequestCookies {
  private readonly cookieMap: Map<string, string>;

  constructor(headers: Headers) {
    this.cookieMap = parseCookieHeader(headers.get("cookie"));
  }

  get(name: string): RequestCookie | undefined {
    const value = this.cookieMap.get(name);
    if (value == null) {
      return undefined;
    }

    return { name, value };
  }

  has(name: string) {
    return this.cookieMap.has(name);
  }

  getAll(): RequestCookie[] {
    return [...this.cookieMap.entries()].map(([name, value]) => ({
      name,
      value,
    }));
  }
}

class ResponseCookies {
  constructor(private readonly headers: Headers) {}

  set(name: string, value: string, options?: ResponseCookieOptions): void;
  set(options: { name: string; value: string } & ResponseCookieOptions): void;
  set(
    nameOrOptions:
      | string
      | ({ name: string; value: string } & ResponseCookieOptions),
    value?: string,
    options?: ResponseCookieOptions,
  ) {
    if (typeof nameOrOptions === "string") {
      this.headers.append(
        "Set-Cookie",
        serializeCookie(nameOrOptions, value ?? "", options),
      );
      return;
    }

    this.headers.append(
      "Set-Cookie",
      serializeCookie(nameOrOptions.name, nameOrOptions.value, nameOrOptions),
    );
  }

  delete(name: string, options: ResponseCookieOptions = {}) {
    this.headers.append(
      "Set-Cookie",
      serializeCookie(name, "", {
        ...options,
        expires: new Date(0),
        maxAge: 0,
      }),
    );
  }
}

export class NextResponse extends Response {
  readonly cookies: ResponseCookies;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.cookies = new ResponseCookies(this.headers);
  }

  static json(body: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers,
    });
  }

  static redirect(url: string | URL, init: number | ResponseInit = 307) {
    const status = typeof init === "number" ? init : (init.status ?? 307);
    const headers =
      typeof init === "number" ? new Headers() : new Headers(init.headers);
    headers.set("Location", String(url));
    return new NextResponse(null, { status, headers });
  }
}

export class NextRequest extends Request {
  readonly cookies: RequestCookies;
  readonly nextUrl: URL;

  constructor(input: string | URL | Request, init?: RequestInit) {
    super(input, init);
    this.cookies = new RequestCookies(this.headers);
    this.nextUrl = new URL(this.url);
  }
}

export async function createNextRequest(request: Request) {
  const method = request.method.toUpperCase();
  const headers = new Headers(request.headers);
  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.clone().arrayBuffer();
  }

  return new NextRequest(request.url, init);
}
