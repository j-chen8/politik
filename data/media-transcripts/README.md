# Media-Transkript-Cache (politische TV-Talks)

VTT-Untertitel (deu, redaktionell) ganzer Sendungen, gezogen via yt-dlp.
**Zweck: Bewahrung vor Mediathek-Ablauf** — ZDF/ARD depublizieren rollierend.
Diese Dateien sind NICHT reproduzierbar (Quellen laufen ab) → committen.

Stand 2026-06-02:
- lanz/       ZDF, Fenster ~24 Mo (ab 04.06.2024)
- illner/     ZDF, Fenster ~12 Mo (ab 05.06.2025)
- maischberger/ ARD, Folgen fallen tgl. (älteste Ablauf 2026-06-02)
- caren_miosga/ ARD
- hart_aber_fair/ ARD

Pro Ordner `_manifest.tsv` = date \t video-id/url \t ... (Mapping zur Quelle).
ARD-Quelle: api.ardmediathek.de/page-gateway/widgets/ard/asset/<show-crid> (platform=MEDIA_THEK).
Lücken ohne UT-Spur (nur per Whisper holbar): lanz 12.06.2025; maischberger 09./10.12.2025; miosga 23.11.2025.
