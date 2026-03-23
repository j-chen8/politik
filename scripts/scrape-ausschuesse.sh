#!/bin/bash
# Scrape ALL Bundestag committee protocols AND Tagesordnungen
# Usage: bash scripts/scrape-ausschuesse.sh

BASE="https://www.bundestag.de"
DATA_DIR="/home/jk/politik/data"
LOG_FILE="${DATA_DIR}/scrape-log.txt"

mkdir -p "$DATA_DIR"
> "$LOG_FILE"

# Function: find AJAX filterlist ID for a given committee page
find_filterlist_id() {
  local url="$1"
  local html=$(curl -s "$url")
  echo "$html" | grep -oP 'filterlist/de/[^"]+/[0-9]+-[0-9]+' | head -1
}

# Function: download all PDFs from a filterlist endpoint with pagination
download_all_pdfs() {
  local ajax_path="$1"
  local output_dir="$2"
  local label="$3"

  mkdir -p "$output_dir"
  local total=0

  for offset in $(seq 0 10 200); do
    local url="${BASE}/ajax/${ajax_path}?limit=10&noFilterSet=true&offset=${offset}"
    local html=$(curl -s "$url")
    local pdfs=$(echo "$html" | grep -oP 'href="[^"]*\.pdf"' | sed 's/href="//;s/"$//')

    if [ -z "$pdfs" ]; then
      break
    fi

    while IFS= read -r pdf_url; do
      # Make absolute URL if needed
      if [[ "$pdf_url" != http* ]]; then
        pdf_url="${BASE}${pdf_url}"
      fi
      local fname=$(basename "$pdf_url")
      if [ ! -f "${output_dir}/${fname}" ]; then
        curl -s -o "${output_dir}/${fname}" "$pdf_url"
        total=$((total+1))
      fi
    done <<< "$pdfs"
  done

  echo "${label}: ${total} new PDFs downloaded to ${output_dir}" | tee -a "$LOG_FILE"
}

# Function: try to find and download protocols/tagesordnungen for a committee
process_committee() {
  local slug="$1"
  local name="$2"
  local safe_name=$(echo "$slug" | tr '/' '_')

  echo "Processing: $name ($slug)..."

  # Try various subpage names for protocols
  for subpage in "protokolle" "Protokolle" "wortprotokolle" "Wortprotokolle" "sitzungen"; do
    local page_url="${BASE}/ausschuesse/${slug}/${subpage}"
    local status=$(curl -sI -o /dev/null -w "%{http_code}" "$page_url")
    if [ "$status" = "200" ]; then
      local ajax_path=$(find_filterlist_id "$page_url")
      if [ -n "$ajax_path" ]; then
        download_all_pdfs "$ajax_path" "${DATA_DIR}/ausschuss_protokolle/${safe_name}" "${name} - Protokolle"
      fi
      break
    fi
  done

  # Try various subpage names for Tagesordnungen
  for subpage in "tagesordnungen" "Tagesordnungen"; do
    local page_url="${BASE}/ausschuesse/${slug}/${subpage}"
    local status=$(curl -sI -o /dev/null -w "%{http_code}" "$page_url")
    if [ "$status" = "200" ]; then
      local ajax_path=$(find_filterlist_id "$page_url")
      if [ -n "$ajax_path" ]; then
        download_all_pdfs "$ajax_path" "${DATA_DIR}/ausschuss_tagesordnungen/${safe_name}" "${name} - Tagesordnungen"
      fi
      break
    fi
  done
}

echo "=== Bundestag Ausschuss Scraper ==="
echo "Started: $(date)"
echo ""

