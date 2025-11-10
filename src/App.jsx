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
  team: "Mano klasė",
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
    { team: "1A", points: 0 },
    { team: "1B", points: 0 },
    { team: "Mokytojai", points: 0 },
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

  // bendras taškų suteikimas (naudojamas visur)
  const award = (p, reason = "") => {
    setToday((t) => ({ ...t, points: t.points + p }));
    setLeaders((arr) =>
      arr.map((x) => (x.team === today.team ? { ...x, points: x.points + p } : x))
    );
    if (reason) console.log(`+${p} taškai: ${reason}`);
  };

  // išsaugoti dieną
  const saveDay = () => {
    setHistory((h) => ({
      ...h,
      [today.date]: {
        steps: today.steps,
        waterMl: today.waterMl,
        screenMin: today.screenMin,
        sleepHours: today.sleepHours,
        points: today.points,
      },
    }));

    const allOk =
      today.steps >= goals.steps &&
      today.waterMl >= goals.waterMl &&
      today.sleepHours >= goals.sleepHours &&
      today.screenMin <= goals.screenLimitMin;

    setStreak((s) => (allOk ? s + 1 : 0));
    if (allOk) {
      award(5, "Įvykdyti visi dienos tikslai");
      const gained = [];
      if (today.steps >= 10000) gained.push("10 000 žingsnių ✨");
      if (today.waterMl >= 2000) gained.push("2 l vandens 💧");
      if (today.screenMin <= 60) gained.push("Mažiau nei 1 val. ekranų 📵");
      if (today.sleepHours >= 8) gained.push("8 val. miego 😴");
      if (gained.length) setBadges((b) => [...b, ...gained]);
      alert(`Išsaugota! Streak: ${streak + 1} d. +5 taškų.`);
    } else {
      alert("Išsaugota. Ne visi tikslai pasiekti – streak atstatytas.");
    }

    setToday((d) => ({ ...newDay(), team: d.team }));
  };

  // grafikas
  const weekKeys = Object.keys(history).sort().slice(-7);
  const weekSteps = weekKeys.map((k) => history[k].steps || 0);

  const Btn = ({ children, onClick, kind = "primary" }) => (
    <button onClick={onClick} className={kind === "primary" ? "btn-primary" : "btn-ghost"}>
      {children}
    </button>
  );

  // automatinis perspėjimas: viršytas ekrano limitas
  const overScreen = today.screenMin > goals.screenLimitMin;
  const [idea, setIdea] = useState(randomIdea());
  useEffect(() => {
    if (overScreen) setIdea(randomIdea());
  }, [overScreen]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-sky-50 to-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">Sveikas įprotis</div>
            <div className="text-xs text-gray-500">Prototipas • v0.3.1 • PWA</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{today.team}</div>
            <div className="text-xs text-gray-500">Taškai: {today.points}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["home", "focus", "goals", "leaders", "badges", "notes"].map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl py-2 text-sm ${
                tab === t ? "bg-brand-600 text-white" : "bg-white border hover:bg-sky-50"
              }`}
            >
              {["Pradžia", "Be ekranų", "Tikslai", "Lyderiai", "Ženkliukai", "Užrašai"][i]}
            </button>
          ))}
        </div>

        {tab === "home" && (
          <div className="space-y-4">
            {/* Perspėjimas dėl ekranų */}
            {overScreen && (
              <div className="card border-brand-100">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📵</div>
                  <div className="flex-1">
                    <div className="font-semibold">Per daug laiko prie ekrano</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Pasiūlymas: <span className="font-medium">{idea}</span>
                    </div>
                    <div className="mt-2">
                      <button className="btn-primary" onClick={() => setTab("focus")}>
                        Eiti į „Be ekranų“
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dienos iššūkis */}
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <div className="font-semibold">Dienos iššūkis</div>
                  <div className="text-sm text-gray-600 mt-1">{challenge.text}</div>
                  {!challenge.done ? (
                    <button
                      className="btn-primary mt-2"
                      onClick={() => {
                        award(challenge.points, "Dienos iššūkis");
                        setChallenge((c) => ({ ...c, done: true }));
                        alert(`Puiku! Įvykdei dienos iššūkį. +${challenge.points} tašk.`);
                      }}
                    >
                      Pažymėti įvykdytą (+{challenge.points} tšk.)
                    </button>
                  ) : (
                    <div className="mt-2 text-sm text-brand-700">✔ Įvykdyta! Taškai jau pridėti.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistika */}
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Žingsniai šiandien" value={today.steps} pct={pct.steps} />
              <Stat label="Vanduo" value={today.waterMl} unit="ml" pct={pct.water} />
              <Stat label="Ekrano laikas" value={today.screenMin} unit="min" pct={pct.screen} />
              <Stat label="Miegas" value={today.sleepHours} unit="val." pct={pct.sleep} />
            </div>

            {/* Greiti veiksmai */}
            <div className="card">
              <H title="Greiti veiksmai" subtitle="Progresas ir taškai." />
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => setToday((t) => ({ ...t, steps: t.steps + 500 }))}>+500 žingsnių</Btn>
                <Btn onClick={() => setToday((t) => ({ ...t, steps: t.steps + 1000 }))}>
                  +1000 žingsnių
                </Btn>
                <Btn kind="ghost" onClick={() => setToday((t) => ({ ...t, waterMl: t.waterMl + 250 }))}>
                  +250 ml
                </Btn>
                <Btn kind="ghost" onClick={() => setToday((t) => ({ ...t, waterMl: t.waterMl + 500 }))}>
                  +500 ml
                </Btn>
                <Btn kind="ghost" onClick={() => setToday((t) => ({ ...t, screenMin: t.screenMin + 15 }))}>
                  +15 min ekranui
                </Btn>
                <Btn kind="ghost" onClick={() => award(1, "Rankinis +1 taškas")}>+1 taškas</Btn>
              </div>
            </div>

            {/* Miegas */}
            <div className="card">
              <H title="Miegas" subtitle="Kiek miegojai?" />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="rounded-xl border px-3 py-2 w-28"
                  value={today.sleepHours}
                  min={0}
                  step={0.5}
                  onChange={(e) =>
                    setToday((t) => ({ ...t, sleepHours: parseFloat(e.target.value || 0) }))
                  }
                />
                <span className="text-sm text-gray-600">val.</span>
                <div className="ml-auto text-xs text-gray-500">
                  Streak: <b>{streak}</b> d.
                </div>
              </div>
            </div>

            {/* Grafikas */}
            <div className="card">
              <H
                title="Savaitės žingsniai"
                subtitle="Paskutinės 7 dienos"
                right={<Tag>{weekKeys.length} d.</Tag>}
              />
              <Bars values={weekSteps} labels={weekKeys.map((k) => k.slice(5))} />
            </div>

            <div className="flex gap-2">
              <Btn onClick={saveDay}>Išsaugoti dieną</Btn>
              <Btn kind="ghost" onClick={() => setToday(newDay())}>Nauja diena</Btn>
            </div>
          </div>
        )}

        {tab === "focus" && <FocusTab today={today} setToday={setToday} award={award} />}

        {tab === "goals" && (
          <div className="space-y-4">
            <div className="card">
              <H title="Asmeniniai tikslai" subtitle="Keisk pagal poreikį." />
              {["steps", "waterMl", "screenLimitMin", "sleepHours"].map((k, i) => {
                const labels = ["Žingsniai/d.", "Vanduo (ml)", "Ekranas (min/d.)", "Miegas (val.)"];
                const step = i === 3 ? 0.5 : 1;
                return (
                  <label key={k} className="grid grid-cols-[150px,1fr] items-center gap-3 py-1">
                    <span className="text-sm text-gray-700">{labels[i]}</span>
                    <input
                      type="number"
                      step={step}
                      className="rounded-xl border px-3 py-2"
                      value={goals[k]}
                      onChange={(e) =>
                        setGoals((g) => ({
                          ...g,
                          [k]:
                            i === 3
                              ? parseFloat(e.target.value || 0)
                              : parseInt(e.target.value || 0),
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>

            <div className="card">
              <H title="Komanda" />
              <div className="grid grid-cols-2 gap-3 items-center">
                <span className="text-sm text-gray-700">Mano komanda / klasė</span>
                <input
                  className="rounded-xl border px-3 py-2"
                  value={today.team}
                  onChange={(e) => setToday((t) => ({ ...t, team: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "leaders" && (
          <div className="space-y-3">
            <div className="card">
              <H title="Lyderių lentelė" subtitle="Šiame įrenginyje" />
              <div className="flex gap-2 mb-2">
                <input
                  id="newTeam"
                  placeholder="Nauja komanda (pvz., 2C)"
                  className="rounded-xl border px-3 py-2 flex-1"
                />
                <button
                  className="btn-ghost"
                  onClick={() => {
                    const el = document.getElementById("newTeam");
                    if (el.value.trim()) {
                      setLeaders((a) => [...a, { team: el.value.trim(), points: 0 }]);
                      el.value = "";
                    }
                  }}
                >
                  Pridėti
                </button>
              </div>
              {[...leaders].sort((a, b) => b.points - a.points).map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="font-medium">
                    {i + 1}. {l.team}
                  </div>
                  <div className="text-sm">{l.points} taškai</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "badges" && (
          <div className="card">
            <H title="Ženkliukai" subtitle="Motyvaciniai pasiekimai" right={<Tag>{badges.length}</Tag>} />
            {badges.length ? (
              <div className="grid grid-cols-2 gap-2">
                {badges.map((b, i) => (
                  <div key={i} className="rounded-xl border p-3 bg-white text-sm">
                    🏅 {b}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Kol kas nėra – pasiek tikslus ir gauk!</div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="card">
            <H title="Užrašai / planas" subtitle="Automatiškai išsaugoma" />
            <textarea
              className="w-full min-h-[180px] rounded-2xl border p-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Idėjos, pastabos, ataskaitų užrašai..."
            />
            <div className="text-xs text-gray-500 mt-1 text-right">{notes.length} simbolių</div>
          </div>
        )}

        <footer className="text-center text-xs text-gray-500 mt-6">
          Duomenys saugomi tik šiame įrenginyje (localStorage). 🧠 PWA: pridėk prie pagrindinio ekrano.
        </footer>
      </div>
    </div>
  );
}

/* ====================== Be ekranų (laikmatis) ====================== */
function FocusTab({ today, setToday, award }) {
  const [running, setRunning] = useState(false);
  const [start, setStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let id;
    if (running) {
      id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 60000)); // min
      }, 1000);
    }
    return () => clearInterval(id);
  }, [running, start]);

  const startTimer = () => {
    setStart(Date.now());
    setElapsed(0);
    setRunning(true);
  };

  const finish = () => {
    setRunning(false);
    const minutes = Math.max(1, Math.floor((Date.now() - start) / 60000));
    const gained = Math.floor(minutes / 10); // +1 tšk kas 10 min
    if (gained > 0) award(gained, "Laikas be ekranų");
    setToday((t) => ({
      ...t,
      focusSessions: [...t.focusSessions, { start: new Date().toISOString(), minutes }],
    }));
    alert(`Puiku! Be ekranų: ${minutes} min. Gavai +${gained} tašk.`);
  };

  return (
    <div className="space-y-4">
      <div className="card text-center">
        <H title="Laikas be ekranų" subtitle="+1 taškas kas 10 min." />
        <div className="text-5xl font-extrabold">{running ? `${elapsed} min` : "0 min"}</div>
        <div className="mt-3 flex justify-center gap-2">
          {!running ? (
            <button className="btn-primary" onClick={startTimer}>
              Pradėti
            </button>
          ) : (
            <button className="btn-primary" onClick={finish}>
              Baigti
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <H title="Idėjos vietoj ekranų" />
        <div className="grid gap-2 text-sm">
          {IDEAS.map((x, i) => (
            <div key={i} className="rounded-xl border p-3 bg-white">
              • {x}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====================== Pagalbiniai mygtukai ====================== */
function Btn({ children, onClick, kind = "primary" }) {
  return (
    <button onClick={onClick} className={kind === "primary" ? "btn-primary" : "btn-ghost"}>
      {children}
    </button>
  );
}
