import React, { useEffect, useMemo, useState } from "react";

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

const defaultGoals = {
  steps: 8000,
  waterMl: 1500,
  screenLimitMin: 120,
  sleepHours: 8,
};

const defaultState = {
  date: new Date().toISOString().slice(0, 10),
  steps: 0,
  waterMl: 0,
  screenMin: 0,
  sleepHours: 0,
  joinedChallenges: [],
  focusSessions: [], // {start, minutes}
  points: 0,
  team: "Mano klasė",
};

const challengesSeed = [
  { id: "ch1", title: "10 000 žingsnių savaitę", desc: "Kasdien pasiek 10k žingsnių.", points: 10 },
  { id: "ch2", title: "Vandens iššūkis", desc: "Išgerk ≥ 2 l vandens kasdien.", points: 10 },
  { id: "ch3", title: "Laikas be ekranų po 21:00", desc: "Vakarais rinkis veiklas be ekranų.", points: 10 },
];

const alternatives = [
  { t: "5", mood: "energija", label: "5 min tempimo/sąnarių mankšta" },
  { t: "5", mood: "ramybe", label: "Kvėpavimo 4-7-8 pratimas" },
  { t: "15", mood: "energija", label: "Greitas pasivaikščiojimas lauke" },
  { t: "15", mood: "social", label: "Stalo žaidimo raundas su šeima" },
  { t: "30", mood: "ramybe", label: "Knyga arba dienoraštis" },
  { t: "30", mood: "social", label: "Pagalba namuose: sutvarkyk stalą/kuprinę" },
  { t: "30+", mood: "energija", label: "Futbolo/mėgstamas sportas kieme" },
];

