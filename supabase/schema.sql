-- =============================================================================
--  Wayomile order/customer schema
-- -----------------------------------------------------------------------------
--  Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--  Idempotent (safe to re-run) via IF NOT EXISTS everywhere.
--
--  Design notes / assumptions (flag if any of these are wrong):
--   - Customers are de-duplicated by MOBILE NUMBER (unique, mandatory) — the
--     checkout flow should look up an existing customer by mobile before
--     creating a new one. Email is required too but not treated as unique,
--     since a household could plausibly share one email across phone numbers.
--   - The delivery address is captured per ORDER (a snapshot at checkout
--     time), not as a separate reusable "address book" on the customer —
--     standard e-commerce practice, and avoids an address silently drifting
--     out of sync with what a past order actually shipped to. Easy to add a
--     saved-addresses table later if you want reusable addresses at checkout.
--   - `woo_order_id` bridges to the existing WooCommerce order created by
--     api/create-order.ts — this table is meant to become the richer,
--     queryable order ledger going forward, with WooCommerce still holding
--     product/stock data. If that's not the intent, say so before this goes
--     live against real orders.
--   - Discount coupon and V-STEP reference are captured as plain text on the
--     order — this stores what the customer typed, it does not validate a
--     coupon against a coupons table or check a V-STEP ID against your
--     mobile app's data. That's a separate feature if/when you want it.
--   - RLS is enabled on every table with NO policies for the anon key —
--     meaning the browser can never read/write these directly. All access
--     goes through server-side API routes using the service_role client
--     (src/lib/supabase.ts -> getSupabaseAdmin()), matching how PayPal/
--     WooCommerce credentials are already handled in this codebase.
--
--  ISOLATION FROM THE V-STEP TABLES
--  ---------------------------------------------------------------------------
--  The V-STEP mobile app's tables already live in this database (almost
--  certainly in the default `public` schema). Rather than trust that none of
--  the names below happen to collide, everything here lives in its own
--  Postgres schema, `shop` — a hard, structural guarantee of zero impact on
--  any existing table, whatever it's named.
--
--  ONE MANUAL STEP THIS SCRIPT CAN'T DO: Supabase's API layer only serves
--  schemas you've explicitly exposed. After running this, go to
--  Project Settings -> API -> "Exposed schemas" and add `shop` alongside
--  `public`, or the app won't be able to query these tables at all.
-- =============================================================================

-- Installed into the default schema (public), before search_path changes below.
create extension if not exists pgcrypto;

create schema if not exists shop;

-- Everything from here on lands in `shop`, not `public` — this is what
-- keeps it fully separate from the existing V-STEP tables.
set search_path to shop, public;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists customers (
	id             uuid primary key default gen_random_uuid(),
	customer_code  text unique,                     -- friendly ref, e.g. WMC-100001
	full_name      text not null,
	mobile_number  text not null unique,             -- mandatory, de-dupe key
	email          text not null,
	created_at     timestamptz not null default now(),
	updated_at     timestamptz not null default now()
);

create index if not exists customers_email_idx on customers (email);

create sequence if not exists customer_code_seq start 100001;

create or replace function set_customer_code()
returns trigger language plpgsql as $$
begin
	if new.customer_code is null then
		new.customer_code := 'WMC-' || nextval('customer_code_seq');
	end if;
	return new;
end;
$$;

drop trigger if exists trg_set_customer_code on customers;
create trigger trg_set_customer_code
	before insert on customers
	for each row execute function set_customer_code();

drop trigger if exists trg_customers_updated_at on customers;
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
	new.updated_at := now();
	return new;
end;
$$;
create trigger trg_customers_updated_at
	before update on customers
	for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create sequence if not exists order_number_seq start 100001;

