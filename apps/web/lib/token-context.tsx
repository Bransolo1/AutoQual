"use client";
/**
 * TokenProvider – passes the server-read JWT down to client components.
 * Usage in layout.tsx (server component):
 *   const token = getSessionToken();
 *   <TokenProvider token={token}> ... </TokenProvider>
 */
import { createContext, useContext } from "react";
import { decodeJwtClaims, type SessionUser } from "./session";

type TokenCtx = {
  token: string | null;
  user: SessionUser | null;
};

const Ctx = createContext<TokenCtx>({ token: null, user: null });

export function TokenProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const user: SessionUser | null = token
    ? (() => {
        const c = decodeJwtClaims(token);
        if (!c.sub) return null;
        return {
          sub: c.sub as string,
          email: c.email as string | undefined,
          name: c.name as string | undefined,
          role: c.role as string | undefined,
          workspaceId: c.workspaceId as string | undefined,
        };
      })()
    : null;

  return <Ctx.Provider value={{ token, user }}>{children}</Ctx.Provider>;
}

export function useToken(): TokenCtx {
  return useContext(Ctx);
}
