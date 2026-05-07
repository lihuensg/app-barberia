import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTurnosDisponibles,
  useReservarAnonimo,
  useReservarCliente,
  getListTurnosDisponiblesQueryKey,
  getGetHistorialQueryKey,
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
import { normalizeWhatsAppPhone, buildWhatsAppUrl } from "@/utils/whatsapp";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";

export default function Reservar() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const { data: turnos, isLoading } = useListTurnosDisponibles();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [mode, setMode] = useState<"cuenta" | "anonimo">(token ? "cuenta" : "anonimo");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [adminContactPhone, setAdminContactPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMode("anonimo");
      return;
    }

    if (user.rol !== "admin") {
      setMode("cuenta");
    }
  }, [user]);
  // Nota: originalmente limitábamos la vista a la semana actual. Quitamos ese
  // límite para mostrar todos los turnos que devuelve la API.

  const availableTurnos = useMemo(() => {
    // Mostrar todos los turnos que trae la API (la API ya filtra por fecha futura
    // y por reglas de negocio). Esto evita limitar la vista solo a la semana actual.
    return turnos ?? [];
  }, [turnos]);

  const reservarCliente = useReservarCliente({
    mutation: {
      onSuccess: async (res: any) => {
        const turno = res?.turno ?? res ?? null;
        toast.success("¡Turno reservado!", {
          description: "Te esperamos. Podés ver tu turno en 'Mis turnos'.",
        });
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: getListTurnosDisponiblesQueryKey(),
          }),
          queryClient.refetchQueries({
            queryKey: getGetHistorialQueryKey(),
          }),
        ]);
        setSelectedTurno(null);
        if (turno) {
          setPostReserva(turno);
        }
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
      onSuccess: async (res: any) => {
        const turno = res?.turno ?? null;
        toast.success("¡Turno reservado!", {
          description: "Te esperamos. Guardá la fecha y hora.",
        });
        await queryClient.refetchQueries({
          queryKey: getListTurnosDisponiblesQueryKey(),
        });
        setSelectedTurno(null);
        setNombre("");
        setEmail("");
        setWhatsapp("");
        if (turno) setPostReserva(turno);
      },
      onError: (err: any) => {
        toast.error("No pudimos reservar", {
          description: err?.message ?? "Probá con otro horario.",
        });
      },
    },
  });

  const [postReserva, setPostReserva] = useState<any | null>(null);

  const isAdminAnonymousBooking = Boolean(user?.rol === "admin" && mode === "anonimo");

  const getAdminContactPhone = async () => {
    if (adminContactPhone) return adminContactPhone;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    const r = await fetch(`${apiBase}/api/usuario/admin-publicos`);
    if (r.ok) {
      const j = await r.json();
      const phone = j.whatsappNormalizado || j.whatsapp || j.telefono || import.meta.env.VITE_WHATSAPP_ADMIN_PHONE || null;
      setAdminContactPhone(phone);
      return phone;
    }
    const fallback = import.meta.env.VITE_WHATSAPP_ADMIN_PHONE || null;
    setAdminContactPhone(fallback);
    return fallback;
  };

  const getPostReservaWhatsAppTarget = async () => {
    if (!postReserva) return null;

    if (isAdminAnonymousBooking) {
      return normalizeWhatsAppPhone(postReserva.clienteWhatsapp || postReserva.clienteWhatsappNormalizado || postReserva.clienteTelefono || postReserva.clienteTelefonoNormalized);
    }

    return getAdminContactPhone();
  };

  const getPostReservaWhatsAppMessage = () => {
    if (!postReserva) return "";

    if (isAdminAnonymousBooking) {
      return `Hola ${postReserva.clienteNombre || ""}, te confirmamos tu turno en Naza para el ${fechaLarga(postReserva.fecha)} a las ${postReserva.hora}. Te esperamos.`;
    }

    return `Hola Naza, acabo de reservar un turno.\n\nNombre: ${postReserva.clienteNombre || ""}\nTurno: ${postReserva.fecha} a las ${postReserva.hora}\nWhatsApp: ${postReserva.clienteWhatsapp || postReserva.clienteTelefono || ""}\n\nGracias.`;
  };

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
    if (token && (mode === "cuenta" || !user || user.rol !== "admin")) {
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
          whatsapp: whatsapp.trim() || undefined,
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
            user.rol === 'admin' ? (
              <div className="mt-2">
                <Tabs value={mode} onValueChange={(v) => setMode(v as "cuenta" | "anonimo")}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="cuenta">Con mi cuenta</TabsTrigger>
                    <TabsTrigger value="anonimo">Sin cuenta</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : null
          ) : (
                <div className="text-sm text-muted-foreground">
                  ¿Ya tenés cuenta?{" "}
                  <Link href="/login" onClick={() => setSelectedTurno(null)}>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-anon-email"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (obligatorio)</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    data-testid="input-anon-whatsapp"
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
      {postReserva && (
        <div className="mx-auto max-w-2xl mt-6">
          <Glass className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">Reserva confirmada</div>
              <div className="text-xs text-muted-foreground">{fechaLarga(postReserva.fecha)} · {postReserva.hora} hs</div>
            </div>
            <div>
              <Button
                  onClick={async () => {
                    try {
                      const phone = await getPostReservaWhatsAppTarget();
                      const msgPlain = getPostReservaWhatsAppMessage();
                      const url = phone ? buildWhatsAppUrl(phone, msgPlain) : null;
                      if (url) window.open(url, '_blank', 'noopener');
                      else toast.error(isAdminAnonymousBooking ? 'No se encontró número de contacto del cliente' : 'No se encontró número de contacto para Naza');
                    } catch (e) {
                      console.error(e);
                      toast.error(isAdminAnonymousBooking ? 'No pudimos obtener el teléfono del cliente' : 'No pudimos obtener el contacto de Naza');
                    }
                  }}
                >
                  {isAdminAnonymousBooking ? "Enviar WhatsApp al cliente" : "Enviar WhatsApp a Naza"}
                </Button>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
}
