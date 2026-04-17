"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Calendar, Download, MapPin, Plus, UploadCloud } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAppState } from "@/lib/store/app-state";
import type { PerformanceArea, PerformanceEntryInput, PerformanceEntry, PerformanceDefinition } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { performanceAreaLabels, emptyPerformanceForm } from "./performance-constants";

export function PerformanceSection({ area, setArea, performanceEntries }: { area: PerformanceArea; setArea: (v: PerformanceArea) => void; performanceEntries: PerformanceEntry[] }) {
  const { addPerformanceEntry, addTrainingLoadEntry, importPerformanceEntries, state } = useAppState();
  const { t } = useLocale();
  const [perfTab, setPerfTab] = useState<"tests" | "trainingLoad" | "gps">("tests");
  const [perfForm, setPerfForm] = useState<PerformanceEntryInput>({ ...emptyPerformanceForm, area });
  const [perfFeedback, setPerfFeedback] = useState("");
  const [athleteSearch, setAthleteSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "team" | "athlete" | "test">("none");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Training load state
  const [tlAthlete, setTlAthlete] = useState("");
  const [tlDate, setTlDate] = useState(new Date().toISOString().split("T")[0]);
  const [tlAttended, setTlAttended] = useState(true);
  const [tlType, setTlType] = useState<"training" | "match">("training");
  const [tlMinutes, setTlMinutes] = useState(60);
  const [tlRpe, setTlRpe] = useState(5);
  const [tlNotes, setTlNotes] = useState("");

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowList(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const testDefs = state.performanceDefinitions.filter(d => d.area === area);
  const selDef = testDefs.find(d => d.name === perfForm.testName);
  const filteredAthletes = state.athletes.filter(a => a.name.toLowerCase().includes(athleteSearch.toLowerCase()));
  const ratings = [{ v: "Bronce", l: "Bronce" }, { v: "Plata", l: "Plata" }, { v: "Oro", l: "Oro" }, { v: "Platino", l: "Platino" }];

  useEffect(() => {
    if (!perfForm.testName && testDefs.length) { setPerfForm(c => ({ ...c, testName: testDefs[0].name, unit: testDefs[0].unit })); }
    if (selDef && selDef.attempts !== attempts.length) setAttempts(new Array(selDef.attempts).fill(0));
  }, [area, testDefs, perfForm.testName, selDef, attempts.length]);

  function downloadPerformanceTemplate() {
    const wb = XLSX.utils.book_new();
    const sampleTest = testDefs[0];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Name: "Sample Athlete", Area: area, Team: "U14 Boys", Position: "Winger", "Test Name": sampleTest?.name ?? "Test", Unit: sampleTest?.unit ?? "unit", Value: 1, "Measurement Date": "2026-03-18", Notes: "" }]), "Performance");
    XLSX.writeFile(wb, "performance-template.xlsx");
  }

  async function importPerformanceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
    const normalized = rows.map<PerformanceEntryInput | null>((row) => {
      const athleteName = String(row["Name"] ?? "").trim();
      const testName = String(row["Test Name"] ?? "").trim();
      const measurementDate = String(row["Measurement Date"] ?? "").trim();
      const value = Number(row["Value"] ?? 0);
      if (!athleteName || !testName || !measurementDate || !Number.isFinite(value)) return null;
      const areaRaw = String(row["Area"] ?? "").trim();
      return { athleteName, area: areaRaw === "technicalTactical" ? "technicalTactical" : areaRaw === "psychological" ? "psychological" : "physical", teamName: String(row["Team"] ?? "").trim(), position: String(row["Position"] ?? "").trim(), testName, unit: String(row["Unit"] ?? "").trim(), value, measurementDate, notes: String(row["Notes"] ?? "").trim() || undefined };
    }).filter((row): row is PerformanceEntryInput => Boolean(row));
    importPerformanceEntries(normalized);
    setPerfFeedback(`imported:${normalized.length}`);
    e.target.value = "";
  }

  function sv<K extends keyof PerformanceEntryInput>(k: K, v: PerformanceEntryInput[K]) { setPerfForm(c => ({ ...c, [k]: v })); }

  function savePerf(e: React.FormEvent) {
    e.preventDefault();
    const athlete = state.athletes.find(a => a.id === perfForm.athleteId || a.name.toLowerCase() === perfForm.athleteName.toLowerCase());
    const data: PerformanceEntryInput = selDef?.isRating ? perfForm : { ...perfForm, ratingLevel: undefined, ratingValue: undefined };
    addPerformanceEntry({ ...data, teamName: perfForm.teamName || athlete?.teamName, position: perfForm.position || athlete?.position });
    setPerfFeedback("saved");
    setPerfForm({ ...emptyPerformanceForm, area });
  }

  const latest = useMemo(() => {
    const g = new Map<string, PerformanceEntry[]>();
    for (const e of performanceEntries) { const k = `${e.athleteName}::${e.testName}`; const b = g.get(k) ?? []; b.push(e); g.set(k, b); }
    return Array.from(g.values()).map(es => es.sort((a, b) => b.measurementDate.localeCompare(a.measurementDate))[0]);
  }, [performanceEntries]);

  const filtered = useMemo(() => latest.filter(e => !search || [e.athleteName, e.teamName ?? "", e.position ?? "", e.testName].join(" ").toLowerCase().includes(search.toLowerCase())), [latest, search]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ group: "", rows: filtered }];
    const m = new Map<string, typeof filtered>();
    filtered.forEach(e => { const g = groupBy === "team" ? e.teamName ?? t("datahub.noTeam") : groupBy === "athlete" ? e.athleteName : e.testName; const b = m.get(g) ?? []; b.push(e); m.set(g, b); });
    return Array.from(m.entries()).map(([g, r]) => ({ group: g, rows: r }));
  }, [filtered, groupBy]);

  const tlLoad = tlAttended ? tlMinutes * tlRpe : 0;

  // Training load entries
  const { trainingLoadEntries } = state;

  // Calendar helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
  const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
  const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Monday start
  const daysInMonth = lastDayOfMonth.getDate();

  const getEntriesForDate = (date: string) => {
    return trainingLoadEntries.filter(e => e.date === date);
  };

  const getTotalLoadForDate = (date: string) => {
    return getEntriesForDate(date).reduce((sum, e) => sum + e.load, 0);
  };

  const getLoadColor = (load: number) => {
    if (load === 0) return "bg-white";
    if (load < 200) return "bg-green-100 border-green-300";
    if (load < 400) return "bg-yellow-100 border-yellow-300";
    if (load < 600) return "bg-orange-100 border-orange-300";
    return "bg-red-100 border-red-300";
  };

  const navigateMonth = (direction: number) => {
    setCalendarDate(new Date(calendarYear, calendarMonth + direction, 1));
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={() => setPerfTab("tests")} className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition", perfTab === "tests" ? "bg-accent text-white" : "bg-white border border-line text-zinc-600 hover:bg-zinc-50")}><Plus className="h-4 w-4" />{t("perfTab.tests")}</button>
        <button type="button" onClick={() => setPerfTab("trainingLoad")} className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition", perfTab === "trainingLoad" ? "bg-accent text-white" : "bg-white border border-line text-zinc-600 hover:bg-zinc-50")}><Calendar className="h-4 w-4" />{t("perfTab.trainingLoad")}</button>
        <button type="button" onClick={() => setPerfTab("gps")} className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition", perfTab === "gps" ? "bg-accent text-white" : "bg-white border border-line text-zinc-600 hover:bg-zinc-50")}><MapPin className="h-4 w-4" />GPS</button>
      </div>

      {perfTab === "tests" && <div className="space-y-6">
        {/* Area selector */}
        <section className="grid gap-3 md:grid-cols-3">
          {(Object.keys(performanceAreaLabels) as PerformanceArea[]).map(item => (
            <button key={item} onClick={() => { setArea(item as PerformanceArea); sv("area", item as PerformanceArea); }} className={cn("rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 hover:shadow-lg", area === item ? "border-accent bg-accent text-white shadow-md" : "border-gray-300 bg-white hover:bg-gray-50")}>
              <p className="text-lg font-semibold">{t(performanceAreaLabels[item as PerformanceArea])}</p>
              <p className={cn("mt-1 text-sm", area === item ? "text-white/85" : "text-zinc-600")}>{item === "physical" ? t("datahub.physicalDesc") : item === "technicalTactical" ? t("datahub.technicalTacticalDesc") : t("datahub.psychologicalDesc")}</p>
            </button>
          ))}
        </section>

        {/* Record form */}
        <section className="panel rounded-[1.75rem] p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="text-xl font-semibold">{t("datahub.manualRecordOf")} {t(performanceAreaLabels[area])}</h2><p className="mt-2 text-sm text-zinc-600">{t("datahub.registerResultsBody")}</p></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadPerformanceTemplate} className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-zinc-700 transition hover:bg-white"><Download className="h-4 w-4" />{t("datahub.excelTemplate")}</button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-zinc-700 transition hover:bg-white"><UploadCloud className="h-4 w-4" />{t("datahub.uploadExcel")}<input type="file" accept=".xlsx,.xls" className="hidden" onChange={importPerformanceFile} /></label>
            </div>
          </div>
          {testDefs.length === 0 ? (
            <div className="rounded-xl border border-line bg-white/50 p-8 text-center">
              <p className="text-zinc-600">{t("club.noTestsDefined")}</p>
            </div>
          ) : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={savePerf}>
              <Field label={t("datahub.player")}>
                <div className="relative" ref={ref}>
                  <input type="text" className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.searchOrTypeName")} value={athleteSearch} onChange={e => { setAthleteSearch(e.target.value); setShowList(true); }} onFocus={() => setShowList(true)} />
                  {showList && athleteSearch.length > 0 && <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl border border-line bg-white shadow-lg z-50 max-h-64 overflow-y-auto">{filteredAthletes.length > 0 ? filteredAthletes.map(a => <button key={a.id} type="button" onClick={() => { sv("athleteName", a.name); setAthleteSearch(a.name); setShowList(false); }} className="w-full px-4 py-3 text-left hover:bg-accent/10 border-b border-line/50 last:border-b-0 transition text-zinc-700"><div className="font-medium">{a.name}</div>{a.teamName && <div className="text-xs text-zinc-500">{a.teamName}</div>}</button>) : <div className="px-4 py-3 text-sm text-zinc-500">{t("datahub.noMatchingPlayers")}</div>}</div>}
                  {perfForm.athleteName && <div className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-1 text-sm text-accent border border-accent/30">{perfForm.athleteName}</div>}
                </div>
              </Field>
              <Field label={t("datahub.measurement")}><input type="date" className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" value={perfForm.measurementDate} onChange={e => sv("measurementDate", e.target.value)} /></Field>
              <Field label={t("datahub.test")}><select className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" value={perfForm.testName} onChange={e => sv("testName", e.target.value)}>{testDefs.map(d => <option key={d.id} value={d.name}>{d.name} ({d.unit})</option>)}</select></Field>
              <Field label={t("datahub.unit")}><input className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" value={perfForm.unit} onChange={e => sv("unit", e.target.value)} /></Field>
              {selDef?.isRating ? (
                <>
                  <Field label={t("datahub.rating")}>
                    <div className="grid grid-cols-2 gap-2">
                      {ratings.map(r => (
                        <button key={r.v} type="button" onClick={() => sv("ratingLevel", r.v)} className={cn("rounded-2xl border px-4 py-3 text-sm font-medium transition", perfForm.ratingLevel === r.v ? "border-accent bg-accent text-white" : "border-line bg-white/70 text-zinc-700 hover:bg-white")}>
                          {r.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={t("datahub.numericValueOptional")}>
                    <input type="number" step="0.1" className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.exampleRatingValue")} value={perfForm.ratingValue ?? ""} onChange={e => sv("ratingValue", Number(e.target.value))} />
                  </Field>
                </>
              ) : selDef && selDef.attempts > 1 ? (
                <Field label={`${t("datahub.valuesWithAttempts")} (${selDef.attempts} ${t("datahub.attemptsShort")} - ${selDef.scoringStrategy === "average" ? t("datahub.avgShort") : selDef.interpretation === "lower_better" ? t("datahub.bestMinShort") : t("datahub.bestMaxShort")})`} className="md:col-span-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    {Array.from({ length: selDef.attempts }, (_, i) => (
                      <input 
                        key={i} 
                        type="number" 
                        step="0.01" 
                        className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" 
                        placeholder={`${t("datahub.attemptLabel")} ${i + 1}`} 
                        value={attempts[i] || ""} 
                        onChange={e => { 
                          const nv = [...attempts]; 
                          nv[i] = Number(e.target.value) || 0; 
                          setAttempts(nv); 
                          const vv = nv.filter(v => v > 0); 
                          let cv = 0; 
                          if (vv.length > 0) { 
                            if (selDef.scoringStrategy === "average") {
                              cv = vv.reduce((a, b) => a + b, 0) / vv.length;
                            } else if (selDef.interpretation === "lower_better") {
                              cv = Math.min(...vv);
                            } else {
                              cv = Math.max(...vv);
                            }
                          } 
                          sv("value", cv); 
                        }} 
                      />
                    ))}
                  </div>
                </Field>
              ) : (
                <Field label={t("datahub.value")}>
                  <input type="number" step="0.01" className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.exampleValue")} value={perfForm.value || ""} onChange={e => sv("value", Number(e.target.value))} />
                </Field>
              )}
              <Field label={t("common.notes")} className="md:col-span-2"><input className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.exampleNotes")} value={perfForm.notes ?? ""} onChange={e => sv("notes", e.target.value)} /></Field>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-slate-950 md:col-span-2 hover:bg-accent-strong"><Plus className="h-4 w-4" />{t("datahub.addTest")}</button>
              {perfFeedback && <p className="mt-4 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-zinc-700 md:col-span-2">{perfFeedback === "saved" ? t("datahub.testAddedOk") : perfFeedback === "duplicate" ? t("datahub.cannotImportRows") : t("datahub.importedRows").replace("{count}", perfFeedback.split(":")[1] ?? "0")}</p>}
            </form>
          )}
        </section>

        <section className="panel rounded-[1.75rem] p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="text-xl font-semibold">{t("datahub.registeredTestsTitle")}</h2><p className="mt-2 text-sm text-zinc-600">{t("datahub.registerListHint")}</p></div>
            <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
              <input className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.searchPlayerTeamTest")} value={search} onChange={e => setSearch(e.target.value)} />
              <select className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" value={groupBy} onChange={e => setGroupBy(e.target.value as typeof groupBy)}><option value="none">{t("datahub.groupNone")}</option><option value="team">{t("datahub.groupByTeam")}</option><option value="athlete">{t("datahub.groupByPlayer")}</option><option value="test">{t("datahub.groupByTest")}</option></select>
              <div className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"><p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{t("datahub.history")}</p><p className="text-sm text-zinc-700">{t("datahub.historyExpandHint")}</p></div>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-line bg-white/50 p-8 text-center">
              <p className="text-zinc-600">{t("datahub.noResultsYet")}</p>
            </div>
          ) : (
            <div className="space-y-6">{grouped.map(({ group, rows }) => <div key={group || "all"}>{group && <div className="mb-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-900">{group}</div>}<div className="table-scroll overflow-x-auto rounded-[1.5rem] border border-line bg-white/40"><table className="min-w-full text-left text-sm"><thead className="text-zinc-600"><tr><th className="border-b border-line px-3 py-3">{t("datahub.player")}</th><th className="border-b border-line px-3 py-3">{t("datahub.team")}</th><th className="border-b border-line px-3 py-3">{t("datahub.test")}</th><th className="border-b border-line px-3 py-3">{t("datahub.result")}</th><th className="border-b border-line px-3 py-3">{t("datahub.latestDate")}</th><th className="border-b border-line px-3 py-3">{t("datahub.attemptsCount")}</th></tr></thead><tbody suppressHydrationWarning>{rows.map(entry => { const key = `${entry.athleteName}::${entry.testName}`; const open = expandedKey === key; const hist = performanceEntries.filter(it => it.athleteName === entry.athleteName && it.testName === entry.testName).sort((a, b) => b.measurementDate.localeCompare(a.measurementDate)); const dv = entry.ratingLevel ? `${entry.ratingLevel}${entry.ratingValue ? ` · ${formatNumber(entry.ratingValue, 1)} ${entry.unit}` : ""}` : `${formatNumber(entry.value, 2)} ${entry.unit}`; return <Fragment key={key}><tr className="cursor-pointer border-t border-line/70 hover:bg-white/50" onClick={() => setExpandedKey(open ? null : key)}><td className="px-3 py-3 font-medium text-zinc-900">{entry.athleteName}</td><td className="px-3 py-3 text-zinc-600">{entry.teamName ?? "--"}</td><td className="px-3 py-3 text-zinc-700">{entry.testName}</td><td className="px-3 py-3 text-zinc-900">{dv}</td><td className="px-3 py-3 text-zinc-600">{formatDate(entry.measurementDate)}</td><td className="px-3 py-3 text-zinc-600">{entry.attemptCount ?? selDef?.attempts ?? 1}</td></tr>{open && <PerfHistRow history={hist} />}</Fragment>; })}</tbody></table></div></div>)}</div>
          )}
        </section>
      </div>}

      {perfTab === "trainingLoad" && <div className="space-y-6">
        <section className="panel rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold mb-4">{t("trainingLoad.addEntry")}</h2>
          <form onSubmit={e => { e.preventDefault(); if (tlAthlete) { addTrainingLoadEntry({ athleteId: tlAthlete, date: tlDate, attended: tlAttended, sessionType: tlType, minutesPlayed: tlAttended ? tlMinutes : 0, rpe: tlAttended ? tlRpe : 0, notes: tlNotes || undefined }); setTlMinutes(60); setTlRpe(5); setTlNotes(""); setTlAthlete(""); } }} className="grid gap-4 md:grid-cols-2">
            <Field label={t("datahub.player")}><select value={tlAthlete} onChange={e => setTlAthlete(e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"><option value="">{t("club.selectTeam")}</option>{state.athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <Field label={t("datahub.measurement")}><input type="date" value={tlDate} onChange={e => setTlDate(e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" /></Field>
            <Field label={t("trainingLoad.sessionType")}><select value={tlType} onChange={e => setTlType(e.target.value as "training" | "match")} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"><option value="training">{t("trainingLoad.training")}</option><option value="match">{t("trainingLoad.match")}</option></select></Field>
            <Field label={t("trainingLoad.attended")}><select value={tlAttended ? "yes" : "no"} onChange={e => setTlAttended(e.target.value === "yes")} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"><option value="yes">{t("common.yes")}</option><option value="no">{t("common.no")}</option></select></Field>
            {tlAttended && <><Field label={t("trainingLoad.minutes")}><input type="number" min={0} value={tlMinutes} onChange={e => setTlMinutes(Number(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" /></Field><Field label={t("trainingLoad.rpe")}><div className="flex gap-2">{[1,2,3,4,5,6,7,8,9,10].map(v => <button key={v} type="button" onClick={() => setTlRpe(v)} className={cn("flex-1 rounded-xl py-2 text-sm font-medium transition", tlRpe === v ? "bg-accent text-white" : "bg-white border border-line text-zinc-600 hover:bg-zinc-50")}>{v}</button>)}</div></Field><div className="md:col-span-2 rounded-xl bg-accent/10 px-4 py-3 text-center"><span className="text-sm font-medium text-zinc-700">{t("trainingLoad.load")}: </span><span className="text-2xl font-bold text-accent">{tlLoad}</span><span className="text-xs text-zinc-500 ml-2">({tlMinutes} min × RPE {tlRpe})</span></div></>}
            <Field label={t("common.notes")} className="md:col-span-2"><input className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" placeholder={t("datahub.exampleNotes")} value={tlNotes} onChange={e => setTlNotes(e.target.value)} /></Field>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-slate-950 md:col-span-2 hover:bg-accent-strong"><Plus className="h-4 w-4" />{t("trainingLoad.addEntry")}</button>
          </form>
        </section>
        <section className="panel rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold mb-4">{t("trainingLoad.calendar")}</h2>
          
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="rounded-xl border border-line bg-white/70 px-4 py-2 text-sm text-zinc-700 hover:bg-white transition">
              ← {t("datahub.previous")}
            </button>
            <h3 className="text-lg font-semibold text-zinc-900">
              {monthNames[calendarMonth]} {calendarYear}
            </h3>
            <button onClick={() => navigateMonth(1)} className="rounded-xl border border-line bg-white/70 px-4 py-2 text-sm text-zinc-700 hover:bg-white transition">
              {t("datahub.next")} →
            </button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-xl border border-line bg-white/50 overflow-hidden">
            {/* Day names header */}
            <div className="grid grid-cols-7 bg-zinc-50 border-b border-line">
              {dayNames.map(day => (
                <div key={day} className="py-3 text-center text-xs font-medium text-zinc-600 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 border-b border-r border-line/30 bg-zinc-50/50" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                const day = dayIndex + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const entries = getEntriesForDate(dateStr);
                const totalLoad = getTotalLoadForDate(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      "min-h-24 border-b border-r border-line/30 p-2 cursor-pointer transition hover:bg-white/80",
                      getLoadColor(totalLoad),
                      isSelected && "ring-2 ring-accent ring-inset",
                      isToday && "bg-accent/5"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        isToday ? "text-accent" : "text-zinc-700"
                      )}>
                        {day}
                      </span>
                      {totalLoad > 0 && (
                        <span className="text-xs font-semibold text-zinc-600">
                          {totalLoad}
                        </span>
                      )}
                    </div>
                    {entries.length > 0 && (
                      <div className="space-y-1">
                        {entries.slice(0, 2).map((entry, idx) => {
                          const athlete = state.athletes.find(a => a.id === entry.athleteId);
                          return (
                            <div key={idx} className="text-xs text-zinc-700 truncate">
                              <span className="font-medium">{athlete?.name ?? "Unknown"}</span>
                              <span className="text-zinc-500 ml-1">({entry.sessionType === "match" ? "P" : "E"})</span>
                            </div>
                          );
                        })}
                        {entries.length > 2 && (
                          <div className="text-xs text-zinc-500">+{entries.length - 2} más</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <div className="mt-6 rounded-xl border border-line bg-white/70 p-4">
              <h4 className="font-semibold text-zinc-900 mb-3">
                {t("trainingLoad.entriesForDate")}: {formatDate(selectedDate)}
              </h4>
              {getEntriesForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-zinc-500">{t("trainingLoad.noEntriesForDate")}</p>
              ) : (
                <div className="space-y-2">
                  {getEntriesForDate(selectedDate).map((entry, idx) => {
                    const athlete = state.athletes.find(a => a.id === entry.athleteId);
                    return (
                      <div key={idx} className="rounded-lg border border-line bg-white/50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-zinc-900">{athlete?.name ?? "Unknown"}</p>
                            <p className="text-sm text-zinc-600">
                              {entry.sessionType === "match" ? t("trainingLoad.match") : t("trainingLoad.training")}
                              {entry.attended && ` · ${entry.minutesPlayed} min · RPE ${entry.rpe}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-accent">{entry.load}</p>
                            <p className="text-xs text-zinc-500">{t("trainingLoad.load")}</p>
                          </div>
                        </div>
                        {entry.notes && <p className="mt-2 text-xs text-zinc-600 italic">{entry.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>}

      {perfTab === "gps" && <div className="space-y-6">
        <section className="panel rounded-[1.75rem] p-6">
          <div className="flex items-center gap-3 mb-4"><MapPin className="h-6 w-6 text-zinc-400" /><h2 className="text-xl font-semibold">GPS</h2></div>
          <div className="rounded-xl border border-line bg-white/50 p-12 text-center"><MapPin className="h-16 w-16 mx-auto text-zinc-300 mb-4" /><p className="text-lg font-medium text-zinc-700 mb-2">{t("gps.comingSoon")}</p><p className="text-sm text-zinc-500 max-w-md mx-auto">{t("gps.body")}</p></div>
        </section>
      </div>}
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={cn("grid gap-2", className)}><span className="text-sm font-medium text-zinc-800">{label}</span>{children}</label>;
}

function PerfHistRow({ history }: { history: PerformanceEntry[] }) {
  const { t } = useLocale();
  return <tr><td colSpan={6} className="border-t border-line/50 bg-white/80 px-5 py-5"><div className="rounded-[1.5rem] border border-line bg-white/70 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-semibold text-zinc-900">{t("datahub.performanceHistory")}</h3><p className="text-xs text-zinc-600">{history.length} {t("datahub.valuesCount")}</p></div><div className="table-scroll overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-zinc-600"><tr><th className="border-b border-line px-3 py-2">{t("datahub.date")}</th><th className="border-b border-line px-3 py-2">{t("datahub.result")}</th><th className="border-b border-line px-3 py-2">{t("common.notes")}</th></tr></thead><tbody>{history.map(it => <tr key={it.id} className="border-t border-line/50"><td className="px-3 py-2 text-zinc-900">{formatDate(it.measurementDate)}</td><td className="px-3 py-2 text-zinc-900">{it.ratingLevel ? `${it.ratingLevel}${it.ratingValue ? ` · ${formatNumber(it.ratingValue, 1)} ${it.unit}` : ""}` : `${formatNumber(it.value, 2)} ${it.unit}`}</td><td className="px-3 py-2 text-zinc-600">{it.notes ?? "-"}</td></tr>)}</tbody></table></div></div></td></tr>;
}
