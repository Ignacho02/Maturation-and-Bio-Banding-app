"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAppState } from "@/lib/store/app-state";
import { cn } from "@/lib/utils";
import { Beaker, Plus, Trash2, Users, Palette, Shield, Edit2, Search, X } from "lucide-react";
import type { PerformanceArea, PerformanceDefinition } from "@/lib/types";
import { performancePresets, performanceAreaLabels } from "./performance-constants";

export function ClubSection() {
  const { t } = useLocale();
  const { state, addTeam, updateTeam, deleteTeam, addAthlete, updateAthlete, deleteAthlete, updateClub, addPerformanceDefinition, updatePerformanceDefinition, deletePerformanceDefinition } = useAppState();
  const [activeTab, setActiveTab] = useState<"structure" | "testBattery" | "settings">("structure");
  const [structureSubTab, setStructureSubTab] = useState<"teams" | "players">("players");
  const [testBatteryArea, setTestBatteryArea] = useState<PerformanceArea>("physical");
  const [showAddTestForm, setShowAddTestForm] = useState(false);
  const [newDef, setNewDef] = useState({ name: "", unit: "", attempts: 1, isRating: false, calculation: "best_min" as "best_min" | "best_max" | "average", description: "", mediaUrl: "", mediaType: undefined as "image" | "video" | undefined });

  const testDefs = state.performanceDefinitions;

  function addDef(e: React.FormEvent) {
    e.preventDefault();
    const n = newDef.name.trim(), u = newDef.unit.trim();
    if (!n || !u) return;
    addPerformanceDefinition({
      name: n,
      area: testBatteryArea,
      unit: u,
      attempts: newDef.attempts,
      isRating: newDef.isRating,
      calculation: newDef.calculation,
      description: newDef.description || undefined,
      mediaUrl: newDef.mediaUrl || undefined,
      mediaType: newDef.mediaType,
    });
    setNewDef({ name: "", unit: "", attempts: 1, isRating: false, calculation: "best_min", description: "", mediaUrl: "", mediaType: undefined });
    setShowAddTestForm(false);
  }

  function delDef(id: string) {
    deletePerformanceDefinition(id);
  }

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { setNewDef(c => ({ ...c, mediaUrl: ev.target?.result as string, mediaType: type })); };
    r.readAsDataURL(f);
  }

  const areaTestDefs = testDefs.filter(d => d.area === testBatteryArea);

  return (
    <div className="space-y-6">
      {/* Main tab navigation - grouped */}
      <div className="flex gap-2">
        {[
          { id: "structure" as const, icon: Users, label: t("club.structure") },
          { id: "testBattery" as const, icon: Beaker, label: t("club.testBattery") },
          { id: "settings" as const, icon: Palette, label: t("club.settings") },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "bg-white border border-line text-zinc-600 hover:bg-zinc-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab navigation for Structure */}
      {activeTab === "structure" && (
        <div className="flex gap-2 ml-2">
          {[
            { id: "players" as const, label: t("club.players") },
            { id: "teams" as const, label: t("club.teams") },
          ].map((subTab) => (
            <button
              key={subTab.id}
              type="button"
              onClick={() => setStructureSubTab(subTab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition",
                structureSubTab === subTab.id
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {subTab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "structure" && structureSubTab === "teams" && (
        <TeamsTab teams={state.teams} addTeam={addTeam} updateTeam={updateTeam} deleteTeam={deleteTeam} />
      )}
      {activeTab === "structure" && structureSubTab === "players" && (
        <PlayersTab
          athletes={state.athletes}
          teams={state.teams}
          addAthlete={addAthlete as (a: { name: string; sex: "male" | "female"; ageGroup: string; clubName: string; teamName?: string; teamId?: string; position?: string; dob: string }) => void}
          updateAthlete={updateAthlete as (id: string, updates: { name?: string; sex?: "male" | "female"; ageGroup?: string; teamName?: string; teamId?: string; position?: string; dob?: string }) => void}
          deleteAthlete={deleteAthlete}
        />
      )}
      {activeTab === "testBattery" && (
        <TestBatteryTab
          testBatteryArea={testBatteryArea}
          setTestBatteryArea={setTestBatteryArea}
          showAddTestForm={showAddTestForm}
          setShowAddTestForm={setShowAddTestForm}
          newDef={newDef}
          setNewDef={setNewDef}
          areaTestDefs={areaTestDefs}
          addDef={addDef}
          delDef={delDef}
          handleMedia={handleMedia}
          t={t}
        />
      )}
      {activeTab === "settings" && (
        <SettingsTab club={state.club} updateClub={updateClub} />
      )}
    </div>
  );
}

function TeamsTab({
  teams,
  addTeam,
  updateTeam,
  deleteTeam,
}: {
  teams: Array<{ id: string; name: string; ageGroup: string; clubId: string }>;
  addTeam: (team: { name: string; ageGroup: string; clubId: string }) => void;
  updateTeam: (id: string, updates: { name?: string; ageGroup?: string }) => void;
  deleteTeam: (id: string) => void;
}) {
  const { t } = useLocale();
  const { state } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("club.teams")}</h2>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          {t("club.addTeam")}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-line bg-white p-4 space-y-3">
          <input
            type="text"
            placeholder={t("club.teamNamePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder={t("club.ageGroupPlaceholder")}
            value={newAgeGroup}
            onChange={(e) => setNewAgeGroup(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (newName.trim()) {
                  addTeam({ name: newName.trim(), ageGroup: newAgeGroup.trim(), clubId: state.club.id });
                  setNewName("");
                  setNewAgeGroup("");
                  setShowAdd(false);
                }
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-600"
            >
              {t("datahub.cancel")}
            </button>
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <p className="text-sm text-zinc-500">{t("club.noTeams")}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-900">{team.name}</h3>
              <button
                type="button"
                onClick={() => deleteTeam(team.id)}
                className="rounded-full p-1 hover:bg-red-50 text-red-500 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-500">{t("club.ageGroup")}: {team.ageGroup}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersTab({
  athletes,
  teams,
  addAthlete,
  updateAthlete,
  deleteAthlete,
}: {
  athletes: Array<{ id: string; name: string; sex: string; ageGroup: string; teamName?: string; position?: string; dob: string; clubName: string; teamId?: string }>;
  teams: Array<{ id: string; name: string }>;
  addAthlete: (a: { name: string; sex: "male" | "female"; ageGroup: string; clubName: string; teamName?: string; teamId?: string; position?: string; dob: string }) => void;
  updateAthlete: (id: string, updates: { name?: string; sex?: "male" | "female"; ageGroup?: string; teamName?: string; teamId?: string; position?: string; dob?: string }) => void;
  deleteAthlete: (id: string) => void;
}) {
  const { t } = useLocale();
  const { state } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [ageGroup, setAgeGroup] = useState("");
  const [teamId, setTeamId] = useState("");
  const [position, setPosition] = useState("");
  const [dob, setDob] = useState("");
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");

  // Get unique positions for filter
  const positions = Array.from(new Set(athletes.map(a => a.position).filter(Boolean))) as string[];

  // Filter athletes
  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === "all" || a.teamId === filterTeam;
    const matchesPosition = filterPosition === "all" || a.position === filterPosition;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  function openEdit(athlete: typeof athletes[0]) {
    setEditingId(athlete.id);
    setName(athlete.name);
    setSex(athlete.sex as "male" | "female");
    setAgeGroup(athlete.ageGroup);
    setTeamId(athlete.teamId || "");
    setPosition(athlete.position || "");
    setDob(athlete.dob);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setSex("male");
    setAgeGroup("");
    setTeamId("");
    setPosition("");
    setDob("");
  }

  function saveEdit() {
    if (!editingId || !name.trim() || !ageGroup.trim() || !dob.trim()) return;
    
    const team = teams.find((t) => t.id === teamId);
    updateAthlete(editingId, {
      name: name.trim(),
      sex,
      ageGroup: ageGroup.trim(),
      teamName: team?.name,
      teamId: team?.id,
      position: position.trim() || undefined,
      dob: dob.trim(),
    });
    cancelEdit();
  }

  function openAdd() {
    setName("");
    setSex("male");
    setAgeGroup("");
    setTeamId("");
    setPosition("");
    setDob("");
    setShowAdd(true);
  }

  function saveAdd() {
    if (!name.trim() || !ageGroup.trim() || !dob.trim()) return;
    
    const team = teams.find((t) => t.id === teamId);
    addAthlete({
      name: name.trim(),
      sex,
      ageGroup: ageGroup.trim(),
      clubName: state.club.name,
      teamName: team?.name,
      teamId: team?.id,
      position: position.trim() || undefined,
      dob: dob.trim(),
    });
    setName("");
    setSex("male");
    setAgeGroup("");
    setTeamId("");
    setPosition("");
    setDob("");
    setShowAdd(false);
  }

  const hasActiveFilters = searchQuery || filterTeam !== "all" || filterPosition !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("club.players")}</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          {t("club.addPlayer")}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-line bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("datahub.searchPlayerPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterTeam("all");
                setFilterPosition("all");
              }}
              className="rounded-lg border border-line px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            <option value="all">{t("datahub.allTeams")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            <option value="all">{t("datahub.position")}</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-line bg-white p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t("datahub.playerName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as "male" | "female")}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="male">{t("datahub.male")}</option>
              <option value="female">{t("datahub.female")}</option>
            </select>
            <input
              type="text"
              placeholder={t("datahub.ageGroup")}
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">{t("club.selectTeam")}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t("datahub.position")}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveAdd}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-zinc-600"
            >
              {t("datahub.cancel")}
            </button>
          </div>
        </div>
      )}

      {filteredAthletes.length === 0 && (
        <p className="text-sm text-zinc-500">
          {hasActiveFilters ? t("datahub.noMatches") : t("club.noPlayers")}
        </p>
      )}

      <div className="rounded-xl border border-line bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-50">
              <th className="text-left px-4 py-3 font-medium text-zinc-600">{t("datahub.playerName")}</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">{t("datahub.sex")}</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">{t("datahub.team")}</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">{t("datahub.position")}</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">{t("datahub.birthDate")}</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody suppressHydrationWarning>
            {filteredAthletes.map((a) => {
              const isEditing = editingId === a.id;
              return (
                <tr key={a.id} className="border-t border-line/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{a.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.sex === "male" ? t("datahub.male") : t("datahub.female")}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.teamName ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.position ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.dob}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => isEditing ? cancelEdit() : openEdit(a)}
                        className={cn(
                          "rounded-full p-1 transition",
                          isEditing
                            ? "bg-zinc-200 text-zinc-700"
                            : "hover:bg-blue-50 text-blue-600"
                        )}
                      >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAthlete(a.id)}
                        className="rounded-full p-1 hover:bg-red-50 text-red-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({
  club,
  updateClub,
}: {
  club: { name: string; region: string; sport?: "football" | "futsal"; accentColor?: string; badgeUrl?: string };
  updateClub: (updates: { name?: string; region?: string; sport?: "football" | "futsal"; accentColor?: string; badgeUrl?: string }) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(club.name);
  const [region, setRegion] = useState(club.region);
  const [sport, setSport] = useState<"football" | "futsal" | "">(club.sport || "");
  const [accentColor, setAccentColor] = useState(club.accentColor || "#0d9488");
  const [badgeUrl, setBadgeUrl] = useState(club.badgeUrl || "");
  const [badgePreview, setBadgePreview] = useState<string | null>(club.badgeUrl || null);

  // Handle badge file upload
  const handleBadgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBadgePreview(result);
      setBadgeUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Helper to adjust color brightness
  function adjustColor(hex: string, amount: number): string {
    const clean = hex.replace("#", "");
    const r = Math.max(0, Math.min(255, parseInt(clean.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(clean.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(clean.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // Apply accent color on mount and change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accentColor);
    root.style.setProperty("--accent-strong", adjustColor(accentColor, -20));
    root.style.setProperty("--accent-soft", `${accentColor}1a`);
  }, [accentColor]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("club.settings")}</h2>

      <div className="rounded-xl border border-line bg-white p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-zinc-400" />
          <h3 className="font-medium">{t("club.clubInfo")}</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">{t("club.clubName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">{t("club.region")}</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">{t("club.sport")}</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as "football" | "futsal" | "")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            >
              <option value="">{t("club.selectSport")}</option>
              <option value="football">{t("club.football")}</option>
              <option value="futsal">{t("club.futsal")}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-zinc-400" />
          <h3 className="font-medium">{t("club.appearance")}</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">{t("club.accentColor")}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-10 rounded border border-line"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{t("club.badgeUrl")}</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={badgeUrl}
                  onChange={(e) => {
                    setBadgeUrl(e.target.value);
                    setBadgePreview(e.target.value);
                  }}
                  placeholder={t("club.badgeUrlPlaceholder")}
                  className="flex-1 rounded-lg border border-line px-3 py-2"
                />
                <label className="cursor-pointer rounded-lg border border-line bg-white/70 px-4 py-2 text-sm text-zinc-700 hover:bg-white transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBadgeUpload}
                  />
                  {t("club.uploadBadge")}
                </label>
              </div>
              {badgePreview && (
                <div className="rounded-lg border border-line bg-white/50 p-3">
                  <p className="text-xs text-zinc-600 mb-2">{t("club.badgePreview")}</p>
                  <img
                    src={badgePreview}
                    alt="Club badge preview"
                    className="h-24 w-auto object-contain rounded border border-line/50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => updateClub({ name, region, sport: sport || undefined, accentColor, badgeUrl })}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

function TestBatteryTab({
  testBatteryArea,
  setTestBatteryArea,
  showAddTestForm,
  setShowAddTestForm,
  newDef,
  setNewDef,
  areaTestDefs,
  addDef,
  delDef,
  handleMedia,
  t,
}: {
  testBatteryArea: PerformanceArea;
  setTestBatteryArea: (area: PerformanceArea) => void;
  showAddTestForm: boolean;
  setShowAddTestForm: (show: boolean) => void;
  newDef: { name: string; unit: string; attempts: number; isRating: boolean; calculation: "best_min" | "best_max" | "average"; description: string; mediaUrl: string; mediaType: "image" | "video" | undefined };
  setNewDef: React.Dispatch<React.SetStateAction<typeof newDef>>;
  areaTestDefs: PerformanceDefinition[];
  addDef: (e: React.FormEvent) => void;
  delDef: (id: string) => void;
  handleMedia: (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => void;
  t: (key: string) => string;
}) {
  return (
    <section className="panel rounded-[1.75rem] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("club.testBattery")}</h2>
          <p className="mt-2 text-sm text-zinc-600">{t("datahub.createMetricsBody")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddTestForm(!showAddTestForm)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
            showAddTestForm
              ? "bg-zinc-200 text-zinc-700"
              : "bg-accent text-white hover:bg-accent/90"
          )}
        >
          <Plus className="h-4 w-4" />
          {showAddTestForm ? t("datahub.cancel") : t("club.addTest")}
        </button>
      </div>

      {/* Area selector */}
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {(Object.keys(performanceAreaLabels) as PerformanceArea[]).map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setTestBatteryArea(item as PerformanceArea)}
            className={cn(
              "rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 hover:shadow-lg",
              testBatteryArea === item
                ? "border-accent bg-accent text-white shadow-md"
                : "border-gray-300 bg-white hover:bg-gray-50"
            )}
          >
            <p className="text-lg font-semibold">{t(performanceAreaLabels[item as PerformanceArea])}</p>
            <p className={cn("mt-1 text-sm", testBatteryArea === item ? "text-white/85" : "text-zinc-600")}>
              {item === "physical" ? t("datahub.physicalDesc") : item === "technicalTactical" ? t("datahub.technicalTacticalDesc") : item === "psychological" ? t("datahub.psychologicalDesc") : t("datahub.motorSkillsDesc")}
            </p>
          </button>
        ))}
      </section>

      <div className="space-y-6">
        {/* Available tests - shown first */}
        {areaTestDefs.length > 0 && (
          <div className="rounded-[1.75rem] border border-line bg-white/50 p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-zinc-900">{t("datahub.testsAvailable")}</h3>
              <p className="mt-1 text-sm text-zinc-600">{areaTestDefs.length} {t("datahub.testsRegistered")}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {areaTestDefs.map(d => (
                <div key={d.id} className="rounded-2xl border border-line bg-white/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-zinc-900">{d.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {d.unit} · {d.attempts} {t("datahub.attemptsShort")} · {d.calculation === "average" ? t("datahub.avgShort") : d.calculation === "best_min" ? t("datahub.bestMinShort") : t("datahub.bestMaxShort")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => delDef(d.id)}
                      className="rounded-full p-2 hover:bg-red-100 text-red-600 transition flex-shrink-0"
                      title={t("datahub.delete")}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                      </svg>
                    </button>
                  </div>
                  {(d.description || d.mediaUrl) && (
                    <div className="mt-3 pt-3 border-t border-line/50 space-y-2">
                      {d.description && <p className="text-xs text-zinc-600 line-clamp-2">{d.description}</p>}
                      {d.mediaUrl && (
                        <div className="rounded-lg overflow-hidden h-20 bg-zinc-200">
                          {d.mediaType === "image" ? (
                            <img src={d.mediaUrl} alt="preview" className="h-full w-full object-cover" />
                          ) : (
                            <video src={d.mediaUrl} className="h-full w-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add test form - collapsible */}
        {showAddTestForm && (
          <div className="rounded-[1.75rem] border border-line bg-white/50 p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-zinc-900">{t("datahub.addMetricTitle")}</h3>
              <p className="mt-1 text-sm text-zinc-600">{t("datahub.addMetricBody")}</p>
            </div>
            <form onSubmit={addDef} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.metricName")}</label>
                  <input
                    className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"
                    placeholder={t("datahub.exampleMetricNames")}
                    value={newDef.name}
                    onChange={e => setNewDef(c => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.metricUnit")}</label>
                  <input
                    className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"
                    placeholder={t("datahub.exampleMetricUnit")}
                    value={newDef.unit}
                    onChange={e => setNewDef(c => ({ ...c, unit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.attemptsCount")}</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"
                    placeholder={t("datahub.exampleAttempts")}
                    value={newDef.attempts}
                    onChange={e => setNewDef(c => ({ ...c, attempts: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.resultType")}</label>
                  <select
                    className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"
                    value={newDef.isRating ? "rating" : "numeric"}
                    onChange={e => setNewDef(c => ({ ...c, isRating: e.target.value === "rating" }))}
                  >
                    <option value="numeric">{t("datahub.resultNumeric")}</option>
                    <option value="rating">{t("datahub.resultRating")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.attemptsCalculation")}</label>
                  <select
                    className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700"
                    value={newDef.calculation}
                    onChange={e => setNewDef(c => ({ ...c, calculation: e.target.value as "best_min" | "best_max" | "average" }))}
                  >
                    <option value="best_min">{t("datahub.calcBestMin")}</option>
                    <option value="best_max">{t("datahub.calcBestMax")}</option>
                    <option value="average">{t("datahub.calcAverage")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">{t("datahub.testDescriptionOptional")}</label>
                <textarea
                  className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-zinc-700 resize-none"
                  placeholder={t("datahub.exampleTestDescription")}
                  rows={3}
                  value={newDef.description}
                  onChange={e => setNewDef(c => ({ ...c, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">{t("datahub.mediaOptional")}</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white/50 px-4 py-6 hover:bg-white/70 transition text-zinc-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">{t("datahub.image")}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleMedia(e, "image")} />
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white/50 px-4 py-6 hover:bg-white/70 transition text-zinc-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">{t("datahub.video")}</span>
                    </div>
                    <input type="file" accept="video/*" className="hidden" onChange={e => handleMedia(e, "video")} />
                  </label>
                </div>
                {newDef.mediaUrl && (
                  <div className="mt-3 rounded-2xl border border-line bg-white/70 p-3">
                    <p className="text-xs text-zinc-600 mb-2">{t("datahub.selectedMedia")} ({newDef.mediaType})</p>
                    {newDef.mediaType === "image" ? (
                      <img src={newDef.mediaUrl} alt="preview" className="h-32 w-full rounded object-cover" />
                    ) : (
                      <video src={newDef.mediaUrl} className="h-32 w-full rounded object-cover" controls />
                    )}
                  </div>
                )}
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-medium text-slate-950 hover:bg-accent-strong w-full md:w-auto">
                <Plus className="h-4 w-4" />
                {t("datahub.createMetric")}
              </button>
            </form>
          </div>
        )}

        {areaTestDefs.length === 0 && !showAddTestForm && (
          <div className="rounded-[1.75rem] border border-dashed border-line bg-white/30 p-12 text-center">
            <Beaker className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-600 mb-4">{t("club.noTestsDefined")}</p>
            <button
              type="button"
              onClick={() => setShowAddTestForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              {t("club.addTest")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
