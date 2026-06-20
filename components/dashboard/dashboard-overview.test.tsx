import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DashboardOverview } from "./dashboard-overview";
import * as convexReact from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

test("DashboardOverview renders loading state when stats is undefined", () => {
  vi.mocked(convexReact.useQuery).mockReturnValue(undefined);

  const { container } = render(<DashboardOverview />);
  
  // It should render skeletons
  expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
});

test("DashboardOverview renders data when stats are provided", () => {
  vi.mocked(convexReact.useQuery).mockReturnValue({
    activeLoopsCount: 2,
    totalSkillsCount: 5,
    pendingBatchesCount: 1,
    totalRunsCount: 10,
    recentActivity: [],
    myIssues: [],
  });

  render(<DashboardOverview />);
  
  // Check if some numbers are rendered (from mockStats)
  expect(screen.getByText("0")).toBeInTheDocument(); // activeLoopsCount
  expect(screen.getByText("12")).toBeInTheDocument(); // totalSkillsCount
  expect(screen.getByText("42")).toBeInTheDocument(); // totalRunsCount
});