function StatCard({ label, value, unit, pct }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}{unit ? <span className="text-base font-normal ml-1">{unit}</span> : null}</div>
      {typeof pct === 'number' && (
        <div className="mt-3">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">{Math.round(Math.min(100, Math.max(0, pct)))}% tikslo</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PrimaryButton({ children, ...rest }) {
  return (
    <button {...rest} className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition">
      {children}
    </button>
  );
}

function OutlineButton({ children, ...rest }) {
  return (
    <button {...rest} className="px-4 py-2 rounded-xl border hover:bg-gray-50 active:scale-[0.99] transition">
      {children}
    </button>
  );
}

function MobileShell({ children, activeTab, setActiveTab }) {
  const tabs = [
    { id: "home", label: "Pradžia" },
    { id: "goals", label: "Tikslai" },
    { id: "focus", label: "Be ekranų" },
    { id: "challenges", label: "Iššūkiai" },
    { id: "leaders", label: "Lyderiai" },
    { id: "notes", label: "Užrašai" },
  ];
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border bg-white p-4 shadow-xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Sveikas įprotis</h1>
            <p className="text-xs text-gray-500">Prototipas (hakatonas)</p>
          </div>
          <span className="text-xs text-gray-400">v0.2 (PWA)</span>
        </header>
        <div className="mt-4">{children}</div>
        <nav className="mt-6 grid grid-cols-6 gap-1 text-sm">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl py-2 ${activeTab === t.id ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <p className="mt-3 text-center text-xs text-gray-500">PWA: gali pridėti prie telefono kaip programėlę. Duomenys saugomi tik šiame įrenginyje.</p>
    </div>
  );
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [goals, setGoals] = useLocalStorage("goals", defaultGoals);
  const [today, setToday] = useLocalStorage("today", defaultState);
  const [notes, setNotes] = useLocalStorage("notes", "");
  const [availableChallenges] = useState(challengesSeed);
  const [leaders, setLeaders] = useLocalStorage("leaders", [
    { team: "1A", points: 0 },
    { team: "1B", points: 0 },
    { team: "Mokytojai", points: 0 },
  ]);

  useEffect(() => {
    const now = new Date().toISOString().slice(0, 10);
    if (today.date !== now) setToday({ ...defaultState, date: now, team: today.team });
  }, []); // eslint-disable-line

  const pct = useMemo(() => ({
    steps: (today.steps / (goals.steps || 1)) * 100,
    water: (today.waterMl / (goals.waterMl || 1)) * 100,
    screen: (today.screenMin / (goals.screenLimitMin || 1)) * 100,
    sleep: (today.sleepHours / (goals.sleepHours || 1)) * 100,
  }), [today, goals]);

  const addWater = (ml) => setToday(t => ({ ...t, waterMl: Math.max(0, t.waterMl + ml) }));
  const addSteps = (n) => setToday(t => ({ ...t, steps: Math.max(0, t.steps + n) }));
  const addScreen = (min) => setToday(t => ({ ...t, screenMin: Math.max(0, t.screenMin + min) }));
  const setSleep = (h) => setToday(t => ({ ...t, sleepHours: Math.max(0, h) }));
  const resetToday = () => setToday({ ...defaultState, date: new Date().toISOString().slice(0,10), team: today.team });

  // Points calculation helpers
  const award = (p, reason) => {
    setToday(t => ({ ...t, points: t.points + p }));
    setLeaders(arr => arr.map(x => x.team === today.team ? { ...x, points: x.points + p } : x));
  };

  const claimDailyGoals = () => {
    let gained = 0;
    if (today.steps >= goals.steps) gained += 5;
    if (today.waterMl >= goals.waterMl) gained += 5;
    if (today.sleepHours >= goals.sleepHours) gained += 5;
    if (today.screenMin <= goals.screenLimitMin) gained += 5;
    if (gained > 0) award(gained, "Dienos tikslai");
    alert(`Suteikta ${gained} taškų už dienos tikslus.`);
  };

  // Focus (no-screen) timer
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusStart, setFocusStart] = useState(null);
  const [focusElapsed, setFocusElapsed] = useState(0);
  useEffect(() => {
    let id;
    if (focusRunning) {
      id = setInterval(() => setFocusElapsed(Math.floor((Date.now() - focusStart) / 60000)), 1000);
    }
    return () => clearInterval(id);
  }, [focusRunning, focusStart]);

  const startFocus = () => { setFocusStart(Date.now()); setFocusElapsed(0); setFocusRunning(true); };
  const stopFocus = () => {
    setFocusRunning(false);
    const minutes = Math.max(1, Math.floor((Date.now() - focusStart) / 60000));
    setToday(t => ({ ...t, focusSessions: [...t.focusSessions, { start: new Date().toISOString(), minutes }] }));
    const bonus = Math.floor(minutes / 10); // 1 taškas kas 10 min.
    if (bonus > 0) award(bonus, "Fokusas be ekranų");
  };

  const totalFocus = today.focusSessions.reduce((a,b) => a + b.minutes, 0);

  // Alternatives filter
  const [fltTime, setFltTime] = useState("all");
  const [fltMood, setFltMood] = useState("all");
  const filteredAlt = alternatives.filter(a =>
    (fltTime === "all" || a.t === fltTime) &&
    (fltMood === "all" || a.mood === fltMood)
  );

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["Data","Komanda","Žingsniai","Vanduo (ml)","Ekranas (min)","Miegas (val.)","Fokusas (min)","Taškai"],
      [today.date, today.team, today.steps, today.waterMl, today.screenMin, today.sleepHours, totalFocus, today.points],
      [],
      ["Fokusavimo sesijos"],
      ["Pradžia","Minutės"],
      ...today.focusSessions.map(s => [s.start, s.minutes])
    ];
    downloadCSV(`sveikas-iprotis-${today.date}.csv`, rows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <MobileShell activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === "home" && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Žingsniai šiandien" value={today.steps} unit="" pct={pct.steps} />
              <StatCard label="Vanduo" value={today.waterMl} unit="ml" pct={pct.water} />
              <StatCard label="Ekrano laikas" value={today.screenMin} unit="min" pct={pct.screen} />
              <StatCard label="Miegas" value={today.sleepHours} unit="val." pct={pct.sleep} />
            </div>

            <Section title="Greiti veiksmai" subtitle="Rink taškus už progresą.">
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={() => addSteps(500)}>+500 žingsnių</PrimaryButton>
                <PrimaryButton onClick={() => addSteps(1000)}>+1000 žingsnių</PrimaryButton>
                <OutlineButton onClick={() => addWater(250)}>+250 ml</OutlineButton>
                <OutlineButton onClick={() => addWater(500)}>+500 ml</OutlineButton>
                <OutlineButton onClick={() => addScreen(15)}>+15 min ekranui</OutlineButton>
                <OutlineButton onClick={() => award(1, 'Rankinis taškas')}>+1 taškas</OutlineButton>
                <OutlineButton onClick={claimDailyGoals}>„Check“ dienos tikslus</OutlineButton>
                <OutlineButton onClick={exportCSV}>Eksportuoti CSV</OutlineButton>
              </div>
            </Section>

            <Section title="Miegas" subtitle="Įrašyk, kiek miegojai">
              <div className="flex items-center gap-3">
                <input type="number" className="w-28 rounded-xl border px-3 py-2" value={today.sleepHours}
                  onChange={(e) => setSleep(parseFloat(e.target.value || 0))} min={0} step={0.5} />
                <span className="text-sm text-gray-600">valandų</span>
              </div>
            </Section>

            <Section title="Komanda ir taškai" action={<OutlineButton onClick={resetToday}>Nauja diena</OutlineButton>}>
              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="text-sm text-gray-700">Mano komanda/klasė</label>
                <input className="rounded-xl border px-3 py-2" value={today.team}
                  onChange={(e)=>setToday(t=>({...t, team: e.target.value}))}/>
                <label className="text-sm text-gray-700">Surinkta taškų šiandien</label>
                <div className="rounded-xl border px-3 py-2 bg-gray-50">{today.points}</div>
              </div>
              <div className="text-sm text-gray-600 mt-2">Data: {today.date}</div>
            </Section>
          </div>
        )}

        {activeTab === "goals" && (
          <div>
            <Section title="Asmeniniai tikslai" subtitle="Nustatyk rėžius ir tikslus.">
              <div className="grid gap-3">
                <label className="grid grid-cols-[160px,1fr] items-center gap-3">
                  <span className="text-sm text-gray-700">Žingsniai/diena</span>
                  <input type="number" className="rounded-xl border px-3 py-2" value={goals.steps}
                         onChange={(e)=>setGoals(g=>({...g, steps: parseInt(e.target.value||0)}))} />
                </label>
                <label className="grid grid-cols-[160px,1fr] items-center gap-3">
                  <span className="text-sm text-gray-700">Vanduo (ml)</span>
                  <input type="number" className="rounded-xl border px-3 py-2" value={goals.waterMl}
                         onChange={(e)=>setGoals(g=>({...g, waterMl: parseInt(e.target.value||0)}))} />
                </label>
                <label className="grid grid-cols-[160px,1fr] items-center gap-3">
                  <span className="text-sm text-gray-700">Ekranas (min/d.)</span>
                  <input type="number" className="rounded-xl border px-3 py-2" value={goals.screenLimitMin}
                         onChange={(e)=>setGoals(g=>({...g, screenLimitMin: parseInt(e.target.value||0)}))} />
                </label>
                <label className="grid grid-cols-[160px,1fr] items-center gap-3">
                  <span className="text-sm text-gray-700">Miegas (val.)</span>
                  <input type="number" className="rounded-xl border px-3 py-2" value={goals.sleepHours}
                         onChange={(e)=>setGoals(g=>({...g, sleepHours: parseFloat(e.target.value||0)}))} step={0.5} />
                </label>
              </div>
            </Section>

            <Section title="Santrauka">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Žingsniai" value={`${today.steps}/${goals.steps}`} />
                <StatCard label="Vanduo (ml)" value={`${today.waterMl}/${goals.waterMl}`} />
                <StatCard label="Ekranas (min)" value={`${today.screenMin}/${goals.screenLimitMin}`} />
                <StatCard label="Miegas (val.)" value={`${today.sleepHours}/${goals.sleepHours}`} />
              </div>
            </Section>
          </div>
        )}

        {activeTab === "focus" && (
          <div>
            <Section title="Laikas be ekranų" subtitle="Įjunk fokusą ir rinkis sveikas alternatyvas.">
              <div className="rounded-2xl border p-4 flex flex-col items-center text-center">
                <div className="text-5xl font-bold">{focusRunning ? `${focusElapsed} min` : `${totalFocus} min`}</div>
                <div className="text-sm text-gray-500 mt-1">{focusRunning ? "Vyksta fokusas" : "Sukaupta šiandien"}</div>
                <div className="mt-4 flex gap-2">
                  {!focusRunning ? (
                    <PrimaryButton onClick={startFocus}>Pradėti</PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={stopFocus}>Baigti</PrimaryButton>
                  )}
                  <OutlineButton onClick={() => alert('Idėja: ' + (filteredAlt[0]?.label || 'Pailsėk trumpai!'))}>Ką veikti vietoj?</OutlineButton>
                </div>
              </div>
            </Section>

            <Section title="Filtruok idėjas">
              <div className="grid grid-cols-2 gap-2">
                <select className="rounded-xl border px-3 py-2" value={fltTime} onChange={e=>setFltTime(e.target.value)}>
                  <option value="all">Trukmė (visos)</option>
                  <option value="5">~5 min</option>
                  <option value="15">~15 min</option>
                  <option value="30">~30 min</option>
                  <option value="30+">30+ min</option>
                </select>
                <select className="rounded-xl border px-3 py-2" value={fltMood} onChange={e=>setFltMood(e.target.value)}>
                  <option value="all">Nuotaika (visos)</option>
                  <option value="energija">Energija</option>
                  <option value="ramybe">Ramybė</option>
                  <option value="social">Drauge</option>
                </select>
              </div>
              <div className="grid gap-2 mt-3">
                {filteredAlt.map((a, i) => (
                  <div key={i} className="rounded-xl border p-3 text-sm bg-gray-50">• {a.label}</div>
                ))}
                {filteredAlt.length===0 && <div className="text-sm text-gray-500">Nėra atitinkančių idėjų.</div>}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "challenges" && (
          <div>
            <Section title="Iššūkiai" subtitle="Prisijunk ir gauk taškų.">
              <div className="grid gap-3">
                {availableChallenges.map(ch => {
                  const joined = today.joinedChallenges.includes(ch.id);
                  return (
                    <div key={ch.id} className="rounded-2xl border p-4 bg-white flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{ch.title}</div>
                        <div className="text-sm text-gray-600">{ch.desc}</div>
                        <div className="text-xs text-gray-500 mt-1">Įvykdęs gauk +{ch.points} taškų</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setToday(t => ({
                            ...t,
                            joinedChallenges: joined
                              ? t.joinedChallenges.filter(id => id !== ch.id)
                              : [...t.joinedChallenges, ch.id]
                          }))}
                          className={`px-3 py-2 rounded-xl text-sm ${joined ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                          {joined ? 'Prisijungta' : 'Prisijungti'}
                        </button>
                        <button
                          onClick={() => award(ch.points, ch.title)}
                          className="px-3 py-2 rounded-xl text-sm bg-black text-white"
                        >
                          +{ch.points}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "leaders" && (
          <div>
            <Section title="Lyderių lentelė" subtitle="Komandų (klasių) taškai šiame įrenginyje.">
              <div className="rounded-2xl border p-4">
                <div className="flex gap-2 mb-3">
                  <input className="rounded-xl border px-3 py-2 flex-1" placeholder="Nauja komanda (pvz., 2C)" id="newTeam" />
                  <PrimaryButton onClick={() => {
                    const el = document.getElementById('newTeam');
                    if (el.value.trim()) { setLeaders(arr => [...arr, { team: el.value.trim(), points: 0 }]); el.value=''; }
                  }}>Pridėti</PrimaryButton>
                </div>
                {[...leaders].sort((a,b)=>b.points-a.points).map((l, i)=>(
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="font-medium">{i+1}. {l.team}</div>
                    <div className="text-sm">{l.points} taškai</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <Section title="Užrašai / planas" subtitle="Idėjos, ataskaitoms reikalingos pastabos, meniu planas ir pan.">
              <textarea className="w-full min-h-[180px] rounded-2xl border p-3" placeholder="Parašyk pastabas čia..." value={notes} onChange={(e)=>setNotes(e.target.value)} />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Automatiškai išsaugoma.</span>
                <span>{notes.length} simbolių</span>
              </div>
            </Section>
          </div>
        )}
      </MobileShell>
    </div>
  );
}
