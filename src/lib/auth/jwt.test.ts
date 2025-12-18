import { describe, it, expect } from "vitest";
import { createJWT, verifyJWT, JWTPayload } from "./jwt";

describe("JWT", () => {
  const secret = "test-secret-key-for-jwt-validation";
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: 1,
    email: "test@example.com",
    username: "testuser",
  };

  describe("createJWT", () => {
    it("should create a valid JWT token", async () => {
      const token = await createJWT(payload, secret);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT tokens have three parts separated by dots
      expect(token.split(".")).toHaveLength(3);
    });

    it("should create different tokens for different payloads", async () => {
      const token1 = await createJWT(payload, secret);
      const payload2 = { ...payload, userId: 2 };
      const token2 = await createJWT(payload2, secret);

      expect(token1).not.toBe(token2);
    });

    it("should create different tokens even with same payload (due to iat)", async () => {
      const token1 = await createJWT(payload, secret);
      // Wait at least 1 second to ensure different issued at time (iat is in seconds)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const token2 = await createJWT(payload, secret);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyJWT", () => {
    it("should verify a valid JWT token", async () => {
      const token = await createJWT(payload, secret);
      const verified = await verifyJWT(token, secret);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.username).toBe(payload.username);
      expect(verified?.iat).toBeDefined();
      expect(verified?.exp).toBeDefined();
    });

    it("should return null for invalid token", async () => {
      const invalidToken = "invalid.token.here";
      const verified = await verifyJWT(invalidToken, secret);

      expect(verified).toBeNull();
    });

    it("should return null for token with wrong secret", async () => {
      const token = await createJWT(payload, secret);
      const wrongSecret = "wrong-secret-key";
      const verified = await verifyJWT(token, wrongSecret);

      expect(verified).toBeNull();
    });

    it("should return null for malformed token", async () => {
      const malformedToken = "not.a.valid.jwt.token.format";
      const verified = await verifyJWT(malformedToken, secret);

      expect(verified).toBeNull();
    });

    it("should return null for empty token", async () => {
      const verified = await verifyJWT("", secret);

      expect(verified).toBeNull();
    });

    it("should verify token and preserve all payload fields", async () => {
      const token = await createJWT(payload, secret);
      const verified = await verifyJWT(token, secret);

      expect(verified).not.toBeNull();
      if (verified) {
        expect(verified.userId).toBe(payload.userId);
        expect(verified.email).toBe(payload.email);
        expect(verified.username).toBe(payload.username);
      }
    });
  });

  describe("createJWT and verifyJWT integration", () => {
    it("should create and verify JWT token successfully", async () => {
      const token = await createJWT(payload, secret);
      const verified = await verifyJWT(token, secret);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.username).toBe(payload.username);
    });

    it("should handle multiple create and verify cycles", async () => {
      for (let i = 0; i < 5; i++) {
        const testPayload = { ...payload, userId: i };
        const token = await createJWT(testPayload, secret);
        const verified = await verifyJWT(token, secret);

        expect(verified).not.toBeNull();
        expect(verified?.userId).toBe(i);
      }
    });
  });
});
