import Image from "next/image";
import { partyColors } from "@/lib/party-colors";

interface Props {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  party: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "card";
  /** No-Foto-Fallback: "party" = Partei-Farbblock, "muted" = ruhiges Grau. */
  fallback?: "party" | "muted";
}

const SIZES = {
  sm: { wrap: "w-8 h-8 text-[10px]", img: 32, rounded: "rounded-lg" },
  md: { wrap: "w-12 h-12 text-sm", img: 48, rounded: "rounded-xl" },
  lg: { wrap: "w-20 h-20 text-xl", img: 80, rounded: "rounded-2xl" },
  xl: { wrap: "w-28 h-28 text-2xl", img: 112, rounded: "rounded-2xl" },
  "2xl": { wrap: "w-40 h-40 text-4xl", img: 160, rounded: "rounded-3xl" },
  // Responsive Karten-Größe: klein auf Handy, groß ab Desktop.
  card: {
    wrap: "w-16 h-16 text-base lg:w-28 lg:h-28 lg:text-2xl",
    img: 112,
    rounded: "rounded-xl lg:rounded-2xl",
  },
} as const;

export function PoliticianAvatar({ photoUrl, firstName, lastName, party, size = "md", fallback = "party" }: Props) {
  const s = SIZES[size];

  if (photoUrl) {
    return (
      <div className={`${s.wrap} ${s.rounded} overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800`}>
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          width={s.img}
          height={s.img}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const noPhotoLabel = `${firstName} ${lastName} – kein Foto verfügbar, da keine eindeutige Bildlizenz vorliegt`;

  if (fallback === "muted") {
    return (
      <div
        className={`${s.wrap} ${s.rounded} flex items-center justify-center shrink-0 font-semibold tracking-tight bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500`}
        aria-label={noPhotoLabel}
        title="Kein Foto verfügbar – keine eindeutige Bildlizenz"
      >
        {initials}
      </div>
    );
  }

  const { bg, fg } = partyColors(party);
  return (
    <div
      className={`${s.wrap} ${s.rounded} flex items-center justify-center shrink-0 font-bold tracking-tight`}
      style={{ backgroundColor: bg, color: fg }}
      aria-label={noPhotoLabel}
      title="Kein Foto verfügbar – keine eindeutige Bildlizenz"
    >
      {initials}
    </div>
  );
}
