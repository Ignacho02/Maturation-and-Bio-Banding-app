"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function ModulePlaceholder({
  title,
  body,
  bullets,
  href,
}: {
  title: string;
  body: string;
  bullets: string[];
  href?: string;
}) {
  const { t } = useLocale();

  return (
    <section className="panel rounded-[1.75rem] p-6">
      <div className="mb-4 space-y-2">
        <p className="eyebrow">{t("placeholders.title")}</p>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-ink-soft">{body}</p>
      </div>

      <ul className="grid gap-3 text-sm text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="rounded-2xl border border-line bg-white/55 px-4 py-3">
            {bullet}
          </li>
        ))}
      </ul>

      {href ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent"
        >
          {t("common.openSection")} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}
