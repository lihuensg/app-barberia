import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useGetHistorial,
  useCancelarCliente,
  getGetHistorialQueryKey,
  getListTurnosDisponiblesQueryKey,
  type Turno,
} from "@workspace/api-client-react";
import { Glass, GoldDivider } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fechaLarga, todayISO } from "@/lib/format";
import { CalendarX2, Scissors, Calendar } from "lucide-react";

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  reservado: { label: "Reservado", className: "bg-primary/15 text-primary border-primary/30" },
  cortado: { label: "Cortado", className: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30" },
  cancelado: { label: "Cancelado", className: "bg-muted text-muted-foreground border-white/10" },
  disponible: { label: "Liberado", className: "bg-muted text-muted-foreground border-white/10" },
};

export default function MisTurnos() {
  const { data: turnos, isLoading } = useGetHistorial();
  const queryClient = useQueryClient();
  const [cancelar, setCancelar] = useState<Turno | null>(null);
  const cancelWindowMs = 60 * 60 * 1000;

  const cancelarMut = useCancelarCliente({
    mutation: {
      onSuccess: (response: any) => {
        toast.success(response?.message ?? "Turno cancelado correctamente. El horario vuelve a estar disponible.");
        queryClient.invalidateQueries({ queryKey: getGetHistorialQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTurnosDisponiblesQueryKey() });
        setCancelar(null);
      },
      onError: (error: any) => {
        const backendMessage = error?.data?.message;
        toast.error(backendMessage ?? "No pudimos cancelar");
      },
    },
  });

  const now = new Date();
  const proximos = (turnos ?? []).filter((t) => {
    if (t.estado !== "reservado") return false;
    const dateTime = parseTurnoDateTime(t.fecha, t.hora);
    return dateTime !== null && dateTime.getTime() > now.getTime();
  });
  const pasados = (turnos ?? []).filter((t) => {
    if (t.estado === "cortado") return true;
    if (t.estado !== "reservado") return false;

    const dateTime = parseTurnoDateTime(t.fecha, t.hora);
    return dateTime === null || dateTime.getTime() <= now.getTime();
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
          Tu agenda
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">Mis turnos</h1>
        <GoldDivider className="mx-auto" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : (turnos ?? []).length === 0 ? (
        <Glass className="p-10 text-center">
          <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
          <div className="font-serif text-xl mb-2">No tenés turnos todavía</div>
          <p className="text-muted-foreground text-sm mb-5">
            Reservá tu primer turno y empezá tu historial.
          </p>
          <Button asChild>
            <Link href="/reservar">Reservar turno</Link>
          </Button>
        </Glass>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Próximos
            </h2>
            {proximos.length === 0 ? (
              <Glass className="p-6 text-sm text-muted-foreground text-center">
                No tenés próximos turnos.{" "}
                <Link href="/reservar" className="text-primary hover:underline">
                  Reservar
                </Link>
              </Glass>
            ) : (
              <div className="space-y-3">
                {proximos.map((t) => (
                  <TurnoRow
                    key={t.id}
                    t={t}
                    onCancelar={isCancelableTurno(t, now, cancelWindowMs) ? () => setCancelar(t) : undefined}
                    cancelable={isCancelableTurno(t, now, cancelWindowMs)}
                  />
                ))}
              </div>
            )}
          </section>
          {pasados.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Historial
              </h2>
              <div className="space-y-3">
                {pasados.map((t) => (
                  <TurnoRow key={t.id} t={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AlertDialog open={!!cancelar} onOpenChange={(o) => !o && setCancelar(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelar &&
                `${fechaLarga(cancelar.fecha)} a las ${cancelar.hora} hs. El horario quedará disponible para otros clientes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelar && cancelarMut.mutate({ id: cancelar.id })}
              data-testid="button-confirmar-cancelar"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TurnoRow({
  t,
  onCancelar,
  cancelable = true,
}: {
  t: Turno;
  onCancelar?: () => void;
  cancelable?: boolean;
}) {
  const meta = ESTADO_LABEL[t.estado] ?? ESTADO_LABEL["reservado"]!;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Glass className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="h-9 sm:h-10 w-9 sm:w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              {t.estado === "cortado" ? (
                <Scissors className="h-4 w-4 text-primary" />
              ) : (
                <Calendar className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base">{fechaLarga(t.fecha)}</div>
              <div className="text-xs text-muted-foreground">{t.hora} hs</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Badge variant="outline" className={meta.className + " shrink-0"}>
              {meta.label}
            </Badge>
            {onCancelar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelar}
                data-testid={`button-cancelar-${t.id}`}
                className="text-xs sm:text-sm h-8 sm:h-9 shrink-0"
              >
                <CalendarX2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Cancelar</span>
              </Button>
            )}
            {!onCancelar && cancelable === false && (
              <span className="text-[11px] text-muted-foreground shrink-0">
                No cancelable por ahora
              </span>
            )}
          </div>
        </div>
      </Glass>
    </motion.div>
  );
}

function parseTurnoDateTime(fecha?: string, hora?: string): Date | null {
  if (!fecha || !hora) return null;

  const fechaMatch = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const horaMatch = /^([01]\d|2[0-3]):([0-5]\d)/.exec(hora);

  if (!fechaMatch || !horaMatch) return null;

  const [year, month, day] = fecha.split("-").map(Number) as [number, number, number];
  const hour = Number(horaMatch[1]);
  const minute = Number(horaMatch[2]);
  const dateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (Number.isNaN(dateTime.getTime())) return null;

  return dateTime;
}

function isCancelableTurno(turno: Turno, now: Date, cancelWindowMs: number): boolean {
  const dateTime = parseTurnoDateTime(turno.fecha, turno.hora);
  if (!dateTime) return false;
  return dateTime.getTime() - now.getTime() >= cancelWindowMs;
}
