import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OverviewPage from "./OverviewPage";

const listMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../../lib/apiClient", () => ({
  announcementsApi: {
    list: (...args) => listMock(...args),
  },
  pmApi: {
    createAnnouncement: (...args) => createMock(...args),
    updateAnnouncement: (...args) => updateMock(...args),
    deleteAnnouncement: (...args) => deleteMock(...args),
  },
}));

describe("PM OverviewPage – department announcements", () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    listMock.mockResolvedValue({ success: true, announcements: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a department dropdown in the create announcement form", async () => {
    render(<OverviewPage pm={{ id: "pm_1", fullName: "PM One" }} interns={[]} stats={null} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /new/i }));

    const selects = screen.getAllByRole("combobox");
    const deptSelect = selects.find((s) => Array.from(s.options || []).some((o) => o.value === "SAP"));
    expect(deptSelect).toBeTruthy();
    expect(Array.from(deptSelect.options || []).some((o) => o.textContent === "All")).toBe(true);
    expect(Array.from(deptSelect.options || []).some((o) => o.textContent === "SAP")).toBe(true);
  });

  it("submits selected department to createAnnouncement (SAP)", async () => {
    createMock.mockResolvedValue({ success: true });

    render(<OverviewPage pm={{ id: "pm_1", fullName: "PM One" }} interns={[]} stats={null} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Message"), { target: { value: "Hello" } });

    // There are two selects in the form: priority + department. Pick department by value.
    const selects = screen.getAllByRole("combobox");
    const deptSelect = selects.find((s) => Array.from(s.options || []).some((o) => o.value === "SAP"));
    expect(deptSelect).toBeTruthy();
    fireEvent.change(deptSelect, { target: { value: "SAP" } });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test",
        content: "Hello",
        audienceRoles: ["intern"],
        department: "SAP",
      })
    );
  });

  it("sends null department when 'All' is selected", async () => {
    createMock.mockResolvedValue({ success: true });

    render(<OverviewPage pm={{ id: "pm_1", fullName: "PM One" }} interns={[]} stats={null} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Global" } });
    fireEvent.change(screen.getByPlaceholderText("Message"), { target: { value: "For all" } });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ department: null }));
  });

  it("shows validation error when title/content are missing", async () => {
    render(<OverviewPage pm={{ id: "pm_1", fullName: "PM One" }} interns={[]} stats={null} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(await screen.findByText("Title and content are required.")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });
});
