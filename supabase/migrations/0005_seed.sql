-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — essential seed (config only, no demo catalog)
-- Seeds currencies, site settings, the three core categories, the homepage
-- layout and a starter FAQ. Real games/products/reviews are added by admins
-- through the dashboard. Idempotent: guarded by unique keys / "not exists".
-- ─────────────────────────────────────────────────────────────────────────

-- Currencies (rates relative to 1 USD; editable in Admin → Settings)
insert into zeus.exchange_rates (code, rate, symbol, label) values
  ('USD', 1.000000, '$',  'US Dollar'),
  ('EUR', 0.920000, '€',  'Euro'),
  ('GBP', 0.790000, '£',  'British Pound'),
  ('CAD', 1.370000, 'C$', 'Canadian Dollar'),
  ('AUD', 1.530000, 'A$', 'Australian Dollar')
on conflict (code) do nothing;

-- Site settings. First signup whose email is in bootstrap_admin_emails
-- automatically becomes super_admin.
insert into zeus.site_settings (key, value) values
  ('site_name',              '"Zeuservices"'),
  ('tagline',                '"Premium game top-ups, boosting and accounts — fast, safe and trusted by thousands of gamers."'),
  ('announcement',           '""'),
  ('support_email',          '"support@zeus-services.gg"'),
  ('discord_invite',         '""'),
  ('twitter_url',            '""'),
  ('youtube_url',            '""'),
  ('tiktok_url',             '""'),
  ('bootstrap_admin_emails', '["daniel.holecek20@gmail.com"]')
on conflict (key) do nothing;

-- The three core categories.
insert into zeus.categories (name, slug, description, icon, sort_order) values
  ('Top-Ups',  'topups',   'In-game currency for less — V-Bucks, VP, Robux, Gems and more, delivered fast.', null, 0),
  ('Boosting', 'boosting', 'Pro players rank up your account safely. VPN-protected, progress screenshots included.', null, 1),
  ('Accounts', 'accounts', 'Hand-levelled and rare accounts with full email access and a 48-hour warranty.', null, 2)
on conflict (slug) do nothing;

-- Homepage layout. Data-driven sections (featured products, games, reviews,
-- giveaway) render nothing until you add content, so the page stays clean.
insert into zeus.site_sections (kind, title, subtitle, content, sort_order)
select * from (values
  ('hero', 'Level up for less with', null,
    '{"highlight":"Zeuservices","badge":"Trusted by thousands of gamers worldwide","cta_text":"Browse games","cta_href":"/games","cta2_text":"Cheap top-ups","cta2_href":"/category/topups"}'::jsonb, 0),
  ('stats', null, null, '{}'::jsonb, 1),
  ('categories', 'Shop by category', 'Top-ups, boosting and accounts for every major title.', '{}'::jsonb, 2),
  ('featured_products', 'Featured offers', 'Best sellers, hand-picked by the team.', '{"limit": 8}'::jsonb, 3),
  ('games', 'Popular games', null, '{"limit": 12}'::jsonb, 4),
  ('giveaway', null, null, '{}'::jsonb, 5),
  ('reviews', 'What gamers say about us', null, '{"limit": 6}'::jsonb, 6),
  ('discord', 'Join our Discord community', 'Order support, flash sales and giveaway alerts — before anyone else.', '{}'::jsonb, 7),
  ('faq', 'Frequently asked questions', null, '{"limit": 6}'::jsonb, 8)
) as v(kind, title, subtitle, content, sort_order)
where not exists (select 1 from zeus.site_sections);

-- Starter FAQ (edit/extend in Admin → FAQs).
insert into zeus.faqs (question, answer, category, sort_order)
select * from (values
  ('How fast is delivery?', 'Instant products (top-ups) are typically delivered within 15 minutes of payment. Boosting starts within a few hours and accounts are handed over within 24 hours. You can track every order live in your account.', 'Orders & Delivery', 0),
  ('Is boosting safe for my account?', 'Our boosters connect through a VPN matched to your region, enable offline/streamer mode, and never touch anything unrelated to your order. We recommend changing your password after the boost completes.', 'Orders & Delivery', 1),
  ('Do you need my account password?', 'Only for boosting services where we play on your account. Top-ups need just your username or ID. Credentials are encrypted, visible only to your assigned booster, and you should change them after delivery.', 'Account & Security', 2),
  ('What payment methods do you accept?', 'All payments run through Stripe — cards, Apple Pay and Google Pay, in USD, EUR, GBP, CAD or AUD. We never see or store your card details.', 'Payments', 3),
  ('Can I get a refund?', 'Yes — full refund any time before delivery starts. After delivery, refunds are case-by-case per our Refund Policy. Accounts include a 48-hour replacement warranty instead.', 'Payments', 4),
  ('How do giveaways work?', 'Giveaways are free to enter with a registered account. Winners are drawn randomly when the timer ends and contacted by email/Discord. No purchase necessary, ever.', 'General', 5)
) as v(question, answer, category, sort_order)
where not exists (select 1 from zeus.faqs);

-- Backfill profiles for any pre-existing auth users.
insert into zeus.profiles (id, email, username)
select u.id, u.email,
  left(regexp_replace(split_part(coalesce(u.email, 'user'), '@', 1), '[^a-zA-Z0-9_]', '_', 'g'), 16)
  || '_' || substr(md5(u.id::text), 1, 4)
from auth.users u
where not exists (select 1 from zeus.profiles p where p.id = u.id);

-- Promote the bootstrap admin if that account already exists.
update zeus.profiles
set role = 'super_admin'
where lower(email) = 'daniel.holecek20@gmail.com';
