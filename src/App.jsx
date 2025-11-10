import React, { useEffect, useMemo, useState } from "react";

/* ====================== Pagalbinės ====================== */
const todayStr = () => new Date().toISOString().slice(0, 10);
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  }, [key, v]);
  return [v, setV];
}

const defaultGoals = { steps: 8000, waterMl: 1500, screenLimitMin: 120, sleepHours: 8 };
const newDay = () => ({
  date: todayStr(),
  steps: 0,
  waterMl: 0,
  screenMin: 0,
  sleepHours: 0,
  focusSessions: [],
  points: 0,
  team: "IIIa", // gimnazijos pavyzdys
});

/* ===== Aiškūs, taisyklingi pasiūlymai vietoj ekranų ===== */
const IDEAS = [
  "Padaryk 100 žingsnių po klasę ar koridorių.",
  "Kvėpuok 4–7–8 metodu (3 kartus).",
  "Skirk 5 minutes tempimo pratimams.",
  "Išgerk stiklinę vandens ir padaryk 20 pritūpimų.",
  "Perskaityk 5 puslapius knygos.",
  "2 minutes varyk arba perduok kamuolį.",
  "Atlik 60 sąmoningų įkvėpimų ir iškvėpimų.",
  "Padaryk 10 atsispaudimų (gali būti į sieną).",
  "Per 2 minutes susitvarkyk darbo vietą.",
  "Užrašyk 3 dalykus, už kuriuos šiandien esi dėkingas.",
];
const randomIdea = () => IDEAS[Math.floor(Math.random() * IDEAS.length)];

/* ====================== Dienos iššūkis ====================== */
const CHALLENGES = [
  { text: "Surink bent 6 000 žingsnių.", points: 3 },
  { text: "Išgerk 8 stiklines vandens (≈ 1,6 l).", points: 3 },
  { text: "30 minučių be ekranų vienu kartu.", points: 3 },
  { text: "Eik miegoti 30 min anksčiau nei įprastai.", points: 3 },
  { text: "Padaryk 3 gerus darbus/gestus kitiems.", points: 3 },
  { text: "5 minutes kvėpavimo pratimų dienos metu.", points: 3 },
  { text: "15 minučių aktyvios veiklos lauke.", points: 3 },
];
function getChallengeByDate(dateStr) {
  const n = parseInt(dateStr.replaceAll("-", ""), 10);
  const idx = n % CHALLENGES.length;
  return { ...CHALLENGES[idx], date: dateStr, done: false };
}

/* ====================== Mažos UI dalys ====================== */
const Tag = ({ children }) => <span className="pill">{children}</span>;

const H = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between mb-2">
    <div>
      <div className="text-base font-semibold">{title}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
    {right}
  </div>
);

const Stat = ({ label, value, unit, pct }) => (
  <div className="card">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-2xl font-bold mt-1">
      {value}
      {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
    </div>
    {typeof pct === "number" && (
      <div className="mt-3">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-2 bg-brand-600 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          {Math.round(Math.min(100, Math.max(0, pct)))}% tikslo
        </div>
      </div>
    )}
  </div>
);

/* ===== Paprastas SVG bar chart paskutinėms 7 dienoms ===== */
function Bars({ values, max = 1, labels = [] }) {
  const m = Math.max(max, ...values, 1);
  return (
    <svg viewBox="0 0 120 40" className="w-full">
      {values.map((v, i) => {
        const h = 30 * (v / m);
        const x = 10 + i * 15;
        const y = 35 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width="10" height={h} rx="2" className="fill-brand-600/80"></rect>
            <text x={x + 5} y="38" textAnchor="middle" fontSize="3" className="fill-gray-500">
              {labels[i] || ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ====================== Pagrindinė aplikacija ====================== */
export default function App() {
  const [tab, setTab] = useState("home");
  const [goals, setGoals] = useLS("goals", defaultGoals);
  const [today, setToday] = useLS("today", newDay());
  const [notes, setNotes] = useLS("notes", "");
  const [leaders, setLeaders] = useLS("leaders", [
    { team: "IIIa", points: 0 },
    { team: "IIf", points: 0 },
    { team: "Ia", points: 0 },
  ]);
  const [history, setHistory] = useLS("history", {});
  const [badges, setBadges] = useLS("badges", []);
  const [streak, setStreak] = useLS("streak", 0);
  const [challenge, setChallenge] = useLS("dailyChallenge", getChallengeByDate(todayStr()));

  // nauja diena
  useEffect(() => {
    if (today.date !== todayStr()) setToday(newDay());
  }, []);

  // jei pasikeitė diena – naujas dienos iššūkis
  useEffect(() => {
    if (challenge.date !== today.date) setChallenge(getChallengeByDate(today.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.date]);

  // jei šiandienos komandos nėra lyderių sąraše – įterpti
  useEffect(() => {
    setLeaders((list) => {
      const name = (today.team || "").trim();
      if (!name) return list;
      const exists = list.some((x) => (x.team || "").toLowerCase() === name.toLowerCase());
      return exists ? list : [...list, { team: name, points: 0 }];
    });
  }, [today.team, setLeaders]);

  // procentai
  const pct = useMemo(
    () => ({
      steps: (today.steps / (goals.steps || 1)) * 100,
      water: (today.waterMl / (goals.waterMl || 1)) * 100,
      screen: (today.screenMin / (goals.screenLimitMin || 1)) * 100,
      sleep: (today.sleepHours / (goals.sleepHours || 1)) * 100,
    }),
    [today, goals]
  );

  // bendras taškų suteikimas (pridės ir komandai; jei jos
