import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signOut: mocks.signOut } } }));
vi.mock("@/integrations/lovable", () => ({ lovable: {} }));
vi.mock("@/lib/swipes", () => ({ sessionId: vi.fn(), sessionSecret: vi.fn(), ensureSession: vi.fn() }));
import { signOut } from "@/lib/auth";

describe("logout", () => {
  it("cancels queries and clears account data before ending the session", async () => {
    const client = new QueryClient();
    client.setQueryData(["account"], { points: 100 });
    const order: string[] = [];
    vi.spyOn(client, "cancelQueries").mockImplementation(async () => { order.push("cancel"); });
    const clear = client.clear.bind(client);
    vi.spyOn(client, "clear").mockImplementation(() => { order.push("clear"); clear(); });
    mocks.signOut.mockImplementation(async () => { order.push("logout"); return { error: null }; });
    await signOut(client);
    expect(order).toEqual(["cancel", "clear", "logout"]);
    expect(client.getQueryData(["account"])).toBeUndefined();
  });
  it("reports a failed logout instead of treating it as successful", async () => {
    const error = new Error("Session could not be ended");
    mocks.signOut.mockResolvedValue({ error });
    await expect(signOut(new QueryClient())).rejects.toThrow(error.message);
  });
});