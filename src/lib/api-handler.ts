import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "./supabase";

export type ApiRole = "admin" | "teacher" | "student" | "guest";

export interface ApiContext {
  actorRole: ApiRole;
  actorId: string;
  db: typeof supabase;
  params: Record<string, string>;
}

type ApiHandler = (
  req: Request,
  context: ApiContext
) => Promise<NextResponse | Response>;

/**
 * A wrapper for Next.js API routes that handles common logic:
 * - Authentication headers (actor role/id)
 * - DB client selection (admin vs anon)
 * - Consistent error handling
 */
export function withApiHandler(handler: ApiHandler, options?: { adminOnly?: boolean }) {
  return async (req: Request, { params }: { params: any }) => {
    try {
      const actorRole = (req.headers.get("x-actor-role") || "guest") as ApiRole;
      const actorId = req.headers.get("x-actor-id") || "";

      // Authorization check
      if (options?.adminOnly && actorRole !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 403 }
        );
      }

      // Context construction
      const context: ApiContext = {
        actorRole,
        actorId,
        db: supabaseAdmin || supabase,
        params: params || {},
      };

      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { 
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Standard Success Response helper
 */
export function successResponse(data: any, init?: number | ResponseInit) {
  const options = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, options);
}

/**
 * Standard Error Response helper
 */
export function errorResponse(message: string, init?: number | ResponseInit, details?: any) {
  const options = typeof init === "number" ? { status: init } : (init || { status: 400 });
  return NextResponse.json({ error: message, details }, options);
}
