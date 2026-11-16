import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  ShoppingCart,
  MapPin,
  Bell,
  Share2,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------
   SETTINGS: fill these in to start earning. Empty values are hidden.
------------------------------------------------------------------- */
const CONFIG = {
  // Amazon Associates India tag, e.g. "yourname-21"
  AMAZON_TAG: "",
  // Your Telegram channel link, e.g. "https://t.me/yourchannel"
  TELEGRAM_URL: "https://t.me/leonidahub89",
  // Adsterra Native Banner: from the code Adsterra gives you, copy the
  // script src (starts with // or https://) and the container id.
  ADSTERRA_NATIVE_SRC: "https://bicea.org/21/470966ca46198f128d2cfcf7e081f531",
  ADSTERRA_NATIVE_ID: "container-470966ca46198f128d2cfcf7e081f531",
  // VPN / antivirus affiliate link (optional)
  SECURITY_AFFILIATE_URL: "",
  // Launch date (local time)
  LAUNCH: "2026-11-19T00:00:00",
};

type Tab = "scan" | "preload" | "gear" | "map" | "alerts";

const TABS: { id: Tab; label: string }[] = [
  { id: "scan", label: "Scam check" },
  { id: "preload", label: "Preload guide" },
  { id: "gear", label: "Launch gear" },
  { id: "map", label: "Leonida map" },
  { id: "alerts", label: "Scam alerts" },
];

const DISPLAY = "font-['Anton',Impact,'Arial_Narrow',sans-serif] tracking-wide";

/* ------------------------------- helpers ------------------------------- */

