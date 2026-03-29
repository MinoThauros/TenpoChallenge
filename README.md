# Tenpo Academy Marketing Communications

> **LICENSE NOTICE:** This codebase is the proprietary property of Tenpo, Inc. It is provided solely for use during the authorized hackathon event. You may not copy, distribute, sublicense, publish, or use any part of this code, design system, or design tokens in any other project, product, or context without permission.

## Abstract

We approached this challenge as a workflow problem, not just an email-composer problem. Academy owners already have rich first-party data inside Tenpo, including registrations, payments, athletes, events, and parent contact records, but they cannot turn that data into outreach without exporting it into a separate marketing tool. Our solution brings that process into the Tenpo dashboard so an admin can build an audience, validate who will receive the message, and launch a campaign in one place.

The core product bet is segmentation. Instead of treating marketing as a static mailing list, this codebase turns Tenpo data into a live audience engine. Admins can start from reusable presets, narrow by event, season, registration behavior, payment behavior, activity recency, linked athletes, or imported-list provenance, then save those rules as reusable segments. This makes the product materially faster than the current CSV workaround and gives academies a reason to use Tenpo as the system of action, not just the system of record.

## What This Codebase Delivers

This repository is the academy-facing marketing workspace built with Next.js and Supabase. It gives admins a simple, preview-first interface for:

- building audiences from Tenpo contact, athlete, event, registration, and payment data
- importing subscribers from external tools such as Mailchimp or CSV exports
- deduplicating contacts by normalized email so imported lists and Tenpo-native contacts can merge cleanly
- managing suppressions for unsubscribes, bounces, complaints, and manual removals
- saving reusable segments that stay current as underlying data changes
- composing campaigns against a chosen audience and scheduling them for delivery
- monitoring dispatch progress and recipient activity from inside the dashboard

The product experience is intentionally designed for non-technical academy staff. Audience creation is preview-first, so the admin can see who matches before sending. Campaign composition reuses the exact same segmentation model, which avoids the common problem of trusting one set of filters in one screen and then rebuilding them differently somewhere else.

## Why Segmentation Was The Centerpiece

We believed the real value was not sending one more newsletter. It was giving academies a way to act on the data they already have.

That is why the data model and UI focus on audience resolution:

- Tenpo-native contacts can be combined with imported audiences rather than living in separate silos.
- Contacts can be linked to athletes, which makes parent communication more useful and more precise.
- Registration and payment facts become marketable signals, such as families who registered but never paid, contacts tied to a past event, or families inactive for a period of time.
- Saved segments keep those rules reusable, so recurring outreach does not require rebuilding filters every time.

In business terms, this shifts marketing from list management to revenue activation. The admin is no longer exporting data to another product just to answer a basic question like “who came last summer but has not registered this season?”

## Companion Delivery Microservice

This frontend works in tandem with a separate marketing dispatch microservice that handles campaign execution.

From a business perspective, that service is the operational backbone for delivery. It watches for campaigns that are ready to send, expands the selected audience into concrete recipients, processes sends in controlled batches, and updates progress and outcomes back into Supabase in real time. It is built to prevent duplicate sends, respect suppressions, track sent, retried, failed, and blocked recipients, and maintain a reliable audit trail of campaign performance.

Architecturally, it is a lightweight cron-friendly worker rather than a long-running API. That makes it cost-efficient and well suited to scheduled campaign execution. At the moment, the provider layer is simulated rather than connected to a live email platform, which let us validate the workflow, state transitions, and recipient-level tracking before introducing real sending infrastructure.

## Product Thinking And Tradeoffs

We made a few deliberate choices to stay aligned with the hackathon brief:

- We prioritized first-party segmentation and portability over building a full template editor.
- We kept imports lightweight because the goal was immediate audience activation, not a heavy ETL product.
- We treated suppressions and deduplication as core platform behavior, not edge cases.
- We separated campaign creation from delivery execution so the system can scale operationally without making the dashboard more complex.

What we intentionally left out:

- live ESP integration and provider-specific deliverability work
- advanced template design, personalization, and A/B testing
- deeper analytics beyond dispatch and recipient activity visibility
- automated journeys or multi-step lifecycle campaigns

## Outcome

The result is a segmentation-first marketing system that helps Tenpo close the gap between operational data and outbound communication. Instead of forcing academy owners to export CSVs into Mailchimp, the platform can now let them identify the right audience, create a campaign, and send it from the same place they already manage camps, registrations, and families.

## Local Development

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). The marketing workspace is available at [http://localhost:3000/marketing](http://localhost:3000/marketing).
