/**
 * Politik-Radar LLM-Routing.
 *
 * Eine zentrale Stelle, an der entschieden wird:
 *   - welches Modell für welche Aufgabe (Task) und welchen Input
 *   - welcher Provider (Groq jetzt, später Cerebras / OpenAI / Anthropic für
 *     Multi-LLM-Konsens)
 *   - wie das Modell aufgerufen wird (einheitlicher Wrapper mit Rate-Limit-Handling)
 *   - welche Audit-Daten zurückgegeben werden (Modell, Prompt-Version, Roh-Output)
 *
 * Jede Generierung gibt eine Audit-fähige Antwort zurück: { content, raw, model,
 * promptVersion, generatedAt }. Diese Felder können direkt in die DB
 * (politicians.cv_*_model, speech_summaries.model etc.) gespeichert werden.
 *
 * Erweiterung Multi-LLM-Konsens:
 *   - mehrere Provider werden zukünftig parallel aufgerufen
 *   - Ergebnisse semantisch verglichen
 *   - Antwort-Format gleich, plus zusätzliches `consensus`-Feld
 */

// ── Tasks ──

export type LlmTask =
  | "cv_extract_wikipedia"   // Wikipedia-Volltext → strukturierter CV-JSON
  | "cv_extract_homepage"    // Homepage-Text → strukturierter CV-JSON
  | "cv_summary"             // Strukturierte CV-Daten → 2–3-Satz-Bio
  | "speech_summary"         // Bundestagsrede → 2-Satz-Zusammenfassung
  | "speech_topic"           // Rede → kurzes Themen-Label
  | "topic_classify"         // Drucksache/Antrag → Themen-Klassifikation
  | "conflict_check"         // Komplexes Reasoning: Conflict-of-Interest
  | "tone_classify"          // Tonalität / Sentiment einer Rede
  | "consensus_synthesize";  // Multi-LLM-Outputs zu finalem Synthesetext

// ── Modelle ──

export interface ModelSpec {
  /** Provider-Name, z.B. "groq", "openai", "anthropic" */
  provider: "groq" | "openai" | "anthropic" | "cerebras";
  /** Provider-spezifische Modell-ID, z.B. "llama-3.1-8b-instant" */
  id: string;
  /** Maximale Kontextgröße in Token (ungefähr) */
  contextTokens: number;
  /** Empfohlene Concurrency (gleichzeitige Calls) */
  concurrency: number;
  /** Beschreibung für Logs */
  label: string;
}

const GROQ_8B: ModelSpec = {
  provider: "groq",
  id: "llama-3.1-8b-instant",
  contextTokens: 8192,
  concurrency: 4,
  label: "Llama 3.1 8B (schnell, Standard)",
};

const GROQ_70B: ModelSpec = {
  provider: "groq",
  id: "llama-3.3-70b-versatile",
  contextTokens: 32768,
  concurrency: 2,
  label: "Llama 3.3 70B (Reasoning, höhere Qualität)",
};

const GROQ_SCOUT: ModelSpec = {
  provider: "groq",
  id: "meta-llama/llama-4-scout-17b-16e-instruct",
  contextTokens: 131072,
  concurrency: 3,
  label: "Llama 4 Scout (128K Kontext, Langtexte)",
};

// Multi-LLM-Konsens: Stufe 4 (Tiebreak-V2) nutzt Anthropic
const ANTHROPIC_HAIKU: ModelSpec = {
  provider: "anthropic",
  id: "claude-haiku-4-5-20251001",
  contextTokens: 200000,
  concurrency: 4,
  label: "Claude Haiku 4.5 (Reasoning, Multi-Source-Synthese)",
};

export const MODELS = {
  GROQ_8B,
  GROQ_70B,
  GROQ_SCOUT,
  ANTHROPIC_HAIKU,
};

// ── Routing ──

export interface PickOpts {
  /** Anzahl Zeichen im User-Input (Wikipedia-Text, Rede, etc.) */
  inputChars?: number;
  /** Override per ENV-Var, z.B. POLITIK_LLM_OVERRIDE=groq:llama-3.3-70b */
  override?: string | null;
}

/**
 * Wählt das passende Modell für eine Aufgabe.
 *
 * Faustregeln (anpassbar — alles an einer Stelle):
 *   - cv_extract_wikipedia: 8B normalerweise, Scout bei langen Wiki-Artikeln
 *   - cv_extract_homepage:  8B (Texte sind kurz, ~5k chars max)
 *   - cv_summary:           8B (kurzer Output, JSON-Daten als Input)
 *   - speech_summary:       8B (~3-5k chars, standardisiert)
 *   - conflict_check:       70B (Reasoning, justifizierbar)
 *   - tone_classify:        70B (Sprach-Sensibilität)
 *   - consensus_synthesize: 70B (mehrere Quellen integrieren)
 */
