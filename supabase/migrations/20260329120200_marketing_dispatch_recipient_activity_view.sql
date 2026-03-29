begin;

-- -----------------------------------------------------------------------------
-- Recipient activity view
-- -----------------------------------------------------------------------------
--
-- The campaign page needs a denormalized read model that can answer questions
-- like "who has already received the email?" and "which recipients failed, and
-- what was the last known error?" without changing the underlying write tables.
-- This view keeps that reporting surface read-only and derived.

create or replace view public.v_marketing_dispatch_recipient_activity as
with latest_attempts as (
  select
    mesa.dispatch_recipient_id,
    mesa.status as latest_attempt_status,
    mesa.requested_at as latest_attempt_requested_at,
    mesa.completed_at as latest_attempt_completed_at,
    mesa.retry_after as latest_attempt_retry_after,
    mesa.provider_message_id as latest_attempt_provider_message_id,
    mesa.error_message as latest_attempt_error_message,
    row_number() over (
      partition by mesa.dispatch_recipient_id
      order by mesa.attempt_no desc, mesa.requested_at desc
    ) as latest_attempt_rank
  from public.marketing_email_send_attempts mesa
)
select
  rdr.id as dispatch_recipient_id,
  rdr.dispatch_id,
  rdr.campaign_id,
  rdr.academy_id,
  rdr.marketing_contact_id,
  mc.first_name,
  mc.last_name,
  mc.email as contact_email,
  rdr.to_email as recipient_email,
  rdr.status as recipient_status,
  rdr.sent_at,
  rdr.attempt_count,
  rdr.last_error_message,
  rdr.provider_message_id,
  rdr.inserted_at,
  rdr.updated_at,
  mcd.status as dispatch_status,
  la.latest_attempt_status,
  la.latest_attempt_requested_at,
  la.latest_attempt_completed_at,
  la.latest_attempt_retry_after,
  la.latest_attempt_provider_message_id,
  la.latest_attempt_error_message
from public.marketing_dispatch_recipients rdr
join public.marketing_campaign_dispatches mcd
  on mcd.id = rdr.dispatch_id
join public.marketing_contacts mc
  on mc.id = rdr.marketing_contact_id
left join latest_attempts la
  on la.dispatch_recipient_id = rdr.id
 and la.latest_attempt_rank = 1;

comment on view public.v_marketing_dispatch_recipient_activity is
  'Detailed recipient-level activity for campaign delivery. This read model powers UI reporting for delivered, failed, retryable, and pending recipients without introducing another persisted table.';

alter view public.v_marketing_dispatch_recipient_activity
set (security_invoker = true);

commit;
