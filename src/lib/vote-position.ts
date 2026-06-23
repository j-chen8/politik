// Umrechnung einer rohen Fraktions-Stimme in die Sachposition ZUM ANTRAG.
//
// Hintergrund: Stimmt der Bundestag über eine BESCHLUSSEMPFEHLUNG ab, die die
// ABLEHNUNG eines Antrags empfiehlt, ist die rohe Stimmrichtung gegenläufig zur
// inhaltlichen Position: "Ja" (zur Empfehlung) = GEGEN den Antrag, "Nein" = FÜR den
// Antrag. Diese deterministische Umrechnung macht aus der Verfahrens-Stimme die
// Sachposition. Die Rohstimme bleibt in der UI immer als Beleg sichtbar.

export type AntragPosition = "dafuer" | "dagegen" | "enthaltung" | "unbekannt";

export function positionZumAntrag(
  roh: string | undefined | null,
  beschlussAblehnung: boolean,
): AntragPosition {
  const r = (roh ?? "").toLowerCase();
  if (r === "enthaltung" || r === "enthalten") return "enthaltung";
  if (beschlussAblehnung) {
    if (r === "ja") return "dagegen";
    if (r === "nein") return "dafuer";
  } else {
    if (r === "ja") return "dafuer";
    if (r === "nein") return "dagegen";
  }
  return "unbekannt";
}

export const POSITION_META: Record<
  AntragPosition,
  { label: string; icon: string }
> = {
  dafuer: { label: "dafür", icon: "✓" },
  dagegen: { label: "dagegen", icon: "✗" },
  enthaltung: { label: "Enthaltung", icon: "—" },
  unbekannt: { label: "—", icon: "?" },
};
