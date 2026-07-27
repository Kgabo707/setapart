import { TRUST_WEIGHTS } from "../config/appConfig";

export function computeTrustScore(profile, weights = TRUST_WEIGHTS) {
  const d = profile?.trustData || {};
  const verificationScore =
    (profile?.verification?.id ? 50 : 0) + (profile?.verification?.video ? 50 : 0);
  const responseScore = (d.responseRate || 0) * 100;
  const reportScore = Math.max(0, 100 - (d.reports || 0) * 40);
  const consistencyScore = Math.min(100, ((d.accountAgeMonths || 0) / 12) * 100);
  const feedbackScore = (d.feedbackPositive || 0) * 100;

  const score = Math.round(
    (verificationScore * weights.verification +
      responseScore * weights.responseRate +
      reportScore * weights.reportHistory +
      consistencyScore * weights.accountConsistency +
      feedbackScore * weights.postMatchFeedback) /
      100
  );

  const tiers = [
    { min: 80, label: "Highly trusted", color: "#00B894" },
    { min: 55, label: "Trusted", color: "#7DDFC9" },
    { min: 0, label: "Building trust", color: "#E0DEF7" },
  ];
  const tier = tiers.find((t) => score >= t.min) || tiers[tiers.length - 1];
  const hasEnoughData = (d.dataPoints || 0) >= 5;
  return { score, tier, hasEnoughData };
}

export default computeTrustScore;
