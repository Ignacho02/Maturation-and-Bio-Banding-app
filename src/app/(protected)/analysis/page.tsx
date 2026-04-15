"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Scatter, ScatterChart, Legend,
} from "recharts";
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Filter,
  Search, TrendingUp, Users, Calendar, MapPin, Target,
  Dumbbell, Shield, Activity, Group, Trophy,
} from "lucide-react";
import { buildInsights } from "@/lib/maturation/insights";
import { useAppState } from "@/lib/store/app-state";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate, formatNumber } from "@/lib/utils";
import { MaturationInsights } from "@/components/maturation-insights";
import {
  buildTeamStats, computeAthleteZScore, buildBioBandingGroups,
  buildAlerts, detectRapidGrowth,
} from "@/lib/maturation/analysis-helpers";
import type { MaturityBand } from "@/lib/types";
import type { TeamStats, AlertItem, RapidGrowthAlert } from "@/lib/maturation/analysis-helpers";

const bandColors: Record<string, string> = {
  "Pre-PHV": "#0f766e",
  "Mid-PHV": "#b45309",
  "Post-PHV": "#0f172a",
};

type AnalysisTab = "individual" | "collective" | "bioBanding" | "alerts";

// ---------------------------------------------------------------------------
// Tab selector
// ---------------------------------------------------------------------------
function TabBar({
  active,
  onChange,
  labels,
}: {
  active: AnalysisTab;
  onChange: (t: AnalysisTab) => void;
  labels: Record<AnalysisTab, string>;
}) {
  const tabs: AnalysisTab[] = ["individual", "collective", "bioBanding", "alerts"];
  const icons: Record<AnalysisTab, React.ReactNode> = {
    individual: <Users className="h-4 w-4" />,
    collective: <Group className="h-4 w-4" />,
    bioBanding: <Target className="h-4 w-4" />,
    alerts: <AlertTriangle className="h-4 w-4" />,
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
            active === tab
              ? "border-teal-600 bg-teal-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {icons[tab]}
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// INDIVIDUAL TAB
// ---------------------------------------------------------------------------
function IndividualView({
  assessments,
  state,
  t,
}: {
  assessments: ReturnType<typeof useAppState>["assessments"];
  state: ReturnType<typeof useAppState>["state"];
  t: (k: string) => string;
}) {
  const teams = useMemo(
    () => [...new Set(state.athletes.map((a) => a.teamName).filter(Boolean))] as string[],
    [state.athletes],
  );

  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterBand, setFilterBand] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState(state.athletes[0]?.id ?? "");

  const latestByAthlete = useMemo(() => {
    const map = new Map<string, (typeof assessments)[number]>();
    for (const a of assessments) {
      const existing = map.get(a.inputs.athleteId);
      if (!existing || existing.inputs.dataCollectionDate < a.inputs.dataCollectionDate) {
        map.set(a.inputs.athleteId, a);
      }
    }
    return Array.from(map.values());
  }, [assessments]);

  const filtered = useMemo(() => {
    return latestByAthlete.filter((a) => {
      if (search && !a.inputs.athleteName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTeam && a.inputs.teamName !== filterTeam) return false;
      if (filterBand && a.classification.maturityBand !== filterBand) return false;
      return true;
    });
  }, [latestByAthlete, search, filterTeam, filterBand]);

  const selectedLatest = latestByAthlete.find((a) => a.inputs.athleteId === selectedAthleteId) ?? latestByAthlete[0];

  const selectedHistory = useMemo(
    () =>
      assessments
        .filter((a) => a.inputs.athleteId === selectedAthleteId)
        .sort((a, b) => a.inputs.dataCollectionDate.localeCompare(b.inputs.dataCollectionDate)),
    [assessments, selectedAthleteId],
  );

  // Z-score within team
  const teamAssessments = useMemo(
    () => assessments.filter((a) => a.inputs.teamName === selectedLatest?.inputs.teamName),
    [assessments, selectedLatest],
  );
  const zScoreInfo = selectedLatest ? computeAthleteZScore(selectedLatest, teamAssessments) : null;

  // Team comparison data
  const teamComparisonData = useMemo(() => {
    if (!zScoreInfo) return [];
    const teammates = teamAssessments.filter((a) => a.inputs.athleteId !== selectedAthleteId);
    return [
      { name: selectedLatest.inputs.athleteName, offset: selectedLatest.classification.primaryOffset, highlight: true },
      ...teammates.map((a) => ({ name: a.inputs.athleteName, offset: a.classification.primaryOffset, highlight: false })),
    ].sort((a, b) => a.offset - b.offset);
  }, [selectedLatest, teamAssessments, selectedAthleteId, zScoreInfo]);

  if (latestByAthlete.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <Users size={48} className="mb-4 opacity-20" />
        <p>{t("analysis.individual.noDataSelected")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder={t("analysis.individual.searchAthlete")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t("analysis.individual.allTeams")}</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <select
            value={filterBand}
            onChange={(e) => setFilterBand(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t("analysis.individual.allBands")}</option>
            <option value="Pre-PHV">Pre-PHV</option>
            <option value="Mid-PHV">Mid-PHV</option>
            <option value="Post-PHV">Post-PHV</option>
          </select>
        </div>
      </div>

      {/* Athlete selector cards */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {filtered.map((a) => (
          <button
            key={a.inputs.athleteId}
            onClick={() => setSelectedAthleteId(a.inputs.athleteId)}
            className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border transition-all ${
              selectedAthleteId === a.inputs.athleteId
                ? "bg-teal-50 border-teal-200 ring-1 ring-teal-200"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
              a.classification.maturityBand === "Pre-PHV" ? "bg-teal-100 text-teal-700" :
              a.classification.maturityBand === "Mid-PHV" ? "bg-amber-100 text-amber-700" :
              "bg-slate-200 text-slate-700"
            }`}>
              {a.inputs.athleteName.charAt(0)}
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{a.inputs.athleteName}</div>
              <div className="text-xs text-slate-500">{a.inputs.teamName}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedLatest && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Maturation Insights Cards */}
          <MaturationInsights result={selectedLatest} />

          {/* Z-Score Card + Team Comparison */}
          {zScoreInfo && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
                    {t("analysis.individual.zScoreLabel")}
                  </h3>
                </div>
                <div className={`text-4xl font-bold mb-2 ${
                  zScoreInfo.zScore > 1 ? "text-amber-600" :
                  zScoreInfo.zScore < -1 ? "text-blue-600" : "text-teal-600"
                }`}>
                  {zScoreInfo.zScore.toFixed(2)}
                </div>
                <p className="text-sm text-slate-500 mb-1">
                  {zScoreInfo.interpretation === "early" && t("analysis.individual.zScoreInterpretation.early")}
                  {zScoreInfo.interpretation === "average" && t("analysis.individual.zScoreInterpretation.average")}
                  {zScoreInfo.interpretation === "late" && t("analysis.individual.zScoreInterpretation.late")}
                </p>
                <p className="text-xs text-slate-400">
                  {zScoreInfo.teammateCount} {t("analysis.individual.teammates")} · {t("analysis.individual.zScoreExplanation")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-3">
                  {t("analysis.individual.teamComparison")}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamComparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="offset" radius={[0, 6, 6, 0]} barSize={18}>
                        {teamComparisonData.map((entry, i) => (
                          <Cell key={i} fill={entry.highlight ? "#0f766e" : "#cbd5e1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Temporal trend */}
          {selectedHistory.length > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">{t("analysis.individual.temporalTrend")}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedHistory.map((item) => ({
                      date: formatDate(item.inputs.dataCollectionDate),
                      stature: item.inputs.statureCm,
                      offset: Number(item.classification.primaryOffset.toFixed(2)),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="stature" name="Estatura (cm)" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="offset" name="Offset PHV" stroke="#b45309" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed metrics table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold">{t("analysis.individual.maturityProfile")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t("analysis.individual.chronologicalAge")}</th>
                    <th className="px-6 py-3 font-semibold">{t("analysis.individual.offsetFromPHV")}</th>
                    <th className="px-6 py-3 font-semibold">{t("analysis.individual.maturityBand")}</th>
                    <th className="px-6 py-3 font-semibold">Moore APHV</th>
                    <th className="px-6 py-3 font-semibold">Mirwald APHV</th>
                    <th className="px-6 py-3 font-semibold">{t("analysis.individual.adultHeightPrediction")}</th>
                    <th className="px-6 py-3 font-semibold">{t("analysis.individual.percentageOfAdult")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium">{formatNumber(selectedLatest.derivedMetrics.chronologicalAge, 2)} {t("analysis.collective.years")}</td>
                    <td className="px-6 py-4 font-medium text-teal-600">{formatNumber(selectedLatest.classification.primaryOffset, 2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedLatest.classification.maturityBand === "Pre-PHV" ? "bg-teal-100 text-teal-700" :
                        selectedLatest.classification.maturityBand === "Mid-PHV" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-200 text-slate-700"
                      }`}>
                        {selectedLatest.classification.maturityBand}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatNumber(selectedLatest.methodOutputs.mooreAphv, 2)} {t("analysis.collective.years")}</td>
                    <td className="px-6 py-4">{formatNumber(selectedLatest.methodOutputs.mirwaldAphv, 2)} {t("analysis.collective.years")}</td>
                    <td className="px-6 py-4">{selectedLatest.methodOutputs.pahCm ? `${formatNumber(selectedLatest.methodOutputs.pahCm, 1)} cm` : "N/A"}</td>
                    <td className="px-6 py-4">{selectedLatest.methodOutputs.percentageAdultHeight ? `${formatNumber(selectedLatest.methodOutputs.percentageAdultHeight, 1)}%` : "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights / warnings */}
          {(() => {
            const insights = buildInsights(selectedLatest);
            return insights.length > 0 ? (
              <div className="rounded-[1.5rem] border border-line bg-white/60 p-4">
                <p className="mb-3 text-sm font-medium text-zinc-900">{t("analysis.warningsTitle")}</p>
                <div className="grid gap-3">
                  {insights.map((insight) => (
                    <article key={insight.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                      <h3 className="font-medium">{t(insight.titleKey)}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{t(insight.bodyKey)}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COLLECTIVE TAB
// ---------------------------------------------------------------------------
function CollectiveView({
  assessments,
  state,
  t,
}: {
  assessments: ReturnType<typeof useAppState>["assessments"];
  state: ReturnType<typeof useAppState>["state"];
  t: (k: string) => string;
}) {
  const teams = useMemo(
    () => [...new Set(state.athletes.map((a) => a.teamName).filter(Boolean))] as string[],
    [state.athletes],
  );

  const [selectedTeam, setSelectedTeam] = useState(teams[0] ?? "");

  const latestByAthlete = useMemo(() => {
    const map = new Map<string, (typeof assessments)[number]>();
    for (const a of assessments) {
      const existing = map.get(a.inputs.athleteId);
      if (!existing || existing.inputs.dataCollectionDate < a.inputs.dataCollectionDate) {
        map.set(a.inputs.athleteId, a);
      }
    }
    return Array.from(map.values());
  }, [assessments]);

  const teamStats = useMemo(() => {
    if (!selectedTeam) return null;
    const teamData = latestByAthlete.filter((a) => a.inputs.teamName === selectedTeam);
    if (teamData.length === 0) return null;

    const offsets = teamData.map((a) => a.classification.primaryOffset);
    const meanOff = offsets.reduce((s, v) => s + v, 0) / offsets.length;
    const sdOff = offsets.length > 1 ? Math.sqrt(offsets.reduce((s, v) => s + (v - meanOff) ** 2, 0) / offsets.length) : 0;

    const bandCounts: Record<MaturityBand, number> = { "Pre-PHV": 0, "Mid-PHV": 0, "Post-PHV": 0 };
    teamData.forEach((a) => bandCounts[a.classification.maturityBand]++);

    const sorted = [...teamData].sort((a, b) => a.classification.primaryOffset - b.classification.primaryOffset);

    return {
      athletes: teamData.map((a) => ({
        ...a,
        zScore: sdOff === 0 ? 0 : (a.classification.primaryOffset - meanOff) / sdOff,
      })),
      meanOffset: meanOff,
      meanAge: teamData.reduce((s, a) => s + a.derivedMetrics.chronologicalAge, 0) / teamData.length,
      meanStature: teamData.reduce((s, a) => s + a.inputs.statureCm, 0) / teamData.length,
      meanWeight: teamData.reduce((s, a) => s + a.inputs.bodyMassKg, 0) / teamData.length,
      bandCounts,
      sdOffset: sdOff,
      earliest: sorted[0],
      latest: sorted[sorted.length - 1],
      maturitySpread: sorted.length > 1 ? sorted[sorted.length - 1].classification.primaryOffset - sorted[0].classification.primaryOffset : 0,
    };
  }, [latestByAthlete, selectedTeam]);

  const distributionData = teamStats
    ? (["Pre-PHV", "Mid-PHV", "Post-PHV"] as MaturityBand[]).map((band) => ({
        name: band,
        value: teamStats.bandCounts[band],
        fill: bandColors[band],
      }))
    : [];

  const offsetData = teamStats
    ? teamStats.athletes
        .map((a) => ({
          name: a.inputs.athleteName,
          offset: Number(a.classification.primaryOffset.toFixed(2)),
          zScore: Number(a.zScore.toFixed(2)),
          band: a.classification.maturityBand,
        }))
        .sort((a, b) => a.offset - b.offset)
    : [];

  const scatterData = teamStats
    ? teamStats.athletes.map((a) => ({
        name: a.inputs.athleteName,
        age: a.derivedMetrics.chronologicalAge,
        offset: a.classification.primaryOffset,
        stature: a.inputs.statureCm,
        band: a.classification.maturityBand,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Team selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">{t("analysis.collective.selectTeam")}</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      {!teamStats ? (
        <div className="h-48 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <p>{t("analysis.collective.noData")}</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="metric-card rounded-[1.75rem] p-5">
              <p className="text-sm text-ink-soft">{t("analysis.collective.avgOffset")}</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(teamStats.meanOffset, 2)}</p>
            </div>
            <div className="metric-card rounded-[1.75rem] p-5">
              <p className="text-sm text-ink-soft">{t("analysis.collective.avgAge")}</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(teamStats.meanAge, 1)} {t("analysis.collective.years")}</p>
            </div>
            <div className="metric-card rounded-[1.75rem] p-5">
              <p className="text-sm text-ink-soft">{t("analysis.collective.avgStature")}</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(teamStats.meanStature, 1)} cm</p>
            </div>
            <div className="metric-card rounded-[1.75rem] p-5">
              <p className="text-sm text-ink-soft">{t("analysis.collective.avgWeight")}</p>
              <p className="mt-2 text-3xl font-semibold">{formatNumber(teamStats.meanWeight, 1)} kg</p>
            </div>
          </div>

          {/* Extra stats */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{t("analysis.collective.earliestMaturity")}</p>
              <p className="mt-1 font-semibold">{teamStats.earliest.inputs.athleteName}</p>
              <p className="text-sm text-teal-600">{formatNumber(teamStats.earliest.classification.primaryOffset, 2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{t("analysis.collective.latestMaturity")}</p>
              <p className="mt-1 font-semibold">{teamStats.latest.inputs.athleteName}</p>
              <p className="text-sm text-blue-600">{formatNumber(teamStats.latest.classification.primaryOffset, 2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{t("analysis.collective.maturitySpread")}</p>
              <p className="mt-1 font-semibold">{formatNumber(teamStats.maturitySpread, 2)} {t("analysis.collective.years")}</p>
              <p className="text-xs text-slate-400">SD: {formatNumber(teamStats.sdOffset, 2)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel rounded-[1.75rem] p-6">
              <h2 className="mb-4 text-lg font-semibold">{t("analysis.collective.distributionTitle")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                      {distributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel rounded-[1.75rem] p-6">
              <h2 className="mb-4 text-lg font-semibold">{t("analysis.collective.offsetsTitle")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={offsetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="offset" radius={[6, 6, 0, 0]} barSize={24}>
                      {offsetData.map((entry, i) => (
                        <Cell key={i} fill={bandColors[entry.band as keyof typeof bandColors]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Scatter: Age vs Offset */}
          <div className="panel rounded-[1.75rem] p-6">
            <h2 className="mb-4 text-lg font-semibold">Edad vs Offset Madurativo</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                  <XAxis dataKey="age" name="Edad" tick={{ fontSize: 12 }} unit=" años" />
                  <YAxis dataKey="offset" name="Offset" tick={{ fontSize: 12 }} unit=" años" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                  {(["Pre-PHV", "Mid-PHV", "Post-PHV"] as MaturityBand[]).map((band) => {
                    const bandData = scatterData.filter((d) => d.band === band);
                    return (
                      <Scatter
                        key={band}
                        name={band}
                        data={bandData}
                        fill={bandColors[band]}
                      />
                    );
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full athlete table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold">{selectedTeam} — {t("analysis.collective.bandCounts")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Atleta</th>
                    <th className="px-6 py-3 font-semibold">Edad</th>
                    <th className="px-6 py-3 font-semibold">Estatura</th>
                    <th className="px-6 py-3 font-semibold">Peso</th>
                    <th className="px-6 py-3 font-semibold">Offset</th>
                    <th className="px-6 py-3 font-semibold">Z-Score</th>
                    <th className="px-6 py-3 font-semibold">Banda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamStats.athletes.map((a) => (
                    <tr key={a.inputs.athleteId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium">{a.inputs.athleteName}</td>
                      <td className="px-6 py-3">{formatNumber(a.derivedMetrics.chronologicalAge, 1)}</td>
                      <td className="px-6 py-3">{a.inputs.statureCm} cm</td>
                      <td className="px-6 py-3">{a.inputs.bodyMassKg} kg</td>
                      <td className="px-6 py-3 font-medium text-teal-600">{formatNumber(a.classification.primaryOffset, 2)}</td>
                      <td className="px-6 py-3">
                        <span className={`font-semibold ${
                          a.zScore > 1 ? "text-amber-600" : a.zScore < -1 ? "text-blue-600" : "text-slate-600"
                        }`}>
                          {formatNumber(a.zScore, 2)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.classification.maturityBand === "Pre-PHV" ? "bg-teal-100 text-teal-700" :
                          a.classification.maturityBand === "Mid-PHV" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-200 text-slate-700"
                        }`}>
                          {a.classification.maturityBand}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BIO-BANDING TAB
// ---------------------------------------------------------------------------
function BioBandingView({
  assessments,
  state,
  t,
}: {
  assessments: ReturnType<typeof useAppState>["assessments"];
  state: ReturnType<typeof useAppState>["state"];
  t: (k: string) => string;
}) {
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentLocation, setTournamentLocation] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupFocus, setGroupFocus] = useState("coordination");
  const [toast, setToast] = useState<string | null>(null);

  const groups = useMemo(() => buildBioBandingGroups(assessments), [assessments]);

  const teamNames = useMemo(
    () => [...new Set(state.athletes.map((a) => a.teamName).filter(Boolean))] as string[],
    [state.athletes],
  );
  const [selectedTournamentTeams, setSelectedTournamentTeams] = useState<string[]>(teamNames);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const bandAdvice: Record<string, { label: string; advice: string; color: string; bg: string; icon: React.ReactNode }> = {
    "Post-PHV": {
      label: t("analysis.bioBanding.earlyGroup"),
      advice: t("analysis.bioBanding.earlyAdvice"),
      color: "text-slate-700",
      bg: "bg-slate-50 border-slate-200",
      icon: <Dumbbell className="h-5 w-5 text-slate-600" />,
    },
    "Mid-PHV": {
      label: t("analysis.bioBanding.averageGroup"),
      advice: t("analysis.bioBanding.averageAdvice"),
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      icon: <Shield className="h-5 w-5 text-amber-600" />,
    },
    "Pre-PHV": {
      label: t("analysis.bioBanding.lateGroup"),
      advice: t("analysis.bioBanding.lateAdvice"),
      color: "text-teal-700",
      bg: "bg-teal-50 border-teal-200",
      icon: <Activity className="h-5 w-5 text-teal-600" />,
    },
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-teal-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle2 className="inline h-4 w-4 mr-2" />
          {toast}
        </div>
      )}

      {/* Proposed groups */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("analysis.bioBanding.proposedGroups")}</h2>
        <div className="space-y-6">
          {groups.map((group) => {
            const info = bandAdvice[group.band];
            return (
              <div key={group.band} className={`rounded-2xl border p-6 ${info.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  {info.icon}
                  <h3 className={`text-lg font-semibold ${info.color}`}>{info.label}</h3>
                  <span className="text-sm text-slate-500 ml-auto">{group.athletes.length} atletas</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{info.advice}</p>
                {group.athletes.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.athletes.map((a) => (
                      <div key={a.id} className="rounded-xl bg-white/80 border border-slate-200/60 p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            group.band === "Pre-PHV" ? "bg-teal-100 text-teal-700" :
                            group.band === "Mid-PHV" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-200 text-slate-700"
                          }`}>
                            {a.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{a.name}</div>
                            <div className="text-xs text-slate-500">{a.teamName} · {a.ageGroup}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-slate-500">
                          <span>Offset: {a.offset.toFixed(2)}</span>
                          <span>Z: {a.zScore.toFixed(2)}</span>
                          <span>{a.statureCm} cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">{t("analysis.bioBanding.noGroupData")}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create training group */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-lg">{t("analysis.bioBanding.createTrainingGroup")}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder={t("analysis.bioBanding.trainingGroupPlaceholder")}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          <select
            value={groupFocus}
            onChange={(e) => setGroupFocus(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            <option value="coordination">{t("analysis.bioBanding.focusCoordination")}</option>
            <option value="strength">{t("analysis.bioBanding.focusStrength")}</option>
            <option value="injury">{t("analysis.bioBanding.focusInjury")}</option>
            <option value="mixed">{t("analysis.bioBanding.focusMixed")}</option>
          </select>
          <button
            onClick={() => {
              if (groupName.trim()) {
                showToast(t("analysis.bioBanding.groupCreated"));
                setGroupName("");
              }
            }}
            className="rounded-full bg-teal-600 text-white px-5 py-2 text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {t("analysis.bioBanding.createGroup")}
          </button>
        </div>
      </div>

      {/* Schedule tournament */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-lg">{t("analysis.bioBanding.scheduleTournament")}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder={t("analysis.bioBanding.tournamentPlaceholder")}
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("analysis.bioBanding.tournamentLocationPlaceholder")}
              value={tournamentLocation}
              onChange={(e) => setTournamentLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => {
              if (tournamentName.trim() && tournamentDate) {
                showToast(t("analysis.bioBanding.tournamentScheduled"));
                setTournamentName("");
                setTournamentDate("");
                setTournamentLocation("");
              }
            }}
            className="rounded-full bg-amber-600 text-white px-5 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            {t("analysis.bioBanding.scheduleTournament")}
          </button>
        </div>
        {/* Team checkboxes */}
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-600 mb-2">{t("analysis.bioBanding.tournamentTeams")}</p>
          <div className="flex flex-wrap gap-3">
            {teamNames.map((team) => (
              <label key={team} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTournamentTeams.includes(team)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTournamentTeams([...selectedTournamentTeams, team]);
                    } else {
                      setSelectedTournamentTeams(selectedTournamentTeams.filter((t) => t !== team));
                    }
                  }}
                  className="rounded border-slate-300 text-teal-600"
                />
                {team}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALERTS TAB
// ---------------------------------------------------------------------------
function AlertsView({
  assessments,
  t,
}: {
  assessments: ReturnType<typeof useAppState>["assessments"];
  t: (k: string) => string;
}) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");

  const alerts = useMemo(() => buildAlerts(assessments), [assessments]);
  const rapidGrowth = useMemo(() => detectRapidGrowth(assessments), [assessments]);
  const insights = useMemo(() => {
    const all: AlertItem[] = [];
    let c = alerts.length + rapidGrowth.length;
    for (const a of assessments) {
      const ins = buildInsights(a);
      for (const i of ins) {
        all.push({
          id: `insight-${i.id}-${c++}`,
          severity: i.tone === "warning" ? "warning" : i.tone === "success" ? "info" : "info",
          athleteName: a.inputs.athleteName,
          teamName: a.inputs.teamName,
          category: "recommendations",
          message: i.titleKey,
          detail: i.bodyKey,
        });
      }
    }
    return all;
  }, [assessments, alerts, rapidGrowth]);

  const rapidAlerts: AlertItem[] = rapidGrowth.map((r) => ({
    id: r.id,
    severity: "critical",
    athleteName: r.athleteName,
    teamName: r.teamName,
    category: "rapidGrowth",
    message: `${r.monthlyRate} cm/month`,
    detail: `${r.statureGain.toFixed(1)} cm in ${r.monthsBetween} months (${r.dateFrom} → ${r.dateTo})`,
  }));

  const allAlerts = useMemo(() => [...alerts, ...rapidAlerts, ...insights], [alerts, rapidAlerts, insights]);

  const filtered = filterSeverity === "all" ? allAlerts : allAlerts.filter((a) => a.severity === filterSeverity);

  const counts = {
    critical: allAlerts.filter((a) => a.severity === "critical").length,
    warning: allAlerts.filter((a) => a.severity === "warning").length,
    info: allAlerts.filter((a) => a.severity === "info").length,
  };

  const severityIcon = (sev: string) => {
    switch (sev) {
      case "critical": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info": return <CheckCircle2 className="h-5 w-5 text-teal-500" />;
      default: return null;
    }
  };

  const severityBg = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-50 border-red-200";
      case "warning": return "bg-amber-50 border-amber-200";
      case "info": return "bg-teal-50 border-teal-200";
      default: return "bg-white border-slate-200";
    }
  };

  if (allAlerts.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <CheckCircle2 size={48} className="mb-4 text-teal-400" />
        <p>{t("analysis.alerts.noAlerts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-700">{counts.critical}</p>
          <p className="text-xs text-red-500">{t("analysis.alerts.critical")}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">{counts.warning}</p>
          <p className="text-xs text-amber-500">{t("analysis.alerts.warning")}</p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-teal-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-teal-700">{counts.info}</p>
          <p className="text-xs text-teal-500">{t("analysis.alerts.info")}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {(["all", "critical", "warning", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              filterSeverity === sev
                ? sev === "critical" ? "border-red-500 bg-red-500 text-white" :
                  sev === "warning" ? "border-amber-500 bg-amber-500 text-white" :
                  sev === "info" ? "border-teal-500 bg-teal-500 text-white" :
                  "border-slate-500 bg-slate-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {sev === "all" ? t("analysis.alerts.allAlerts") : t(`analysis.alerts.${sev}`)}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <div key={alert.id} className={`rounded-2xl border p-4 ${severityBg(alert.severity)}`}>
            <div className="flex items-start gap-3">
              {severityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{alert.athleteName}</span>
                  {alert.teamName && (
                    <span className="text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">{alert.teamName}</span>
                  )}
                </div>
                <p className="font-medium text-sm">{t(`analysis.alerts.${alert.category}`) || alert.message}</p>
                {alert.detail && (
                  <p className="text-sm text-slate-500 mt-1">
                    {alert.detail.startsWith("insights.") || alert.detail.startsWith("analysis.") ? t(alert.detail) : alert.detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function AnalysisPage() {
  const { t } = useLocale();
  const { state, assessments } = useAppState();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("individual");

  const tabLabels: Record<AnalysisTab, string> = {
    individual: t("analysis.tabs.individual"),
    collective: t("analysis.tabs.collective"),
    bioBanding: t("analysis.tabs.bioBanding"),
    alerts: t("analysis.tabs.alerts"),
  };

  // Quick summary stats (always shown at top)
  const latestByAthlete = useMemo(() => {
    const map = new Map<string, (typeof assessments)[number]>();
    for (const a of assessments) {
      const existing = map.get(a.inputs.athleteId);
      if (!existing || existing.inputs.dataCollectionDate < a.inputs.dataCollectionDate) {
        map.set(a.inputs.athleteId, a);
      }
    }
    return Array.from(map.values());
  }, [assessments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="fade-up space-y-3">
        <p className="eyebrow">{t("analysis.title")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("analysis.subtitle")}</h1>
      </section>

      {/* Quick stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <article className="metric-card rounded-[1.75rem] p-5">
          <p className="text-sm text-ink-soft">{t("analysis.cards.athletes")}</p>
          <p className="mt-3 text-4xl font-semibold">{state.athletes.length}</p>
        </article>
        <article className="metric-card rounded-[1.75rem] p-5">
          <p className="text-sm text-ink-soft">{t("analysis.cards.records")}</p>
          <p className="mt-3 text-4xl font-semibold">{state.records.length}</p>
        </article>
        <article className="metric-card rounded-[1.75rem] p-5">
          <p className="text-sm text-ink-soft">{t("analysis.cards.pre")}</p>
          <p className="mt-3 text-4xl font-semibold">
            {latestByAthlete.filter((a) => a.classification.maturityBand === "Pre-PHV").length}
          </p>
        </article>
        <article className="metric-card rounded-[1.75rem] p-5">
          <p className="text-sm text-ink-soft">{t("analysis.cards.post")}</p>
          <p className="mt-3 text-4xl font-semibold">
            {latestByAthlete.filter((a) => a.classification.maturityBand === "Post-PHV").length}
          </p>
        </article>
      </section>

      {/* Tab navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} labels={tabLabels} />

      {/* Tab content */}
      {activeTab === "individual" && (
        <IndividualView assessments={assessments} state={state} t={t} />
      )}
      {activeTab === "collective" && (
        <CollectiveView assessments={assessments} state={state} t={t} />
      )}
      {activeTab === "bioBanding" && (
        <BioBandingView assessments={assessments} state={state} t={t} />
      )}
      {activeTab === "alerts" && (
        <AlertsView assessments={assessments} t={t} />
      )}
    </div>
  );
}
