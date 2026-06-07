"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface VerificationFormProps {
  submitButtonText?: string;
}

type VerificationMethod = "school_email" | "student_id" | "enrollment_letter";

export default function VerificationForm({
  submitButtonText = "Submit for Verification",
}: VerificationFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<VerificationMethod>("school_email");
  const [emailInput, setEmailInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // File drag & drop states
  const [isDragging, setIsDragging] = useState(false);

  function handleMethodChange(newMethod: VerificationMethod) {
    setMethod(newMethod);
    setError(null);
    setFileInput(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  }

  function validateAndSetFile(file: File) {
    setError(null);
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (method === "student_id") {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG and PNG images are allowed for Student ID Card.");
        setFileInput(null);
        return;
      }
    } else if (method === "enrollment_letter") {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed for Enrollment Letter.");
        setFileInput(null);
        return;
      }
    }

    if (file.size > maxBytes) {
      setError("File size exceeds 5MB limit.");
      setFileInput(null);
      return;
    }

    setFileInput(file);
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setProgressMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to submit verification documents.");
      }

      let documentUrl = "";

      if (method === "school_email") {
        const trimmedEmail = emailInput.trim();
        if (!trimmedEmail) {
          throw new Error("Please enter your university email.");
        }
        if (!trimmedEmail.toLowerCase().endsWith("@fud.edu.ng")) {
          throw new Error("University email must end with @fud.edu.ng");
        }
        documentUrl = trimmedEmail;
      } else {
        if (!fileInput) {
          throw new Error("Please select a file to upload.");
        }

        setProgressMessage("Uploading document to storage...");

        const fileExt = fileInput.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to 'verification-docs' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("verification-docs")
          .upload(filePath, fileInput, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        // Retrieve public url
        const { data: urlData } = supabase.storage
          .from("verification-docs")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error("Failed to retrieve public URL of the uploaded document.");
        }

        documentUrl = urlData.publicUrl;
      }

      setProgressMessage("Submitting request...");

      // Submit request to API
      const res = await fetch("/api/verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_type: method,
          document_url: documentUrl,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Submission failed");
      }

      setProgressMessage("Submission successful! Redirecting...");
      router.push("/verification-pending");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <svg
            className="h-5 w-5 shrink-0 text-red-500 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Selectable Method Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* School Email Card */}
        <button
          type="button"
          onClick={() => handleMethodChange("school_email")}
          className={`flex flex-col items-center justify-between text-center p-5 rounded-xl border-2 transition-all cursor-pointer bg-white ${
            method === "school_email"
              ? "border-brand-green bg-green-50/20 ring-1 ring-brand-green/20"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
          }`}
        >
          <div className={`p-3 rounded-full mb-3 ${
            method === "school_email" ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-500"
          }`}>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="font-semibold text-gray-900">School Email</div>
          <div className="mt-1 text-xs text-gray-500">
            Verify instantly with your @fud.edu.ng email
          </div>
        </button>

        {/* Student ID Card */}
        <button
          type="button"
          onClick={() => handleMethodChange("student_id")}
          className={`flex flex-col items-center justify-between text-center p-5 rounded-xl border-2 transition-all cursor-pointer bg-white ${
            method === "student_id"
              ? "border-brand-green bg-green-50/20 ring-1 ring-brand-green/20"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
          }`}
        >
          <div className={`p-3 rounded-full mb-3 ${
            method === "student_id" ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-500"
          }`}>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.33 0 4 1 4 2v1H2v-1c0-1 2.67-2 4-2zm8-1h2m-2 2h2"
              />
            </svg>
          </div>
          <div className="font-semibold text-gray-900">Student ID Card</div>
          <div className="mt-1 text-xs text-gray-500">
            Upload JPG or PNG format, up to 5MB
          </div>
        </button>

        {/* Enrollment Letter */}
        <button
          type="button"
          onClick={() => handleMethodChange("enrollment_letter")}
          className={`flex flex-col items-center justify-between text-center p-5 rounded-xl border-2 transition-all cursor-pointer bg-white ${
            method === "enrollment_letter"
              ? "border-brand-green bg-green-50/20 ring-1 ring-brand-green/20"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
          }`}
        >
          <div className={`p-3 rounded-full mb-3 ${
            method === "enrollment_letter" ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-500"
          }`}>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="font-semibold text-gray-900">Enrollment Letter</div>
          <div className="mt-1 text-xs text-gray-500">
            Upload official PDF format, up to 5MB
          </div>
        </button>
      </div>

      {/* Dynamic Content Forms */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {method === "school_email" ? (
          <div className="space-y-2">
            <label
              htmlFor="school_email"
              className="block text-sm font-medium text-gray-700"
            >
              University Email Address
            </label>
            <input
              id="school_email"
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="username@fud.edu.ng"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none ring-brand-green focus:border-brand-green focus:ring-2"
            />
            <p className="text-xs text-gray-500">
              Must end with <span className="font-semibold text-brand-green">@fud.edu.ng</span>. You will need to confirm your university email.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {method === "student_id" ? "Student ID Document" : "Enrollment Letter Document"}
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isDragging
                  ? "border-brand-green bg-green-50/10"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={method === "student_id" ? "image/png, image/jpeg, image/jpg" : "application/pdf"}
                className="hidden"
              />

              {fileInput ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-green-100 text-brand-green rounded-full">
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-gray-900 break-all">
                    {fileInput.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(fileInput.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileInput(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="mx-auto text-gray-400">
                    <svg
                      className="h-10 w-10 mx-auto"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-brand-green hover:underline">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    {method === "student_id" ? "JPG or PNG image (max. 5MB)" : "PDF document (max. 5MB)"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || (method === "school_email" ? !emailInput : !fileInput)}
        className="w-full rounded-lg bg-brand-orange py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5 text-white"
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
        {isLoading
          ? progressMessage || "Submitting verification..."
          : submitButtonText}
      </button>
    </form>
  );
}
