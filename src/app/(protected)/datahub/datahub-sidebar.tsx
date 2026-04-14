"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { Building2, Brain, Dumbbell, Home } from "lucide-react";

const sections = [
  { id: "club" as const, icon: Building2, key: "datahubNav.club", tab: "club" },
  { id: "maturation" as const, icon: Brain, key: "datahubNav.maturation", tab: "maturation" },
  { id: "performance" as const, icon: Dumbbell, key: "datahubNav.performance", tab: "performance" },
];

export function DataHubSidebar({
  activeSection,
  onSelect,
}: {
  activeSection: "club" | "maturation" | "performance";
  onSelect: (section: "club" | "maturation" | "performance" | "landing") => void;
}) {
  const { t } = useLocale();
  const router = useRouter();

  function handleSelect(section: "club" | "maturation" | "performance" | "landing") {
    onSelect(section);
    if (section === "landing") {
      router.push("/datahub");
    } else {
      const area = sections.find(s => s.id === section);
      if (area) {
        router.push(`/datahub?tab=${area.tab}`);
      }
    }
  }

  return (
    <nav className="w-56 border-r border-line bg-white/95 flex-shrink-0" aria-label="DataHub sections">
      <div className="p-4 space-y-1">
        <button
          type="button"
          onClick={() => handleSelect("landing")}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
            "text-zinc-600 hover:bg-zinc-100 mb-2",
          )}
        >
          <Home className="h-5 w-5" />
          {t("datahub.landingTitle")}
        </button>
        <div className="border-t border-line pt-2">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-accent text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.key)}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
