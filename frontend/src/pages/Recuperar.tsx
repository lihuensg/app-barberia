import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useForgotPassword } from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const mutation = useForgotPassword({
    mutation: {
      onSuccess: (data) => {
        toast.success(data.message ?? "Listo");
        setEnviado(true);
      },
      onError: () => {
        toast.error("No pudimos procesar el pedido.");
      },
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Glass variant="strong" className="p-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-2xl text-center mb-2">Recuperar contraseña</h1>
          {enviado ? (
            <p className="text-sm text-muted-foreground text-center">
              Si tu email está registrado, te enviamos las instrucciones para
              restablecer tu contraseña.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Ingresá tu email y te enviamos un enlace para restablecerla.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email.trim()) {
                    toast.error("Ingresá tu email");
                    return;
                  }
                  mutation.mutate({ data: { email: email.trim() } });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-recuperar-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                  data-testid="button-recuperar-submit"
                >
                  {mutation.isPending ? "Enviando..." : "Enviar instrucciones"}
                </Button>
              </form>
            </>
          )}
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
