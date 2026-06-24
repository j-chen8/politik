#!/usr/bin/env python3
"""Dark-Mode-Codemod für Tailwind-Klassen (farbfamilien-/muster-basiert).

Fügt `dark:`-Varianten additiv hinzu bzw. migriert neutrale Flächen/Ränder auf
semantische Tokens. Klassen-Tokens im className sind durch Whitespace/Quotes
getrennt; die Regex matcht ein Token nur zwischen solchen Delimitern (Lookarounds,
die nicht konsumieren). Eingefügte `dark:…`-Tokens sind vom `:` vorangestellt und
werden daher nie erneut verarbeitet.

WICHTIG: NICHT idempotent — nur auf Dateien OHNE bestehendes `dark:` anwenden
(sonst werden Geschwister verdoppelt). Usage:
    python3 scripts/darkmode-codemod.py <datei> [<datei> ...]

Bewusst NICHT angefasst (Augenmaß nötig, werden am Ende als Rest gemeldet):
solide Füllungen (-500/-600/-700 als bg), graue Füll-Flächen (bg-zinc-300/400),
dunkle Flächen in Light (bg-zinc-900/950), Gradient-Stops (from-/via-/to-),
helle Schrift (text-*-50/100/200, text-white).
"""
import re
import sys

DELIM = r"[\s\"'`]"
END = r"(?=" + DELIM + r")"

def _enclosing(text, start, end):
    """Slice des umschließenden String-Literals (zwischen Quotes/Backticks),
    damit wir prüfen können, ob im selben class-String schon eine passende
    dark:-Variante existiert (verhindert Duplikate auf teil-dunklen Dateien)."""
    quotes = "\"'`"
    l = start
    while l > 0 and text[l - 1] not in quotes:
        l -= 1
    r = end
    n = len(text)
    while r < n and text[r] not in quotes:
        r += 1
    return text[l:r]

def _has_dark(text, m, util, color):
    """True, wenn im selben class-String bereits eine dark:…util-color…-Variante steht."""
    cls = _enclosing(text, m.start(), m.end())
    return re.search(r"dark:(?:[a-z-]+:)*" + re.escape(util) + r"-" + re.escape(color) + r"\b", cls) is not None
# Variant-Prefix-Kette (hover:, focus:, group-hover:, target:, placeholder:, …).
# Schließt `dark:` AKTIV aus (Negative-Lookahead pro Stufe), sonst würde der
# Codemod bestehende Dark-Varianten als Light-Token behandeln → dark:dark:.
PREFIX = r"(?P<prefix>(?:(?!dark:)[a-z-]+:)*)"
OPAC = r"(?P<op>/\d+)?"

NEUTRAL = "zinc|slate|gray|neutral|stone"
ACCENT = "emerald|rose|amber|red|green|blue|sky|indigo|violet|teal|orange|yellow|cyan|fuchsia|pink|purple|lime"

# ── Token-Swaps (Migration auf semantische Tokens, flippen automatisch) ──
def swap_rules(text):
    n = 0
    # bg-white(+op) -> bg-card(+op)
    pat = re.compile(r"(?<=" + DELIM + r")(?P<prefix>(?:(?!dark:)[a-z-]+:)*)bg-white(?P<op>/\d+)?(?=" + DELIM + r")")
    text, c = pat.subn(lambda m: f"{m.group('prefix')}bg-card{m.group('op') or ''}", text); n += c
    # border-(neutral)-(50|100|200)(+op) -> border-border ; divide-… -> divide-border
    for util in ("border", "divide"):
        pat = re.compile(r"(?<=" + DELIM + r")(?P<prefix>(?:(?!dark:)[a-z-]+:)*)" + util + r"-(?:" + NEUTRAL + r")-(?:50|100|200)(?:/\d+)?(?=" + DELIM + r")")
        text, c = pat.subn(lambda m, u=util: f"{m.group('prefix')}{u}-border", text); n += c
    return text, n

