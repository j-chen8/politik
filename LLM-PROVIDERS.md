# LLM-Anbieter & Modelle für Politik-Radar

> Stand 2026-04-29. Persistente Referenz, nicht produktiv genutzt — siehe `src/lib/llm.ts` für aktiven Stack.

## Aktueller Multi-LLM-Stack (im Einsatz)

| Rolle | Anbieter | Modell | Auth | Limit (Free) |
|---|---|---|---|---|
| Generator (CV, Reden) | **Groq** | `llama-3.1-8b-instant` | `GROQ_API_KEY*` | 12K TPM, 500K TPD |
| Generator (lange Texte) | **Groq** | `meta-llama/llama-4-scout-17b-16e-instruct` | `GROQ_API_KEY*` | 30K TPM, 500K TPD, **128K Kontext** |
| Cross-Check | **Mistral AI** | `mistral-small-latest` | `MISTRAL_API_KEY*` | 1M Tokens/Monat |
| Tiebreaker | **GitHub Models** | `openai/gpt-4o-mini` | `GITHUB_MODELS_TOKEN` | 15 RPM, 150 RPD |

---

## Empfohlene Free-Tier-Anbieter (nach Familien sortiert)

### Llama-Familie (Meta)

**Groq** — schnell, großzügig, viele Modelle
- `llama-3.1-8b-instant` — 12K TPM, 500K TPD, 8K Kontext — **Standard für Routine**
- `llama-3.3-70b-versatile` — 12K TPM, 100K TPD, 32K Kontext — bessere Qualität
- `meta-llama/llama-4-scout-17b-16e-instruct` — 30K TPM, 500K TPD, **128K Kontext** — für Langtexte
- `meta-llama/llama-4-maverick-17b-128e-instruct` — ähnliche Specs
- `deepseek-r1-distill-llama-70b` — Reasoning-distilled, immer noch Llama-basiert
- Setup: https://console.groq.com/keys
- Achtung: Multi-Account = Sperre. Maximal 1 Account.

**Cerebras** — alternativ zu Groq, ebenfalls sehr schnell
- Llama-Modelle, ähnliche Specs
- Setup: https://cloud.cerebras.ai/

### Mistral-Familie (Mistral AI, Frankreich)

**Mistral AI direkt**
- `mistral-small-latest` — Free Tier 1M Tokens/Monat
- `mistral-medium-latest` — größer, ähnliche Quotas
- Setup: https://console.mistral.ai/api-keys/
- Methodisch ideal als Cross-Check (andere Architektur als Llama)

### OpenAI-Familie (OpenAI / Microsoft)

**GitHub Models** — Free für GitHub-User, mehrere Familien
- `openai/gpt-4o-mini` — 15 RPM, **150 RPD**, 8K in / 4K out
- `openai/gpt-4o` — gleiche Quotas, größer
- `microsoft/phi-4` — Microsoft, andere Familie als GPT
- `meta/llama-3.3-70b-instruct` — auch über GitHub
- `mistral-ai/mistral-large` — auch über GitHub
- Setup: https://github.com/settings/personal-access-tokens → fine-grained, Account permission „Models: Read"
- **Tageslimit zu beachten** — bei großen Läufen über mehrere Tage planen

**OpenAI direkt (paid)**
- `gpt-4o-mini` — $0,15 pro 1M Input + $0,60 pro 1M Output. Lächerlich billig.
- `gpt-4o` — teurer, deutlich besser
- 1M Tokens kosten ~5–10 € → für Policik-Radar-Größe vernachlässigbar

**Groq** hostet auch OpenAI-Open-Source-Modelle:
- `openai/gpt-oss-20b` — 30 RPM, 1K RPD, **200K TPD** — Free
- `openai/gpt-oss-120b` — gleiche Quotas, größer
- Methodisch interessant als zusätzliche OpenAI-Familie auf Groq-Speed

### Anthropic-Familie (Claude)

**Anthropic direkt (paid)**
- `claude-haiku-4-5-20251001` — $1 / $5 pro 1M Tokens. Sehr gute Sprache, sicher
- `claude-sonnet-4-6` — größer, besser, ~5x teurer
- Setup: https://console.anthropic.com/

**GitHub Models** hat Claude (siehe oben)

### Google-Familie (Gemini / Gemma)

**Google AI Studio**
- `gemini-2.5-flash` / `gemini-2.5-pro` — 15 RPM, 1500 RPD im Free Tier
- `gemini-1.5-flash` — kleiner, schneller
- Setup: https://aistudio.google.com/apikey
- ⚠ Achtung: bei diesem Projekt schon einmal Account-Sperre passiert (4 Keys auf einmal)

**Groq** hostet Gemma:
- `gemma2-9b-it` — Status unklar in 2026, evtl. deprecated. Im Account-Limit-Panel checken.

