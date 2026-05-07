import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRegistrar } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, isValidEmail } from "@/lib/formErrors";
import { isValidWhatsAppPhone } from "@/utils/whatsapp";
import { Scissors } from "lucide-react";

export default function Registro() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState<{ nombre?: string; email?: string; password?: string; whatsapp?: string }>({});

  const mutation = useRegistrar({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.usuario);
        toast.success("Cuenta creada correctamente.", {
          description: "Ya podés iniciar sesión.",
        });
        navigate("/reservar");
      },
      onError: (err: any) => {
        toast.error("No pudimos crear la cuenta", {
          description: getErrorMessage(err, "No pudimos crear tu cuenta. Intentá nuevamente."),
        });
      },
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: { nombre?: string; email?: string; password?: string; whatsapp?: string } = {};

    if (!nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!email.trim()) nextErrors.email = "El email es obligatorio.";
    else if (!isValidEmail(email)) nextErrors.email = "Ingresá un email válido.";

    if (!password) nextErrors.password = "La contraseña es obligatoria.";
    else if (password.length < 8) nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      nextErrors.password = "La contraseña debe incluir letras y números.";
    }

    if (!whatsapp.trim()) nextErrors.whatsapp = "El WhatsApp es obligatorio.";
    else if (!isValidWhatsAppPhone(whatsapp)) nextErrors.whatsapp = "Ingresá un número de WhatsApp válido.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      data: {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        whatsapp: whatsapp.trim(),
      },
    });
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
          <h1 className="font-serif text-2xl text-center mb-1">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Reservá más rápido y mantené tu historial.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
                }}
                data-testid="input-reg-nombre"
              />
              {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre}</p>}
            </div>
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
                data-testid="input-reg-email"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                data-testid="input-reg-password"
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                }}
                placeholder="+54 9 11 ..."
                data-testid="input-reg-whatsapp"
              />
              {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
              data-testid="button-reg-submit"
            >
              {mutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Ingresá
            </Link>
          </div>
        </Glass>
      </motion.div>
    </div>
  );
}
