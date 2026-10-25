import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/request-body";

describe("readJsonBody", () => {
  it("parses valid bounded JSON", async () => {
    const result = await readJsonBody(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ok: true }) }), 100);
    expect(result).toEqual({ ok: true, value: { ok: true } });
  });

  it("rejects a declared oversized body before reading it", async () => {
    const request = { headers: new Headers({ "content-length": "1000" }), body: new ReadableStream() } as Request;
    const result = await readJsonBody(request, 10);
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it("rejects malformed JSON", async () => {
    const result = await readJsonBody(new Request("http://localhost", { method: "POST", body: "{" }), 100);
    expect(result).toEqual({ ok: false, status: 400 });
  });
});
