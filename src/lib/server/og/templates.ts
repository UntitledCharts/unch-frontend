import { h, type OgNode, type OgChildren } from "./render.js";

const FONT = "Inter, 'Noto Sans JP'";

function box(style: Record<string, unknown>, children?: OgChildren): OgNode {
  return h("div", { style: { display: "flex", ...style } }, children);
}

function svgUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const HEART = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.2C.6 9 1.5 5.5 4.5 4.5 6.4 3.9 8.4 4.6 9.6 6.1L12 9l2.4-2.9c1.2-1.5 3.2-2.2 5.1-1.6 3 1 3.9 4.5 2.5 7.3-2.5 4.3-10 9.2-10 9.2z" fill="#fca5a5"/></svg>`,
);
const CHAT = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z" fill="#cbd5e1"/></svg>`,
);

function corner(pos: "tl" | "tr" | "bl" | "br"): OgNode {
  const s: Record<string, unknown> = {
    position: "absolute",
    width: "440px",
    height: "210px",
    borderColor: "rgba(255,255,255,0.6)",
    borderStyle: "solid",
    borderWidth: "0px",
  };
  if (pos === "tl")
    Object.assign(s, { top: "30px", left: "30px", borderTopWidth: "2px", borderLeftWidth: "2px", borderTopLeftRadius: "12px" });
  if (pos === "tr")
    Object.assign(s, { top: "30px", right: "30px", borderTopWidth: "2px", borderRightWidth: "2px", borderTopRightRadius: "12px" });
  if (pos === "bl")
    Object.assign(s, { bottom: "30px", left: "30px", borderBottomWidth: "2px", borderLeftWidth: "2px", borderBottomLeftRadius: "12px" });
  if (pos === "br")
    Object.assign(s, { bottom: "30px", right: "30px", borderBottomWidth: "2px", borderRightWidth: "2px", borderBottomRightRadius: "12px" });
  return box(s);
}

function img(src: string, style: Record<string, unknown>): OgNode {
  return h("img", { src, style });
}

function rich(style: Record<string, unknown>, text: string, emojis: Record<string, string> = {}): OgNode {
  if (!/:[a-zA-Z0-9_]+:/.test(text)) return box(style, text);
  const size = parseFloat(String(style.fontSize ?? "24")) || 24;
  const words = text.split(" ").filter(Boolean);
  const gap = `${Math.round(size * 0.28)}px`;
  const px = `${Math.round(size * 1.3)}px`;
  return box({ ...style, flexWrap: "wrap", alignItems: "center" },
    words.map((w) => {
      const m = w.match(/^:([a-zA-Z0-9_]+):$/);
      if (m && emojis[m[1]]) return img(emojis[m[1]], { width: px, height: px, objectFit: "contain", marginRight: gap });
      return m ? null : box({ marginRight: gap }, w);
    }));
}

const rootStyle = {
  width: "1200px",
  height: "630px",
  position: "relative",
  flexDirection: "column",
  fontFamily: FONT,
  color: "white",
  backgroundColor: "#020617",
  overflow: "hidden",
};

export type LevelOg = {
  title: string;
  artists: string;
  author: string;
  description: string;
  emojis?: Record<string, string>;
  rating: number;
  likeCount: number;
  commentCount: number;
  staffPick: boolean;
  jacket: string | null;
  background: string | null;
  pfp: string | null;
  miku: string | null;
};

