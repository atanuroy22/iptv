export default {
  async fetch(request, env, ctx) {
    // Supports:
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

    const upstream = new URL(target);

    // Prepare request init
    const init = {
      method: request.method,
      headers: new Headers(),
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'follow',
    };

    // Realistic UA helps some CDNs
    init.headers.set(
      'User-Agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    );

    // Forward basic Accept/Range for media compatibility
    const reqHeaders = request.headers;
    const passThrough = ['accept', 'range', 'accept-encoding'];
    for (const h of passThrough) {
      const v = reqHeaders.get(h);
      if (v) init.headers.set(h, v);
    }

    // Auto Referer rules: common providers and heuristics
    const host = upstream.host;
    const REFERERS = {
      'zee5.com': 'https://www.zee5.com/',
      'akamaized.net': 'https://www.hotstar.com/',
      'hotstar.com': 'https://www.hotstar.com/',
      'jiotv.com': 'https://www.jiotv.com/',
      'sonyLiv.com': 'https://www.sonyliv.com/',
      'sonyliv.com': 'https://www.sonyliv.com/',
      'voot.com': 'https://www.voot.com/',
      'star.com': 'https://www.startv.com/'
    };
    // exact host match
    if (REFERERS[host]) {
      init.headers.set('Referer', REFERERS[host]);
    } else {
      // suffix/contains heuristics
      if (host.endsWith('.akamaized.net')) {
        init.headers.set('Referer', REFERERS['akamaized.net']);
      } else if (host.includes('zee')) {
        init.headers.set('Referer', REFERERS['zee5.com']);
      } else if (host.includes('hotstar') || host.includes('hs')) {
        init.headers.set('Referer', REFERERS['hotstar.com']);
      } else if (host.includes('sonyliv') || host.includes('sony')) {
        init.headers.set('Referer', REFERERS['sonyliv.com']);
      } else if (host.includes('jiotv')) {
        init.headers.set('Referer', REFERERS['jiotv.com']);
      } else if (host.includes('voot')) {
        init.headers.set('Referer', REFERERS['voot.com']);
      } else if (host.includes('star')) {
        init.headers.set('Referer', REFERERS['star.com']);
      }
    }

    // Never send browser identity headers (strip these)
    // Cloudflare adds Host automatically; cookies/origin often break upstream checks
    // Do not set Origin; most servers check it and block unknown sites.
    // We intentionally DO NOT forward cookies.
    // (Nothing to delete since we’re constructing headers from scratch)

    try {
      const resp = await fetch(upstream.toString(), init);
      const headers = new Headers(resp.headers);

      headers.delete('X-Frame-Options');
      headers.delete('x-frame-options');
      headers.delete('Content-Security-Policy');
      headers.delete('content-security-policy');
      headers.delete('Content-Security-Policy-Report-Only');
      headers.delete('content-security-policy-report-only');

      // Add permissive CORS for browser HLS
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Headers', '*');
      headers.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');

      // Preserve content-type and support range
      // Ensure Accept-Ranges is present for TS/MP4 where needed
      if (!headers.get('Accept-Ranges')) {
        headers.set('Accept-Ranges', 'bytes');
      }

      // For OPTIONS preflight (rare for HLS), respond quickly
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
      }

      const contentType = headers.get('content-type') || '';
      if (contentType.toLowerCase().includes('text/html')) {
        const html = await resp.text();
        const injected = html.replace(
          /<\/body\s*>/i,
          `<script>(function(){function t(e){return (e&&((e.innerText||e.textContent)||'')||'').trim().toLowerCase()}function c(e){try{if(!e) return false; if(e.disabled) return false; if(e.offsetParent===null) return false; e.click(); return true}catch(_){return false}}function s(){var k=['continue','click here to continue','support','please support us','skip','proceed','i understand','accept','allow','unlock','enter','visit site','go to link','get link'];var nodes=document.querySelectorAll('button,a,input[type="button"],input[type="submit"],div[role="button"],span[role="button"]');for(var i=0;i<nodes.length;i++){var n=nodes[i];var v=t(n);if(!v && n.value) v=(n.value||'').trim().toLowerCase();if(!v && n.getAttribute) v=(n.getAttribute('aria-label')||'').trim().toLowerCase();for(var j=0;j<k.length;j++){if(v===k[j] || v.indexOf(k[j])!==-1){if(c(n)) return true;}}}return false}var a=0;var iv=setInterval(function(){a++;if(s()||a>25){clearInterval(iv)}},400);window.addEventListener('load',function(){setTimeout(s,300);setTimeout(s,1200);});})();</script></body>`
        );
        return new Response(injected, { status: resp.status, headers });
      }

      return new Response(resp.body, { status: resp.status, headers });
    } catch (e) {
      return new Response('Proxy error: ' + (e && e.message), { status: 502 });
    }
  }
};