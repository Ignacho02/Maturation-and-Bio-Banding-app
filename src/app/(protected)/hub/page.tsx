"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Database, FlaskConical, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ModuleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const modules: Array<{
  href: string;
  key: string;
  bodyKey: string;
  status: ModuleStatus;
  icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/datahub", key: "nav.datahub", bodyKey: "hub.modules.datahub", status: "live", icon: Database },
  { href: "/analysis", key: "nav.analysis", bodyKey: "hub.modules.analysis", status: "live", icon: BarChart3 },
  { href: "/community", key: "nav.community", bodyKey: "hub.modules.community", status: "beta", icon: Users },
  { href: "/research", key: "nav.research", bodyKey: "hub.modules.research", status: "coming_soon", icon: FlaskConical },
];

const statusColor: Record<ModuleStatus, string> = {
  live: "bg-accent",
  beta: "bg-warning",
  coming_soon: "bg-zinc-400",
};

export default function HubPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <section className="fade-up grid gap-6 rounded-[2rem] border border-line bg-[linear-gradient(120deg,rgba(12,36,59,0.96),rgba(17,94,89,0.88))] px-6 py-7 text-white md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <div className="space-y-4">
          <p className="eyebrow text-white/70">{t("hub.title")}</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
            {t("hub.body")}
          </h1>
        </div>
        <div className="panel rounded-[1.8rem] border-white/10 bg-white/10 p-5 text-white/82">
          <p className="text-sm leading-7">
            {t("hubExtra.intro")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="metric-card fade-up group rounded-[1.8rem] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs text-zinc-700">
                  <span className={cn("status-dot", statusColor[module.status])} />
                  {t(`common.${module.status === "coming_soon" ? "comingSoon" : module.status}`)}
                </div>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{t(module.key)}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{t(module.bodyKey)}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                {t("common.open")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