### Reasoning-spezifisch

**Together.ai**
- DeepSeek R1, Llama-Reasoning, andere reasoning-Modelle
- $5 Startguthaben
- Setup: https://api.together.xyz/

**OpenRouter** — Aggregator, eine API für viele Anbieter
- Free-Tier mit limitierten Modellen
- Setup: https://openrouter.ai/

---

## Backup-Optionen (No-Credit-Card)

**Kilo Code Gateway** (`https://api.kilo.ai/api/gateway`)
- ~200 req/hr für alle gelisteten Modelle
- Nützliche US-Modelle:
  - `nvidia/nemotron-3-super-120b-a12b:free` — **262K Kontext**, 32K Output, US
  - `arcee-ai/trinity-large-thinking:free` — Reasoning, US-Startup
- Vorsicht / meiden:
  - `bytedance-seed/dola-seed-2.0-pro:free` — China (TikTok-Mutter)
  - `kilo-auto/free` (routet zu MiniMax + StepFun) — China
- Status: junges Projekt, Free-Tier könnte sich ändern

**Cohere**
- `command-r-08-2024` — 1.000 Calls/Monat free
- Europäische Cloud-Optionen verfügbar
- Setup: https://dashboard.cohere.com/api-keys

**DeepInfra** (paid, sehr günstig)
- Llama-3.1-8b: $0,05 / 1M Tokens
- Andere Modelle auch billig
- Setup: https://deepinfra.com/

---

## ⛔ Strategisch zu meiden für DIESES Projekt

Politik-Radar ist eine **deutsche Politik-Transparenz-Plattform**. Folgende Anbieter bergen Reputations-Risiko:

| Anbieter | Modell-Beispiele | Risiko |
|---|---|---|
| Z.AI / Zhipu AI | GLM-4.5-Flash, GLM-4.7-Flash | Chinesisch, Tsinghua-Spinoff |
| Alibaba | Qwen | Chinesisch |
| ByteDance | Dola, Doubao | Chinesisch (TikTok-Mutter) |
| Moonshot | Kimi | Chinesisch |
| MiniMax | M2.5 | Chinesisch |
| StepFun | Step-3.5 | Chinesisch |
| DeepSeek (direkt) | R1, V3 | Chinesisch |

**Nicht aus politischen Gründen** — sondern weil:
1. Politik-Radar verkauft Vertrauen + Unabhängigkeit als Kernwert
2. Förderanträge (Prototype Fund, Mercator) bewerten Datensouveränität
3. Schlagzeile *„Plattform zu deutschen Politikern nutzt chinesische KI"* schreibt sich selbst

---

## Strategische Empfehlungen

### Standard-Workload (CV-Generierung, Reden-Summary)
**Llama-3.1-8b auf Groq** — schnell, billig, ausreichend gut

### Lange Texte (Wikipedia-Volltexte > 8K Token)
**Llama-4-Scout auf Groq** — 128K Kontext, hohe Qualität

### Cross-Check / Multi-LLM-Konsens
**Mistral-Small** — andere Architektur als Llama, EU-Anbieter

### Tiebreaker / sensible Entscheidungen
**GPT-4o-mini via GitHub Models** (free) oder direkt OpenAI (paid)

### Falls GitHub Models 150 RPD blockt
Backup: **NVIDIA Nemotron via Kilo Code** (US, 262K Kontext) oder **gpt-oss-20b auf Groq** (200K TPD)

### Wenn Reasoning kritisch ist
**Claude Haiku 4.5 (paid)** — beste Sprache, beste Sicherheit

---

## Auth-Pattern in `.env`

```bash
# Groq — mehrere Keys per Round-Robin
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
# Achtung: max 1 Account pro Person, sonst Sperre

# Mistral
MISTRAL_API_KEY1=...
# auch hier: nicht künstlich Multi-Account

# GitHub Models
GITHUB_MODELS_TOKEN=github_pat_...

# Optional / paid:
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Backup-Optionen:
COHERE_API_KEY=...
KILO_API_KEY=...
TOGETHER_API_KEY=...
GEMINI_API_KEY=...   # neuer Account, alte sind suspended
```

Alle Skripte unter `scripts/` lesen `.env` automatisch ein.

---

## Wenn was kaputt geht

1. **Groq-Sperre**: warte 1–3 Tage, neuen Key generieren. Bei wiederkehrenden Problemen → Cerebras als 1:1-Ersatz.
2. **GitHub-Token revoked**: neuen erstellen (90 Tage Expiration), Limits checken.
3. **Mistral 429**: zentraler Free-Tier-Bottleneck. Nemotron via Kilo als Backup.
4. **Alle Keys gleichzeitig down**: meistens API-spezifischer Outage. https://status.openai.com/, https://status.anthropic.com/ etc. checken bevor Code-Änderungen.
