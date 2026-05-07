import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useResetPassword } from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/formErrors";
import { KeyRound } from "lucide-react";

export default function Restablecer({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

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
        toast.success("Contraseña actualizada correctamente.", {
          description: "Ya podés iniciar sesión.",
        });
        navigate("/login");
      },
      onError: (err: any) => {
        toast.error("No pudimos actualizar", {
          description: getErrorMessage(err, "El enlace venció o ya fue utilizado. Solicitá uno nuevo."),
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
            El enlace para cambiar la contraseña no es válido.
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
              const nextErrors: { password?: string; confirm?: string } = {};

              if (!password) {
                nextErrors.password = "La nueva contraseña es obligatoria.";
              } else if (password.length < 8) {
                nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
              } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
                nextErrors.password = "La contraseña debe incluir letras y números.";
              }

              if (!confirm) {
                nextErrors.confirm = "Confirmá tu nueva contraseña.";
              } else if (password !== confirm) {
                nextErrors.confirm = "Las contraseñas no coinciden.";
              }

              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) {
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                data-testid="input-reset-pwd"
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="cpwd">Confirmar contraseña</Label>
              <Input
                id="cpwd"
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
                }}
                data-testid="input-reset-cpwd"
              />
              {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm}</p>}
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
