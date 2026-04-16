"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { Range } from "react-range";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Pencil,
  Plus,
  UploadCloud,
  UserPlus,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAppState } from "@/lib/store/app-state";
import type { AnthropometricRecordInput } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";

/** Filter range bounds — kept in one place to avoid drift between state and UI. */
const FILTER_RANGES = {
  age: { min: 10, max: 20 },
  stature: { min: 120, max: 220 },
  mass: { min: 30, max: 100 },
  sitting: { min: 60, max: 120 },
  offset: { min: -5, max: 5 },
  moore: { min: 8, max: 18 },
  pah: { min: 60, max: 110 },
  mirwald: { min: -5, max: 5 },
};

/** Default initial values for the column filter state. */
const DEFAULT_COLUMN_FILTERS = {
  athlete: [] as string[],
  team: [] as string[],
  position: [] as string[],
  band: [] as string[],
  age: { min: FILTER_RANGES.age.min, max: FILTER_RANGES.age.max },
  stature: { min: FILTER_RANGES.stature.min, max: FILTER_RANGES.stature.max },
  mass: { min: FILTER_RANGES.mass.min, max: FILTER_RANGES.mass.max },
  sitting: { min: FILTER_RANGES.sitting.min, max: FILTER_RANGES.sitting.max },
  offset: { min: FILTER_RANGES.offset.min, max: FILTER_RANGES.offset.max },
  moore: { min: FILTER_RANGES.moore.min, max: FILTER_RANGES.moore.max },
  pah: { min: FILTER_RANGES.pah.min, max: FILTER_RANGES.pah.max },
  mirwald: { min: FILTER_RANGES.mirwald.min, max: FILTER_RANGES.mirwald.max },
};

