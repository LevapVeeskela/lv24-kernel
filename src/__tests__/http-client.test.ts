import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { UndiciHttpClient } from '../http/undici-http-client.js';

/**
 * Local-only HTTP fixture server (127.0.0.1, ephemeral port).
 * No live network: exercises UndiciHttpClient send/query/body/headers.
 */
let server: Server;
let baseUrl: string;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });
}

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', id: '123' }));
      return;
    }
    if (url.pathname === '/echo-query') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', query: Object.fromEntries(url.searchParams) }));
      return;
    }
    if (url.pathname === '/echo-body') {
      void readBody(req).then((body) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', body, contentType: req.headers['content-type'] }));
        return undefined;
      });
      return;
    }
    if (url.pathname === '/echo-headers') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', userAgent: req.headers['user-agent'] ?? '' }));
      return;
    }
    if (url.pathname === '/text') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('plain text');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'fail', message: 'not found' }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('UndiciHttpClient', () => {
  it('parses a JSON response body', async () => {
    const client = new UndiciHttpClient();
    const response = await client.send({ url: `${baseUrl}/json`, method: 'GET' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok', id: '123' });
    expect(response.method).toBe('GET');
  });

  it('appends query params to the URL', async () => {
    const client = new UndiciHttpClient();
    const response = await client.send({
      url: `${baseUrl}/echo-query`,
      method: 'GET',
      query: { access_token: 'tok', limit: 25 },
    });

    expect(response.body).toEqual({
      status: 'ok',
      query: { access_token: 'tok', limit: '25' },
    });
  });

  it('sends URLSearchParams bodies as form-encoded', async () => {
    const client = new UndiciHttpClient();
    const response = await client.send({
      url: `${baseUrl}/echo-body`,
      method: 'POST',
      body: new URLSearchParams({ message: 'hello' }),
    });

    const body = response.body as Record<string, unknown>;
    expect(body.body).toBe('message=hello');
    expect(body.contentType).toBe('application/x-www-form-urlencoded');
  });

  it('sends default Instagram headers', async () => {
    const client = new UndiciHttpClient();
    const response = await client.send({ url: `${baseUrl}/echo-headers`, method: 'GET' });

    const body = response.body as Record<string, unknown>;
    expect(body.userAgent).toContain('Instagram');
  });

  it('returns plain text bodies as strings', async () => {
    const client = new UndiciHttpClient();
    const response = await client.send({ url: `${baseUrl}/text`, method: 'GET' });

    expect(response.body).toBe('plain text');
  });

  it('setProxy(null) keeps the client usable', async () => {
    const client = new UndiciHttpClient();
    client.setProxy(null);
    const response = await client.send({ url: `${baseUrl}/json`, method: 'GET' });

    expect(response.statusCode).toBe(200);
  });
});