# ── Additive dark:-Regeln pro Util/Farbklasse: level -> dark-level (None = skip) ──
TEXT_NEUTRAL = {"950": "50", "900": "100", "800": "200", "700": "300", "600": "300", "500": "400", "400": "500", "300": "600"}
TEXT_ACCENT = {"950": "200", "900": "300", "800": "400", "700": "400", "600": "400", "500": "400"}
BG_NEUTRAL = {"50": "800", "100": "800", "200": "700"}        # nur helle Flächen; 300/400/900/950 = skip
BG_ACCENT_FIXED = {"50": "950/40", "100": "900/40"}           # feste dunkle Tints (Opacity überschrieben)
BORDER_NEUTRAL = {"300": "600", "400": "500", "900": "100"}   # 50/100/200 werden geswappt
BORDER_ACCENT = {"200": "900/50", "300": "800/50"}
RING_NEUTRAL = {"200": "700", "300": "600", "900": "100"}
RING_ACCENT = {"200": "900/50", "400": "700/50"}
DECO_NEUTRAL = {"200": "700", "300": "600", "400": "500", "900": "100", "950": "100"}
DECO_ACCENT = {"300": "700", "400": "600", "700": "400"}

def additive_rules(text):
    n = 0
    def make(util, neutral_map, accent_map, fixed_accent=None):
        nonlocal text, n
        # neutral
        if neutral_map:
            pat = re.compile(r"(?<=" + DELIM + r")" + PREFIX + util + r"-(?P<c>" + NEUTRAL + r")-(?P<lvl>\d+)" + OPAC + END)
            def repl(m):
                dl = neutral_map.get(m.group("lvl"))
                if dl is None: return m.group(0)
                if _has_dark(m.string, m, util, m.group("c")): return m.group(0)
                op = "" if "/" in dl else (m.group("op") or "")  # Dark-Wert bringt ggf. eigene Opacity mit
                return f"{m.group(0)} dark:{m.group('prefix')}{util}-{m.group('c')}-{dl}{op}"
            text, c = pat.subn(repl, text); n += c
        # accent
        if accent_map or fixed_accent:
            pat = re.compile(r"(?<=" + DELIM + r")" + PREFIX + util + r"-(?P<c>" + ACCENT + r")-(?P<lvl>\d+)" + OPAC + END)
            def repl(m):
                if _has_dark(m.string, m, util, m.group("c")): return m.group(0)
                if fixed_accent is not None:
                    fv = fixed_accent.get(m.group("lvl"))
                    if fv is None: return m.group(0)
                    return f"{m.group(0)} dark:{m.group('prefix')}{util}-{m.group('c')}-{fv}"
                dl = accent_map.get(m.group("lvl"))
                if dl is None: return m.group(0)
                op = "" if "/" in dl else (m.group("op") or "")  # Dark-Wert bringt ggf. eigene Opacity mit
                return f"{m.group(0)} dark:{m.group('prefix')}{util}-{m.group('c')}-{dl}{op}"
            text, c = pat.subn(repl, text); n += c
    make("text", TEXT_NEUTRAL, TEXT_ACCENT)
    make("bg", BG_NEUTRAL, None, fixed_accent=BG_ACCENT_FIXED)
    make("border", BORDER_NEUTRAL, BORDER_ACCENT)
    make("ring", RING_NEUTRAL, RING_ACCENT)
    make("decoration", DECO_NEUTRAL, DECO_ACCENT)
    return text, n

# ── Marken-Navy #1a3e72 -> helleres Blau im Dark (arbitrary hex) ──
HEX_MAP = {"#1a3e72": "#8fb3e6", "#0f2a52": "#b7d0f0"}
def hex_rules(text):
    n = 0
    for util in ("text", "bg", "border", "decoration", "ring"):
        pat = re.compile(r"(?<=" + DELIM + r")" + PREFIX + util + r"-\[(?P<hex>#[0-9a-fA-F]{3,8})\](?P<op>/(?:\[[^\]]+\]|[\d.]+%?))?" + END)
        def repl(m):
            dh = HEX_MAP.get(m.group("hex").lower())
            if dh is None: return m.group(0)
            if _has_dark(m.string, m, util, f"[{dh}]"): return m.group(0)
            op = m.group("op") or ""
            return f"{m.group(0)} dark:{m.group('prefix')}{util}-[{dh}]{op}"
        text, c = pat.subn(repl, text); n += c
    return text, n

def transform(text):
    total = 0
    text, c = swap_rules(text); total += c
    text, c = additive_rules(text); total += c
    text, c = hex_rules(text); total += c
    return text, total

def main():
    grand = 0
    for path in sys.argv[1:]:
        with open(path, "r", encoding="utf-8") as f:
            original = f.read()
        new, n = transform(original)
        if new != original:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
        grand += n
        print(f"{path}: {n} Ersetzungen")
    print(f"Σ {grand} Ersetzungen über {len(sys.argv) - 1} Dateien")

if __name__ == "__main__":
    main()