export function MaturationSection({
  state,
  filteredRows,
  assessments,
  expandedAthleteId,
  setExpandedAthleteId,
  search: _search,
  setSearch: _setSearch,
  teamFilter: _teamFilter,
  setTeamFilter: _setTeamFilter,
  positionFilter: _positionFilter,
  setPositionFilter: _setPositionFilter,
  ageMin: _ageMin,
  setAgeMin: _setAgeMin,
  ageMax: _ageMax,
  setAgeMax: _setAgeMax,
  heightMin: _heightMin,
  setHeightMin: _setHeightMin,
  heightMax: _heightMax,
  setHeightMax: _setHeightMax,
  teams,
  positions,
  maturationForm,
  setMaturationForm,
  setMaturationValue,
  saveMaturation,
  saveEditPlayer,
  downloadPlayersTemplate,
  downloadMeasurementsTemplate,
  importPlayersFile,
  importMeasurementsFile,
  feedback,
  showAddPlayerModal,
  setShowAddPlayerModal,
  showAddMeasurementModal,
  setShowAddMeasurementModal,
  showEditPlayerModal,
  setShowEditPlayerModal,
  editingAthleteId,
  setEditingAthleteId,
  openEditForAthlete,
  openAddMeasurementForAthlete: _openAddMeasurementForAthlete,
  emptyForm,
}: {
  state: ReturnType<typeof useAppState>["state"];
  filteredRows: ReturnType<typeof useAppState>["assessments"];
  assessments: ReturnType<typeof useAppState>["assessments"];
  expandedAthleteId: string | null;
  setExpandedAthleteId: (id: string | null) => void;
  search: string;
  setSearch: (value: string) => void;
  teamFilter: string;
  setTeamFilter: (value: string) => void;
  positionFilter: string;
  setPositionFilter: (value: string) => void;
  ageMin: number;
  setAgeMin: (value: number) => void;
  ageMax: number;
  setAgeMax: (value: number) => void;
  heightMin: number;
  setHeightMin: (value: number) => void;
  heightMax: number;
  setHeightMax: (value: number) => void;
  teams: string[];
  positions: string[];
  maturationForm: AnthropometricRecordInput;
  setMaturationForm: (form: AnthropometricRecordInput) => void;
  setMaturationValue: <K extends keyof AnthropometricRecordInput>(
    key: K,
    value: AnthropometricRecordInput[K],
  ) => void;
  saveMaturation: (event: React.FormEvent<HTMLFormElement>) => void;
  saveEditPlayer: (event: React.FormEvent<HTMLFormElement>) => void;
  downloadPlayersTemplate: () => void;
  downloadMeasurementsTemplate: () => void;
  importPlayersFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  importMeasurementsFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  feedback: string;
  showAddPlayerModal: boolean;
  setShowAddPlayerModal: (show: boolean) => void;
  showAddMeasurementModal: boolean;
  setShowAddMeasurementModal: (show: boolean) => void;
  showEditPlayerModal: boolean;
  setShowEditPlayerModal: (show: boolean) => void;
  editingAthleteId: string | null;
  setEditingAthleteId: (id: string | null) => void;
  openEditForAthlete: (athleteId: string) => void;
  openAddMeasurementForAthlete: (athleteId: string) => void;
  emptyForm: AnthropometricRecordInput;
}) {
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState({
    anthropometric: true,
    maturation: true,
  });
  const [columnFilters, setColumnFilters] = useState(DEFAULT_COLUMN_FILTERS);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [showColumnFilter, setShowColumnFilter] = useState<string | null>(null);
  const playersFileRef = useRef<HTMLInputElement>(null);
  const measurementsFileRef = useRef<HTMLInputElement>(null);

  const toggleAthleteFilter = (name: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      athlete: prev.athlete.includes(name)
        ? prev.athlete.filter((item) => item !== name)
        : [...prev.athlete, name],
    }));
  };

  const filteredData = useMemo(() => {
    return filteredRows.filter((row) => {
      const athlete = state.athletes.find((candidate) => candidate.id === row.inputs.athleteId);

      // Filtro de jugador por selecci\u00f3n expl\u00edcita
      if (columnFilters.athlete.length > 0 && !columnFilters.athlete.includes(row.inputs.athleteName)) {
        return false;
      }

      // Filtro de equipos (m\u00faltiple)
      if (columnFilters.team.length > 0 && (!row.inputs.teamName || !columnFilters.team.includes(row.inputs.teamName))) {
        return false;
      }

      // Filtro de posiciones (m\u00faltiple)
      if (columnFilters.position.length > 0 && (!athlete?.position || !columnFilters.position.includes(athlete.position))) {
        return false;
      }

      // Filtros de rango
      if (row.derivedMetrics.chronologicalAge < columnFilters.age.min || row.derivedMetrics.chronologicalAge > columnFilters.age.max) {
        return false;
      }
      if (row.inputs.statureCm < columnFilters.stature.min || row.inputs.statureCm > columnFilters.stature.max) {
        return false;
      }
      if (row.inputs.bodyMassKg < columnFilters.mass.min || row.inputs.bodyMassKg > columnFilters.mass.max) {
        return false;
      }
      if (row.inputs.sittingHeightCm < columnFilters.sitting.min || row.inputs.sittingHeightCm > columnFilters.sitting.max) {
        return false;
      }

      // Filtros de maduracion
      if (columnFilters.band.length > 0 && !columnFilters.band.includes(row.classification.maturityBand)) {
        return false;
      }
      if (row.classification.primaryOffset < columnFilters.offset.min || row.classification.primaryOffset > columnFilters.offset.max) {
        return false;
      }
      if (row.methodOutputs.mooreAphv < columnFilters.moore.min || row.methodOutputs.mooreAphv > columnFilters.moore.max) {
        return false;
      }
      const pah = row.methodOutputs.percentageAdultHeight;
      if (pah !== null && (pah < columnFilters.pah.min || pah > columnFilters.pah.max)) {
        return false;
      }
      if (row.methodOutputs.mirwaldOffset < columnFilters.mirwald.min || row.methodOutputs.mirwaldOffset > columnFilters.mirwald.max) {
        return false;
      }

      return true;
    });
  }, [filteredRows, state.athletes, columnFilters]);

  const toggleTeamFilter = (team: string) => {
    setColumnFilters(prev => ({
      ...prev,
      team: prev.team.includes(team)
        ? prev.team.filter(t => t !== team)
        : [...prev.team, team]
    }));
  };

  const togglePositionFilter = (position: string) => {
    setColumnFilters(prev => ({
      ...prev,
      position: prev.position.includes(position)
        ? prev.position.filter(p => p !== position)
        : [...prev.position, position]
    }));
  };

  const toggleBandFilter = (band: string) => {
    setColumnFilters(prev => ({
      ...prev,
      band: prev.band.includes(band)
        ? prev.band.filter(b => b !== band)
        : [...prev.band, band]
    }));
  };

  const maturityBands = useMemo(() => {
    const bands = new Set(filteredRows.map((r) => r.classification.maturityBand));
    return Array.from(bands).sort();
  }, [filteredRows]);

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleTeamClick = (team: string | null) => {
    setSelectedTeam(team);
    if (team) {
      // Selecting a specific team: clear the team column filter and set this team
      setColumnFilters((prev) => ({ ...prev, team: [team] }));
    } else {
      // "All" selected: clear the team column filter
      setColumnFilters((prev) => ({ ...prev, team: [] }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Team quick filter buttons */}
      {teams.length > 0 && (
        <section className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => handleTeamClick(null)}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
              selectedTeam === null
                ? "bg-accent text-white shadow"
                : "bg-white border border-line text-zinc-600 hover:bg-white/80"
            )}
          >
            {t("datahub.allTeams")}
          </button>
          {teams.map((team) => (
            <button
              key={team}
              type="button"
              onClick={() => handleTeamClick(team)}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                selectedTeam === team
                  ? "bg-accent text-white shadow"
                  : "bg-white border border-line text-zinc-600 hover:bg-white/80"
              )}
            >
              {team}
            </button>
          ))}
        </section>
      )}

      {/* Filtros globales */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-700">{t("datahub.viewLabel")}:</span>
          <div className="flex gap-2">
            {[
              { key: "anthropometric", label: t("datahub.viewAnthropometric") },
              { key: "maturation", label: t("datahub.viewMaturation") },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setViewMode((prev) => ({
                  ...prev,
                  [option.key]: !prev[option.key as keyof typeof prev],
                }))}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  viewMode[option.key as keyof typeof viewMode]
                    ? "bg-accent text-white"
                    : "bg-white/70 text-zinc-700 hover:bg-white"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setEditingAthleteId(null); setMaturationForm({ ...emptyForm, clubName: state.club.name }); setShowAddPlayerModal(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            <UserPlus className="h-4 w-4" />
            {t("datahub.addPlayer")}
          </button>
          <button
            onClick={() => setShowAddMeasurementModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus className="h-4 w-4" />
            {t("datahub.addMeasurementTitle")}
          </button>
        </div>
      </section>

      {/* Tabla de datos */}
      <section className="panel rounded-[1.75rem] p-6 overflow-visible">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{t("datahub.playersListTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600">{t("datahub.clickHeaderHint")}</p>
        </div>

        <div className="table-scroll overflow-x-auto overflow-visible">
          <table className="min-w-[1450px] text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-line px-3 py-3"></th>
{viewMode.anthropometric && (
                  <th className="border-b border-line bg-white/70 px-3 py-3 text-xs uppercase tracking-[0.18em] text-zinc-600" colSpan={7}>
                    {t("datahub.anthropometrics")}
                  </th>
                )}
{viewMode.maturation && (
                  <th className="border-b border-line bg-white/70 px-3 py-3 text-xs uppercase tracking-[0.18em] text-zinc-600" colSpan={5}>
{t("maturation")}
                  </th>
                )}
              </tr>
              <tr className="text-zinc-600">
  <th className="border-b border-line px-3 py-3 relative group">
                  <button
                    onClick={() => setShowColumnFilter(showColumnFilter === "athlete" ? null : "athlete")}
                    className="flex items-center gap-1 hover:text-accent"
                  >
                    {t("datahub.player")}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showColumnFilter === "athlete" && (
                    <div className="absolute left-0 z-10 mt-1 min-w-[18rem] w-72 h-64 rounded-lg border border-line bg-white p-3 shadow-lg">
                      <input
                        type="text"
                        placeholder={t("datahub.searchPlayerPlaceholder")}
                        value={athleteSearch}
                        onChange={(e) => setAthleteSearch(e.target.value)}
                        className="w-full rounded border border-line px-3 py-2 text-sm placeholder:text-zinc-500"
                      />
                      <div className="mt-3 h-48 space-y-2 overflow-y-auto">
                        {state.athletes
                          .filter((athlete) =>
                            athlete.name.toLowerCase().includes(athleteSearch.toLowerCase()),
                          )
                          .slice(0, 12)
                          .map((athlete) => {
                            const checked = columnFilters.athlete.includes(athlete.name);
                            return (
                              <label
                                key={athlete.id}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-zinc-700 hover:bg-accent/10"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAthleteFilter(athlete.name)}
                                  className="h-4 w-4 rounded border-line text-accent"
                                />
                                <span>{athlete.name}</span>
                              </label>
                            );
                          })}
                        {state.athletes.filter((athlete) => athlete.name.toLowerCase().includes(athleteSearch.toLowerCase())).length === 0 && (
                          <p className="text-sm text-zinc-500">{t("datahub.noMatches")}</p>
                        )}
                      </div>
                      {columnFilters.athlete.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {columnFilters.athlete.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleAthleteFilter(name)}
                              className="rounded-full border border-line bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
                            >
                              {name} \u00d7
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </th>
                {viewMode.anthropometric && (
                  <>
                    <th className="relative border-b border-line bg-white/60 px-3 py-3">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "team" ? null : "team")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.team")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "team" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-48 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-2">
                            {teams.map((team) => (
                              <label key={team} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={columnFilters.team.includes(team)}
                                  onChange={() => toggleTeamFilter(team)}
                                  className="rounded"
                                />
                                <span className="text-sm">{team}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="relative border-b border-line bg-white/60 px-3 py-3">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "position" ? null : "position")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.position")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "position" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-48 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-2">
                            {positions.map((position) => (
                              <label key={position} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={columnFilters.position.includes(position)}
                                  onChange={() => togglePositionFilter(position)}
                                  className="rounded"
                                />
                                <span className="text-sm">{position}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-b border-line bg-white/60 px-3 py-3">{t("datahub.birthDate")}</th>
                    <th className="border-b border-line bg-white/60 px-3 py-3">{t("datahub.measurement")}</th>
                    <th className="relative border-b border-line bg-white/60 px-3 py-3">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "age" ? null : "age")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.age")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "age" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>{t("datahub.age")}</span>
                              <span>{columnFilters.age.min} - {columnFilters.age.max} {t("datahub.years")}</span>
                            </div>
                            <Range
                              step={1}
                              min={FILTER_RANGES.age.min}
                              max={FILTER_RANGES.age.max}
                              values={[columnFilters.age.min, columnFilters.age.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, age: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.age.max - FILTER_RANGES.age.min;
                                const leftPct = ((columnFilters.age.min - FILTER_RANGES.age.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.age.max - FILTER_RANGES.age.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="relative border-b border-line bg-white/60 px-3 py-3">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "stature" ? null : "stature")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.stature")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "stature" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>{t("datahub.statureFilter")}</span>
                              <span>{columnFilters.stature.min} - {columnFilters.stature.max} cm</span>
                            </div>
                            <Range
                              step={1}
                              min={FILTER_RANGES.stature.min}
                              max={FILTER_RANGES.stature.max}
                              values={[columnFilters.stature.min, columnFilters.stature.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, stature: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.stature.max - FILTER_RANGES.stature.min;
                                const leftPct = ((columnFilters.stature.min - FILTER_RANGES.stature.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.stature.max - FILTER_RANGES.stature.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="relative border-b border-line bg-white/60 px-3 py-3">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "mass" ? null : "mass")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.massSitting")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "mass" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>{t("datahub.massFilter")}</span>
                              <span>{columnFilters.mass.min} - {columnFilters.mass.max} kg</span>
                            </div>
                            <Range
                              step={1}
                              min={FILTER_RANGES.mass.min}
                              max={FILTER_RANGES.mass.max}
                              values={[columnFilters.mass.min, columnFilters.mass.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, mass: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.mass.max - FILTER_RANGES.mass.min;
                                const leftPct = ((columnFilters.mass.min - FILTER_RANGES.mass.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.mass.max - FILTER_RANGES.mass.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>{t("datahub.sittingFilter")}</span>
                              <span>{columnFilters.sitting.min} - {columnFilters.sitting.max} cm</span>
                            </div>
                            <Range
                              step={1}
                              min={FILTER_RANGES.sitting.min}
                              max={FILTER_RANGES.sitting.max}
                              values={[columnFilters.sitting.min, columnFilters.sitting.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, sitting: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.sitting.max - FILTER_RANGES.sitting.min;
                                const leftPct = ((columnFilters.sitting.min - FILTER_RANGES.sitting.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.sitting.max - FILTER_RANGES.sitting.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                  </>
                )}
                {viewMode.maturation && (
                  <>
                    <th className="border-b border-line bg-[#eaf4f2] px-3 py-3 relative group">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "band" ? null : "band")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.group")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "band" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-48 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-2">
                            {maturityBands.map((band) => (
                              <label key={band} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={columnFilters.band.includes(band)}
                                  onChange={() => toggleBandFilter(band)}
                                  className="rounded"
                                />
                                <span className="text-sm">{band}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-b border-line bg-[#eaf4f2] px-3 py-3 relative group">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "offset" ? null : "offset")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        {t("datahub.offset")}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "offset" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>{t("datahub.offset")}</span>
                              <span>{columnFilters.offset.min} - {columnFilters.offset.max}</span>
                            </div>
                            <Range
                              step={0.5}
                              min={FILTER_RANGES.offset.min}
                              max={FILTER_RANGES.offset.max}
                              values={[columnFilters.offset.min, columnFilters.offset.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, offset: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.offset.max - FILTER_RANGES.offset.min;
                                const leftPct = ((columnFilters.offset.min - FILTER_RANGES.offset.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.offset.max - FILTER_RANGES.offset.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-b border-line bg-[#eaf4f2] px-3 py-3 relative group">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "moore" ? null : "moore")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        Moore APHV
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "moore" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>Moore APHV</span>
                              <span>{columnFilters.moore.min} - {columnFilters.moore.max}</span>
                            </div>
                            <Range
                              step={0.5}
                              min={FILTER_RANGES.moore.min}
                              max={FILTER_RANGES.moore.max}
                              values={[columnFilters.moore.min, columnFilters.moore.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, moore: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.moore.max - FILTER_RANGES.moore.min;
                                const leftPct = ((columnFilters.moore.min - FILTER_RANGES.moore.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.moore.max - FILTER_RANGES.moore.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-b border-line bg-[#eaf4f2] px-3 py-3 relative group">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "pah" ? null : "pah")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        % PAH
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "pah" && (
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>% PAH</span>
                              <span>{columnFilters.pah.min} - {columnFilters.pah.max}%</span>
                            </div>
                            <Range
                              step={1}
                              min={FILTER_RANGES.pah.min}
                              max={FILTER_RANGES.pah.max}
                              values={[columnFilters.pah.min, columnFilters.pah.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, pah: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.pah.max - FILTER_RANGES.pah.min;
                                const leftPct = ((columnFilters.pah.min - FILTER_RANGES.pah.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.pah.max - FILTER_RANGES.pah.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-b border-line bg-[#eaf4f2] px-3 py-3 relative group">
                      <button
                        onClick={() => setShowColumnFilter(showColumnFilter === "mirwald" ? null : "mirwald")}
                        className="flex items-center gap-1 hover:text-accent"
                      >
                        Mirwald
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      {showColumnFilter === "mirwald" && (
                        <div className="absolute right-0 left-auto z-10 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-zinc-600">
                              <span>Mirwald</span>
                              <span>{columnFilters.mirwald.min} - {columnFilters.mirwald.max}</span>
                            </div>
                            <Range
                              step={0.5}
                              min={FILTER_RANGES.mirwald.min}
                              max={FILTER_RANGES.mirwald.max}
                              values={[columnFilters.mirwald.min, columnFilters.mirwald.max]}
                              onChange={(values) => setColumnFilters((prev) => ({ ...prev, mirwald: { min: values[0], max: values[1] } }))}
                              renderTrack={({ props, children }) => {
                                const range = FILTER_RANGES.mirwald.max - FILTER_RANGES.mirwald.min;
                                const leftPct = ((columnFilters.mirwald.min - FILTER_RANGES.mirwald.min) / range) * 100;
                                const rightPct = 100 - ((columnFilters.mirwald.max - FILTER_RANGES.mirwald.min) / range) * 100;
                                return (
                                  <div {...props} className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute inset-0 rounded-full" style={{ left: `${leftPct}%`, right: `${rightPct}%`, background: "hsl(174 60% 40% / 0.35)" }} />
                                    {children}
                                  </div>
                                );
                              }}
                              renderThumb={({ props, isDragged }) => {
                                const { key, ...rest } = props;
                                return <div key={key} {...rest} className={cn("h-4 w-4 bg-accent rounded-full border-2 border-white shadow", isDragged && "shadow-lg")} />;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody suppressHydrationWarning>
              {filteredData.map((row) => {
                const athlete = state.athletes.find((candidate) => candidate.id === row.inputs.athleteId);
                const history = assessments
                  .filter((item) => item.inputs.athleteId === row.inputs.athleteId)
                  .sort((a, b) => b.inputs.dataCollectionDate.localeCompare(a.inputs.dataCollectionDate));
                const open = expandedAthleteId === row.inputs.athleteId;
                return (
                  <Fragment key={row.inputs.id}>
                    <tr key={row.inputs.id} className="cursor-pointer border-t border-line/70 hover:bg-white/50 group" onClick={() => setExpandedAthleteId(open ? null : row.inputs.athleteId)}>
                      <td className="px-3 py-3 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          {open ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />}
                          {row.inputs.athleteName}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditForAthlete(row.inputs.athleteId); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent/10 text-zinc-400 hover:text-accent transition"
                            aria-label={`Edit ${row.inputs.athleteName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      {viewMode.anthropometric && (
                        <>
                          <td className="bg-white/35 px-3 py-3 text-ink-soft">{row.inputs.teamName ?? "--"}</td>
                          <td className="bg-white/35 px-3 py-3 text-ink-soft">{athlete?.position ?? row.inputs.position ?? "--"}</td>
                          <td className="bg-white/35 px-3 py-3 text-ink-soft">{formatDate(row.inputs.dob)}</td>
                          <td className="bg-white/35 px-3 py-3 text-ink-soft">{formatDate(row.inputs.dataCollectionDate)}</td>
                          <td className="bg-white/35 px-3 py-3">{formatNumber(row.derivedMetrics.chronologicalAge, 2)}</td>
                          <td className="bg-white/35 px-3 py-3">{formatNumber(row.inputs.statureCm, 1)} cm</td>
                          <td className="bg-white/35 px-3 py-3">{formatNumber(row.inputs.bodyMassKg, 1)} kg / {formatNumber(row.inputs.sittingHeightCm, 1)} cm</td>
                        </>
                      )}
                      {viewMode.maturation && (
                        <>
                          <td className="bg-[#eaf4f2] px-3 py-3 font-medium">{row.classification.maturityBand}</td>
                          <td className="bg-[#eaf4f2] px-3 py-3">{formatNumber(row.classification.primaryOffset, 2)}</td>
                          <td className="bg-[#eaf4f2] px-3 py-3">{formatNumber(row.methodOutputs.mooreAphv, 2)}</td>
                          <td className="bg-[#eaf4f2] px-3 py-3">{formatNumber(row.methodOutputs.percentageAdultHeight, 2)}</td>
                          <td className="bg-[#eaf4f2] px-3 py-3">{formatNumber(row.methodOutputs.mirwaldOffset, 2)}</td>
                        </>
                      )}
                    </tr>
                    {open ? <HistoryRow history={history} /> : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Add Player */}
      {showAddPlayerModal && (
        <ModalShell
          title={t("datahub.addNewPlayerTitle")}
          body={t("datahub.addNewPlayerBody")}
          onClose={() => setShowAddPlayerModal(false)}
          downloadTemplate={downloadPlayersTemplate}
          downloadLabel={t("common.downloadTemplate")}
          uploadLabel={t("datahub.uploadExcel")}
          fileRef={playersFileRef}
          onUploadClick={() => playersFileRef.current?.click()}
          onUploadChange={importPlayersFile}
          feedback={feedback}
          t={t}
        >
          <form onSubmit={saveMaturation} className="space-y-6" noValidate>
            <AddPlayerFormBody
              maturationForm={maturationForm}
              setMaturationValue={setMaturationValue}
              onCancel={() => setShowAddPlayerModal(false)}
              t={t}
            />
          </form>
        </ModalShell>
      )}

      {/* Modal: Add Measurement */}
      {showAddMeasurementModal && (
        <ModalShell
          title={t("datahub.addMeasurementTitle")}
          body={t("datahub.addMeasurementBody")}
          onClose={() => { setShowAddMeasurementModal(false); setEditingAthleteId(null); }}
          downloadTemplate={downloadMeasurementsTemplate}
          downloadLabel={t("common.downloadTemplate")}
          uploadLabel={t("datahub.uploadExcel")}
          fileRef={measurementsFileRef}
          onUploadClick={() => measurementsFileRef.current?.click()}
          onUploadChange={importMeasurementsFile}
          feedback={feedback}
          t={t}
        >
          <form onSubmit={saveMaturation} className="space-y-6" noValidate>
            <AthleteSelector
              editingAthleteId={editingAthleteId}
              setEditingAthleteId={setEditingAthleteId}
              athletes={state.athletes}
              setMaturationForm={setMaturationForm}
              emptyForm={emptyForm}
              clubName={state.club.name}
              t={t}
            />
            <AddMeasurementFormBody
              maturationForm={maturationForm}
              setMaturationValue={setMaturationValue}
              onCancel={() => { setShowAddMeasurementModal(false); setEditingAthleteId(null); }}
              t={t}
            />
          </form>
        </ModalShell>
      )}

      {/* Modal: Edit Player */}
      {showEditPlayerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onKeyDown={(e) => { if (e.key === "Escape") { setShowEditPlayerModal(false); setEditingAthleteId(null); } }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-6">
              <h3 id="edit-modal-title" className="text-xl font-semibold">{t("datahub.editPlayerTitle")}</h3>
              <p className="text-sm text-zinc-600">{t("datahub.editPlayerBody")}</p>
              <button
                type="button"
                onClick={() => { setShowEditPlayerModal(false); setEditingAthleteId(null); }}
                className="absolute top-0 right-0 rounded-full p-1 text-red-500 hover:bg-red-50 transition"
                aria-label={t("datahub.close")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={saveEditPlayer} className="space-y-6" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="edit-player-name" className="block text-sm font-medium text-zinc-700">{t("datahub.playerName")}</label>
                  <input
                    id="edit-player-name"
                    type="text"
                    readOnly
                    value={maturationForm.athleteName}
                    className="mt-1 w-full rounded-lg border border-line bg-zinc-50 px-3 py-2 text-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label htmlFor="edit-player-sex" className="block text-sm font-medium text-zinc-700">{t("datahub.sex")}</label>
                  <select
                    id="edit-player-sex"
                    value={maturationForm.sex}
                    onChange={(e) => setMaturationValue("sex", e.target.value as "male" | "female")}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-sans"
                  >
                    <option value="male">{t("datahub.male")}</option>
                    <option value="female">{t("datahub.female")}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-player-age-group" className="block text-sm font-medium text-zinc-700">{t("datahub.ageGroup")}</label>
                  <input
                    id="edit-player-age-group"
                    type="text"
                    value={maturationForm.ageGroup}
                    onChange={(e) => setMaturationValue("ageGroup", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 placeholder:text-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label htmlFor="edit-player-team" className="block text-sm font-medium text-zinc-700">{t("datahub.team")}</label>
                  <input
                    id="edit-player-team"
                    type="text"
                    value={maturationForm.teamName || ""}
                    onChange={(e) => setMaturationValue("teamName", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 placeholder:text-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label htmlFor="edit-player-position" className="block text-sm font-medium text-zinc-700">{t("datahub.position")}</label>
                  <input
                    id="edit-player-position"
                    type="text"
                    value={maturationForm.position || ""}
                    onChange={(e) => setMaturationValue("position", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 placeholder:text-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label htmlFor="edit-player-dob" className="block text-sm font-medium text-zinc-700">{t("datahub.birthDate")}</label>
                  <input
                    id="edit-player-dob"
                    type="date"
                    value={maturationForm.dob}
                    onChange={(e) => setMaturationValue("dob", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 placeholder:text-zinc-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditPlayerModal(false); setEditingAthleteId(null); }}
                  className="rounded-lg border border-line px-4 py-2 text-zinc-700 hover:bg-gray-50"
                >
                  {t("datahub.cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent/90"
                >
                  {t("datahub.savePlayer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalShell({
  title,
  body,
  onClose,
  downloadTemplate,
  downloadLabel,
  uploadLabel,
  fileRef,
  onUploadClick,
  onUploadChange,
  feedback,
  t,
  children,
}: {
  title: string;
  body: string;
  onClose: () => void;
  downloadTemplate: () => void;
  downloadLabel: string;
  uploadLabel: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onUploadClick: () => void;
  onUploadChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  feedback: string;
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative">
          <div>
            <h3 id="modal-title" className="text-xl font-semibold">{title}</h3>
            <p className="text-sm text-zinc-600">{body}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
              aria-label={downloadLabel}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              {downloadLabel}
            </button>
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 transition hover:bg-emerald-100"
              aria-label={uploadLabel}
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {uploadLabel}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onUploadChange} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 rounded-full p-1 text-red-500 hover:bg-red-50 transition"
            aria-label={t("datahub.close")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
        {feedback && (
          <div className="mt-4 rounded-lg border border-line bg-white/70 px-4 py-3 text-sm text-zinc-700">
            {feedback === "saved" ? t("datahub.playerAddedOk") : feedback === "duplicate" ? t("datahub.measurementExists") : feedback}
          </div>
        )}
      </div>
    </div>
  );
}

function AddPlayerFormBody({
  maturationForm,
  setMaturationValue,
  onCancel,
  t,
}: {
  maturationForm: AnthropometricRecordInput;
  setMaturationValue: <K extends keyof AnthropometricRecordInput>(key: K, value: AnthropometricRecordInput[K]) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("datahub.playerName")}>
          <input type="text" required placeholder={t("datahub.examplePlayerName")} value={maturationForm.athleteName} onChange={(e) => setMaturationValue("athleteName", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700 font-sans" />
        </Field>
        <Field label={t("datahub.sex")}>
          <select required value={maturationForm.sex} onChange={(e) => setMaturationValue("sex", e.target.value as "male" | "female")} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700 font-sans">
            <option value="male">{t("datahub.male")}</option>
            <option value="female">{t("datahub.female")}</option>
          </select>
        </Field>
        <Field label={t("datahub.ageGroup")}>
          <input type="text" required placeholder={t("datahub.exampleAgeGroup")} value={maturationForm.ageGroup} onChange={(e) => setMaturationValue("ageGroup", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.team")}>
          <input type="text" placeholder={t("datahub.exampleTeam")} value={maturationForm.teamName || ""} onChange={(e) => setMaturationValue("teamName", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.position")}>
          <input type="text" placeholder={t("datahub.examplePosition")} value={maturationForm.position || ""} onChange={(e) => setMaturationValue("position", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.birthDate")}>
          <input type="date" required value={maturationForm.dob} onChange={(e) => setMaturationValue("dob", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.measurement")}>
          <input type="date" required value={maturationForm.dataCollectionDate} onChange={(e) => setMaturationValue("dataCollectionDate", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.statureCm")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleStature")} value={maturationForm.statureCm || ""} onChange={(e) => setMaturationValue("statureCm", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.bodyMassKg")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleMass")} value={maturationForm.bodyMassKg || ""} onChange={(e) => setMaturationValue("bodyMassKg", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.sittingHeightCm")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleSittingHeight")} value={maturationForm.sittingHeightCm || ""} onChange={(e) => setMaturationValue("sittingHeightCm", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.motherHeightCm")}>
          <input type="number" step="0.1" placeholder={t("datahub.exampleParentHeight")} value={maturationForm.motherHeightCm || ""} onChange={(e) => setMaturationValue("motherHeightCm", parseFloat(e.target.value) || null)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.fatherHeightCm")}>
          <input type="number" step="0.1" placeholder={t("datahub.exampleParentHeight")} value={maturationForm.fatherHeightCm || ""} onChange={(e) => setMaturationValue("fatherHeightCm", parseFloat(e.target.value) || null)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-zinc-700 hover:bg-gray-50">{t("datahub.cancel")}</button>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent/90">{t("datahub.savePlayer")}</button>
      </div>
    </>
  );
}

function AthleteSelector({
  editingAthleteId,
  setEditingAthleteId,
  athletes,
  setMaturationForm,
  emptyForm,
  clubName,
  t,
}: {
  editingAthleteId: string | null;
  setEditingAthleteId: (id: string | null) => void;
  athletes: Array<{ id: string; name: string; sex: string; ageGroup: string; teamName?: string; position?: string; dob: string }>;
  setMaturationForm: (form: AnthropometricRecordInput) => void;
  emptyForm: AnthropometricRecordInput;
  clubName: string;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-4">
      <Field label={t("datahub.selectAthlete")}>
        <select
          value={editingAthleteId ?? ""}
          onChange={(e) => {
            const athlete = athletes.find((a) => a.id === e.target.value);
            if (athlete) {
              setEditingAthleteId(athlete.id);
              setMaturationForm({
                ...emptyForm,
                athleteName: athlete.name,
                sex: athlete.sex as "male" | "female",
                ageGroup: athlete.ageGroup,
                clubName,
                teamName: athlete.teamName,
                position: athlete.position,
                dob: athlete.dob,
              });
            }
          }}
          className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700 font-sans"
        >
          <option value="" disabled>{t("datahub.selectAthlete")}</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function AddMeasurementFormBody({
  maturationForm,
  setMaturationValue,
  onCancel,
  t,
}: {
  maturationForm: AnthropometricRecordInput;
  setMaturationValue: <K extends keyof AnthropometricRecordInput>(key: K, value: AnthropometricRecordInput[K]) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("datahub.measurement")}>
          <input type="date" required value={maturationForm.dataCollectionDate} onChange={(e) => setMaturationValue("dataCollectionDate", e.target.value)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.statureCm")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleStature")} value={maturationForm.statureCm || ""} onChange={(e) => setMaturationValue("statureCm", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.bodyMassKg")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleMass")} value={maturationForm.bodyMassKg || ""} onChange={(e) => setMaturationValue("bodyMassKg", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
        <Field label={t("datahub.sittingHeightCm")}>
          <input type="number" step="0.1" required placeholder={t("datahub.exampleSittingHeight")} value={maturationForm.sittingHeightCm || ""} onChange={(e) => setMaturationValue("sittingHeightCm", parseFloat(e.target.value) || 0)} className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700" />
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-zinc-700 hover:bg-gray-50">{t("datahub.cancel")}</button>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent/90">{t("datahub.savePlayer")}</button>
      </div>
    </>
  );
}

function HistoryRow({
  history,
}: {
  history: ReturnType<typeof useAppState>["assessments"];
}) {
  const { t } = useLocale();
  return (
    <tr>
      <td colSpan={13} className="border-t border-line/50 bg-white/55 px-5 py-5">
        <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900">{t("datahub.historyMeasurements")}</h3>
            <p className="text-xs text-ink-soft">{history.length} {t("datahub.measurementsRegistered")}</p>
          </div>
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="border-b border-line px-3 py-2">{t("datahub.date")}</th>
                  <th className="border-b border-line px-3 py-2">Stature</th>
                  <th className="border-b border-line px-3 py-2">Mass</th>
                  <th className="border-b border-line px-3 py-2">Sitting</th>
                  <th className="border-b border-line px-3 py-2">{t("datahub.group")}</th>
                  <th className="border-b border-line px-3 py-2">{t("datahub.offset")}</th>
                  <th className="border-b border-line px-3 py-2">% PAH</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.inputs.id} className="border-t border-line/50">
                    <td className="px-3 py-2">{formatDate(item.inputs.dataCollectionDate)}</td>
                    <td className="px-3 py-2">{formatNumber(item.inputs.statureCm, 1)} cm</td>
                    <td className="px-3 py-2">{formatNumber(item.inputs.bodyMassKg, 1)} kg</td>
                    <td className="px-3 py-2">{formatNumber(item.inputs.sittingHeightCm, 1)} cm</td>
                    <td className="px-3 py-2">{item.classification.maturityBand}</td>
                    <td className="px-3 py-2">{formatNumber(item.classification.primaryOffset, 2)}</td>
                    <td className="px-3 py-2">{formatNumber(item.methodOutputs.percentageAdultHeight, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
    </label>
  );
}
