"use client";

import { ModulePlaceholder } from "@/components/module-placeholder";
import { useLocale } from "@/lib/i18n/locale-context";

export default function CommunityPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      <section className="fade-up space-y-3">
        <p className="eyebrow">{t("community.title")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("community.subtitle")}</h1>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ModulePlaceholder
          title={t("community.formationTitle")}
          body={t("community.formationBody")}
          bullets={[
            t("placeholders.bullets.formation"),
            t("community.formationBullet"),
          ]}
        />
        <ModulePlaceholder
          title={t("community.networkTitle")}
          body={t("community.networkBody")}
          bullets={[
            t("placeholders.bullets.community"),
            t("community.networkBullet"),
          ]}
        />
      </section>
    </div>
  );
}
