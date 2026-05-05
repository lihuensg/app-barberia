import { useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => Promise<void>;
  onRemove?: () => void;
  preview?: string | null;
  isLoading?: boolean;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
}

export function ImageUpload({
  onUpload,
  onRemove,
  preview,
  isLoading = false,
  maxSize = 5242880, // 5MB
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidation = (file: File): boolean => {
    setError(null);

    if (!acceptedTypes.includes(file.type)) {
      setError(
        `Solo se aceptan: ${acceptedTypes.map((t) => t.split("/")[1]).join(", ")}`
      );
      return false;
    }

    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1);
      setError(`Tamaño máximo: ${maxMB}MB`);
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    if (!handleValidation(file)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      try {
        await onUpload(file, result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir imagen");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (preview) {
    return (
      <div className="relative inline-block">
        <img
          src={preview}
          alt="Preview"
          className="h-40 w-40 rounded-lg object-cover border border-primary/20"
        />
        <button
          onClick={onRemove}
          disabled={isLoading}
          className="absolute -right-2 -top-2 rounded-full bg-destructive text-white p-1 hover:bg-destructive/90 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-primary/50",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <label className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Arrastra tu imagen aquí
            </p>
            <p className="text-xs text-muted-foreground">
              o haz clic para seleccionar
            </p>
          </div>
          <input
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleInputChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
