import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isPrivateHostname,
  isSafeRemoteHttpUrl,
  resolveSafeRedirectUrl,
} from "../src/shared/utils/safeRemoteUrl.ts";
import {
  readBoundedArrayBuffer,
  readBoundedText,
} from "../src/shared/utils/boundedResponse.ts";

test("allows public HTTP and HTTPS destinations", () => {
  assert.equal(isSafeRemoteHttpUrl("https://example.com/article"), true);
  assert.equal(isSafeRemoteHttpUrl("http://1.1.1.1/"), true);
  assert.equal(isSafeRemoteHttpUrl("https://[2606:4700:4700::1111]/"), true);
  assert.equal(
    isSafeRemoteHttpUrl("https://[2001:4860:4860::8888]/"),
    true
  );
  assert.equal(isSafeRemoteHttpUrl("http://172.32.0.1/"), true);
  assert.equal(isSafeRemoteHttpUrl("http://100.128.0.1/"), true);
  assert.equal(isSafeRemoteHttpUrl("http://198.20.0.1/"), true);
  assert.equal(isSafeRemoteHttpUrl("https://news.example.co.uk/"), true);
});

test("rejects private, loopback, link-local, and reserved IPv4 hosts", () => {
  for (const url of [
    "http://localhost/",
    "http://localhost./",
    "http://0.0.0.0/",
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://172.16.0.1/",
    "http://172.31.255.255/",
    "http://192.168.1.1/",
    "http://169.254.169.254/",
    "http://100.64.0.1/",
    "http://198.18.0.1/",
    "http://198.19.255.255/",
    "http://2130706433/",
    "http://127.0.0.1.nip.io/",
    "http://foo.localhost/",
  ]) {
    assert.equal(isSafeRemoteHttpUrl(url), false, url);
  }
});

test("rejects private and embedded IPv6 hosts", () => {
  for (const url of [
    "http://[::1]/",
    "http://[::]/",
    "http://[fc00::1]/",
    "http://[fd12:3456::1]/",
    "http://[fe80::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[2001:db8::1]/",
  ]) {
    assert.equal(isSafeRemoteHttpUrl(url), false, url);
  }
  assert.equal(isPrivateHostname("example.local"), true);
});

test("rejects unsupported schemes and malformed URLs", () => {
  for (const url of [
    "file:///tmp/secret",
    "javascript:alert(1)",
    "ftp://example.com/file",
    "data:text/html,hi",
    "not a url",
  ]) {
    assert.equal(isSafeRemoteHttpUrl(url), false, url);
  }
});

test("bounded array-buffer reads reject chunked bodies over the limit", async () => {
  const response = new Response(new Uint8Array(10), {
    headers: { "content-type": "image/jpeg" },
  });
  await assert.rejects(readBoundedArrayBuffer(response, 5), /too large/i);

  const declared = new Response(new Uint8Array(10), {
    headers: { "content-length": "10" },
  });
  await assert.rejects(readBoundedArrayBuffer(declared, 5), /too large/i);
});

test("bounded text reads cap both bytes and characters", async () => {
  const response = new Response("abcdefghij");
  assert.equal(await readBoundedText(response, 100, 4), "abcd");

  const oversized = new Response("abcdefghij");
  await assert.rejects(readBoundedText(oversized, 5, 100), /too large/i);
});

test("safe redirect resolution rejects a public-to-private hop", () => {
  assert.throws(
    () =>
      resolveSafeRedirectUrl(
        "https://public.example.com/start",
        "http://127.0.0.1/secret"
      ),
    /not allowed/i
  );
  assert.throws(
    () =>
      resolveSafeRedirectUrl(
        "https://public.example.com/start",
        "file:///tmp/secret"
      ),
    /not allowed/i
  );
});

test("safe redirect resolution follows relative public redirects", () => {
  assert.equal(
    resolveSafeRedirectUrl(
      "https://public.example.com/start",
      "/final"
    ),
    "https://public.example.com/final"
  );
});

