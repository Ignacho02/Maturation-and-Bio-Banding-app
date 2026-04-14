"use client";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { useLocale } from "@/lib/i18n/locale-context";

export default function ResearchPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <section className="fade-up space-y-3">
        <p className="eyebrow">{t("research.title")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("research.subtitle")}</h1>
      </section>

      <ModulePlaceholder
        title={t("research.title")}
        body={t("research.subtitle")}
        bullets={[
          t("placeholders.bullets.research"),
          t("research.bullet"),
        ]}
      />
    </div>
  );
}
