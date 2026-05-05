import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useResetPassword } from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

export default function Restablecer({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Extraer userId del query string
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('userId');
    }
    return null;
  }, []);

  const mutation = useResetPassword({
    mutation: {
      onSuccess: () => {
        toast.success("Contraseña actualizada", {
          description: "Ingresá con tu nueva clave.",
        });
        navigate("/login");
      },
      onError: (err: any) => {
        toast.error("No pudimos actualizar", {
          description: err?.message ?? "El enlace puede haber expirado.",
        });
      },
    },
  });

  // Si no hay userId, mostrar error
  if (!userId) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
        <Glass variant="strong" className="p-8">
          <p className="text-sm text-red-500 text-center">
            Enlace inválido. Por favor, solicita uno nuevo.
          </p>
          <div className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/recuperar" className="hover:text-primary">
              Solicitar nuevo enlace
            </Link>
          </div>
        </Glass>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Glass variant="strong" className="p-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-2xl text-center mb-2">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Elegí una contraseña nueva para tu cuenta.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password.length < 6) {
                toast.error("La contraseña debe tener al menos 6 caracteres.");
                return;
              }
              if (password !== confirm) {
                toast.error("Las contraseñas no coinciden");
                return;
              }
              mutation.mutate({
                token,
                data: {
                  password,
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="pwd">Nueva contraseña</Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-reset-pwd"
              />
            </div>
            <div>
              <Label htmlFor="cpwd">Confirmar contraseña</Label>
              <Input
                id="cpwd"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                data-testid="input-reset-cpwd"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
              data-testid="button-reset-submit"
            >
              {mutation.isPending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/login" className="hover:text-primary">
              Volver a ingresar
            </Link>
          </div>
        </Glass>
      </motion.div>
    </div>
  );
}