create table if not exists orders (
	id                    uuid primary key default gen_random_uuid(),
	order_number          text not null unique default ('WM-' || nextval('order_number_seq')),
	customer_id           uuid not null references customers (id),

	-- Bridge to the existing WooCommerce order (product/stock system of record).
	woo_order_id          integer,

	status text not null default 'placed' check (
		status in ('placed', 'confirmed', 'processing', 'dispatched',
		           'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded')
	),

	-- Milestone timestamps, per the requested status fields.
	placed_at             timestamptz not null default now(),
	dispatched_at         timestamptz,
	delivered_at          timestamptz,

	courier_vendor        text,
	courier_tracking_id   text,

	-- Captured verbatim as typed at checkout — not validated against anything.
	discount_coupon_code  text,
	vstep_reference_id    text,

	subtotal_amount       numeric(10, 2) not null,
	shipping_amount       numeric(10, 2) not null default 0,
	discount_amount       numeric(10, 2) not null default 0,
	total_amount          numeric(10, 2) not null,
	currency              text not null default 'INR',

	payment_method        text,                      -- e.g. 'paypal'
	payment_status         text not null default 'pending' check (
		payment_status in ('pending', 'paid', 'failed', 'refunded')
	),
	payment_reference     text,                      -- e.g. PayPal capture id

	-- Delivery address, snapshotted at checkout time (see design note above).
	recipient_name        text not null,
	recipient_mobile      text not null,
	address_line1         text not null,
	address_line2         text,
	city                  text not null,
	state                 text not null,
	postcode              text not null,
	country               text not null default 'IN',

	created_at             timestamptz not null default now(),
	updated_at             timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders (customer_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_woo_order_id_idx on orders (woo_order_id);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
	before update on orders
	for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists order_items (
	id                uuid primary key default gen_random_uuid(),
	order_id          uuid not null references orders (id) on delete cascade,
	product_id        integer not null,               -- WooCommerce product id
	product_name      text not null,                  -- snapshot at order time
	variation_label   text,                            -- e.g. "200g"
	unit_price        numeric(10, 2) not null,
	quantity          integer not null check (quantity > 0),
	line_total        numeric(10, 2) not null
);

create index if not exists order_items_order_id_idx on order_items (order_id);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
-- Independent of `customers` — someone can subscribe without ever ordering.
-- `customer_id` links up when the same email later places an order (or
-- already has), per the "capture against customer email" requirement.
create table if not exists newsletter_subscribers (
	id              uuid primary key default gen_random_uuid(),
	email           text not null unique,
	customer_id     uuid references customers (id),
	status          text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
	source          text default 'footer_newsletter',
	subscribed_at   timestamptz not null default now(),
	unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_customer_id_idx on newsletter_subscribers (customer_id);

-- ---------------------------------------------------------------------------
-- certifications
-- ---------------------------------------------------------------------------
-- Government certification numbers (FSSAI, Tea Board, Spices Board, APEDA)
-- shown as trust badges on product pages, the footer and checkout. Admin-
-- editable at /admin/certifications — a badge only renders once `number` is
-- non-null, so leaving a field blank hides it everywhere rather than showing
-- a fabricated/placeholder value.
create table if not exists certifications (
	key           text primary key,
	label         text not null,
	number        text,
	number_label  text not null default 'Reg.',
	blurb         text not null default '',
	-- Product types this claim applies to ('tea' | 'spice' | 'kombucha').
	-- Null = applies to every product (e.g. FSSAI, APEDA).
	applies_to    text[],
	updated_at    timestamptz not null default now(),
	updated_by    text
);

-- Seed the four known certifications. Re-running this script is safe — it
-- never overwrites a number the admin has since edited via the dashboard.
insert into certifications (key, label, number, number_label, blurb, applies_to) values
	('fssai', 'FSSAI Certified', '11324011001462', 'Lic No.',
		'Formulated, processed and packaged in hygienic FSSAI-audited facilities.', null),
	('tea_board', 'Tea Board of India', 'TB|LC|TM|BLF|TR-10007 & TB|LC|TM|KE-10001', 'Reg.',
		'Direct sourcing from registered small tea growers across India.', array['tea']),
	('spices_board', 'Spices Board India', null, 'Cert.',
		'100% natural, unadulterated whole & ground spices.', array['spice']),
	('apeda', 'APEDA Registered', null, 'Reg.',
		'Registered for export of agricultural & processed food products.', null)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security — lock every table to server-side (service_role) access
-- only. The browser's anon key gets no policies, so it can't read or write
-- any of this directly; all access goes through API routes using
-- getSupabaseAdmin() from src/lib/supabase.ts.
-- ---------------------------------------------------------------------------
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table newsletter_subscribers enable row level security;
alter table certifications enable row level security;

-- ---------------------------------------------------------------------------
-- Grants — RLS and schema/table grants are separate Postgres privilege
-- systems. service_role's RLS-bypass doesn't imply it can even see this
-- schema; it needs USAGE granted explicitly, same as any other role would.
-- anon/authenticated get nothing here on purpose (no grants at all) — the
-- browser should never touch these tables directly.
-- ---------------------------------------------------------------------------
grant usage on schema shop to service_role;
grant all on all tables in schema shop to service_role;
grant all on all sequences in schema shop to service_role;
grant execute on all functions in schema shop to service_role;

-- Applies the same grants automatically to any table/sequence/function
-- added to `shop` later, so this doesn't need re-running per new table.
alter default privileges in schema shop grant all on tables to service_role;
alter default privileges in schema shop grant all on sequences to service_role;
alter default privileges in schema shop grant execute on functions to service_role;

-- ---------------------------------------------------------------------------
-- Verify: confirms everything above landed in `shop`, and shows what's still
-- sitting in `public` untouched (your V-STEP tables) for a sanity check.
-- ---------------------------------------------------------------------------
select table_schema, table_name
from information_schema.tables
where table_schema in ('shop', 'public')
order by table_schema, table_name;
