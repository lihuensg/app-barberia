import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearPost, useUploadPostImage, getListPostsQueryKey } from "@workspace/api-client-react";
import { Glass, GoldDivider } from "@/components/Glass";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Upload } from "lucide-react";

export function CreatePostForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [descripcion, setDescripcion] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{
    url: string;
    publicId: string;
  } | null>(null);

  const uploadMut = useUploadPostImage({
    mutation: {
      onSuccess: (data: any) => {
        setImageData({
          url: data.imageUrl,
          publicId: data.imagePublicId,
        });
        toast.success("✓ Imagen subida a Cloudinary");
      },
      onError: (err: any) => {
        toast.error("Error al subir imagen", {
          description: err?.message || "Intentá con una imagen diferente",
        });
      },
    },
  });

  const createMut = useCrearPost({
    mutation: {
      onSuccess: () => {
        setDescripcion("");
        setImagePreview(null);
        setImageData(null);
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        toast.success("✓ Post publicado");
        onSuccess?.();
      },
      onError: (err: any) => {
        toast.error("Error al crear el post", {
          description: err?.message,
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageData) {
      toast.error("Necesitas subir una imagen");
      return;
    }

    createMut.mutate({
      data: {
        imagen: imageData.url,
        descripcion: descripcion.trim(),
        imagePublicId: imageData.publicId,
      },
    });
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
  };

  const isLoading = uploadMut.isPending || createMut.isPending;

  return (
    <Glass className="p-6">
      <div className="mb-6">
        <h2 className="font-serif text-2xl mb-2">Crear nueva publicación</h2>
        <GoldDivider />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Imagen */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Imagen del post *</label>
          <ImageUpload
            onUpload={async (file, preview) => {
              setImagePreview(preview);
              await uploadMut.mutateAsync(file);
            }}
            onRemove={handleRemoveImage}
            preview={imagePreview}
            isLoading={isLoading}
            maxSize={5242880} // 5MB
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción (opcional)</label>
          <Textarea
            placeholder="Describe el corte, estilo o lo que quieras compartir..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
            disabled={isLoading}
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground text-right">
            {descripcion.length}/500
          </div>
        </div>

        {/* Alertas */}
        {!imageData && (
          <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg text-sm text-amber-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>Necesitas subir una imagen para publicar</div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !imageData}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Publicando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publicar post
              </>
            )}
          </Button>
        </div>
      </form>
    </Glass>
  );
}
