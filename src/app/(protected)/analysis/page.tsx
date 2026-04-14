"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildInsights } from "@/lib/maturation/insights";
import { useAppState } from "@/lib/store/app-state";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate, formatNumber } from "@/lib/utils";

const bandColors = {
  "Pre-PHV": "#0f766e",
  "Mid-PHV": "#b45309",
  "Post-PHV": "#0f172a",
};

export default function AnalysisPage() {
  const { t } = useLocale();
  const { state, assessments } = useAppState();
  const [athleteId, setAthleteId] = useState(state.athletes[0]?.id ?? "");

  const latestByAthlete = useMemo(() => {
    const map = new Map<string, (typeof assessments)[number]>();

    for (const assessment of assessments) {
      const existing = map.get(assessment.inputs.athleteId);
      if (
        !existing ||
        existing.inputs.dataCollectionDate < assessment.inputs.dataCollectionDate
      ) {
        map.set(assessment.inputs.athleteId, assessment);
      }
    }

    return Array.from(map.values());
  }, [assessments]);

  const selectedHistory = useMemo(
    () =>
      assessments
        .filter((assessment) => assessment.inputs.athleteId === athleteId)
        .sort((a, b) => a.inputs.dataCollectionDate.localeCompare(b.inputs.dataCollectionDate)),
    [assessments, athleteId],
  );

  const selectedLatest =
    latestByAthlete.find((assessment) => assessment.inputs.athleteId === athleteId) ??
    latestByAthlete[0];

  const maturityDistribution = Object.entries(
    latestByAthlete.reduce<Record<string, number>>((acc, assessment) => {
      acc[assessment.classification.maturityBand] =
        (acc[assessment.classification.maturityBand] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const comparison = latestByAthlete.map((assessment) => ({
    name: assessment.inputs.athleteName,
    offset: Number(assessment.classification.primaryOffset.toFixed(2)),
  }));

  const insights = selectedLatest ? buildInsights(selectedLatest) : [];

  function exportCsv() {
    if (latestByAthlete.length === 0) {
      alert(t("analysis.exportEmpty"));
      return;
    }

    const rows = latestByAthlete.map((assessment) => ({
      athlete: assessment.inputs.athleteName,
      team: assessment.inputs.teamName ?? "",
      age: assessment.derivedMetrics.chronologicalAge.toFixed(2),
      band: assessment.classification.maturityBand,
      offset: assessment.classification.primaryOffset.toFixed(2),
      moore: assessment.methodOutputs.mooreOffset.toFixed(2),
      mirwald: assessment.methodOutputs.mirwaldOffset.toFixed(2),
      percentageAdultHeight: assessment.methodOutputs.percentageAdultHeight?.toFixed(2) ?? "",
    }));

    const header = Object.keys(rows[0]).join(",");
    const body = rows.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "maduration-analysis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <section className="fade-up space-y-3">
        <p className="eyebrow">{t("analysis.title")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("analysis.subtitle")}</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            {latestByAthlete.filter((item) => item.classification.maturityBand === "Pre-PHV").length}
          </p>
        </article>
        <article className="metric-card rounded-[1.75rem] p-5">
          <p className="text-sm text-ink-soft">{t("analysis.cards.post")}</p>
          <p className="mt-3 text-4xl font-semibold">
            {latestByAthlete.filter((item) => item.classification.maturityBand === "Post-PHV").length}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="panel rounded-[1.75rem] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("analysis.chartA")}</h2>
            <button onClick={exportCsv} className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm">
              {t("analysis.exportCsv")}
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={maturityDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                  {maturityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={bandColors[entry.name as keyof typeof bandColors]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel rounded-[1.75rem] p-6">
          <h2 className="mb-4 text-xl font-semibold">{t("analysis.chartB")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="offset" radius={[10, 10, 0, 0]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="panel rounded-[1.75rem] p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t("analysis.athleteView")}</h2>
              <p className="text-sm text-ink-soft">{t("analysisExtra.latestSnapshot")}</p>
            </div>
            <select
              className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm"
              value={athleteId}
              onChange={(event) => setAthleteId(event.target.value)}
            >
              {state.athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>

          {selectedLatest ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white/70 p-4">
                  <p className="text-sm text-ink-soft">{t("analysisExtra.maturityBand")}</p>
                  <p className="mt-2 text-2xl font-semibold">{selectedLatest.classification.maturityBand}</p>
                </div>
                <div className="rounded-2xl border border-line bg-white/70 p-4">
                  <p className="text-sm text-ink-soft">{t("analysisExtra.primaryOffset")}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(selectedLatest.classification.primaryOffset, 2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-white/70 p-4">
                  <p className="text-sm text-ink-soft">Moore APHV</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(selectedLatest.methodOutputs.mooreAphv, 2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-white/70 p-4">
                  <p className="text-sm text-ink-soft">% PAH</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatNumber(selectedLatest.methodOutputs.percentageAdultHeight, 2)}
                  </p>
                </div>
              </div>

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
            </div>
          ) : null}
        </article>

        <article className="panel rounded-[1.75rem] p-6">
          <h2 className="mb-4 text-xl font-semibold">{t("analysis.chartC")}</h2>
          <div className="h-80">
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
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="stature" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="offset" stroke="#b45309" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
