import { vi } from "vitest";
import type { Context } from "@/lib/context";

export function createMockContext(): Context {
  return {
    env: {
      JWT_SECRET: "test-secret",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      DB: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      R2: {} as any,
      TURNSTILE_SECRET_KEY: "test-turnstile-key",
    } as CloudflareEnv,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
    db: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((data) => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            },
          ]),
        })),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
      update: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}
