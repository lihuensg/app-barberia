import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateMe,
  useUploadProfileImage,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { getGetAdminPublicosQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Glass, GoldDivider } from "@/components/Glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inicialesDe } from "@/lib/format";
import { Camera } from "lucide-react";

export default function Perfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(user?.instagram ?? "");

  const updateMut = useUpdateMe({
    mutation: {
      onSuccess: () => {
        toast.success("Perfil actualizado");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminPublicosQueryKey() });
      },
      onError: () => toast.error("No pudimos guardar los cambios"),
    },
  });

  const fotoMut = useUploadProfileImage({
    mutation: {
      onSuccess: () => {
        toast.success("Foto actualizada");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => toast.error("No pudimos subir la foto"),
    },
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }
    // Subir como multipart/form-data (no base64)
    fotoMut.mutate(file as File);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
          Mi cuenta
        </div>
        <h1 className="font-serif text-4xl mb-3">Tu perfil</h1>
        <GoldDivider className="mx-auto" />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Glass variant="strong" className="p-6 sm:p-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                <AvatarImage src={user?.foto ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                  {inicialesDe(user?.nombre ?? "")}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInput.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover-elevate"
                aria-label="Cambiar foto"
                data-testid="button-change-foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={onFile}
                data-testid="input-foto-file"
              />
            </div>
            <div>
              <div className="font-serif text-2xl">{user?.nombre}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMut.mutate({
                data: {
                  nombre: nombre.trim(),
                  whatsapp: whatsapp.trim() || undefined,
                  instagram: instagram.trim() || undefined,
                },
              });
            }}
            className="grid sm:grid-cols-2 gap-3 sm:gap-4"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="nombre" className="text-xs sm:text-sm">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                data-testid="input-perfil-nombre"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="text-xs sm:text-sm">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                data-testid="input-perfil-whatsapp"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="instagram" className="text-xs sm:text-sm">Instagram</Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                data-testid="input-perfil-ig"
                className="text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={updateMut.isPending}
                data-testid="button-guardar-perfil"
                size="sm"
                className="text-xs sm:text-sm"
              >
                {updateMut.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Glass>
      </motion.div>
    </div>
  );
}
