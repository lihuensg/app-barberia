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
import { Scissors } from "lucide-react";

export default function Registro() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [instagram, setInstagram] = useState("");

  const mutation = useRegistrar({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.usuario);
        toast.success("¡Cuenta creada!", {
          description: "Ya podés reservar tu primer turno.",
        });
        navigate("/reservar");
      },
      onError: (err: any) => {
        toast.error("No pudimos crear la cuenta", {
          description: err?.message ?? "Revisá los datos e intentá de nuevo.",
        });
      },
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || password.length < 6) {
      toast.error("Datos incompletos", {
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    mutation.mutate({
      data: {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        telefono: telefono.trim() || undefined,
        instagram: instagram.trim() || undefined,
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
                onChange={(e) => setNombre(e.target.value)}
                data-testid="input-reg-nombre"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-reg-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-reg-password"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 9 11 ..."
                  data-testid="input-reg-tel"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="usuario"
                  data-testid="input-reg-ig"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
              data-testid="button-reg-submit"
            >
              {mutation.isPending ? "Creando..." : "Crear cuenta"}
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
