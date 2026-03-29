import { NextResponse, type NextRequest } from "next/server";
import {
  createMarketingServices,
  MarketingServiceError,
  type MarketingDatabaseClient,
} from "@/services/marketing";
import { createSupabaseUserServerClient } from "@/server/supabase/server";
import { getOptionalAuthenticatedAppUser } from "@/server/auth/user";

export class MarketingRequestContextError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MarketingRequestContextError";
  }
}

export async function createMarketingServerServices() {
  const client = await createSupabaseUserServerClient();

  return createMarketingServices(client as unknown as MarketingDatabaseClient);
}

// Marketing requests now derive their scope from the authenticated Supabase
// user. That keeps the Next.js route layer aligned with the RLS model: user
// session -> JWT/app metadata -> academy-scoped database access.
export async function getMarketingServerContext(_request: NextRequest) {
  const user = await getOptionalAuthenticatedAppUser();

  if (!user) {
    throw new MarketingRequestContextError(
      "You must be signed in to access marketing data.",
      401,
    );
  }

  if (!user.academyId) {
    throw new MarketingRequestContextError(
      "Your account is missing an academy scope.",
      403,
    );
  }

  return {
    academyId: user.academyId,
    userId: user.id,
  };
}

export function toMarketingErrorResponse(error: unknown) {
  if (error instanceof MarketingRequestContextError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.status },
    );
  }

  if (error instanceof MarketingServiceError) {
    if (error.causeDetails?.code === "42501") {
      return NextResponse.json(
        {
          error:
            "Your current database session does not have permission for this marketing action. If you recently changed academy_id in auth metadata, sign out and sign back in so Supabase issues a fresh JWT for RLS.",
          code: error.causeDetails.code,
          details: error.causeDetails.details ?? null,
          hint: error.causeDetails.hint ?? null,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.causeDetails?.code ?? null,
        details: error.causeDetails?.details ?? null,
        hint: error.causeDetails?.hint ?? null,
      },
      { status: 500 },
    );
  }

  throw error;
}
