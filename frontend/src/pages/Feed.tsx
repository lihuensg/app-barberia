import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useListPosts,
  useLikePost,
  useComentarPost,
  getListPostsQueryKey,
  useDeleteComment,
  useRateLimitTracker,
  type Post,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Glass, GoldDivider } from "@/components/Glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { inicialesDe, tiempoRelativo } from "@/lib/format";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/formErrors";

export default function Feed() {
  const { user } = useAuth();
  const { data: posts, isLoading } = useListPosts();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
          Feed
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">Lo último de la barbería</h1>
        <GoldDivider className="mx-auto" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : !posts || posts.length === 0 ? (
        <Glass className="p-8 sm:p-10 text-center">
          <div className="font-serif text-lg sm:text-xl mb-2">Sin publicaciones todavía</div>
          <p className="text-muted-foreground text-sm">
            Volvé pronto para ver los próximos trabajos.
          </p>
        </Glass>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} canInteract={!!user} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, canInteract }: { post: Post; canInteract: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comentario, setComentario] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [commentUsedCount, setCommentUsedCount] = useState(0);

  const rateLimitTracker = useRateLimitTracker("comments", {
    commentsPerWindow: 10,
    likesPerWindow: 60,
    windowMs: 600000,
  });

  const likeMut = useLikePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: (err: any) => {
        if (err?.status === 429) {
          toast.error("Demasiados intentos", {
            description: "Esperá unos minutos y volvé a intentar.",
          });
        } else {
          toast.error("No pudimos procesar tu reacción", {
            description: getErrorMessage(err, "Intentá nuevamente."),
          });
        }
      },
    },
  });

  const comentarMut = useComentarPost({
    mutation: {
      onSuccess: () => {
        setComentario("");
        setCommentUsedCount((prev) => prev + 1);
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: (err: any) => {
        if (err?.status === 429) {
          toast.error("Demasiados intentos", {
            description: "Esperá unos minutos y volvé a intentar.",
          });
        } else {
          toast.error("No pudimos publicar el comentario", {
            description: getErrorMessage(err, "Intentá nuevamente."),
          });
        }
      },
    },
  });

  const deleteCommentMut = useDeleteComment({
    mutation: {
      onSuccess: () => {
        toast.success("✓ Comentario eliminado");
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: (err: any) => {
        toast.error("No pudimos eliminar el comentario", {
          description: getErrorMessage(err, "Intentá nuevamente."),
        });
      },
    },
  });

  const comentariosMostrar = showAll
    ? post.comentarios
    : post.comentarios.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Glass className="overflow-hidden">
        <div className="p-3 sm:p-4 flex items-center gap-3">
          <Avatar className="h-9 sm:h-10 w-9 sm:w-10 shrink-0">
            <AvatarImage src={post.autorFoto ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {inicialesDe(post.autorNombre)}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-medium truncate">{post.autorNombre}</div>
            <div className="text-xs text-muted-foreground">
              {tiempoRelativo(post.createdAt)}
            </div>
          </div>
        </div>
        <div className="aspect-square w-full bg-black/40">
          <img
            src={post.imagen}
            alt={post.descripcion}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <button
              onClick={() => {
                if (!canInteract) {
                  toast("Iniciá sesión para reaccionar");
                  return;
                }
                likeMut.mutate({ postId: post.id });
              }}
              data-testid={`button-like-${post.id}`}
              className={cn(
                "flex items-center gap-1 text-xs sm:text-sm transition-colors",
                post.likedByMe ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart
                className={cn("h-4 sm:h-5 w-4 sm:w-5 shrink-0", post.likedByMe && "fill-primary")}
              />
              {post.likes}
            </button>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
              {post.comentarios.length}
            </div>
          </div>
          <p className="text-xs sm:text-sm break-words">
            <span className="font-medium mr-1">{post.autorNombre}</span>
            <span className="text-muted-foreground">{post.descripcion}</span>
          </p>

          {post.comentarios.length > 0 && (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
              <AnimatePresence initial={false}>
                {comentariosMostrar.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 text-xs sm:text-sm group"
                  >
                    <Avatar className="h-6 sm:h-7 w-6 sm:w-7 shrink-0">
                      <AvatarImage src={c.autorFoto ?? undefined} />
                      <AvatarFallback className="bg-secondary text-[10px]">
                        {inicialesDe(c.autorNombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium mr-1">{c.autorNombre}</span>
                          <span className="text-muted-foreground break-words">{c.texto}</span>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {tiempoRelativo(c.createdAt)}
                          </div>
                        </div>
                        {user && user.rol === "admin" && (
                          <button
                            onClick={() => deleteCommentMut.mutate(c.id)}
                            disabled={deleteCommentMut.isPending}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shrink-0"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {post.comentarios.length > 2 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-[11px] sm:text-xs text-muted-foreground hover:text-primary"
                >
                  Ver los {post.comentarios.length} comentarios
                </button>
              )}
            </div>
          )}

          {canInteract ? (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {commentUsedCount > 3 && (
                <RateLimitIndicator
                  used={commentUsedCount}
                  limit={rateLimitTracker.limit}
                  label="Comentarios en esta ventana"
                  resetAtMs={Date.now() + rateLimitTracker.windowMs}
                />
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comentario.trim()) {
                    toast.error("El comentario no puede estar vacío.");
                    return;
                  }
                  comentarMut.mutate({
                    postId: post.id,
                    data: { texto: comentario.trim() },
                  });
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Dejá un comentario..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  data-testid={`input-comentario-${post.id}`}
                  disabled={comentarMut.isPending}
                  maxLength={500}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={comentarMut.isPending || !comentario.trim()}
                  data-testid={`button-comentar-${post.id}`}
                  className="shrink-0"
                >
                  <Send className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Iniciá sesión
              </Link>{" "}
              para comentar y reaccionar.
            </div>
          )}
        </div>
      </Glass>
    </motion.div>
  );
}
