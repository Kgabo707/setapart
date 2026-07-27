import { fireEvent, render, screen } from "@testing-library/react-native";

import Avatar from "../Avatar";
import Chip from "../Chip";
import EmptyState from "../EmptyState";
import GradientButton from "../GradientButton";
import SegmentedControl from "../SegmentedControl";

describe("GradientButton", () => {
  it("calls onPress", () => {
    const onPress = jest.fn();
    render(<GradientButton label="Upgrade" onPress={onPress} />);
    fireEvent.press(screen.getByText("Upgrade"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("swallows presses while loading", () => {
    const onPress = jest.fn();
    render(<GradientButton label="Upgrade" onPress={onPress} loading />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("swallows presses while disabled", () => {
    const onPress = jest.fn();
    render(<GradientButton label="Upgrade" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Chip", () => {
  it("reports its selected state to assistive tech", () => {
    render(<Chip label="Casual dating" selected onPress={() => {}} />);
    expect(screen.getByRole("button", { selected: true })).toBeTruthy();
  });

  it("renders as plain text when it is not interactive", () => {
    render(<Chip label="Lisbon" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Lisbon")).toBeTruthy();
  });
});

describe("Avatar", () => {
  it("falls back to initials when there is no photo", () => {
    render(<Avatar name="Amira Haddad" />);
    expect(screen.getByText("AH")).toBeTruthy();
  });
});

describe("SegmentedControl", () => {
  it("emits the value of the pressed segment", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        options={[
          { value: "women", label: "Women" },
          { value: "men", label: "Men" },
          { value: "everyone", label: "Everyone" },
        ]}
        value="everyone"
        onChange={onChange}
      />
    );
    fireEvent.press(screen.getByText("Men"));
    expect(onChange).toHaveBeenCalledWith("men");
  });
});

describe("EmptyState", () => {
  it("renders its title and message", () => {
    render(<EmptyState title="No matches yet" message="Keep swiping." />);
    expect(screen.getByText("No matches yet")).toBeTruthy();
    expect(screen.getByText("Keep swiping.")).toBeTruthy();
  });
});
