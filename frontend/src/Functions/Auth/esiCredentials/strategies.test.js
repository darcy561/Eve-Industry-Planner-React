import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockServerBatch, mockClientRefresh } = vi.hoisted(() => ({
  mockServerBatch: vi.fn(),
  mockClientRefresh: vi.fn(),
}));
vi.mock("../../Endpoints/esiAccessClient.js", () => ({
  requestEsiAccessFromServerStorageBatch: mockServerBatch,
  requestEsiAccessFromClientRefreshSecret: mockClientRefresh,
}));

import {
  createClientHeldCredentials,
  createServerStoredCredentials,
} from "./strategies.js";
import {
  ESI_CREDENTIAL_REAUTH_REQUIRED,
  ESI_CREDENTIAL_RECOVERABLE,
} from "./errors.js";
import { esiAccessToken } from "../../../tests/utils.js";

const HASH = "owner-hash";

describe("server-stored credentials", () => {
  let serverStoredCredentials;

  beforeEach(() => {
    mockServerBatch.mockReset();
    // Immediate scheduling: these cases are about one character's outcome, not the gathering.
    serverStoredCredentials = createServerStoredCredentials({
      schedule: (fn) => fn(),
    });
  });

  it("reads the expiry from the returned JWT", async () => {
    mockServerBatch.mockResolvedValue({
      tokens: [
        { character_hash: HASH, access_token: esiAccessToken({ exp: 4_242 }) },
      ],
    });

    const token = await serverStoredCredentials.refresh(HASH);

    expect(mockServerBatch).toHaveBeenCalledWith([HASH]);
    expect(token.exp).toBe(4_242);
  });

  // A rejected credential is reported per character in the response body, not by the request
  // failing — see "needs a full login when the batch reports the character failed".
  it("classifies a rejected request as retriable", async () => {
    mockServerBatch.mockRejectedValue(
      new Error("Server-stored ESI access refresh failed: 401 Unauthorized"),
    );

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_RECOVERABLE,
    });
  });

  it("classifies a server fault as retriable", async () => {
    mockServerBatch.mockRejectedValue(
      new Error(
        "Server-stored ESI access refresh failed: 503 Service Unavailable",
      ),
    );

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_RECOVERABLE,
    });
  });

  // The HTTP clients attach `status`; the message is only sniffed when they did not.
  it("treats an unclassifiable failure as retriable", async () => {
    mockServerBatch.mockRejectedValue(new Error("network down"));

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_RECOVERABLE,
    });
  });

  it("needs a full login when the batch reports the character failed", async () => {
    mockServerBatch.mockResolvedValue({
      tokens: [
        {
          character_hash: HASH,
          error: "cloud esi: invalid_grant from EVE SSO",
        },
      ],
    });

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
  });

  // A row with neither a token nor an error is a malformed answer, and treating it as success
  // would hand the caller an empty bearer token.
  it("needs a full login when a row carries neither token nor error", async () => {
    mockServerBatch.mockResolvedValue({ tokens: [{ character_hash: HASH }] });

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
  });

  it("needs a full login when the batch omits the character entirely", async () => {
    mockServerBatch.mockResolvedValue({ tokens: [] });

    await expect(serverStoredCredentials.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
  });

  it("never writes client-side material", () => {
    expect(serverStoredCredentials.persist).toBeUndefined();
  });
});

describe("client-held credentials", () => {
  let secrets;
  let strategy;

  beforeEach(() => {
    mockClientRefresh.mockReset();
    secrets = new Map([[HASH, "refresh-secret-1"]]);
    strategy = createClientHeldCredentials({
      readSecret: (hash) => secrets.get(hash) ?? "",
      writeSecret: (hash, secret) => secrets.set(hash, secret),
    });
  });

  // EVE SSO may hand back a rotated secret; not storing it spends the old one on the next refresh.
  it("writes a rotated refresh secret back", async () => {
    mockClientRefresh.mockResolvedValue({
      access_token: esiAccessToken({ exp: 4_242 }),
      refresh_token: "refresh-secret-2",
    });

    await strategy.refresh(HASH);

    expect(mockClientRefresh).toHaveBeenCalledWith("refresh-secret-1");
    expect(secrets.get(HASH)).toBe("refresh-secret-2");
  });

  it("keeps the existing secret when none is returned", async () => {
    mockClientRefresh.mockResolvedValue({
      access_token: esiAccessToken({ exp: 4_242 }),
    });

    await strategy.refresh(HASH);

    expect(secrets.get(HASH)).toBe("refresh-secret-1");
  });

  it("needs a full login when no secret is held", async () => {
    await expect(strategy.refresh("unknown-character")).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
    expect(mockClientRefresh).not.toHaveBeenCalled();
  });

  // The HTTP clients attach `status`; the message is only sniffed when they did not.
  it("classifies from the error status when one is attached", async () => {
    const err = new Error("refresh failed");
    err.status = 503;
    mockClientRefresh.mockRejectedValue(err);

    await expect(strategy.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_RECOVERABLE,
    });
  });

  it("needs a full login when SSO rejects the secret", async () => {
    mockClientRefresh.mockRejectedValue(
      new Error("API request failed with status 400: Bad Request"),
    );

    await expect(strategy.refresh(HASH)).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
  });
});

