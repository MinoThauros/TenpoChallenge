import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

export async function GET(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const marketingContactId = request.nextUrl.searchParams.get("marketingContactId") ?? undefined;

    const links = await services.contacts.listAthleteLinks({
      academyId,
      marketingContactId,
    });

    return NextResponse.json(links);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      marketing_contact_id: string;
      athlete_id: string;
      relationship_type?: "parent" | "guardian" | "other" | null;
    };

    const [link] = await services.contacts.linkAthletes([
      {
        academy_id: academyId,
        marketing_contact_id: body.marketing_contact_id,
        athlete_id: body.athlete_id,
        relationship_type: body.relationship_type ?? null,
      },
    ]);

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      marketing_contact_id: string;
      athlete_id: string;
    };

    await services.contacts.unlinkAthlete({
      academyId,
      marketingContactId: body.marketing_contact_id,
      athleteId: body.athlete_id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
