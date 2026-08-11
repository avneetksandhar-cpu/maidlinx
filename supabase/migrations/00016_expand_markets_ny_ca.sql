-- Expand MaidLinx markets: keep Toronto/GTA + Florida/South Florida, add New York + California.
-- Aligns with src/config/markets.ts. Zones use postal/ZIP prefixes + city fallbacks.

-- ---------------------------------------------------------------------------
-- Markets
-- ---------------------------------------------------------------------------

insert into public.markets (id, code, slug, name, country, currency, timezone, active, center_lat, center_lng, regions)
values
  ('TORONTO_GTA', 'TORONTO_GTA', 'toronto-gta', 'Toronto / GTA', 'CA', 'CAD', 'America/Toronto', true, 43.6532, -79.3832, array['ON']),
  ('SOUTH_FLORIDA', 'SOUTH_FLORIDA', 'south-florida', 'Florida / South Florida', 'US', 'USD', 'America/New_York', true, 26.1224, -80.1373, array['FL']),
  ('NEW_YORK', 'NEW_YORK', 'new-york', 'New York', 'US', 'USD', 'America/New_York', true, 40.7128, -74.0060, array['NY']),
  ('CALIFORNIA', 'CALIFORNIA', 'california', 'California', 'US', 'USD', 'America/Los_Angeles', true, 34.0522, -118.2437, array['CA'])
on conflict (id) do update set
  code = excluded.code,
  slug = excluded.slug,
  name = excluded.name,
  country = excluded.country,
  currency = excluded.currency,
  timezone = excluded.timezone,
  active = excluded.active,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  regions = excluded.regions,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Service zones (upsert existing + new)
-- ---------------------------------------------------------------------------

insert into public.service_zones (id, market_id, name, postal_codes, cities, active)
values
  -- Toronto / GTA
  ('zone_toronto_core', 'TORONTO_GTA', 'Toronto Core',
    array['M1','M2','M3','M4','M5','M6','M7','M8','M9'],
    array['toronto','north york','scarborough','etobicoke','york','east york','downtown toronto'], true),
  ('zone_gta_west', 'TORONTO_GTA', 'GTA West',
    array['L4','L5','L6','L7','L9'],
    array['mississauga','brampton','oakville','burlington','milton','caledon','georgetown','halton hills','acton','bolton'], true),
  ('zone_gta_east', 'TORONTO_GTA', 'GTA East',
    array['L1','L3'],
    array['markham','richmond hill','vaughan','ajax','pickering','whitby','oshawa','brooklin','courtice','bowmanville','uxbridge','stouffville','whitchurch-stouffville'], true),
  ('zone_gta_north', 'TORONTO_GTA', 'GTA North',
    array['L0G','L0H','L0J','L3X','L3Y','L4G'],
    array['newmarket','aurora','king city','king','bradford','east gwillimbury','georgina','keswick'], true),

  -- Florida / South Florida
  ('zone_miami_dade', 'SOUTH_FLORIDA', 'Miami-Dade',
    array['331','330','332'],
    array['miami','miami beach','coral gables','hialeah','homestead','doral','kendall','aventura','north miami','cutler bay'], true),
  ('zone_broward', 'SOUTH_FLORIDA', 'Broward',
    array['333','334'],
    array['fort lauderdale','lauderdale','lauderdale beach','pompano beach','lauderdale park','sunrise','plantation','davie','lauderdale hills','deerfield beach','coral springs','weston','hollywood','hollywood beach','hollywood lakes','hollywood park','hallandale beach','miramar','pembroke pines','tamarac','margate'], true),
  ('zone_palm_beach', 'SOUTH_FLORIDA', 'Palm Beach',
    array['334'],
    array['west palm beach','boca raton','delray beach','boynton beach','jupiter','palm beach gardens','palm beach','lake worth','wellington','royal palm beach'], true),

  -- New York
  ('zone_nyc_manhattan', 'NEW_YORK', 'Manhattan',
    array['100','101','102'],
    array['new york','manhattan','nyc'], true),
  ('zone_nyc_brooklyn', 'NEW_YORK', 'Brooklyn',
    array['112'],
    array['brooklyn'], true),
  ('zone_nyc_queens', 'NEW_YORK', 'Queens',
    array['111','113','114','116'],
    array['queens','long island city','astoria','flushing','jamaica'], true),
  ('zone_nyc_bronx', 'NEW_YORK', 'Bronx',
    array['104'],
    array['bronx','the bronx'], true),
  ('zone_nyc_staten_island', 'NEW_YORK', 'Staten Island',
    array['103'],
    array['staten island'], true),
  ('zone_ny_metro', 'NEW_YORK', 'NY Metro',
    array['105','106','107','108','109','110','115'],
    array['yonkers','white plains','new rochelle','mount vernon','hempstead','garden city','great neck'], true),

  -- California
  ('zone_la', 'CALIFORNIA', 'Los Angeles',
    array['900','901','902','903','904','905','906','907','908','910','911','912','913','914','915','916','917','918'],
    array['los angeles','beverly hills','santa monica','pasadena','glendale','burbank','long beach','culver city','inglewood','torrance','sherman oaks','van nuys','north hollywood'], true),
  ('zone_orange_county', 'CALIFORNIA', 'Orange County',
    array['926','927','928'],
    array['irvine','anaheim','santa ana','newport beach','huntington beach','costa mesa','orange','fullerton'], true),
  ('zone_sf_bay', 'CALIFORNIA', 'San Francisco Bay Area',
    array['940','941','943','944','945','946','947','948','949','950','951'],
    array['san francisco','oakland','berkeley','san jose','palo alto','mountain view','sunnyvale','fremont','daly city','south san francisco'], true),
  ('zone_san_diego', 'CALIFORNIA', 'San Diego',
    array['919','920','921'],
    array['san diego','la jolla','chula vista','carlsbad','oceanside'], true)
on conflict (id) do update set
  market_id = excluded.market_id,
  name = excluded.name,
  postal_codes = excluded.postal_codes,
  cities = excluded.cities,
  active = excluded.active,
  updated_at = now();
