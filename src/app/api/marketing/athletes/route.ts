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
    const athletes = await services.athletes.listAthletes(academyId);

    return NextResponse.json(athletes);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      first_name: string;
      last_name: string;
      birth_date?: string | null;
    };

    const athlete = await services.athletes.createAthlete({
      academy_id: academyId,
      first_name: body.first_name,
      last_name: body.last_name,
      birth_date: body.birth_date ?? null,
    });

    return NextResponse.json(athlete, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