function amazonLink(query: string) {
  const tag = CONFIG.AMAZON_TAG ? `&tag=${CONFIG.AMAZON_TAG}` : "";
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}${tag}`;
}

const OFFICIAL = ["rockstargames.com", "playstation.com", "xbox.com"];
const BAD_FILES = /\.(apk|exe|zip|rar|torrent|msi|dmg)(\b|$)/i;
const BAD_WORDS =
  /(mobile|android|ios|iphone|free|giveaway|leak|mod|hack|crack|repack|key|beta|generator|download|apk)/i;

type Verdict = { level: "danger" | "warn" | "safe"; title: string; reasons: string[] };

function getHost(input: string) {
  try {
    const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function analyze(raw: string): Verdict {
  const input = raw.trim();
  const host = getHost(input);
  const official = OFFICIAL.some((d) => host === d || host.endsWith(`.${d}`));
  const reasons: string[] = [];

  if (BAD_FILES.test(input)) {
    reasons.push("It points to an installable file (APK, EXE, ZIP or similar). GTA 6 is not released as a download file like this.");
  }
  if (!official && BAD_WORDS.test(input)) {
    reasons.push("It uses words common in scam links (free, mod, leak, mobile, key, download).");
  }
  if (!official) {
    reasons.push("The domain is not Rockstar, PlayStation or Xbox.");
  }
  if (/(android|ios|iphone|mobile|\bpc\b)/i.test(input) && !official) {
    reasons.push("GTA 6 is announced for PS5 and Xbox Series X|S only. No Android, iOS or PC version is announced.");
  }

  if (official && !BAD_FILES.test(input)) {
    return {
      level: "safe",
      title: "Looks official",
      reasons: [
        `The domain (${host}) belongs to an official site.`,
        "This is a basic check, not a guarantee. Read the full address before you sign in.",
      ],
    };
  }
  const strong = BAD_FILES.test(input) || (BAD_WORDS.test(input) && !official);
  return {
    level: strong ? "danger" : "warn",
    title: strong ? "Likely fake" : "Not an official site",
    reasons,
  };
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/* Adsterra native banner: renders only when configured, one fixed slot. */
function AdSlot() {
  const host = useRef<HTMLDivElement>(null);
  const { ADSTERRA_NATIVE_SRC: src, ADSTERRA_NATIVE_ID: id } = CONFIG;
  useEffect(() => {
    const el = host.current;
    if (!el || !src || !id) return;
    const box = document.createElement("div");
    box.id = id;
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.setAttribute("data-cfasync", "false");
    el.append(box, s);
    return () => {
      el.innerHTML = "";
    };
  }, [src, id]);
  if (!src || !id) return null;
  return (
    <div className="mx-auto my-8 max-w-3xl">
      <p className="mb-1 text-center text-xs text-orange-100/60">Advertisement</p>
      <div ref={host} className="min-h-[90px]" />
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-pink-400/25 bg-[#1a0627]/70 p-5 shadow-[0_0_40px_-12px_rgba(255,61,139,0.5)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------- app -------------------------------- */

export default function App() {
  const [tab, setTab] = useState<Tab>("scan");
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const cd = useCountdown(CONFIG.LAUNCH);

  const onScan = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setVerdict(analyze(input));
  };

  const shareWhatsApp = (text: string) => {
    const msg = encodeURIComponent(`${text}\nCheck links here: ${window.location.href}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noreferrer");
  };

  const tone = {
    danger: "border-red-400/60 bg-red-950/50 text-red-100",
    warn: "border-amber-300/60 bg-amber-950/40 text-amber-100",
    safe: "border-teal-300/60 bg-teal-950/40 text-teal-100",
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#12021f_0%,#2b0b40_40%,#6a1752_75%,#c2410c_135%)] text-[#fff2e6]">
      {/* hero */}
      <header className="relative overflow-hidden border-b border-pink-400/20">
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#ffb347_0%,#ff3d8b_55%,transparent_72%)] opacity-70 blur-[2px] sm:h-96 sm:w-96" />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-8 text-center">
          <p className="text-sm text-orange-100/80">Unofficial GTA 6 fan companion by Hackotimize</p>
          <h1 className={`${DISPLAY} mt-3 text-6xl italic leading-none sm:text-8xl bg-gradient-to-b from-[#fff2e6] via-[#ffb347] to-[#ff3d8b] bg-clip-text text-transparent`}>
            LEONIDA HUB
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-orange-50/90">
            Check GTA 6 links before you tap, get ready for launch day, and skip the fake downloads.
          </p>

          {cd ? (
            <div className="mx-auto mt-8 grid max-w-md grid-cols-4 gap-3" aria-live="off">
              {(
                [
                  ["Days", cd.days],
                  ["Hours", cd.hours],
                  ["Min", cd.minutes],
                  ["Sec", cd.seconds],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-xl border border-teal-300/40 bg-black/40 py-3">
                  <div className={`${DISPLAY} text-4xl text-teal-200`}>{String(n).padStart(2, "0")}</div>
                  <div className="text-xs text-teal-100/80">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${DISPLAY} mt-8 text-3xl text-teal-200`}>GTA 6 is out. Stay safe from fake links.</p>
          )}
          <p className="mt-3 text-sm text-orange-100/70">Launch: 19 November 2026 on PS5 and Xbox Series X|S</p>
        </div>
      </header>

      {/* tabs */}
      <nav className="sticky top-0 z-20 border-b border-pink-400/20 bg-[#12021f]/90 backdrop-blur" aria-label="Sections">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-3 py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`min-h-[44px] shrink-0 rounded-full px-5 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-gradient-to-r from-[#ff3d8b] to-[#ff8a2b] text-[#1a0610]"
                  : "text-orange-100/80 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ---------- scam check ---------- */}
        {tab === "scan" && (
          <section className="space-y-6">
            <Card>
              <h2 className={`${DISPLAY} text-3xl`}>Is this GTA 6 link safe?</h2>
              <p className="mt-2 text-orange-50/80">
                Paste a link, Telegram message link, or file name. GTA 6 has no Android or iOS app and no
                download file.
              </p>
              <form onSubmit={onScan} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label htmlFor="scan" className="sr-only">
                  Link or file name
                </label>
                <input
                  id="scan"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. gta6-mobile-download.apk"
                  className="min-h-[52px] flex-1 rounded-xl border border-pink-400/40 bg-black/50 px-4 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <button
                  type="submit"
                  className="min-h-[52px] rounded-xl bg-gradient-to-r from-[#ff3d8b] to-[#ff8a2b] px-8 font-bold text-[#1a0610]"
                >
                  Check link
                </button>
              </form>
              <p className="mt-3 text-sm text-orange-100/70">
                Try:{" "}
                {["gta6-mobile-download.apk", "rockstargames.com/VI"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setInput(s);
                      setVerdict(analyze(s));
                    }}
                    className="mr-3 underline decoration-pink-400 underline-offset-4 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </p>
            </Card>

            {verdict && (
              <div className={`rounded-2xl border p-5 ${tone[verdict.level]}`} role="status">
                <div className="flex items-center gap-3">
                  {verdict.level === "safe" ? (
                    <ShieldCheck aria-hidden="true" />
                  ) : verdict.level === "danger" ? (
                    <ShieldAlert aria-hidden="true" />
                  ) : (
                    <AlertTriangle aria-hidden="true" />
                  )}
                  <h3 className={`${DISPLAY} text-2xl`}>{verdict.title}</h3>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
                  {verdict.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm opacity-90">
                  This is an automatic basic check. When in doubt, do not open or install anything.
                </p>
                {verdict.level !== "safe" && (
                  <button
                    onClick={() => shareWhatsApp("Warning: this GTA 6 link looks fake. Do not download it.")}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-current px-5 text-sm font-semibold"
                  >
                    <Share2 size={16} aria-hidden="true" /> Warn friends on WhatsApp
                  </button>
                )}
              </div>
            )}

            <AdSlot />
          </section>
        )}

        {/* ---------- preload ---------- */}
        {tab === "preload" && (
          <section className="space-y-6">
            <Card>
              <h2 className={`${DISPLAY} text-3xl`}>Get ready for launch day</h2>
              <p className="mt-2 text-orange-50/80">
                Check the exact download size on your console store page. Keep extra free space for the
                launch patch.
              </p>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <h3 className={`${DISPLAY} text-2xl text-teal-200`}>PS5</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-orange-50/90">
                  <li>Buy or pre-order GTA 6 on the PlayStation Store.</li>
                  <li>Open your Game Library and find the game.</li>
                  <li>Start the preload when it becomes available. Check your store page for the exact date.</li>
                  <li>Free up space before launch day and keep the console on a stable connection.</li>
                </ol>
              </Card>
              <Card>
                <h3 className={`${DISPLAY} text-2xl text-teal-200`}>Xbox Series X|S</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-orange-50/90">
                  <li>Buy or pre-order GTA 6 on the Microsoft Store.</li>
                  <li>Open My games and apps and find the game.</li>
                  <li>Start the preload when it becomes available. Check your store page for the exact date.</li>
                  <li>Free up space before launch day and keep the console on a stable connection.</li>
                </ol>
              </Card>
            </div>
            <Card>
              <h3 className="font-semibold">Running low on storage?</h3>
              <p className="mt-1 text-orange-50/80">An extra SSD or a bigger drive can save you from deleting other games.</p>
              <a
                href={amazonLink("PS5 M.2 SSD heatsink")}
                target="_blank"
                rel="noreferrer sponsored"
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-teal-300 px-5 font-semibold text-[#06201d]"
              >
                <Download size={16} aria-hidden="true" /> See storage options on Amazon
              </a>
            </Card>
            <AdSlot />
          </section>
        )}

        {/* ---------- gear ---------- */}
        {tab === "gear" && (
          <section className="space-y-6">
            <Card>
              <h2 className={`${DISPLAY} text-3xl`}>Launch week gear</h2>
              <p className="mt-2 text-sm text-orange-100/70">
                Affiliate links: we may earn a small commission if you buy, at no extra cost to you.
              </p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "PS5 console", q: "PS5 console", note: "Needed to play GTA 6 on PlayStation." },
                { name: "Xbox Series X", q: "Xbox Series X console", note: "Needed to play GTA 6 on Xbox." },
                { name: "DualSense controller", q: "PS5 DualSense controller", note: "A spare controller for long sessions." },
                { name: "Gaming headset", q: "gaming headset PS5", note: "For clear audio and online chat." },
                { name: "Extra storage", q: "PS5 M.2 SSD heatsink", note: "Room for a big new game." },
                { name: "Racing wheel", q: "racing wheel PS5", note: "For driving fans." },
              ].map((g) => (
                <Card key={g.name}>
                  <h3 className="font-semibold">{g.name}</h3>
                  <p className="mt-1 text-sm text-orange-50/80">{g.note}</p>
                  <a
                    href={amazonLink(g.q)}
                    target="_blank"
                    rel="noreferrer sponsored"
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gradient-to-r from-[#ff3d8b] to-[#ff8a2b] px-5 text-sm font-bold text-[#1a0610]"
                  >
                    <ShoppingCart size={16} aria-hidden="true" /> View on Amazon
                  </a>
                </Card>
              ))}
              {CONFIG.SECURITY_AFFILIATE_URL && (
                <Card>
                  <h3 className="font-semibold">VPN and antivirus</h3>
                  <p className="mt-1 text-sm text-orange-50/80">Extra protection on public Wi-Fi and unknown links.</p>
                  <a
                    href={CONFIG.SECURITY_AFFILIATE_URL}
                    target="_blank"
                    rel="noreferrer sponsored"
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-teal-300 px-5 text-sm font-bold text-[#06201d]"
                  >
                    <ExternalLink size={16} aria-hidden="true" /> Learn more
                  </a>
                </Card>
              )}
            </div>
            <AdSlot />
          </section>
        )}

        {/* ---------- map ---------- */}
        {tab === "map" && (
          <section className="space-y-6">
            <Card>
              <h2 className={`${DISPLAY} text-3xl`}>Leonida at a glance</h2>
              <p className="mt-2 text-orange-50/80">
                Regions shown on Rockstar&apos;s official GTA 6 site. We only list confirmed names here and will add
                details after launch.
              </p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Vice City", "Leonida Keys", "Grassrivers", "Port Gellhorn", "Ambrosia", "Mount Kalaga National Park"].map(
                (r) => (
                  <Card key={r}>
                    <div className="flex items-center gap-3">
                      <MapPin className="text-pink-300" aria-hidden="true" />
                      <h3 className="font-semibold">{r}</h3>
                    </div>
                  </Card>
                ),
              )}
            </div>
          </section>
        )}

        {/* ---------- alerts ---------- */}
        {tab === "alerts" && (
          <section className="space-y-6">
            <Card>
              <h2 className={`${DISPLAY} text-3xl`}>Common GTA 6 scams</h2>
              <p className="mt-2 text-orange-50/80">These are typical patterns, not a live blocklist.</p>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Fake mobile APK", "Promises GTA 6 on Android. There is no mobile version. APKs like this can carry spyware."],
                ["Free PC download or repack", "Promises GTA 6 on PC. No PC version is announced. These files often hide info-stealers."],
                ["Free key or giveaway", "Asks you to sign in to PlayStation, Xbox or Steam to claim a key. This steals your account."],
                ["Fake beta or early access", "Asks for payment or personal details to join a beta. Rockstar does not sell access this way."],
              ].map(([t, d]) => (
                <Card key={t}>
                  <h3 className="font-semibold text-pink-200">{t}</h3>
                  <p className="mt-1 text-sm text-orange-50/85">{d}</p>
                </Card>
              ))}
            </div>
            <Card>
              <h3 className={`${DISPLAY} text-2xl`}>Get new scam alerts</h3>
              <p className="mt-1 text-orange-50/80">Join the channel so you hear about fake links early.</p>
              {CONFIG.TELEGRAM_URL ? (
                <a
                  href={CONFIG.TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-teal-300 px-5 font-bold text-[#06201d]"
                >
                  <Bell size={16} aria-hidden="true" /> Join on Telegram
                </a>
              ) : (
                <button
                  onClick={() => shareWhatsApp("Fake GTA 6 downloads are going around. Check any link first.")}
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-teal-300 px-5 font-bold text-[#06201d]"
                >
                  <Share2 size={16} aria-hidden="true" /> Warn friends on WhatsApp
                </button>
              )}
            </Card>
            <AdSlot />
          </section>
        )}
      </main>

      <footer className="border-t border-pink-400/20 px-4 py-8 text-center text-sm text-orange-100/70">
        <p>Built by Yash Thube. Powered by Hackotimize.</p>
        <p className="mx-auto mt-2 max-w-2xl">
          Leonida Hub is an unofficial fan-made project and is not affiliated with or endorsed by Rockstar Games or
          Take-Two Interactive. Some links are affiliate links, so we may earn a commission. Links you check here are
          not stored.
        </p>
      </footer>
    </div>
  );
}
