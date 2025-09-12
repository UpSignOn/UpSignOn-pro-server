import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import env from './env';

let proxyAgent: HttpsProxyAgent<string> | null = null;
if (env.HTTP_PROXY) {
  proxyAgent = new HttpsProxyAgent(env.HTTP_PROXY);
}

function proxiedFetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...(proxyAgent ? { agent: proxyAgent } : {}),
    ...init,
  });
}

export { proxiedFetch };
