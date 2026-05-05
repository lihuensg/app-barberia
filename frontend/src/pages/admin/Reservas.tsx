import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTurnosAdmin,
  useMarcarCortado,
  useCancelarCliente,
  getListTurnosAdminQueryKey,
  getGetAdminMetricsQueryKey,
  type Turno,
} from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { fechaLarga, inicialesDe } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Scissors, X, Phone, Mail } from "lucide-react";

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

const ESTADOS = [
  { v: "reservado", label: "Reservados" },
  { v: "cortado", label: "Cortados" },
  { v: "todos", label: "Todos" },
];

const ESTADO_COLOR: Record<string, string> = {
  reservado: "bg-primary/15 text-primary border-primary/30",
  cortado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelado: "bg-muted text-muted-foreground border-white/10",
  disponible: "bg-muted text-muted-foreground border-white/10",
};

export default function AdminReservas() {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState("reservado");
  const [fecha, setFecha] = useState("");
  const [cliente, setCliente] = useState("");
  const [limit, setLimit] = useState(10);
  const [cancelar, setCancelar] = useState<Turno | null>(null);

  const params: { estado?: string; fecha?: string; cliente?: string; limit?: number } = { limit };
  if (estado !== "todos") params.estado = estado;
  if (fecha) params.fecha = fecha;
  if (cliente.trim()) params.cliente = cliente.trim();

  const { data: turnos, isLoading } = useListTurnosAdmin(params);

  const hasMore = (turnos?.length ?? 0) >= limit;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTurnosAdminQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminMetricsQueryKey() });
  };

  const cortarMut = useMarcarCortado({
    mutation: {
      onSuccess: () => {
        toast.success("Turno marcado como cortado");
        invalidate();
      },
      onError: () => toast.error("No pudimos actualizar"),
    },
  });

  const cancelarMut = useCancelarCliente({
    mutation: {
      onSuccess: () => {
        toast.success("Reserva cancelada");
        setCancelar(null);
        invalidate();
      },
      onError: () => toast.error("No pudimos cancelar"),
    },
  });

  const cargarMas = () => {
    setLimit((current) => current + 10);
  };

  const resetLimit = () => setLimit(10);

  const onEstadoChange = (value: string) => {
    setEstado(value);
    resetLimit();
  };

  const onFechaChange = (value: string) => {
    setFecha(value);
    resetLimit();
  };

  const onClienteChange = (value: string) => {
    setCliente(value);
    resetLimit();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">
          Reservas
        </div>
        <h1 className="font-serif text-3xl">Gestión de reservas</h1>
        <p className="text-sm text-muted-foreground">
          Marcá los turnos como cortados o liberalos si no vinieron.
        </p>
      </div>

      <Glass className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 md:gap-4">
        <Tabs value={estado} onValueChange={onEstadoChange} className="w-full md:w-auto md:shrink-0">
          <TabsList className="w-full md:w-auto">
            {ESTADOS.map((e) => (
              <TabsTrigger key={e.v} value={e.v} data-testid={`tab-${e.v}`} className="flex-1 md:flex-none">
                {e.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 md:gap-2 md:flex md:max-w-md md:ml-auto md:gap-3">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            placeholder="Fecha"
            data-testid="input-filtro-fecha"
            className="text-sm"
          />
          <Input
            value={cliente}
            onChange={(e) => onClienteChange(e.target.value)}
            placeholder="Buscar cliente"
            data-testid="input-filtro-cliente"
            className="text-sm"
          />
        </div>
      </Glass>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Cargando...</div>
      ) : (turnos ?? []).length === 0 ? (
        <Glass className="p-10 text-center text-sm text-muted-foreground">
          Sin resultados con esos filtros.
        </Glass>
      ) : (
        <div className="space-y-3">
          {turnos!.map((t) => {
            const dateTime = parseTurnoDateTime(t.fecha, t.hora);
            const isFuture = dateTime ? dateTime.getTime() > Date.now() : false;
            return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Glass className="p-3 sm:p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 md:justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 sm:h-11 w-10 sm:w-11 shrink-0">
                      <AvatarImage src={t.clienteFoto ?? undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs">
                        {inicialesDe(t.clienteNombre ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {t.clienteNombre ?? "Sin asignar"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {fechaLarga(t.fecha)} · {t.hora} hs
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                        {t.clienteEmail && (
                          <span className="inline-flex items-center gap-0.5 min-w-0 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{t.clienteEmail}</span>
                          </span>
                        )}
                        {t.clienteTelefono && (
                          <span className="inline-flex items-center gap-0.5 min-w-0 truncate">
                            <Phone className="h-3 w-3 shrink-0" /> <span className="truncate">{t.clienteTelefono}</span>
                          </span>
                        )}
                        {t.anonimo && (
                          <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">
                            sin cuenta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end md:shrink-0 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(ESTADO_COLOR[t.estado] ?? "", "shrink-0")}
                    >
                      {t.estado}
                    </Badge>
                    {t.estado === "reservado" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cortarMut.mutate({ id: t.id })}
                          disabled={cortarMut.isPending || isFuture}
                          title={isFuture ? "Disponible cuando pase el horario del turno." : undefined}
                          data-testid={`button-cortar-${t.id}`}
                          className="shrink-0 text-xs sm:text-sm"
                        >
                          <Scissors className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Cortado</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelar(t)}
                          data-testid={`button-cancelar-admin-${t.id}`}
                          className="shrink-0 text-xs sm:text-sm"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Glass>
            </motion.div>
          );
          })}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={cargarMas}
                disabled={isLoading}
                data-testid="button-cargar-mas-reservas"
              >
                Cargar 10 más
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!cancelar} onOpenChange={(o) => !o && setCancelar(null)}>
        <AlertDialogContent className="bg-card/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelar &&
                `${cancelar.clienteNombre ?? ""} · ${fechaLarga(cancelar.fecha)} ${cancelar.hora} hs. El turno volverá a estar disponible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelar && cancelarMut.mutate({ id: cancelar.id })}
              data-testid="button-confirmar-cancelar-admin"
            >
              Cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
