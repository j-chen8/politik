/**
 * Debug-Skript: Was passiert beim Fetch für Amthor's mandate_id 68388?
 * Reproduziert exakt den Code-Pfad aus seed-abgeordnetenwatch.ts.
 */

const BASE_URL = "https://www.abgeordnetenwatch.de/api/v2";

async function fetchApi(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      console.log(`  [try ${i + 1}] ${url.slice(0, 80)}... → ${res.status}`);
      if (res.status === 429) {
        console.log(`    Rate limited, waiting 10s...`);
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.log(`    ERR: ${e.message}`);
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function main() {
  const mandateId = parseInt(process.argv[2] ?? "68388");
  console.log(`Testing mandate_id=${mandateId}\n`);

  console.log("Sequential test:");
  try {
    const v = await fetchApi(`${BASE_URL}/votes?mandate=${mandateId}&range_end=500`);
    console.log(`  votes: ${v.meta?.result?.total} total, ${v.data?.length} returned`);
  } catch (e: any) { console.log(`  votes FAILED: ${e.message}`); }

  try {
    const s = await fetchApi(`${BASE_URL}/sidejobs?mandates=${mandateId}&range_end=100`);
    console.log(`  sidejobs: ${s.meta?.result?.total} total, ${s.data?.length} returned`);
  } catch (e: any) { console.log(`  sidejobs FAILED: ${e.message}`); }

  try {
    const c = await fetchApi(`${BASE_URL}/committee-memberships?candidacy_mandate=${mandateId}&range_end=50`);
    console.log(`  committees: ${c.meta?.result?.total} total, ${c.data?.length} returned`);
  } catch (e: any) { console.log(`  committees FAILED: ${e.message}`); }

  console.log("\nParallel test (Promise.all wie im echten Script):");
  try {
    const [v, s, c] = await Promise.all([
      fetchApi(`${BASE_URL}/votes?mandate=${mandateId}&range_end=500`),
      fetchApi(`${BASE_URL}/sidejobs?mandates=${mandateId}&range_end=100`),
      fetchApi(`${BASE_URL}/committee-memberships?candidacy_mandate=${mandateId}&range_end=50`),
    ]);
    console.log(`  ALL OK: votes=${v.meta?.result?.total}, sidejobs=${s.meta?.result?.total}, committees=${c.meta?.result?.total}`);
  } catch (e: any) {
    console.log(`  Promise.all FAILED: ${e.message}`);
  }
}

main();
