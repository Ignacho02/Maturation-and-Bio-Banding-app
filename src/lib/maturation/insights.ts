import type { DashboardInsight, MaturationResult } from "@/lib/types";

export function buildInsights(result: MaturationResult): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (result.warnings.includes("missing-parent-heights")) {
    insights.push({
      id: `${result.inputs.id}-parents`,
      tone: "warning",
      titleKey: "insights.missingParentsTitle",
      bodyKey: "insights.missingParentsBody",
    });
  }

  const band = result.classification.maturityBand;
  if (band === "Pre-PHV") {
    insights.push({
      id: `${result.inputs.id}-pre`,
      tone: "info",
      titleKey: "insights.preTitle",
      bodyKey: "insights.preBody",
    });
  }
  if (band === "Mid-PHV") {
    insights.push({
      id: `${result.inputs.id}-mid`,
      tone: "warning",
      titleKey: "insights.midTitle",
      bodyKey: "insights.midBody",
    });
  }
  if (band === "Post-PHV") {
    insights.push({
      id: `${result.inputs.id}-post`,
      tone: "success",
      titleKey: "insights.postTitle",
      bodyKey: "insights.postBody",
    });
  }

  return insights;
}
