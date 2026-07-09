// Seed Bulacan municipalities/cities and barangays from PSGC Cloud.
//
// Run locally only, never from the frontend:
//   $env:SUPABASE_URL="https://your-project-ref.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
//   node supabase/seed-bulacan.js

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PSGC_BASE_URL = "https://psgc.cloud/api";
const BULACAN_CODE_PREFIX = "03014";

const municipalityNameOverrides = {
  "City of Baliwag": "Baliwag City",
  "City of Malolos": "Malolos City",
  "City of Meycauayan": "Meycauayan City",
  "City of San Jose Del Monte": "City of San Jose del Monte",
  "DoÃ±a Remedios Trinidad": "Doña Remedios Trinidad"
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in your local shell before running this script."
  );
}

const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation"
};

function unwrapApiList(payload) {
  return payload?.data ?? payload?.value ?? payload ?? [];
}

function normalizeName(name) {
  const trimmed = name.trim();
  return municipalityNameOverrides[trimmed] ?? trimmed;
}

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}): ${url}\n${await res.text()}`);
  }

  return res.json();
}

async function supabaseUpsert(table, data, onConflict) {
  const params = new URLSearchParams({ on_conflict: onConflict });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error(`Upsert failed: ${table}\n${await res.text()}`);
  }

  return res.json();
}

async function run() {
  const localitiesJson = await fetchJson(`${PSGC_BASE_URL}/cities-municipalities`);
  const localities = unwrapApiList(localitiesJson)
    .filter((place) => place.code?.startsWith(BULACAN_CODE_PREFIX))
    .sort((a, b) => a.code.localeCompare(b.code));

  if (localities.length !== 24) {
    throw new Error(`Expected 24 Bulacan cities/municipalities, got ${localities.length}.`);
  }

  let totalBarangays = 0;

  for (const place of localities) {
    const municipalityName = normalizeName(place.name);
    const [municipality] = await supabaseUpsert(
      "ref_municipalities",
      {
        province_name: "Bulacan",
        municipality_name: municipalityName,
        is_active: true
      },
      "province_name,municipality_name"
    );

    if (!municipality?.id) {
      throw new Error(`No municipality id returned for ${municipalityName}.`);
    }

    const barangaysJson = await fetchJson(`${PSGC_BASE_URL}/cities-municipalities/${place.code}/barangays`);
    const barangays = unwrapApiList(barangaysJson);
    const barangayRows = barangays.map((barangay) => ({
      municipality_id: municipality.id,
      barangay_name: barangay.name.trim(),
      is_active: true
    }));

    if (barangayRows.length > 0) {
      await supabaseUpsert("ref_barangays", barangayRows, "municipality_id,barangay_name");
    }

    totalBarangays += barangayRows.length;
    console.log(`Inserted: ${municipalityName} - ${barangayRows.length} barangays`);
  }

  console.log(`Done seeding ${localities.length} Bulacan cities/municipalities and ${totalBarangays} barangays.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
