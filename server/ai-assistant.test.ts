import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "lawyer",
    phone: null,
    avatarUrl: null,
    specialty: null,
    barNumber: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AI Assistant Router", () => {
  it("should have chat procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the ai router exists and has chat mutation
    expect(caller.ai).toBeDefined();
    expect(caller.ai.chat).toBeDefined();
  });

  it("should have history procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the ai router has history query
    expect(caller.ai.history).toBeDefined();
  });

  it("should have clearHistory procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the ai router has clearHistory mutation
    expect(caller.ai.clearHistory).toBeDefined();
  });
});

describe("Dashboard Router", () => {
  it("should have stats procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.dashboard).toBeDefined();
    expect(caller.dashboard.stats).toBeDefined();
  });

  it("should have upcomingHearings procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.dashboard.upcomingHearings).toBeDefined();
  });
});

describe("Cases Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.cases).toBeDefined();
    expect(caller.cases.list).toBeDefined();
  });

  it("should have create procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.cases.create).toBeDefined();
  });

  it("should have stats procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.cases.stats).toBeDefined();
  });
});

describe("Clients Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.clients).toBeDefined();
    expect(caller.clients.list).toBeDefined();
  });

  it("should have create procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.clients.create).toBeDefined();
  });
});

describe("Hearings Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.hearings).toBeDefined();
    expect(caller.hearings.list).toBeDefined();
  });

  it("should have create procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.hearings.create).toBeDefined();
  });
});

describe("Documents Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.documents).toBeDefined();
    expect(caller.documents.list).toBeDefined();
  });

  it("should have create procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.documents.create).toBeDefined();
  });
});

describe("Invoices Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.invoices).toBeDefined();
    expect(caller.invoices.list).toBeDefined();
  });

  it("should have create procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.invoices.create).toBeDefined();
  });

  it("should have stats procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.invoices.stats).toBeDefined();
  });
});

describe("Team Router", () => {
  it("should have list procedure defined", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.team).toBeDefined();
    expect(caller.team.list).toBeDefined();
  });
});
