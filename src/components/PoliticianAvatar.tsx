import Image from "next/image";

interface Props {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  party: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { wrap: "w-8 h-8 text-[10px]", img: 32, rounded: "rounded-lg" },
  md: { wrap: "w-12 h-12 text-sm", img: 48, rounded: "rounded-xl" },
  lg: { wrap: "w-20 h-20 text-xl", img: 80, rounded: "rounded-2xl" },
} as const;

// Parteifarben für Initialen-Avatar (Hex damit unabhängig vom Tailwind-Theme).
function partyColors(party: string | null): { bg: string; fg: string } {
  const p = (party ?? "").toLowerCase();
  if (p.includes("spd")) return { bg: "#e3000f", fg: "#fff" };
  if (p === "cdu" || p.includes("christlich demo")) return { bg: "#000", fg: "#fff" };
  if (p === "csu") return { bg: "#0080c8", fg: "#fff" };
  if (p.includes("grün")) return { bg: "#1aa037", fg: "#fff" };
  if (p === "fdp" || p.includes("freie demo")) return { bg: "#ffed00", fg: "#000" };
  if (p === "afd") return { bg: "#009ee0", fg: "#fff" };
  if (p.includes("linke")) return { bg: "#bd2c80", fg: "#fff" };
  if (p === "bsw" || p.includes("wagenknecht")) return { bg: "#7d2972", fg: "#fff" };
  if (p.includes("freie wähler")) return { bg: "#0f4778", fg: "#fff" };
  if (p === "ssw") return { bg: "#003d8f", fg: "#fff" };
  if (p === "volt") return { bg: "#562883", fg: "#fff" };
  if (p === "ödp") return { bg: "#ed8b00", fg: "#fff" };
  if (p.includes("tierschutz")) return { bg: "#005d23", fg: "#fff" };
  if (p === "die partei") return { bg: "#b80000", fg: "#fff" };
  return { bg: "#9ca3af", fg: "#fff" }; // parteilos / unbekannt → grau
}

export function PoliticianAvatar({ photoUrl, firstName, lastName, party, size = "md" }: Props) {
  const s = SIZES[size];

  if (photoUrl) {
    return (
      <div className={`${s.wrap} ${s.rounded} overflow-hidden shrink-0 bg-primary-light`}>
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
  const { bg, fg } = partyColors(party);
  return (
    <div
      className={`${s.wrap} ${s.rounded} flex items-center justify-center shrink-0 font-bold tracking-tight`}
      style={{ backgroundColor: bg, color: fg }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}
