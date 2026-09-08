"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ResumeUploaderProps {
  onExtracted: (text: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPE = "application/pdf";

type UploadStatus = "idle" | "uploading" | "success" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (file.size === 0) {
    return "This file is empty. Please choose another PDF.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Your resume is too large. Please upload a PDF under 5 MB.";
  }

  // Browser MIME types are useful but not authoritative.
  // The server performs the final PDF signature validation.
  if (
    file.type &&
    file.type !== ACCEPTED_FILE_TYPE &&
    file.type !== "application/octet-stream"
  ) {
    return "Only PDF files are supported.";
  }

  return null;
}

export function ResumeUploader({
  onExtracted,
  disabled = false,
}: ResumeUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isBusy = status === "uploading";

  const resetUploader = useCallback(() => {
    if (disabled || isBusy) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setStatus("idle");
    setFileName("");
    setFileSize(null);
    setError("");
    setIsDragging(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [disabled, isBusy]);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || isBusy) {
        return;
      }

      const validationError = validateFile(file);

      if (validationError) {
        setStatus("error");
        setFileName(file.name);
        setFileSize(file.size);
        setError(validationError);

        toast.error(validationError);
        return;
      }

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setFileName(file.name);
      setFileSize(file.size);
      setStatus("uploading");
      setError("");
      setIsDragging(false);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        let data: {
          success?: boolean;
          data?: {
            text?: string;
          };
          error?: string;
        };

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response. Please try again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error || "We couldn't read this PDF. Please try another file."
          );
        }

        const extractedText = data.data?.text?.trim();

        if (!extractedText) {
          throw new Error(
            "We couldn't extract readable text from this PDF. Try a text-based resume or paste the resume text manually."
          );
        }

        onExtracted(extractedText);

        setStatus("success");
        setError("");

        toast.success("Resume uploaded successfully.");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error("Resume upload failed:", err);

        const message =
          err instanceof TypeError
            ? "We couldn't reach the server. Check your connection and try again."
            : err instanceof Error
            ? err.message
            : "Something went wrong while reading your resume.";

        setStatus("error");
        setError(message);

        toast.error(message);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [disabled, isBusy, onExtracted]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void handleFile(file);
    }

    // Allow selecting the exact same file again.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (disabled || isBusy) {
      return;
    }

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    void handleFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!disabled && !isBusy) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }

    setIsDragging(false);
  };

  const openFilePicker = () => {
    if (disabled || isBusy) {
      return;
    }

    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPE}
        onChange={handleFileInputChange}
        disabled={disabled || isBusy}
        className="sr-only"
        aria-label="Upload resume PDF"
      />

      {status === "success" ? (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2
                className="h-5 w-5 text-success"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {fileName}
                  </p>

                  {fileSize !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF · {formatFileSize(fileSize)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetUploader}
                  disabled={disabled}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Replace
                </button>
              </div>

              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-success"
                    aria-hidden="true"
                  />
                  Ready to analyze
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl border bg-background transition-colors duration-200 ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          } ${disabled ? "opacity-60" : ""}`}
        >
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || isBusy}
            className="flex min-h-[190px] w-full flex-col items-center justify-center px-5 py-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed"
            aria-describedby="resume-upload-help"
          >
            {isBusy ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Loader2
                    className="h-6 w-6 animate-spin text-primary"
                    aria-hidden="true"
                  />
                </div>

                <p className="text-sm font-semibold text-foreground sm:text-base">
                  Reading your resume…
                </p>

                <p className="mt-1 max-w-sm truncate px-4 text-xs text-muted-foreground">
                  {fileName}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  Extracting text from your PDF
                </p>
              </>
            ) : (
              <>
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                    isDragging
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {isDragging ? (
                    <Upload className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  )}
                </div>

                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {isDragging ? "Drop your resume here" : "Upload your resume"}
                </p>

                <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground sm:text-sm">
                  Drag and drop your PDF here, or click to browse
                </p>

                <div
                  id="resume-upload-help"
                  className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground"
                >
                  <span className="rounded-md bg-muted px-2 py-1">
                    PDF only
                  </span>

                  <span className="rounded-md bg-muted px-2 py-1">
                    Max 5 MB
                  </span>

                  <span className="rounded-md bg-muted px-2 py-1">
                    Text-based PDF
                  </span>
                </div>
              </>
            )}
          </button>
        </div>
      )}

      {status === "error" && error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4"
        >
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <X className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-destructive">
              Upload failed
            </p>

            <p className="mt-1 text-xs leading-5 text-destructive/80">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="min-h-9 shrink-0 rounded-lg px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
        Your resume is processed securely to generate your ATS analysis.
      </p>
    </div>
  );
}
