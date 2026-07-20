"use client";

import { useState, useRef, useCallback } from "react";

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
        return;
      }

      setFileName(file.name);
      setStatus("uploading");
      setError("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to read that PDF.");
          setStatus("error");
          return;
        }

        onExtracted(data.data.text);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong. Please try again or paste text manually."
        );
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
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
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
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Reading {fileName}...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-sm text-gray-700 font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">
              Text extracted — review it below and edit if needed
            </p>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl text-gray-400">📄</span>
            <p className="text-sm text-gray-700 font-medium">
              Drop your resume PDF here, or click to browse
            </p>
            <p className="text-xs text-gray-500">PDF only, up to 5MB</p>
          </div>
        )}
      </div>

      {status === "error" && error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
