/**
 * Wiederverwendbarer Mistral-Pool: Round-Robin über alle MISTRAL_API_KEY* (mehrere
 * Accounts = N× Durchsatz), reserve-basiertes Pro-Key-Spacing (hält jede RPS-Grenze ein,
 * auch bei paralleler Nutzung), 429-/Netzwerk-Retry. + kleiner Worker-Pool-Runner.
 */
import fs from "fs";
import path from "path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function loadMistralKeys(): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(process.env))
    if (/^MISTRAL_API_KEY\d*$/.test(k) && v) keys.push(v);
  if (keys.length === 0) {
    try {
      const env = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
      for (const m of env.matchAll(/^MISTRAL_API_KEY\d*\s*=\s*["']?([^"'\s]+)/gm)) keys.push(m[1]);
    } catch { /* ignore */ }
  }
  return [...new Set(keys)];
}

export class MistralPool {
  private keys: string[];
  private next: number[]; // frühester Zeitpunkt (epoch ms), zu dem Key i wieder feuern darf
  readonly minSpacingMs: number;

  constructor(minSpacingPerKeyMs = 0, keys?: string[]) {
    this.keys = keys ?? loadMistralKeys();
    if (this.keys.length === 0) throw new Error("Keine MISTRAL_API_KEY* gefunden (Env oder .env)");
    this.next = this.keys.map(() => 0);
    this.minSpacingMs = minSpacingPerKeyMs;
  }
  get size() { return this.keys.length; }

  async chat(o: { model: string; system: string; user: string; maxTokens?: number; temperature?: number }): Promise<string> {
    // Frühest verfügbaren Key SYNCHRON reservieren (kein await davor → keine Doppelvergabe bei Parallelität)
    let idx = 0;
    for (let k = 1; k < this.keys.length; k++) if (this.next[k] < this.next[idx]) idx = k;
    const fireAt = Math.max(Date.now(), this.next[idx]);
    this.next[idx] = fireAt + this.minSpacingMs; // Slot belegen
    const wait = fireAt - Date.now();
    if (wait > 0) await sleep(wait);
    const key = this.keys[idx];

    for (let a = 0; a < 6; a++) {
      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: o.model,
            temperature: o.temperature ?? 0.2,
            max_tokens: o.maxTokens ?? 400,
            messages: [{ role: "system", content: o.system }, { role: "user", content: o.user }],
          }),
        });
        if (res.status === 429) {
          const w = parseInt(res.headers.get("retry-after") || "", 10);
          const ms = (!isNaN(w) ? w : 30) * 1000;
          this.next[idx] = Date.now() + ms + this.minSpacingMs; // diesen Key zurückstellen
          await sleep(ms);
          continue;
        }
        if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 140)}`);
        const j = (await res.json()) as any;
        return (j.choices?.[0]?.message?.content?.trim() ?? "");
      } catch (e: any) {
        if (a === 5) throw e;
        await sleep(3000 * (a + 1));
      }
    }
    throw new Error("Mistral: Retries erschöpft");
  }
}

/** N parallele Worker über items; worker kapselt eigene Fehlerbehandlung. */
export async function runPool<T>(items: T[], concurrency: number, worker: (it: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (idx < items.length) { const i = idx++; await worker(items[i], i); }
    })
  );
}
