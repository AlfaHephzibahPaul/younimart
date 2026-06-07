"use client";

import { useState, useTransition } from "react";
import { approveVerification, rejectVerification } from "./actions";

interface UniversityInfo {
  name: string;
}

interface ProfileInfo {
  full_name: string;
  universities: UniversityInfo | null;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  profiles: ProfileInfo | null;
}

interface VerificationsTableProps {
  initialRequests: VerificationRequest[];
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function VerificationsTable({
  initialRequests,
}: VerificationsTableProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Rejection modal states
  const [rejectingRequest, setRejectingRequest] = useState<VerificationRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    // Status filter
    if (statusFilter !== "all" && req.status !== statusFilter) {
      return false;
    }
    // Search query (matches student name)
    const name = req.profiles?.full_name?.toLowerCase() || "";
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleApprove = (requestId: string, userId: string) => {
    if (confirm("Are you sure you want to APPROVE this user's verification?")) {
      setActioningId(requestId);
      startTransition(async () => {
        try {
          await approveVerification(requestId, userId);
          // Update local state
          setRequests((prev) =>
            prev.map((r) =>
              r.id === requestId
                ? { ...r, status: "approved", admin_note: null }
                : r
            )
          );
        } catch (err: any) {
          alert(err.message || "Approval failed.");
        } finally {
          setActioningId(null);
        }
      });
    }
  };

  const handleOpenRejectModal = (request: VerificationRequest) => {
    setRejectingRequest(request);
    setRejectionNote("");
    setRejectError(null);
  };

  const handleCloseRejectModal = () => {
    setRejectingRequest(null);
    setRejectionNote("");
    setRejectError(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingRequest) return;
    if (!rejectionNote.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }

    const requestId = rejectingRequest.id;
    const userId = rejectingRequest.user_id;

    setActioningId(requestId);
    startTransition(async () => {
      try {
        await rejectVerification(requestId, userId, rejectionNote);
        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: "rejected", admin_note: rejectionNote }
              : r
          )
        );
        handleCloseRejectModal();
      } catch (err: any) {
        setRejectError(err.message || "Rejection failed.");
      } finally {
        setActioningId(null);
      }
    });
  };

  function getDocumentTypeLabel(type: string) {
    switch (type) {
      case "school_email":
        return "School Email";
      case "student_id":
        return "Student ID Card";
      case "enrollment_letter":
        return "Enrollment Letter";
      default:
        return type;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all capitalize ${
                statusFilter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">University</th>
                <th className="px-6 py-4">Document Type</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No verification requests found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const studentName = req.profiles?.full_name || "Unknown Student";
                  const universityName = req.profiles?.universities?.name || "Federal University Dutse";
                  const isSubmitterEmail = req.document_type === "school_email";

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Student Name */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {studentName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          UID: {req.user_id.substring(0, 8)}...
                        </div>
                      </td>

                      {/* University */}
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {universityName}
                      </td>

                      {/* Document Type / Preview */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {getDocumentTypeLabel(req.document_type)}
                        </div>
                        {isSubmitterEmail ? (
                          <a
                            href={`mailto:${req.document_url}`}
                            className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline mt-1 font-medium"
                          >
                            <span>{req.document_url}</span>
                          </a>
                        ) : (
                          <a
                            href={req.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline mt-1 font-semibold"
                          >
                            <span>View Document</span>
                            <svg
                              className="h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}
                      </td>

                      {/* Submitted date */}
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                        {formatDate(req.created_at)}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {req.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {req.status === "approved" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id, req.user_id)}
                              disabled={actioningId === req.id && isPending}
                              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actioningId === req.id && isPending ? "..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(req)}
                              disabled={actioningId === req.id && isPending}
                              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : req.status === "rejected" && req.admin_note ? (
                          <div className="max-w-xs text-xs text-gray-500 italic truncate" title={req.admin_note}>
                            Reason: {req.admin_note}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal Dialog */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900">
              Reject Verification Request
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              For <span className="font-semibold text-gray-800">{rejectingRequest.profiles?.full_name || "Unknown Student"}</span>. Enter the reason for rejection. This will be shown to the user.
            </p>

            {rejectError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-150">
                {rejectError}
              </div>
            )}

            <div className="mt-4">
              <label
                htmlFor="rejection_note"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                Rejection Note
              </label>
              <textarea
                id="rejection_note"
                rows={4}
                required
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. The ID card photo is blurry. Please upload a clear photo of your student identity card."
                className="mt-1.5 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseRejectModal}
                disabled={isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isPending || !rejectionNote.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending && actioningId === rejectingRequest.id && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
