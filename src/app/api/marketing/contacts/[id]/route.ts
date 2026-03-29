import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    const body = (await request.json()) as {
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
      created_via?: "tenpo" | "import" | "manual";
      import_batch_id?: string | null;
    };

    const contact = await services.contacts.updateContact({
      id,
      ...body,
    });

    return NextResponse.json(contact);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    await services.contacts.deleteContact(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
