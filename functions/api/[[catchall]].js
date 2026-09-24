/**
 * Cloudflare Pages Functions: Reverse Proxy for ML API
 * Routes any request from https://<your-pages-subdomain>.pages.dev/api/* 
 * directly to the Python backend running behind Cloudflare Tunnel or hosted server.
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Set BACKEND_URL in Cloudflare Pages environment variables, 
    // or fallback to your Cloudflare Tunnel host
    const backendOrigin = env.BACKEND_API_URL || "https://api.yourdomain.com";
    const targetUrl = `${backendOrigin}${url.pathname}${url.search}`;

    // Security: Forward strictly validated headers, strip sensitive host headers
    const newHeaders = new Headers(request.headers);
    newHeaders.set("X-Forwarded-Host", url.host);
    newHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

    const response = await fetch(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow"
    });

    return response;
}
