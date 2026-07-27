import { render, screen } from "@testing-library/react-native";

import TrustRing from "../TrustRing";

const wellTrusted = {
  verification: { id: true, video: true },
  trustData: {
    responseRate: 0.9,
    reports: 0,
    accountAgeMonths: 18,
    feedbackPositive: 0.95,
    dataPoints: 22,
  },
};

describe("TrustRing", () => {
  it("shows the score and tier for a profile with enough history", () => {
    render(<TrustRing profile={wellTrusted} />);
    expect(screen.getByText("97")).toBeTruthy();
    expect(screen.getByText("Highly trusted")).toBeTruthy();
  });

  it("withholds the score until there is enough data to be fair", () => {
    render(<TrustRing profile={{ trustData: { dataPoints: 2, responseRate: 1 } }} />);
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("New here")).toBeTruthy();
  });

  it("renders without a label when asked", () => {
    render(<TrustRing profile={wellTrusted} showLabel={false} />);
    expect(screen.queryByText("Highly trusted")).toBeNull();
  });

  it("does not blow up on a profile with no trust data at all", () => {
    expect(() => render(<TrustRing profile={{}} />)).not.toThrow();
  });
});
