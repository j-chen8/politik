// Registry der Pro-Quelle-Extractoren (§2). Key = exakter Watchlist-slug.
// Fehlt ein Slug hier, überspringt der Scraper die Quelle (Seed bleibt unberührt).
// RohBericht/ExtractCtx leben kanonisch in ./types.
import type { ExtractCtx, RohBericht } from "./types";

import { extract as alterssicherungskommission } from "./alterssicherungskommission";
import { extract as finanzkommissionGesundheit } from "./finanzkommission-gesundheit";
import { extract as expertenkommissionSocialMedia } from "./expertenkommission-social-media";
import { extract as normenkontrollrat } from "./normenkontrollrat";
import { extract as expertenratKlimafragen } from "./expertenrat-klimafragen";
import { extract as sozialbeiratRentenversicherungsbericht } from "./sozialbeirat-rentenversicherungsbericht";
import { extract as deutscherEthikrat } from "./deutscher-ethikrat";
import { extract as monopolkommission } from "./monopolkommission";
import { extract as sachverstaendigenratWirtschaft } from "./sachverstaendigenrat-wirtschaft";
import { extract as mindestlohnkommission } from "./mindestlohnkommission";
import { extract as kef } from "./kef";
import { extract as svrMigration } from "./svr-migration";
import { extract as svrGesundheit } from "./svr-gesundheit";
import { extract as ratNachhaltigeEntwicklung } from "./rat-nachhaltige-entwicklung";
import { extract as stabilitaetsrat } from "./stabilitaetsrat";
import { extract as svrVerbraucherfragen } from "./svr-verbraucherfragen";
import { extract as wissBeiratBmf } from "./wiss-beirat-bmf";
import { extract as wissBeiratBmwe } from "./wiss-beirat-bmwe";

export type { ExtractCtx, RohBericht };

export const EXTRACTORS: Record<string, (ctx: ExtractCtx) => Promise<RohBericht[]>> = {
  "alterssicherungskommission": alterssicherungskommission,
  "finanzkommission-gesundheit": finanzkommissionGesundheit,
  "expertenkommission-social-media": expertenkommissionSocialMedia,
  "normenkontrollrat": normenkontrollrat,
  "expertenrat-klimafragen": expertenratKlimafragen,
  "sozialbeirat-rentenversicherungsbericht": sozialbeiratRentenversicherungsbericht,
  "deutscher-ethikrat": deutscherEthikrat,
  "monopolkommission": monopolkommission,
  "sachverstaendigenrat-wirtschaft": sachverstaendigenratWirtschaft,
  "mindestlohnkommission": mindestlohnkommission,
  "kef": kef,
  "svr-migration": svrMigration,
  "svr-gesundheit": svrGesundheit,
  "rat-nachhaltige-entwicklung": ratNachhaltigeEntwicklung,
  "stabilitaetsrat": stabilitaetsrat,
  "svr-verbraucherfragen": svrVerbraucherfragen,
  "wiss-beirat-bmf": wissBeiratBmf,
  "wiss-beirat-bmwe": wissBeiratBmwe,
};
