import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTurnosDisponibles,
  useReservarAnonimo,
  useReservarCliente,
  getListTurnosDisponiblesQueryKey,
  type Turno,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Glass, GoldDivider } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fechaLarga } from "@/lib/format";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";

function toLocalISODate(date: Date) {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export default function Reservar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: turnos, isLoading } = useListTurnosDisponibles();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [mode, setMode] = useState<"cuenta" | "anonimo">(user ? "cuenta" : "anonimo");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const today = toLocalISODate(new Date());
  const weekEnd = useMemo(() => {
    const end = new Date();
    const daysUntilSunday = (7 - end.getDay()) % 7;
    end.setDate(end.getDate() + daysUntilSunday);
    return toLocalISODate(end);
  }, []);

  const availableTurnos = useMemo(() => {
    return (turnos ?? []).filter((turno) => turno.fecha >= today && turno.fecha <= weekEnd);
  }, [today, turnos, weekEnd]);

  const reservarCliente = useReservarCliente({
    mutation: {
      onSuccess: () => {
        toast.success("¡Turno reservado!", {
          description: "Te esperamos. Podés ver tu turno en 'Mis turnos'.",
        });
        queryClient.invalidateQueries({
          queryKey: getListTurnosDisponiblesQueryKey(),
        });
        setSelectedTurno(null);
        navigate("/mis-turnos");
      },
      onError: (err: any) => {
        toast.error("No pudimos reservar", {
          description: err?.message ?? "Probá con otro horario.",
        });
      },
    },
  });

  const reservarAnonimo = useReservarAnonimo({
    mutation: {
      onSuccess: () => {
        toast.success("¡Turno reservado!", {
          description: "Te esperamos. Guardá la fecha y hora.",
        });
        queryClient.invalidateQueries({
          queryKey: getListTurnosDisponiblesQueryKey(),
        });
        setSelectedTurno(null);
        setNombre("");
        setEmail("");
        setTelefono("");
      },
      onError: (err: any) => {
        toast.error("No pudimos reservar", {
          description: err?.message ?? "Probá con otro horario.",
        });
      },
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Turno[]>();
    availableTurnos.forEach((t) => {
      if (!map.has(t.fecha)) map.set(t.fecha, []);
      map.get(t.fecha)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availableTurnos]);

  const activeFecha = selectedDate ?? grouped[0]?.[0] ?? null;
  const slotsDelDia = grouped.find(([f]) => f === activeFecha)?.[1] ?? [];

  function confirmar() {
    if (!selectedTurno) return;
    if (user && mode === "cuenta") {
      reservarCliente.mutate({ data: { turnoId: selectedTurno.id } });
    } else {
      if (!nombre.trim()) {
        toast.error("Ingresá tu nombre");
        return;
      }
      reservarAnonimo.mutate({
        data: {
          turnoId: selectedTurno.id,
          nombre: nombre.trim(),
          email: email.trim() || undefined,
          telefono: telefono.trim() || undefined,
        },
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
          Agenda online
        </div>
        <h1 className="font-serif text-4xl mb-3">Elegí tu turno</h1>
        <GoldDivider className="mx-auto" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-20">Cargando agenda...</div>
      ) : grouped.length === 0 ? (
        <Glass className="p-10 text-center">
          <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
          <div className="font-serif text-xl mb-2">No hay turnos disponibles para este horario.</div>
          <p className="text-muted-foreground text-sm">
            Volvé en unos días o escribinos por Instagram.
          </p>
        </Glass>
      ) : (
        <div className="grid md:grid-cols-[280px,1fr] gap-4 md:gap-6">
          <Glass className="p-3 md:p-4 max-h-[60vh] overflow-y-auto rounded-lg">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground px-2 py-2">
              Fecha
            </div>
            <div className="flex flex-col gap-1">
              {grouped.map(([fecha, slots]) => (
                <button
                  key={fecha}
                  onClick={() => setSelectedDate(fecha)}
                  data-testid={`button-fecha-${fecha}`}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors hover-elevate ${
                    activeFecha === fecha
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <div className="text-sm">{fechaLarga(fecha)}</div>
                  <div className="text-[11px] opacity-70">
                    {slots.length} horarios libres
                  </div>
                </button>
              ))}
            </div>
          </Glass>

          <Glass className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Horarios
                </div>
                <div className="font-serif text-xl">
                  {activeFecha ? fechaLarga(activeFecha) : "—"}
                </div>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
              <AnimatePresence mode="popLayout">
                {slotsDelDia.map((t) => (
                  <motion.button
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedTurno(t)}
                    data-testid={`button-slot-${t.hora}`}
                    className="px-2 sm:px-3 py-2 rounded-lg border border-white/10 bg-secondary/40 text-xs sm:text-sm hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {t.hora}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </Glass>
        </div>
      )}

      <Dialog open={!!selectedTurno} onOpenChange={(o) => !o && setSelectedTurno(null)}>
        <DialogContent className="bg-card/90 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Confirmar turno</DialogTitle>
            <DialogDescription className="">
              {selectedTurno && `${fechaLarga(selectedTurno.fecha)} · ${selectedTurno.hora} hs`}
            </DialogDescription>
          </DialogHeader>

          {user ? (
            <div className="mt-2">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "cuenta" | "anonimo")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="cuenta">Con mi cuenta</TabsTrigger>
                  <TabsTrigger value="anonimo">Sin cuenta</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline"
                onClick={() => setSelectedTurno(null)}
              >
                Iniciá sesión
              </Link>{" "}
              para llevar tu historial.
            </div>
          )}

          {(!user || mode === "anonimo") && (
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Facundo Pérez"
                  data-testid="input-anon-nombre"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-anon-email"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    data-testid="input-anon-tel"
                  />
                </div>
              </div>
            </div>
          )}

          {user && mode === "cuenta" && (
            <Glass className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm">Reservás como {user.nombre}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </Glass>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSelectedTurno(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmar}
              disabled={reservarCliente.isPending || reservarAnonimo.isPending}
              data-testid="button-confirmar-reserva"
            >
              {reservarCliente.isPending || reservarAnonimo.isPending
                ? "Reservando..."
                : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