export function pickModel(task: LlmTask, opts: PickOpts = {}): ModelSpec {
  const override = opts.override ?? process.env.POLITIK_LLM_OVERRIDE;
  if (override) {
    const found = Object.values(MODELS).find((m) => `${m.provider}:${m.id}` === override);
    if (found) return found;
  }

  const chars = opts.inputChars ?? 0;

  switch (task) {
    case "cv_extract_wikipedia":
      // Lange Wiki-Artikel (>6000 chars) → Scout, sonst 8B
      return chars > 6000 ? GROQ_SCOUT : GROQ_8B;

    case "cv_extract_homepage":
      return GROQ_8B;

    case "cv_summary":
      return GROQ_8B;

    case "speech_summary":
      return GROQ_8B;

    case "speech_topic":
      return GROQ_8B;

    case "topic_classify":
      return GROQ_8B;

    case "conflict_check":
      return GROQ_70B;

    case "tone_classify":
      return GROQ_70B;

    case "consensus_synthesize":
      return GROQ_70B;

    default:
      return GROQ_8B;
  }
}

// ── Aufruf ──

export interface CallOpts {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
}

export interface CallResult {
  content: string;
  raw: string;
  model: ModelSpec;
  usage?: { inputTokens?: number; outputTokens?: number };
  generatedAt: string;
}

const PROVIDER_KEYS = {
  groq: () =>
    Object.entries(process.env)
      .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
      .map(([, v]) => v as string),
  openai: () => (process.env.OPENAI_API_KEY ? [process.env.OPENAI_API_KEY] : []),
  anthropic: () => (process.env.ANTHROPIC_API_KEY ? [process.env.ANTHROPIC_API_KEY] : []),
  cerebras: () => (process.env.CEREBRAS_API_KEY ? [process.env.CEREBRAS_API_KEY] : []),
};

const keyRoundRobin = new Map<string, number>();
function nextKey(provider: ModelSpec["provider"]): string | null {
  const keys = PROVIDER_KEYS[provider]();
  if (keys.length === 0) return null;
  const idx = (keyRoundRobin.get(provider) ?? 0) % keys.length;
  keyRoundRobin.set(provider, idx + 1);
  return keys[idx];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGroq(model: ModelSpec, opts: CallOpts): Promise<CallResult> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const retries = opts.retries ?? 6;
  for (let attempt = 0; attempt < retries; attempt++) {
    const key = nextKey("groq");
    if (!key) throw new Error("Kein GROQ_API_KEY in env gefunden");
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userPrompt },
        ],
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
        temperature: opts.temperature ?? 0.1,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      }),
    });
    if (res.status === 429) {
      const ra = res.headers.get("retry-after");
      const wait = ra ? Math.min(60000, parseFloat(ra) * 1000) : 3000;
      await sleep(wait);
      continue;
    }
    if (res.status === 413) {
      throw new Error(`HTTP 413 — Input zu groß für ${model.id}. Anderes Modell wählen oder Input kürzen.`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (attempt === retries - 1) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      await sleep(1000);
      continue;
    }
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error("Leere Antwort vom LLM");
    return {
      content,
      raw: content,
      model,
      usage: {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
      },
      generatedAt: new Date().toISOString(),
    };
  }
  throw new Error("Alle Retry-Versuche fehlgeschlagen");
}

/**
 * Zentraler LLM-Aufruf. Wählt Provider abhängig vom Modell aus,
 * handhabt Rate-Limits und gibt einheitliches Audit-Result zurück.
 *
 * Beispiel:
 *   const r = await callLlm(pickModel("cv_extract_wikipedia", { inputChars: text.length }), {
 *     systemPrompt: "Du extrahierst...",
 *     userPrompt: `Politiker: ${name}\n\n${text}`,
 *     jsonMode: true,
 *   });
 *   db.run(`UPDATE ... SET cv_model=?, cv_raw_llm_response=?`, [`${r.model.provider}:${r.model.id}`, r.raw]);
 */
export async function callLlm(model: ModelSpec, opts: CallOpts): Promise<CallResult> {
  switch (model.provider) {
    case "groq":
      return callGroq(model, opts);
    case "openai":
    case "anthropic":
    case "cerebras":
      throw new Error(`Provider ${model.provider} noch nicht implementiert — TODO`);
    default:
      throw new Error(`Unbekannter Provider: ${model.provider}`);
  }
}

/**
 * Convenience: Modell wählen + Aufruf in einem Schritt.
 */
export async function runTask(
  task: LlmTask,
  opts: CallOpts & { inputChars?: number; modelOverride?: string },
): Promise<CallResult> {
  const model = pickModel(task, { inputChars: opts.inputChars, override: opts.modelOverride });
  return callLlm(model, opts);
}
