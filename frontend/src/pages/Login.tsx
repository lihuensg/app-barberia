import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, isValidEmail } from "@/lib/formErrors";
import { Scissors } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.usuario);
        toast.success("Sesión iniciada correctamente.");
        navigate(data.usuario.rol === "admin" ? "/admin" : "/");
      },
      onError: (err: any) => {
        toast.error("No pudimos ingresar", {
          description: getErrorMessage(err, "No pudimos conectar con el servidor. Intentá nuevamente."),
        });
      },
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = "El email es obligatorio.";
    else if (!isValidEmail(email)) nextErrors.email = "Ingresá un email válido.";

    if (!password) nextErrors.password = "La contraseña es obligatoria.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    loginMutation.mutate({ data: { email: email.trim(), password } });
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Glass variant="strong" className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-serif text-2xl text-center mb-1">Bienvenido de nuevo</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Ingresá para reservar y ver tu historial.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoComplete="email"
                data-testid="input-login-email"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/recuperar"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                autoComplete="current-password"
                data-testid="input-login-password"
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="text-primary hover:underline">
              Crear cuenta
            </Link>
          </div>
        </Glass>
      </motion.div>
    </div>
  );
}
