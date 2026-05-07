import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPosts,
  useCrearPost,
  useUploadPostImage,
  useDeletePost,
  getListPostsQueryKey,
  getGetAdminMetricsQueryKey,
} from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/formErrors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { tiempoRelativo } from "@/lib/format";
import { ImagePlus, Trash2, Heart, MessageCircle } from "lucide-react";

export default function AdminPosts() {
  const queryClient = useQueryClient();
  const { data: posts } = useListPosts();
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ url: string; publicId: string } | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [del, setDel] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminMetricsQueryKey() });
  };

  const crearMut = useCrearPost({
    mutation: {
      onSuccess: () => {
        toast.success("Post creado correctamente.");
        setImagenPreview(null);
        setImageData(null);
        setDescripcion("");
        invalidate();
      },
      onError: (e: any) => toast.error("No pudimos publicar el post", { description: getErrorMessage(e, "Intentá nuevamente.") }),
    },
  });

  const uploadMut = useUploadPostImage({
    mutation: {
      onSuccess: (data: any) => {
        setImageData({ url: data.imageUrl, publicId: data.imagePublicId });
        toast.success("Imagen subida correctamente");
      },
      onError: (e: any) => {
        toast.error("No pudimos subir la imagen", {
          description: getErrorMessage(e, "Seleccioná una imagen válida e intentá nuevamente."),
        });
      },
    },
  });

  const deleteMut = useDeletePost({
    mutation: {
      onSuccess: () => {
        toast.success("Post eliminado correctamente.");
        setDel(null);
        invalidate();
      },
      onError: (e: any) => toast.error(getErrorMessage(e, "No pudimos eliminar el post. Intentá nuevamente.")),
    },
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Seleccioná una imagen válida (JPG, PNG o WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el tamaño máximo permitido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagenPreview(String(reader.result));
    };
    reader.readAsDataURL(file);

    uploadMut.mutate(file);
  }

  function publicar(e: React.FormEvent) {
    e.preventDefault();

    if (!imageData?.url && !descripcion.trim()) {
      toast.error("El post debe tener texto o imagen.");
      return;
    }

    if (!imageData?.url) {
      toast.error("Seleccioná una imagen válida.");
      return;
    }

    crearMut.mutate({
      data: {
        imagen: imageData.url,
        imagePublicId: imageData.publicId,
        descripcion: descripcion.trim(),
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">
          Comunidad
        </div>
        <h1 className="font-serif text-3xl">Posts del feed</h1>
        <p className="text-sm text-muted-foreground">
          Compartí tus trabajos con tu comunidad.
        </p>
      </div>

      <Glass className="p-5">
        <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" /> Nuevo post
        </h2>
        <form onSubmit={publicar} className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <Label className="text-xs sm:text-sm">Imagen</Label>
            <div className="mt-2 aspect-square w-full rounded-lg border border-dashed border-white/15 bg-secondary/30 flex items-center justify-center overflow-hidden relative">
              {imagenPreview ? (
                <img
                  src={imagenPreview}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-muted-foreground text-xs px-3">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="mt-2 sm:mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                data-testid="button-subir-img"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <ImagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Subir</span>
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onFile}
              />
              {imagenPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setImagenPreview(null);
                    setImageData(null);
                  }}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  Quitar
                </Button>
              )}
            </div>
            <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground">
              Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 5MB.
            </p>
          </div>
          <div className="flex flex-col">
            <Label htmlFor="desc" className="text-xs sm:text-sm">Descripción (opcional)</Label>
            <Textarea
              id="desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contá algo sobre el corte, el estilo o el cliente..."
              rows={6}
              className="mt-2 flex-1 text-sm resize-none"
              data-testid="input-desc-post"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                disabled={crearMut.isPending || uploadMut.isPending || !imageData}
                data-testid="button-publicar-post"
                size="sm"
                className="text-xs sm:text-sm"
              >
                {uploadMut.isPending ? "Subiendo imagen..." : crearMut.isPending ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </form>
      </Glass>

      <div>
        <h2 className="font-serif text-xl mb-3">Publicaciones</h2>
        {!posts || posts.length === 0 ? (
          <Glass className="p-10 text-center text-sm text-muted-foreground">
            Aún no publicaste nada.
          </Glass>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Glass className="overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-black/40">
                    <img
                      src={p.imagen}
                      alt={p.descripcion}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-sm line-clamp-2 mb-2">{p.descripcion}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {p.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" /> {p.comentarios.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setDel(p.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar"
                        data-testid={`button-del-post-${p.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {tiempoRelativo(p.createdAt)}
                    </div>
                  </div>
                </Glass>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={del !== null} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent className="bg-card/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este post?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán también sus comentarios y reacciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del !== null && deleteMut.mutate({ postId: del })}
              data-testid="button-confirmar-del-post"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
