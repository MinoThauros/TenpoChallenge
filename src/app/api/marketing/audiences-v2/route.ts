import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MarketingContactEventSegmentFact, Page } from '@/lib/marketing-services';
import {
  buildEventFiltersForRule,
  formatMarketingV2MatchingActivity,
  getMarketingV2ActivityDate,
  type MarketingV2AudienceRule,
} from '@/lib/marketing-v2';
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from '@/server/marketing/service';

type AudiencePreviewFamily = {
  marketingContactId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  lastMatchingActivity: string;
  lastMatchingAt: string | null;
  matchingActivities: Array<{
    eventId: string;
    eventName: string;
    label: string;
    at: string | null;
  }>;
};

type AudiencePreviewResponse = {
  summary: {
    matchingContacts: number;
  };
  results: Page<AudiencePreviewFamily>;
};

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const body = (await request.json()) as {
      rules?: MarketingV2AudienceRule[];
      pageSize?: number;
      excludedContactIds?: string[];
    };
    const rules = (body.rules ?? []).filter((rule) => rule.eventId);
    const pageSize = Math.min(Math.max(body.pageSize ?? 6, 1), 500);
    const excludedContactIds = new Set(body.excludedContactIds ?? []);

    if (!rules.length) {
      const emptyResponse: AudiencePreviewResponse = {
        summary: {
          matchingContacts: 0,
        },
        results: {
          data: [],
          count: 0,
          page: 1,
          pageSize,
        },
      };

      return NextResponse.json(emptyResponse);
    }

    const responses = await Promise.all(
      rules.map((rule) =>
        services.segmentation.listContactEventSegmentFacts({
          academyId,
          filters: buildEventFiltersForRule(rule),
          page: 1,
          pageSize: 200,
        }).then((response) => ({ response, rule }))
      ),
    );

    const uniqueRows = new Map<string, MarketingContactEventSegmentFact & {
      matchedStatus: MarketingV2AudienceRule['status'];
    }>();

    for (const { response, rule } of responses) {
      for (const row of response.data) {
        if (excludedContactIds.has(row.marketing_contact_id)) {
          continue;
        }

        const key = `${row.marketing_contact_id}:${row.event_id}:${rule.status}`;
        if (!uniqueRows.has(key)) {
          uniqueRows.set(key, {
            ...row,
            matchedStatus: rule.status,
          });
        }
      }
    }

    const rows = Array.from(uniqueRows.values());
    const familiesByContact = new Map<string, AudiencePreviewFamily>();

    for (const row of rows) {
      const at = getMarketingV2ActivityDate(row, row.matchedStatus);
      const label = formatMarketingV2MatchingActivity(row.event_name, row.matchedStatus);
      const existing = familiesByContact.get(row.marketing_contact_id);

      if (!existing) {
        familiesByContact.set(row.marketing_contact_id, {
          marketingContactId: row.marketing_contact_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          lastMatchingActivity: label,
          lastMatchingAt: at,
          matchingActivities: [
            {
              eventId: row.event_id,
              eventName: row.event_name,
              label,
              at,
            },
          ],
        });
        continue;
      }

      existing.matchingActivities.push({
        eventId: row.event_id,
        eventName: row.event_name,
        label,
        at,
      });

      const existingTime = existing.lastMatchingAt ? Date.parse(existing.lastMatchingAt) : Number.NEGATIVE_INFINITY;
      const nextTime = at ? Date.parse(at) : Number.NEGATIVE_INFINITY;

      if (nextTime > existingTime) {
        existing.lastMatchingActivity = label;
        existing.lastMatchingAt = at;
      }
    }

    const families = Array.from(familiesByContact.values())
      .map((family) => ({
        ...family,
        matchingActivities: family.matchingActivities.sort((left, right) => {
          const leftTime = left.at ? Date.parse(left.at) : Number.NEGATIVE_INFINITY;
          const rightTime = right.at ? Date.parse(right.at) : Number.NEGATIVE_INFINITY;
          return rightTime - leftTime;
        }),
      }))
      .sort((left, right) => {
        const leftTime = left.lastMatchingAt ? Date.parse(left.lastMatchingAt) : Number.NEGATIVE_INFINITY;
        const rightTime = right.lastMatchingAt ? Date.parse(right.lastMatchingAt) : Number.NEGATIVE_INFINITY;
        return rightTime - leftTime;
      });

    const previewRows = families.slice(0, pageSize);

    const response: AudiencePreviewResponse = {
      summary: {
        matchingContacts: families.length,
      },
      results: {
        data: previewRows,
        count: families.length,
        page: 1,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
