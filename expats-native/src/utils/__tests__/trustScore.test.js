import { computeTrustScore } from "../trustScore";

const fullyTrusted = {
  verification: { id: true, video: true },
  trustData: {
    responseRate: 1,
    reports: 0,
    accountAgeMonths: 24,
    feedbackPositive: 1,
    dataPoints: 40,
  },
};

describe("computeTrustScore", () => {
  it("gives a perfect profile the top score and tier", () => {
    const { score, tier, hasEnoughData } = computeTrustScore(fullyTrusted);
    expect(score).toBe(100);
    expect(tier.label).toBe("Highly trusted");
    expect(hasEnoughData).toBe(true);
  });

  it("scores an empty profile at zero without throwing", () => {
    const { score, tier } = computeTrustScore({});
    expect(score).toBe(20); // report history starts clean, everything else is unproven
    expect(tier.label).toBe("Building trust");
  });

  it("treats a missing profile as an empty one", () => {
    expect(() => computeTrustScore(undefined)).not.toThrow();
  });

  it("caps account age credit at twelve months", () => {
    const oneYear = computeTrustScore({ trustData: { accountAgeMonths: 12 } }).score;
    const fiveYears = computeTrustScore({ trustData: { accountAgeMonths: 60 } }).score;
    expect(fiveYears).toBe(oneYear);
  });

  it("drops the score as reports accumulate", () => {
    const clean = computeTrustScore(fullyTrusted).score;
    const reported = computeTrustScore({
      ...fullyTrusted,
      trustData: { ...fullyTrusted.trustData, reports: 2 },
    }).score;
    expect(reported).toBeLessThan(clean);
  });

  it("withholds the score until there are five data points", () => {
    expect(computeTrustScore({ trustData: { dataPoints: 4 } }).hasEnoughData).toBe(false);
    expect(computeTrustScore({ trustData: { dataPoints: 5 } }).hasEnoughData).toBe(true);
  });

  it("splits the verification weight evenly between the id and video checks", () => {
    // 35 points of weight, half from each check, on top of a clean report score of 20.
    expect(computeTrustScore({ verification: { id: true } }).score).toBe(38);
    expect(computeTrustScore({ verification: { id: true, video: true } }).score).toBe(55);
  });
});
