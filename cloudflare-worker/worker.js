export default {
  async fetch(request, env, ctx) {
    // Proxy endpoint supports:
    // - Query: /?u=<encoded URL>
    // - Path:  /https://example.com/stream.m3u8
    const url = new URL(request.url);
    let target = url.searchParams.get('u') || url.pathname.slice(1);

    if (!target) {
      return new Response('Usage: /?u=<encoded URL> or /<full-url>', { status: 400 });
    }

    // Normalize to full URL
    if (!/^https?:\/\//i.test(target)) {
      target = 'https://' + target;
    }

    // Prepare request init, follow redirects, strip browser-origin headers
    const init = {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'follow',
    };

    // Remove headers that can break upstream or leak browser identity
    ['origin', 'referer', 'host', 'cookie'].forEach(h => init.headers.delete(h));

    // Optional: set a Referer for domains that require it (customize per source)
    // const host = (new URL(target)).host;
    // if (host.endsWith('example.com')) {
    //   init.headers.set('Referer', 'https://example.com/');
    // }

    try {
      const resp = await fetch(target, init);
      const headers = new Headers(resp.headers);

      // Add permissive CORS so browsers can consume HLS via this proxy
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Headers', '*');
      headers.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');

      // Preserve content-type from upstream (m3u8/TS/MP4/etc.)
      return new Response(resp.body, { status: resp.status, headers });
    } catch (e) {
      return new Response('Proxy error: ' + (e && e.message), { status: 502 });
    }
  }
};