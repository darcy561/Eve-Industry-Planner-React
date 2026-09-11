import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrivateRequest, mockPublicFetch } = vi.hoisted(() => ({
  mockPrivateRequest: vi.fn(),
  mockPublicFetch: vi.fn(),
}));
vi.mock("./Private/applyPrivateHeaders.js", () => ({
  default: mockPrivateRequest,
}));
vi.mock("./Public/applyPublicHeaders.js", () => ({
  fetchWithPublicHeaders: mockPublicFetch,
}));

import {
  requestEsiAccessFromClientRefreshSecret,
  requestEsiAccessFromServerStorage,
  requestEsiAccessFromServerStorageBatch,
} from "./esiAccessClient.js";

function ok(body) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

function notOk(status, statusText, body = "") {
  return {
    ok: false,
    status,
    statusText,
    text: async () => body,
    json: async () => ({}),
  };
}

describe("server-stored ESI access, one character", () => {
  beforeEach(() => mockPrivateRequest.mockReset());

  it("posts the character hash", async () => {
    mockPrivateRequest.mockResolvedValue(ok({ access_token: "token" }));

    await expect(
      requestEsiAccessFromServerStorage("owner-hash"),
    ).resolves.toEqual({
      access_token: "token",
    });

    const [url, options] = mockPrivateRequest.mock.calls[0];
    expect(url).toBe("/api/v1/esi/characters/access-token/server");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ character_hash: "owner-hash" });
  });

  it("throws with the status on a rejection", async () => {
    mockPrivateRequest.mockResolvedValue(notOk(403, "Forbidden", "not cloud"));

    await expect(
      requestEsiAccessFromServerStorage("owner-hash"),
    ).rejects.toThrow(/403/);
  });
});

describe("server-stored ESI access, several characters", () => {
  beforeEach(() => mockPrivateRequest.mockReset());

  it("posts the hashes as a list", async () => {
    mockPrivateRequest.mockResolvedValue(ok({ tokens: [] }));

    await requestEsiAccessFromServerStorageBatch(["a", "b"]);

    const [url, options] = mockPrivateRequest.mock.calls[0];
    expect(url).toBe("/api/v1/esi/characters/access-tokens/server");
    expect(JSON.parse(options.body)).toEqual({ character_hashes: ["a", "b"] });
  });

  it("returns the per-character rows unchanged", async () => {
    const tokens = [
      { character_hash: "a", access_token: "token-a" },
      { character_hash: "b", error: "invalid_grant" },
    ];
    mockPrivateRequest.mockResolvedValue(ok({ tokens }));

    await expect(
      requestEsiAccessFromServerStorageBatch(["a", "b"]),
    ).resolves.toEqual({ tokens });
  });

  // The strategy classifies on this, and without it a refused batch reads as an unclassifiable
  // failure rather than the status the server actually sent.
  it("attaches the HTTP status to the error it throws", async () => {
    mockPrivateRequest.mockResolvedValue(
      notOk(400, "Bad Request", "too many character_hashes"),
    );

    await expect(
      requestEsiAccessFromServerStorageBatch(["a"]),
    ).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("client-held ESI access", () => {
  beforeEach(() => mockPublicFetch.mockReset());

  it("posts the refresh secret", async () => {
    mockPublicFetch.mockResolvedValue(ok({ access_token: "token" }));

    await requestEsiAccessFromClientRefreshSecret("secret");

    const [url, options] = mockPublicFetch.mock.calls[0];
    expect(url).toBe("/api/v1/eve-sso/tokens/refresh");
    expect(JSON.parse(options.body)).toEqual({ refresh_token: "secret" });
  });

  it("refuses an empty secret without calling out", async () => {
    await expect(requestEsiAccessFromClientRefreshSecret("  ")).rejects.toThrow(
      /required/,
    );
    expect(mockPublicFetch).not.toHaveBeenCalled();
  });

  it("prefers the server's error message when it sends one", async () => {
    mockPublicFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error: "invalid_grant" }),
    });

    await expect(
      requestEsiAccessFromClientRefreshSecret("secret"),
    ).rejects.toThrow("invalid_grant");
  });
});
