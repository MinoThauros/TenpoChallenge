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
    const transactions = await services.facts.listSuccessfulTransactions(academyId);

    return NextResponse.json(transactions);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      payment_id: string;
      registration_id?: string | null;
      event_id: string;
      athlete_id: string;
      paid_at: string;
    };

    const [transaction] = await services.facts.recordSuccessfulTransactions([
      {
        academy_id: academyId,
        ...body,
      },
    ]);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