# All known committees and their URL slugs
declare -A COMMITTEES=(
  # Hauptausschüsse
  ["a11_arbeit_soziales"]="Arbeit und Soziales"
  ["a03_auswaertiges"]="Auswärtiges"
  ["a13_Bildung-Familie-Senioren-Frauen-und-Jugend"]="Bildung, Familie, Senioren, Frauen und Jugend"
  ["a23_digitales_staatsmodernisierung"]="Digitales und Staatsmodernisierung"
  ["europa"]="Europäische Union"
  ["a07_finanzen"]="Finanzen"
  ["forschung"]="Forschung, Technologie, Raumfahrt"
  ["gemeinsamer-ausschuss"]="Gemeinsamer Ausschuss"
  ["gesundheit"]="Gesundheit"
  ["a08_haushalt"]="Haushalt"
  ["inneres"]="Inneres"
  ["a22_kultur"]="Kultur und Medien"
  ["Landwirtschaft"]="Landwirtschaft, Ernährung, Heimat"
  ["a17_menschenrechte"]="Menschenrechte und humanitäre Hilfe"
  ["a02_Petitionsausschuss"]="Petitionen"
  ["recht-verbraucherschutz"]="Recht und Verbraucherschutz"
  ["sport_und_ehrenamt"]="Sport und Ehrenamt"
  ["a20_tourismus"]="Tourismus"
  ["umwelt"]="Umwelt, Klimaschutz, Naturschutz"
  ["verkehr"]="Verkehr"
  ["vermittlungsausschuss"]="Vermittlungsausschuss"
  ["verteidigung"]="Verteidigung"
  ["wahlpruefungsausschuss"]="Wahlprüfungsausschuss"
  ["geschaeftsordnung"]="Wahlprüfung, Immunität und GO"
  ["a09_wirtschaft"]="Wirtschaft und Energie"
  ["entwicklung"]="Wirtschaftliche Zusammenarbeit und Entwicklung"
  ["a24_wohnen"]="Wohnen, Stadtentwicklung, Bauwesen und Kommunen"
  # Unterausschüsse
  ["a03_auswaertiges/ua_kb"]="UA Kultur- und Bildungspolitik"
  ["a03_auswaertiges/ua_rna"]="UA Rüstungs- und Proliferationskontrolle"
  ["a03_auswaertiges/ua_vn"]="UA Vereinte Nationen"
  ["a03_auswaertiges/ua_kvsf"]="UA Krisenprävention"
  ["a13_Bildung-Familie-Senioren-Frauen-und-Jugend/kiko"]="Kinderkommission"
  ["a08_haushalt/bundesfinanzierungsgremium"]="Bundesfinanzierungsgremium"
  ["a08_haushalt/a08_rpa"]="Rechnungsprüfungsausschuss"
  ["a08_haushalt/a08_eu"]="UA Fragen der EU (Haushalt)"
  ["a08_haushalt/vertrauensgremium"]="Vertrauensgremium"
  ["recht-verbraucherschutz/europarecht"]="UA Europarecht"
  # Weitere Gremien
  ["weitere_gremien/parlamentarisches-kontrollgremium"]="Parlamentarisches Kontrollgremium"
  ["weitere_gremien/g10-kommission"]="G 10-Kommission"
  ["weitere_gremien/gremium-artikel13"]="Gremium Art. 13 GG"
  ["weitere_gremien/wahlausschuss"]="Wahlausschuss"
  ["weitere_gremien/ee01"]="Enquete-Kommission Corona"
  ["weitere_gremien/pbnez"]="Parlamentarischer Beirat nachhaltige Entwicklung"
  ["weitere_gremien/gremium-geldwaeschegesetz"]="Gremium §28a Geldwäschegesetz"
  ["weitere_gremien/gremium-zollfahndung"]="Gremium §80 Zollfahndungsdienst"
  ["weitere_gremien/china-kommission"]="Kommission China"
)

# Process all committees
for slug in "${!COMMITTEES[@]}"; do
  name="${COMMITTEES[$slug]}"
  process_committee "$slug" "$name"
done

echo ""
echo "=== Summary ==="
echo "Protokolle:"
for dir in ${DATA_DIR}/ausschuss_protokolle/*/; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -name "*.pdf" | wc -l)
    echo "  $(basename $dir): $count PDFs"
  fi
done
echo ""
echo "Tagesordnungen:"
for dir in ${DATA_DIR}/ausschuss_tagesordnungen/*/; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -name "*.pdf" | wc -l)
    echo "  $(basename $dir): $count PDFs"
  fi
done
echo ""
echo "Finished: $(date)"