export function buildLevelOg(d: LevelOg): OgNode {
  const avatar = d.pfp
    ? img(d.pfp, { width: "56px", height: "56px", objectFit: "cover" })
    : box({ width: "56px", height: "56px", background: "#1e293b" });

  const children: OgChildren = [
    d.background ? img(d.background, { position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover", opacity: 0.4 }) : null,
    box({ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", background: "linear-gradient(120deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.82) 45%, rgba(2,6,23,0.6) 100%)" }),
    d.staffPick
      ? box({ position: "absolute", top: "54px", right: "60px", alignItems: "center", fontSize: "20px", fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "6px 16px", borderRadius: "50px", border: "2px solid rgba(251,191,36,0.6)" }, "★ Staff Pick")
      : null,

    box({ position: "absolute", top: "70px", left: "70px", width: "700px", height: "490px", flexDirection: "column", justifyContent: "center" }, [
      box({ flexDirection: "row", alignItems: "center", marginBottom: "22px" }, [
        box({ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.25)", marginRight: "16px" }, avatar),
        box({ flexDirection: "column" }, [
          rich({ fontSize: "26px", fontWeight: 700, color: "white" }, d.author, d.emojis),
          box({ fontSize: "18px", color: "#94a3b8", marginTop: "2px" }, "on UntitledCharts"),
        ]),
      ]),
      rich({ fontSize: "56px", fontWeight: 700, color: "white", lineHeight: 1.06 }, d.title, d.emojis),
      rich({ fontSize: "26px", color: "#cbd5e1", marginTop: "10px" }, d.artists, d.emojis),
      d.description
        ? rich({ fontSize: "23px", color: "#94a3b8", lineHeight: 1.35, marginTop: "18px", maxWidth: "660px" }, d.description, d.emojis)
        : null,
      box({ flexDirection: "row", alignItems: "center", marginTop: "26px" }, [
        box({ flexDirection: "row", alignItems: "center", color: "#fca5a5", fontSize: "24px", fontWeight: 600, marginRight: "32px" }, [
          img(HEART, { width: "26px", height: "26px", marginRight: "10px" }), `${d.likeCount || 0}`,
        ]),
        box({ flexDirection: "row", alignItems: "center", color: "#cbd5e1", fontSize: "24px", fontWeight: 600 }, [
          img(CHAT, { width: "26px", height: "26px", marginRight: "10px" }), `${d.commentCount || 0}`,
        ]),
      ]),
    ]),

    box({ position: "absolute", top: "165px", right: "70px", width: "300px", height: "300px", borderRadius: "28px", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)" }, [
      d.jacket
        ? img(d.jacket, { width: "300px", height: "300px", objectFit: "cover" })
        : box({ width: "300px", height: "300px", background: "#334155", alignItems: "center", justifyContent: "center", fontSize: "80px" }, "♪"),
      box({ position: "absolute", top: "12px", right: "12px", alignItems: "center", fontSize: "18px", fontWeight: 700, color: "#38bdf8", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "4px 12px" }, `Lv. ${d.rating || "?"}`),
    ]),

    box({ position: "absolute", bottom: "40px", right: "70px", flexDirection: "row", alignItems: "center" }, [
      box({ fontSize: "24px", fontStyle: "italic", color: "#38bdf8", marginRight: "14px" }, "Untitled Charts"),
      d.miku ? img(d.miku, { width: "46px", height: "46px", objectFit: "contain", opacity: 0.9 }) : null,
    ]),
  ];
  return box(rootStyle, children);
}

export type UserOg = {
  username: string;
  handle: string | number;
  role: string | null;
  bio: string;
  emojis?: Record<string, string>;
  charts: number;
  likes: number;
  comments: number;
  avatar: string | null;
  banner: string | null;
  miku: string | null;
  jackets: string[];
};

function stat(value: string, label: string): OgNode {
  return box({ flexDirection: "column", marginRight: "48px" }, [
    box({ fontSize: "42px", fontWeight: 700, color: "white", lineHeight: 1 }, value),
    box({ fontSize: "19px", color: "#94a3b8", marginTop: "8px" }, label),
  ]);
}

function compactNum(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export function buildUserOg(d: UserOg): OgNode {
  const fan = [
    { left: "0px", top: "56px", rotate: "-11deg", z: 1 },
    { left: "150px", top: "56px", rotate: "11deg", z: 2 },
    { left: "75px", top: "0px", rotate: "0deg", z: 3 },
  ];
  const order = [d.jackets[2], d.jackets[1], d.jackets[0]];

  const children: OgChildren = [
    d.banner
      ? img(d.banner, { position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover", opacity: 0.55 })
      : box({ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", background: "linear-gradient(120deg,#4c1d95,#0e7490)" }),
    box({ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", background: "linear-gradient(90deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.84) 52%, rgba(2,6,23,0.5) 100%)" }),

    box({ position: "absolute", top: 0, left: "72px", width: "660px", height: "630px", flexDirection: "column", justifyContent: "center" }, [
      box({ width: "164px", height: "164px", borderRadius: "50%", overflow: "hidden", border: "6px solid rgba(255,255,255,0.14)" },
        d.avatar ? img(d.avatar, { width: "164px", height: "164px", objectFit: "cover" }) : box({ width: "164px", height: "164px", background: "#334155" })),
      rich({ fontSize: "62px", fontWeight: 700, color: "white", lineHeight: 1.05, marginTop: "26px" }, d.username, d.emojis),
      box({ flexDirection: "row", alignItems: "center", marginTop: "10px" }, [
        box({ fontSize: "26px", color: "#94a3b8" }, `#${d.handle}`),
        d.role
          ? box({ marginLeft: "14px", fontSize: "18px", fontWeight: 700, color: "#c4b5fd", background: "rgba(139,92,246,0.18)", border: "1px solid rgba(167,139,250,0.45)", borderRadius: "8px", padding: "3px 10px" }, d.role)
          : null,
      ]),
      d.bio ? rich({ fontSize: "23px", color: "#cbd5e1", lineHeight: 1.35, marginTop: "16px", maxWidth: "600px" }, d.bio, d.emojis) : null,
      box({ flexDirection: "row", marginTop: "34px" }, [
        stat(compactNum(d.charts), d.charts === 1 ? "chart" : "charts"),
        stat(compactNum(d.likes), d.likes === 1 ? "like" : "likes"),
        stat(compactNum(d.comments), d.comments === 1 ? "comment" : "comments"),
      ]),
    ]),

    d.jackets.length
      ? box({ position: "absolute", top: "150px", right: "84px", width: "380px", height: "300px" },
          fan
            .map((f, i) => (order[i]
              ? box({ position: "absolute", left: f.left, top: f.top, width: "230px", height: "230px", borderRadius: "26px", overflow: "hidden", transform: `rotate(${f.rotate})`, border: "3px solid rgba(255,255,255,0.18)", boxShadow: "0 24px 50px rgba(0,0,0,0.55)" },
                  img(order[i] as string, { width: "230px", height: "230px", objectFit: "cover" }))
              : null)))
      : null,

    box({ position: "absolute", bottom: "40px", right: "72px", flexDirection: "row", alignItems: "center" }, [
      box({ fontSize: "24px", fontStyle: "italic", color: "#38bdf8", marginRight: "14px" }, "Untitled Charts"),
      d.miku ? img(d.miku, { width: "46px", height: "46px", objectFit: "contain", opacity: 0.9 }) : null,
    ]),
  ];
  return box(rootStyle, children);
}

export type GenericOg = {
  title: string;
  subtitle: string;
  // home has no title of its own, so the wordmark becomes the headline
  isHome: boolean;
  logo: string;
  miku: string;
  jackets: string[];
};

export function buildGenericOg(d: GenericOg): OgNode {
  const fan = [
    { left: "0px", top: "70px", rotate: "-12deg" },
    { left: "170px", top: "70px", rotate: "12deg" },
    { left: "85px", top: "0px", rotate: "0deg" },
  ];
  const order = [d.jackets[2], d.jackets[1], d.jackets[0]];
  const wordmark = (size: string) =>
    box({ flexDirection: "row", alignItems: "center" }, [
      img(d.logo, { width: size, height: size, objectFit: "contain", marginRight: "18px" }),
      box({ fontFamily: "Unbounded", fontSize: size, fontWeight: 700, letterSpacing: "-1px" }, "UntitledCharts"),
    ]);

  const children: OgChildren = [
    box({
      position: "absolute",
      top: 0,
      left: 0,
      width: "1200px",
      height: "630px",
      background:
        "radial-gradient(circle at 12% 18%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 88% 85%, rgba(57,197,187,0.28), transparent 45%)",
    }),

    box({ position: "absolute", top: 0, left: "80px", width: d.jackets.length ? "620px" : "1040px", height: "630px", flexDirection: "column", justifyContent: "center" }, [
      d.isHome ? wordmark("58px") : wordmark("30px"),
      d.isHome ? null : box({ fontFamily: "Unbounded", fontSize: "60px", fontWeight: 700, lineHeight: 1.1, marginTop: "26px" }, d.title),
      box({ width: "84px", height: "6px", borderRadius: "3px", background: "linear-gradient(90deg,#3b82f6,#39c5bb)", marginTop: "30px" }),
      box({ fontSize: "30px", color: "#a5b8cf", lineHeight: 1.35, marginTop: "26px", maxWidth: "560px", textWrap: "balance" }, d.subtitle),
    ]),

    d.jackets.length
      ? box({ position: "absolute", top: "150px", right: "90px", width: "400px", height: "320px" },
          fan.map((f, i) =>
            order[i]
              ? box({ position: "absolute", left: f.left, top: f.top, width: "230px", height: "230px", borderRadius: "30px", overflow: "hidden", transform: `rotate(${f.rotate})`, border: "3px solid rgba(255,255,255,0.16)", boxShadow: "0 24px 50px rgba(0,0,0,0.55)" },
                  img(order[i] as string, { width: "230px", height: "230px", objectFit: "cover" }))
              : null,
          ))
      : null,

    img(d.miku, { position: "absolute", bottom: "34px", right: "40px", width: "56px", height: "56px", objectFit: "contain" }),
  ];
  return box({ ...rootStyle, background: "linear-gradient(135deg,#06101d 0%,#0a1728 55%,#0a2430 100%)" }, children);
}
