"use client";

import { useState, useRef, useCallback } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

interface ResumeUploaderProps {
  onExtracted: (text: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the server-side limit

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function ResumeUploader({ onExtracted, disabled }: ResumeUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Please upload a PDF under 5MB.";
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        setStatus("error");
        toast.error(validationError);
        return;
      }

      setFileName(file.name);
      setStatus("uploading");
      setError("");

      try {
        await toast.promise(
          (async () => {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/extract-pdf", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to read that PDF.");
            }

            onExtracted(data.data.text);
            setStatus("success");

            return data;
          })(),
          {
            loading: `Reading ${file.name}...`,
            success: "Resume uploaded successfully.",
            error: (err) =>
              err instanceof Error
                ? err.message
                : "Something went wrong. Please try again.",
          }
        );
      } catch (err) {
        console.error(err);

        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

        setError(message);
        setStatus("error");
      }
    },
    [onExtracted]
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so selecting the same file again still fires onChange
    e.target.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          rounded-xl border-2 border-dashed p-8 text-center transition-all
          ${
            isDragging
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">
              Reading {fileName}...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="text-sm text-foreground font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              Resuem uploaded — review it below and edit if needed
            </p>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-1">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              Drop your resume PDF here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">PDF only, up to 5MB</p>
          </div>
        )}
      </div>

      {status === "error" && error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