describe("server-stored credentials gather into one request", () => {
  let strategy;
  let release;

  beforeEach(() => {
    mockServerBatch.mockReset();
    // A window the test opens and closes, standing in for the microtask the real strategy uses.
    release = null;
    strategy = createServerStoredCredentials({
      schedule: (fn) => {
        release = fn;
      },
    });
  });

  function tokensFor(...hashes) {
    return {
      tokens: hashes.map((hash) => ({
        character_hash: hash,
        access_token: esiAccessToken({ exp: 4_242, owner: hash }),
      })),
    };
  }

  // Deliberately on the real scheduler rather than the injected one: an injected window would
  // gather the calls whatever the strategy did, and prove nothing about the strategy.
  it("sends one request for characters asked for in the same tick", async () => {
    const live = createServerStoredCredentials();
    mockServerBatch.mockResolvedValue(tokensFor("a", "b", "c"));

    const tokens = await Promise.all([
      live.refresh("a"),
      live.refresh("b"),
      live.refresh("c"),
    ]);

    expect(mockServerBatch).toHaveBeenCalledTimes(1);
    expect(mockServerBatch).toHaveBeenCalledWith(["a", "b", "c"]);
    expect(tokens).toHaveLength(3);
  });

  it("asks for a character once however many callers wanted it", async () => {
    mockServerBatch.mockResolvedValue(tokensFor("a"));

    const all = Promise.all([strategy.refresh("a"), strategy.refresh("a")]);
    release();
    const [first, second] = await all;

    expect(mockServerBatch).toHaveBeenCalledWith(["a"]);
    expect(second.accessToken).toBe(first.accessToken);
  });

  // One dead credential must not deny the others their tokens — that is why the endpoint reports
  // per character rather than failing the batch.
  it("fails only the character the batch reported failed", async () => {
    mockServerBatch.mockResolvedValue({
      tokens: [
        {
          character_hash: "a",
          access_token: esiAccessToken({ exp: 4_242, owner: "a" }),
        },
        { character_hash: "b", error: "cloud esi: invalid_grant from EVE SSO" },
      ],
    });

    const good = strategy.refresh("a");
    const bad = strategy.refresh("b");
    release();

    await expect(good).resolves.toMatchObject({ exp: 4_242 });
    await expect(bad).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_REAUTH_REQUIRED,
    });
  });

  it("fails every waiter when the request itself fails", async () => {
    mockServerBatch.mockRejectedValue(new Error("503 Service Unavailable"));

    const a = strategy.refresh("a");
    const b = strategy.refresh("b");
    release();

    for (const pending of [a, b]) {
      await expect(pending).rejects.toMatchObject({
        classification: ESI_CREDENTIAL_RECOVERABLE,
      });
    }
  });

  // Over the server's cap the whole request is refused, which would fail every character in it for
  // a reason none of them caused.
  it("splits a window larger than the server accepts", async () => {
    const live = createServerStoredCredentials();
    const hashes = Array.from({ length: 51 }, (_, i) => `hash-${i}`);
    mockServerBatch.mockImplementation(async (asked) => tokensFor(...asked));

    await Promise.all(hashes.map((hash) => live.refresh(hash)));

    expect(mockServerBatch).toHaveBeenCalledTimes(2);
    expect(mockServerBatch.mock.calls[0][0]).toHaveLength(50);
    expect(mockServerBatch.mock.calls[1][0]).toHaveLength(1);
  });

  // A request that failed says nothing about any one credential. Reporting it as reauth-required
  // would send the user to a full EVE login over a transport fault.
  it("treats a failed request as retriable, not as dead credentials", async () => {
    const err = new Error("400 Bad Request");
    err.status = 400;
    mockServerBatch.mockRejectedValue(err);

    const pending = strategy.refresh("a");
    release();

    await expect(pending).rejects.toMatchObject({
      classification: ESI_CREDENTIAL_RECOVERABLE,
    });
  });

  it("starts a new window after one has been sent", async () => {
    mockServerBatch.mockResolvedValue(tokensFor("a"));
    const first = strategy.refresh("a");
    release();
    await first;

    mockServerBatch.mockResolvedValue(tokensFor("b"));
    const second = strategy.refresh("b");
    release();
    await second;

    expect(mockServerBatch).toHaveBeenNthCalledWith(1, ["a"]);
    expect(mockServerBatch).toHaveBeenNthCalledWith(2, ["b"]);
  });
});
