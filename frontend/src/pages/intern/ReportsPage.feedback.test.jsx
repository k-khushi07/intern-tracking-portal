import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import ReportsPage from "./ReportsPage";

const tnaMock = vi.fn();
const blueprintMock = vi.fn();
const reportLinksMock = vi.fn();
const reportsMock = vi.fn();

vi.mock("../../lib/apiClient", () => ({
  internApi: {
    tna: (...args) => tnaMock(...args),
    blueprint: (...args) => blueprintMock(...args),
    reportLinks: (...args) => reportLinksMock(...args),
    reports: (...args) => reportsMock(...args),
  },
}));

vi.mock("../../lib/realtime", () => ({
  getRealtimeSocket: () => ({
    on: () => { },
    off: () => { },
  }),
}));

function findReportCardForText(textOrRegex) {
  const label = typeof textOrRegex === "string" ? screen.getByText(textOrRegex) : screen.getByText(textOrRegex);
  const toggleMatcher = /view details|hide details/i;

  let node = label;
  let best = null;

  while (node && node !== document.body) {
    const togglesHere = within(node).queryAllByRole("button", { name: toggleMatcher }).length;
    if (togglesHere === 1) best = node;

    const parent = node.parentElement;
    if (!parent) break;
    const togglesParent = within(parent).queryAllByRole("button", { name: toggleMatcher }).length;

    // Once we climb into a parent that contains multiple report toggles (the list),
    // return the highest ancestor we saw that still corresponds to a single report card.
    if (best && togglesParent > 1) return best;

    node = parent;
  }

  if (best) return best;
  throw new Error("Could not find report card container");
}

describe("Intern ReportsPage feedback visibility", () => {
  beforeEach(() => {
    tnaMock.mockReset();
    blueprintMock.mockReset();
    reportLinksMock.mockReset();
    reportsMock.mockReset();

    tnaMock.mockResolvedValue({ success: true, items: [] });
    blueprintMock.mockResolvedValue({ success: true, blueprint: { data: {} } });
    reportLinksMock.mockResolvedValue({ success: true, links: { tnaSheetUrl: "", blueprintDocUrl: "" }, meta: {} });
  });

  async function waitForBaseLoad() {
    await waitFor(() => {
      expect(tnaMock).toHaveBeenCalledTimes(1);
      expect(blueprintMock).toHaveBeenCalledTimes(1);
      expect(reportLinksMock).toHaveBeenCalledTimes(1);
    });
    // Ensures the page is out of its initial `loading` state.
    await screen.findByRole("button", { name: /add row/i });
  }

  it("fetches reports and shows feedback comments and score when available", async () => {
    reportsMock.mockResolvedValueOnce({
      success: true,
      reports: [
        {
          id: "rep_1",
          report_type: "weekly",
          week_number: 4,
          status: "approved",
          summary: "Did work.",
          submitted_at: "2026-03-10T10:00:00.000Z",
          reviewed_at: "2026-03-11T10:00:00.000Z",
          review_reason: "Great progress. Keep it up.",
          review_score: 9,
          reviewer: { full_name: "Alex PM", email: "alex@example.com", role: "pm" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitForBaseLoad();
    await waitFor(() => expect(reportsMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /submitted reports/i }));

    expect(await screen.findByText(/^weekly report/i)).toBeInTheDocument();

    const card = findReportCardForText(/week 4/i);
    fireEvent.click(within(card).getByRole("button", { name: /view details|hide details/i }));

    expect(await within(card).findByText("Feedback")).toBeInTheDocument();
    expect(within(card).getByText(/Score:/i)).toBeInTheDocument();
    expect(within(card).getByText("9")).toBeInTheDocument();
    expect(within(card).getByText("Great progress. Keep it up.")).toBeInTheDocument();
  });

  it("shows 'No feedback yet.' when a report has no review fields", async () => {
    reportsMock.mockResolvedValueOnce({
      success: true,
      reports: [
        {
          id: "rep_2",
          report_type: "monthly",
          month: "March 2026",
          status: "pending",
          summary: "Monthly summary.",
          submitted_at: "2026-03-20T10:00:00.000Z",
          reviewed_at: null,
          review_reason: null,
          review_score: null,
        },
      ],
    });

    render(<ReportsPage />);

    await waitForBaseLoad();
    await waitFor(() => expect(reportsMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /submitted reports/i }));
    expect(await screen.findByText(/^monthly report/i)).toBeInTheDocument();

    const card = findReportCardForText(/march 2026/i);
    fireEvent.click(within(card).getByRole("button", { name: /view details|hide details/i }));

    expect(await within(card).findByText("No feedback yet.")).toBeInTheDocument();
  });

  it("displays feedback separately per report", async () => {
    reportsMock.mockResolvedValueOnce({
      success: true,
      reports: [
        {
          id: "rep_a",
          report_type: "weekly",
          week_number: 1,
          status: "approved",
          summary: "Week 1 summary.",
          submitted_at: "2026-03-01T10:00:00.000Z",
          reviewed_at: "2026-03-02T10:00:00.000Z",
          review_reason: "Solid start.",
          review_score: 7,
        },
        {
          id: "rep_b",
          report_type: "weekly",
          week_number: 2,
          status: "pending",
          summary: "Week 2 summary.",
          submitted_at: "2026-03-08T10:00:00.000Z",
          reviewed_at: null,
          review_reason: null,
          review_score: null,
        },
      ],
    });

    render(<ReportsPage />);

    await waitForBaseLoad();
    await waitFor(() => expect(reportsMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /submitted reports/i }));

    const card1 = findReportCardForText(/week 1/i);
    fireEvent.click(within(card1).getByRole("button", { name: /view details|hide details/i }));
    expect(await within(card1).findByText("Feedback")).toBeInTheDocument();
    expect(within(card1).getByText("Solid start.")).toBeInTheDocument();
    expect(within(card1).getByText("7")).toBeInTheDocument();

    const card2 = findReportCardForText(/week 2/i);
    fireEvent.click(within(card2).getByRole("button", { name: /view details|hide details/i }));
    expect(await within(card2).findByText("No feedback yet.")).toBeInTheDocument();
    expect(within(card2).queryByText("Solid start.")).not.toBeInTheDocument();
  });
});
