import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockClientRefresh, mockServerStorage } = vi.hoisted(() => ({
  mockClientRefresh: vi.fn(),
  mockServerStorage: vi.fn(),
}));
vi.mock("../Endpoints/esiAccessClient.js", () => ({
  requestEsiAccessFromClientRefreshSecret: mockClientRefresh,
  requestEsiAccessFromServerStorage: mockServerStorage,
  requestEsiAccessFromServerStorageBatch: vi.fn(),
}));

import {
  buildCharacterFromAccessToken,
  buildCharacterFromClientSecret,
  buildCharacterFromStoredCredential,
} from "./buildCharacterFromCredentials.js";
import esiCredentials from "./esiCredentials/provider.js";
import { esiAccessToken } from "../../tests/utils.js";

const HASH = "owner-hash";

describe("building a character from credentials", () => {
  beforeEach(() => {
    mockClientRefresh.mockReset();
    mockServerStorage.mockReset();
    esiCredentials.reset();
    localStorage.clear();
  });

  describe("from an access token already in hand", () => {
    it("reads identity from the JWT and adopts the token", () => {
      const token = esiAccessToken({ owner: HASH });

      const character = buildCharacterFromAccessToken(token, {
        isMainCharacter: true,
      });

      expect(character.CharacterHash).toBe(HASH);
      expect(character.CharacterName).toBe("Test Pilot");
      expect(character.isMainCharacter).toBe(true);
      expect(esiCredentials.heldEsiAccessToken(HASH)).toBe(token);
    });

    it("defaults to a non-main character", () => {
      expect(
        buildCharacterFromAccessToken(esiAccessToken({ owner: HASH }))
          .isMainCharacter,
      ).toBe(false);
    });
  });

  describe("from a client-held refresh secret", () => {
    it("adopts the token and stores the rotated secret for the main character", async () => {
      const token = esiAccessToken({ owner: HASH });
      mockClientRefresh.mockResolvedValue({
        access_token: token,
        refresh_token: "rotated-secret",
      });

      const character = await buildCharacterFromClientSecret("secret-1", {
        isMainCharacter: true,
      });

      expect(mockClientRefresh).toHaveBeenCalledWith("secret-1");
      expect(character.CharacterHash).toBe(HASH);
      expect(esiCredentials.heldEsiAccessToken(HASH)).toBe(token);
      expect(localStorage.getItem("Auth")).toBe("rotated-secret");
    });

    it("does not touch the resume secret for an alt", async () => {
      localStorage.setItem("Auth", "main-secret");
      mockClientRefresh.mockResolvedValue({
        access_token: esiAccessToken({ owner: "alt-hash" }),
        refresh_token: "alt-rotated",
      });

      await buildCharacterFromClientSecret("alt-secret");

      expect(localStorage.getItem("Auth")).toBe("main-secret");
    });

    // A main character whose secret no longer works must not leave it behind: a cold reload would
    // resume from it and fail the same way, with no path back to a login.
    it("clears the resume secret when the main character's exchange fails", async () => {
      localStorage.setItem("Auth", "dead-secret");
      mockClientRefresh.mockRejectedValue(new Error("400 Bad Request"));

      const result = await buildCharacterFromClientSecret("dead-secret", {
        isMainCharacter: true,
      });

      expect(result).toBeInstanceOf(Error);
      expect(localStorage.getItem("Auth")).toBeNull();
    });

    it("leaves the resume secret alone when an alt fails", async () => {
      localStorage.setItem("Auth", "main-secret");
      mockClientRefresh.mockRejectedValue(new Error("400 Bad Request"));

      const result = await buildCharacterFromClientSecret("alt-secret");

      expect(result).toBeInstanceOf(Error);
      expect(localStorage.getItem("Auth")).toBe("main-secret");
    });
  });

  describe("from a cloud-stored credential", () => {
    it("builds from the hash alone and writes nothing client-side", async () => {
      const token = esiAccessToken({ owner: HASH });
      mockServerStorage.mockResolvedValue({ access_token: token });

      const character = await buildCharacterFromStoredCredential(HASH);

      expect(mockServerStorage).toHaveBeenCalledWith(HASH);
      expect(character.CharacterHash).toBe(HASH);
      expect(esiCredentials.heldEsiAccessToken(HASH)).toBe(token);
      expect(localStorage.getItem("Auth")).toBeNull();
    });

    it("returns null for a blank hash without calling the API", async () => {
      expect(await buildCharacterFromStoredCredential("   ")).toBeNull();
      expect(mockServerStorage).not.toHaveBeenCalled();
    });

    it("returns null when the server returns no token", async () => {
      mockServerStorage.mockResolvedValue({});
      expect(await buildCharacterFromStoredCredential(HASH)).toBeNull();
    });

    it("returns null when the exchange fails", async () => {
      mockServerStorage.mockRejectedValue(new Error("401 Unauthorized"));
      expect(await buildCharacterFromStoredCredential(HASH)).toBeNull();
    });
  });
});
