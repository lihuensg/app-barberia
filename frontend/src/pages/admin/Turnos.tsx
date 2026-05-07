import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCrearTurno,
  useGenerarSemana,
  useListTurnosAdmin,
  useDeleteTurno,
  getListTurnosAdminQueryKey,
  getListTurnosDisponiblesQueryKey,
  getGetAdminMetricsQueryKey,
} from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, Plus, CalendarRange } from "lucide-react";

const DIAS_SEMANA = [
  { v: 1, label: "Lun" },
  { v: 2, label: "Mar" },
  { v: 3, label: "Mié" },
  { v: 4, label: "Jue" },
  { v: 5, label: "Vie" },
  { v: 6, label: "Sáb" },
  { v: 0, label: "Dom" },
];

export default function AdminTurnos() {
  const queryClient = useQueryClient();
  const { data: turnos } = useListTurnosAdmin({});
  const [del, setDel] = useState<{ id: number; fecha: string; hora: string } | null>(null);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  const [singleFecha, setSingleFecha] = useState(todayISO());
  const [singleHora, setSingleHora] = useState("10:00");

  const [bulkFecha, setBulkFecha] = useState(todayISO());
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("19:00");
  const [intervalo, setIntervalo] = useState(45);
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListTurnosAdminQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTurnosDisponiblesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminMetricsQueryKey() });
  };

  const crearMut = useCrearTurno({
    mutation: {
      onSuccess: () => {
        toast.success("Turno creado");
        invalidateAll();
      },
      onError: (e: any) => toast.error("No pudimos crear el turno", { description: e?.message }),
    },
  });

  const semanaMut = useGenerarSemana({
    mutation: {
      onSuccess: (data) => {
        toast.success(`Se generaron ${data.creados} turnos`);
        invalidateAll();
      },
      onError: () => toast.error("No pudimos generar la semana"),
    },
  });

  const deleteMut = useDeleteTurno({
    mutation: {
      onSuccess: () => {
        toast.success("Turno eliminado");
        setDel(null);
        invalidateAll();
      },
      onError: () => toast.error("No pudimos eliminar"),
    },
  });

  // Toggle expanded dates to show/hide all turnos for a date
  const toggleExpandedDate = (fecha: string) => {
    setExpandedDates((prev) => (prev.includes(fecha) ? prev.filter((d) => d !== fecha) : [...prev, fecha]));
  };

  const grouped = (() => {
    const map = new Map<string, typeof turnos>();

    (turnos ?? [])
      .filter((t) => t.fecha >= todayISO())
      .forEach((t) => {
      const arr = map.get(t.fecha) ?? [];
      arr.push(t);
      map.set(t.fecha, arr);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  const estadoClassNames: Record<string, string> = {
    disponible: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    reservado: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    cancelado: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    cortado: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">
          Agenda
        </div>
        <h1 className="font-serif text-3xl">Turnos disponibles</h1>
        <p className="text-sm text-muted-foreground">
          Creá turnos sueltos o generá la agenda semanal completa.
        </p>
      </div>

      {/* Removed manual assignment feedback UI - assignments are not allowed from this page */}

      <div className="grid lg:grid-cols-2 gap-4">
        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="font-serif text-xl">Nuevo turno</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              crearMut.mutate({ data: { fecha: singleFecha, hora: singleHora } });
            }}
            className="grid sm:grid-cols-2 gap-3"
          >
            <div>
              <Label htmlFor="sf" className="text-xs sm:text-sm">Fecha</Label>
              <Input
                id="sf"
                type="date"
                value={singleFecha}
                onChange={(e) => setSingleFecha(e.target.value)}
                data-testid="input-single-fecha"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="sh" className="text-xs sm:text-sm">Hora</Label>
              <Input
                id="sh"
                type="time"
                value={singleHora}
                onChange={(e) => setSingleHora(e.target.value)}
                data-testid="input-single-hora"
                className="text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={crearMut.isPending}
                data-testid="button-crear-turno"
                size="sm"
              >
                {crearMut.isPending ? "Creando..." : "Crear turno"}
              </Button>
            </div>
          </form>
        </Glass>

        <Glass className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarRange className="h-4 w-4 text-primary" />
            <h2 className="font-serif text-xl">Generar semana</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              semanaMut.mutate({
                data: {
                  fechaInicio: bulkFecha,
                  horaInicio,
                  horaFin,
                  intervaloMinutos: intervalo,
                  diasIncluidos: dias,
                },
              });
            }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="bf" className="text-xs sm:text-sm">Desde</Label>
                <Input
                  id="bf"
                  type="date"
                  value={bulkFecha}
                  onChange={(e) => setBulkFecha(e.target.value)}
                  data-testid="input-bulk-desde"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="hi" className="text-xs sm:text-sm">Hora inicio</Label>
                <Input
                  id="hi"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  data-testid="input-bulk-hi"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="hf" className="text-xs sm:text-sm">Hora fin</Label>
                <Input
                  id="hf"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  data-testid="input-bulk-hf"
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="iv" className="text-xs sm:text-sm">Intervalo (min)</Label>
                <Input
                  id="iv"
                  type="number"
                  min={15}
                  step={5}
                  value={intervalo}
                  onChange={(e) => setIntervalo(Number(e.target.value))}
                  data-testid="input-bulk-iv"
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Días</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIAS_SEMANA.map((d) => {
                  const active = dias.includes(d.v);
                  return (
                    <button
                      type="button"
                      key={d.v}
                      onClick={() =>
                        setDias((prev) =>
                          prev.includes(d.v)
                            ? prev.filter((x) => x !== d.v)
                            : [...prev, d.v],
                        )
                      }
                      className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary/40 border-white/10 text-muted-foreground"
                      }`}
                      data-testid={`button-dia-${d.v}`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={semanaMut.isPending}
                data-testid="button-generar-semana"
                size="sm"
              >
                {semanaMut.isPending ? "Generando..." : "Generar semana"}
              </Button>
            </div>
          </form>
        </Glass>
      </div>

      <div>
        <h2 className="font-serif text-xl mb-3">Todos los turnos</h2>
        {grouped.length === 0 ? (
          <Glass className="p-8 text-center text-sm text-muted-foreground">
            No hay turnos cargados.
          </Glass>
        ) : (
          <div className="space-y-4">
            {grouped.map(([fecha, slots]) => (
              <Glass key={fecha} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">{fechaLarga(fecha)}</div>
                  <Badge variant="outline" className="text-xs">
                    {slots?.length} turnos
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const isExpanded = expandedDates.includes(fecha);
                    const toShow = isExpanded ? (slots ?? []) : (slots?.slice(0, 3) ?? []);
                    return (
                      <>
                        {toShow.map((t) => (
                          <motion.div
                            key={t.id}
                            layout
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-secondary/30 text-sm"
                          >
                            <span>{t.hora}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase tracking-[0.2em] ${estadoClassNames[t.estado] ?? "border-white/10 bg-white/5 text-muted-foreground"}`}
                            >
                              {t.estado}
                            </Badge>
                            <button
                              onClick={() => setDel({ id: t.id, fecha: t.fecha, hora: t.hora })}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              aria-label="Eliminar"
                              data-testid={`button-del-${t.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))}
                        {!isExpanded && (slots?.length ?? 0) > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandedDate(fecha)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Ver {(slots?.length ?? 0) - 3} turnos más
                          </button>
                        )}
                        {isExpanded && (
                          <button
                            type="button"
                            onClick={() => toggleExpandedDate(fecha)}
                            className="text-xs text-muted-foreground hover:underline mt-1"
                          >
                            Mostrar menos
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </Glass>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent className="bg-card/95 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              {del && `${fechaLarga(del.fecha)} · ${del.hora} hs`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del && deleteMut.mutate({ id: del.id })}
              data-testid="button-confirmar-del-turno"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment dialog removed — admin assignment from this page is disabled */}
    </div>
  );
}
