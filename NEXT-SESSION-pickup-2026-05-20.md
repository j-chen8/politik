# Next-Session-Pickup — 2026-05-20 (User krank, abends)

> **Erste Anlaufstelle:** Diese Datei. Vorgänger: `NEXT-SESSION.md` (Demo-Launch-Plan vom 13.05.) und `NEXT-SESSION-vote-context.md` (Vote-Kontext fertig vom 15.05.).

## Heute fertig (4 Commits, alle gepusht zu `j-chen8/politik`)

```
e19f767 Vote-Kontext v1.1: block_hinweis muss DS-Nrn nennen
4b29123 Vote-Kontext UI: HTML-Entities in bt_topic decoden
de3f7a4 NEXT-SESSION-vote-context.md (Vortag, vorher nur lokal)
…
```

- **Remote-URL fix:** `opoi1/politik` → `j-chen8/politik` (das Repo war
  seit dem 13.05. umbenannt, Remote lokal nie nachgezogen). 30 alte
  Commits zusätzlich gepusht (Vote-Kontext-5-Track-Sequenz + Landing-
  Polish + alles davor).
- **Vote-Kontext-Polish-Backlog abgeschlossen** (siehe Memory
  `project_vote_context.md`): Entity-Decode + block_hinweis-v1.1 mit
  Mass-Regen über 17 polls, 1 echte Subjekt-Korrektur. Backlog-Datei
  `NEXT-SESSION-vote-context.md` kann archiviert/gelöscht werden.

## Worauf der User wartete als wir aufhörten

User ist seit Tagen krank. Stand Abend: **Demo-Launch + Mobile-UI-Polish**
ist der Plan, aber zwei Voraussetzungen sind unterwegs:

### 1. Playwright MCP frisch installiert

Im richtigen Projekt-Scope (`/home/jinsheng/politik`, korrekt in
`~/.claude.json` eingetragen). **Wird beim nächsten Claude-Start
verfügbar als `mcp__playwright__*` Tools.** Zweck: Mobile-UI-Sweep
selbst durchführen (iPhone-/Pixel-Viewport, Screenshots, Touch-Targets
prüfen, Overflow erkennen) statt User-Screenshots paste-by-paste.

### 2. Demo-Launch hängt an cloudflared-Auth

Status (heute geprüft):
- `cloudflared` 2026.5.0 in `~/bin/` ✅
- DNS propagiert (`evangeline.ns.cloudflare.com` + `sterling.…`) ✅
- systemd-Services vorbereitet (`politik-web.service`,
  `cloudflared-politik.service`) ✅
- Prod-Build frisch (`.next/BUILD_ID` 2026-05-20 12:06) ✅
- **`~/.cloudflared/` existiert NICHT** → cloudflared nie autorisiert ❌
- Kein Tunnel existiert ❌
- `politik.jinsheng-chen.de` antwortet noch nicht ❌

Was beim User-Restart fehlt: Browser-Auth-Schritt. **Nicht ohne
User-Interaktion möglich:**

```
! /home/jinsheng/bin/cloudflared tunnel login
```

Druckt URL → User öffnet in Laptop-Browser → wählt jinsheng-chen.de
Zone → autorisiert → cloudflared schreibt `~/.cloudflared/cert.pem` und
beendet sich.

**Danach** (kann ich für ihn machen):
```bash
cloudflared tunnel create politik
cloudflared tunnel route dns politik politik.jinsheng-chen.de
# config.yml schreiben (template steht in NEXT-SESSION.md Z. 87-96)
pkill -f "next dev" 2>/dev/null
systemctl --user enable --now politik-web.service cloudflared-politik.service
curl -I https://politik.jinsheng-chen.de
```

### Cleanup-Hinweise

- `next dev` läuft noch seit 2026-05-15 (PID war 316614) auf Port 3000.
  Vor `npm start` killen.
- Working-Tree-Drift ~300 Files (Daten-Refresh, Foto-Track, andere
  Tracks) — wie immer Track-isoliert ignorieren.

## Vorgeschlagene Reihenfolge nächste Session

1. **Begrüßen + nach Gesundheit fragen** (User war gestern krank).
2. Wenn er weitermachen will:
   - cloudflared-Auth (er muss `! cloudflared tunnel login` selbst).
   - Während er das macht / wenn unmöglich: Mobile-UI-Sweep auf
     `localhost:3000` via Playwright MCP (Hauptseite, Politiker-Detail,
     Vote-Detail, Methodik, Such-Modal — iPhone-14- und Pixel-7-
     Viewport).
3. Demo-Launch fertigziehen sobald cert da ist.
4. **DIE Email** — die seit Wochen das Gate ist. Vorlage in
   `docs/cold-email-targets.md`, 4 Sätze, EINE Person. Sobald
   `https://politik.jinsheng-chen.de` 200 antwortet.

## Was NICHT vergessen

- User-Quote (Memory `feedback_passion_project_stance`): „Reception kein
  Gate." Wenn die Email rausgeht und keiner antwortet, ist das
  in-scope, nicht ein Drama.
- Memory `feedback_no_gotcha_framing` + `feedback_neutralitaet` —
  weiterhin gültig fürs UI-Polish (keine wertenden Adjektive in neuen
  Strings, falls beim Mobile-Sweep Texte angepasst werden).
- Memory `feedback_track_isolation_commits` — bei UI-Edits nur die
  spezifischen geänderten Files staging, nicht `git add -A`.
- Memory `feedback_linear_only` — UI-Änderungen ausschließlich unter
  `src/app/design/linear/...`.
