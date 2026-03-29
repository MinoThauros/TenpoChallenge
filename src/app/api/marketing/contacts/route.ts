import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      email: string;
      first_name?: string | null;
      last_name?: string | null;
    };

    const [contact] = await services.contacts.upsertContacts([
      {
        academy_id: academyId,
        email: body.email,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        created_via: "manual",
      },
    ]);

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "25");

    const contacts = await services.contacts.listContacts({
      academyId,
      search,
      page,
      pageSize,
    });

    return NextResponse.json(contacts);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
