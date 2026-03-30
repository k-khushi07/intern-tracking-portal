import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import DocumentsPage from "./DocumentsPage";

const documentsMock = vi.fn();

vi.mock("../../lib/apiClient", () => ({
  internApi: {
    documents: (...args) => documentsMock(...args),
  },
}));

describe("Intern DocumentsPage", () => {
  beforeEach(() => {
    documentsMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches documents and displays them in the correct sections", async () => {
    documentsMock.mockResolvedValueOnce({
      success: true,
      documents: [
        {
          id: "doc_offer_1",
          documentType: "offer_letter",
          title: "Offer Letter - EDCS",
          filename: "offer-letter.pdf",
          mimeType: "application/pdf",
          createdAt: "2026-03-01T10:00:00.000Z",
          updatedAt: "2026-03-01T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_offer_1/download",
        },
        {
          id: "doc_cert_1",
          documentType: "certificate",
          title: "Completion Certificate",
          filename: "certificate.pdf",
          mimeType: "application/pdf",
          createdAt: "2026-03-02T10:00:00.000Z",
          updatedAt: "2026-03-02T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_cert_1/download",
        },
        {
          id: "doc_sub_1",
          documentType: "submission",
          title: "Project Submission",
          filename: "submission.zip",
          mimeType: "application/zip",
          createdAt: "2026-03-03T10:00:00.000Z",
          updatedAt: "2026-03-03T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_sub_1/download",
        },
      ],
    });

    render(<DocumentsPage />);

    await waitFor(() => expect(documentsMock).toHaveBeenCalledTimes(1));
    expect(documentsMock).toHaveBeenCalledWith();

    expect(await screen.findByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Offer Letter")).toBeInTheDocument();
    expect(screen.getByText("Certificates")).toBeInTheDocument();
    expect(screen.getByText("Submissions")).toBeInTheDocument();

    expect(screen.getAllByText("1 file(s)").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Offer Letter - EDCS")).toBeInTheDocument();
    expect(screen.getByText("Completion Certificate")).toBeInTheDocument();
    expect(screen.getByText("Project Submission")).toBeInTheDocument();
  });

  it("opens download URL when clicking Download for a document", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);

    documentsMock.mockResolvedValueOnce({
      success: true,
      documents: [
        {
          id: "doc_offer_1",
          documentType: "offer_letter",
          title: "Offer Letter - EDCS",
          filename: "offer-letter.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-01T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_offer_1/download",
        },
      ],
    });

    render(<DocumentsPage />);

    expect(await screen.findByText("Offer Letter - EDCS")).toBeInTheDocument();
    const download = screen.getByRole("button", { name: /download/i });
    fireEvent.click(download);

    expect(openSpy).toHaveBeenCalledWith("/api/intern/documents/doc_offer_1/download", "_blank", "noopener,noreferrer");

    // restored via afterEach
  });

  it("downloads the correct file for each document", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);

    documentsMock.mockResolvedValueOnce({
      success: true,
      documents: [
        {
          id: "doc_offer_1",
          documentType: "offer_letter",
          title: "Offer Letter - EDCS",
          filename: "offer-letter.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-01T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_offer_1/download",
        },
        {
          id: "doc_offer_2",
          documentType: "offer_letter",
          title: "Offer Letter - SAP",
          filename: "offer-letter-sap.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-04T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_offer_2/download",
        },
        {
          id: "doc_cert_1",
          documentType: "certificate",
          title: "Completion Certificate",
          filename: "certificate.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-02T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_cert_1/download",
        },
      ],
    });

    render(<DocumentsPage />);

    expect(await screen.findByText("Offer Letter - EDCS")).toBeInTheDocument();
    expect(screen.getByText("Offer Letter - SAP")).toBeInTheDocument();
    expect(screen.getByText("Completion Certificate")).toBeInTheDocument();

    const clickDownloadFor = (title) => {
      const titleEl = screen.getByText(title);
      const row = titleEl.parentElement?.parentElement;
      expect(row).toBeTruthy();
      fireEvent.click(within(row).getByRole("button", { name: /download/i }));
    };

    clickDownloadFor("Offer Letter - EDCS");
    expect(openSpy).toHaveBeenLastCalledWith("/api/intern/documents/doc_offer_1/download", "_blank", "noopener,noreferrer");

    clickDownloadFor("Offer Letter - SAP");
    expect(openSpy).toHaveBeenLastCalledWith("/api/intern/documents/doc_offer_2/download", "_blank", "noopener,noreferrer");

    clickDownloadFor("Completion Certificate");
    expect(openSpy).toHaveBeenLastCalledWith("/api/intern/documents/doc_cert_1/download", "_blank", "noopener,noreferrer");

    // restored via afterEach
  });

  it("disables download button when downloadUrl is missing", async () => {
    documentsMock.mockResolvedValueOnce({
      success: true,
      documents: [
        {
          id: "doc_offer_1",
          documentType: "offer_letter",
          title: "Offer Letter - EDCS",
          filename: "offer-letter.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-01T10:00:00.000Z",
          downloadUrl: "",
        },
      ],
    });

    render(<DocumentsPage />);

    expect(await screen.findByText("Offer Letter - EDCS")).toBeInTheDocument();
    const download = screen.getByRole("button", { name: /download/i });
    expect(download).toBeDisabled();
  });

  it("shows an error message when documents API fails", async () => {
    documentsMock.mockRejectedValueOnce(new Error("Server down"));

    render(<DocumentsPage />);

    expect(await screen.findByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Server down")).toBeInTheDocument();
  });

  it("handles empty documents list and shows empty state text", async () => {
    documentsMock.mockResolvedValueOnce({ success: true, documents: [] });

    render(<DocumentsPage />);

    await waitFor(() => expect(documentsMock).toHaveBeenCalledTimes(1));

    const empties = await screen.findAllByText("No documents available yet.");
    // One per section (Offer Letter / Certificates / Submissions)
    expect(empties.length).toBeGreaterThanOrEqual(3);
  });

  it("opens the details modal when clicking View and closes it", async () => {
    documentsMock.mockResolvedValueOnce({
      success: true,
      documents: [
        {
          id: "doc_offer_1",
          documentType: "offer_letter",
          title: "Offer Letter - EDCS",
          filename: "offer-letter.pdf",
          mimeType: "application/pdf",
          updatedAt: "2026-03-01T10:00:00.000Z",
          downloadUrl: "/api/intern/documents/doc_offer_1/download",
        },
      ],
    });

    render(<DocumentsPage />);

    expect(await screen.findByText("Offer Letter - EDCS")).toBeInTheDocument();

    const view = screen.getByRole("button", { name: /view/i });
    fireEvent.click(view);

    expect(await screen.findByText("Document Details")).toBeInTheDocument();
    expect(screen.getByText(/Filename:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText("Document Details")).not.toBeInTheDocument();
  });
});
