import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetAdminMetrics } from "@workspace/api-client-react";
import type { Turno } from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fechaLarga, inicialesDe } from "@/lib/format";
import {
  CalendarCheck2,
  CalendarPlus,
  Scissors,
  Users,
  ImageIcon,
  ArrowRight,
  X,
} from "lucide-react";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/utils/whatsapp";

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

  if (
    dateTime.getFullYear() !== year ||
    dateTime.getMonth() !== month - 1 ||
    dateTime.getDate() !== day
  ) {
    return null;
  }

  return dateTime;
}

const MAIN_STATS = [
  { key: "availableNow" as const, label: "Disponibles ahora", icon: CalendarPlus },
  { key: "upcomingReserved" as const, label: "Reservados próximos", icon: CalendarCheck2 },
  { key: "cutToday" as const, label: "Cortados hoy", icon: Scissors },
  { key: "cancelledToday" as const, label: "Cancelados hoy", icon: X },
];

function PeriodMetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Glass className="h-full p-4 flex flex-col justify-between min-h-[108px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground leading-tight">
          {label}
        </div>
      </div>
      <div className="font-serif text-3xl sm:text-4xl leading-none text-foreground">
        {value}
      </div>
    </Glass>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminMetrics();

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();

    return (data?.upcomingAppointments ?? [])
      .map((turno: Turno) => ({
        turno,
        dateTime: parseTurnoDateTime(turno.fecha, turno.hora),
      }))
      .filter(
        (item: { turno: Turno; dateTime: Date | null }) =>
          item.dateTime !== null && item.dateTime.getTime() >= now,
      )
      .sort(
        (a: { turno: Turno; dateTime: Date | null }, b: { turno: Turno; dateTime: Date | null }) =>
          (a.dateTime?.getTime() ?? Number.POSITIVE_INFINITY) -
          (b.dateTime?.getTime() ?? Number.POSITIVE_INFINITY),
      )
      .map((item: { turno: Turno; dateTime: Date | null }) => item.turno);
  }, [data?.upcomingAppointments]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">Panel</div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Un vistazo rápido a tu agenda, clientes y desempeño.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {MAIN_STATS.map((s, i) => {
          const Icon = s.icon;
          const value = data ? (data[s.key as keyof typeof data] as number) || 0 : 0;

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Glass className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground leading-tight">
                    {s.label}
                  </div>
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                </div>
                <div className="font-serif text-2xl sm:text-3xl">{isLoading ? "—" : value}</div>
              </Glass>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        <Glass className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Próximos turnos</h2>
            <Link
              href="/admin/reservas"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay próximos turnos.</div>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((t: Turno) => (
                (() => {
                  const clienteId = t.clienteId ?? (t as any).cliente_id ?? null;
                  const clienteNombre = t.clienteNombre ?? (t as any).cliente_nombre ?? null;
                  const clienteWhatsapp = t.clienteWhatsapp ?? (t as any).cliente_whatsapp ?? t.clienteTelefono ?? (t as any).cliente_telefono ?? null;
                  const clienteFoto = t.clienteFoto ?? (t as any).cliente_foto ?? null;
                  const esAnonimo = Boolean((t.anonimo ?? (t as any).anonimo) && !clienteId);

                  return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={clienteFoto ?? undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-xs">
                        {inicialesDe(clienteNombre ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm truncate">{clienteNombre ?? "Sin asignar"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {fechaLarga(t.fecha)} · {t.hora} hs
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {esAnonimo && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        sin cuenta
                      </span>
                    )}
                    {clienteWhatsapp && normalizeWhatsAppPhone(clienteWhatsapp) && (
                      <button
                        onClick={() => {
                          const msg = `Hola ${clienteNombre ?? ''}, te confirmamos tu turno en Naza para el ${fechaLarga(t.fecha)} a las ${t.hora}. Te esperamos.`;
                          const url = buildWhatsAppUrl(clienteWhatsapp, msg);
                          if (url) window.open(url, '_blank', 'noopener');
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </Glass>

        <Glass className="p-5">
          <h2 className="font-serif text-xl mb-4">Atajos</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/turnos"
              className="p-4 rounded-lg border border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <CalendarPlus className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm">Generar agenda</div>
              <div className="text-xs text-muted-foreground">Crear turnos para la semana</div>
            </Link>
            <Link
              href="/admin/posts"
              className="p-4 rounded-lg border border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm">Nuevo post</div>
              <div className="text-xs text-muted-foreground">Subí tus últimos trabajos</div>
            </Link>
            <Link
              href="/admin/reservas"
              className="p-4 rounded-lg border border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <CalendarCheck2 className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm">Reservas</div>
              <div className="text-xs text-muted-foreground">Marcar cortados o cancelar</div>
            </Link>
            <Link
              href="/admin/clientes"
              className="p-4 rounded-lg border border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <Users className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm">Clientes</div>
              <div className="text-xs text-muted-foreground">Ver el listado completo</div>
            </Link>
          </div>
        </Glass>
      </div>

      <Glass className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-xl">Resumen del período</h2>
            <p className="text-sm text-muted-foreground">
              Solo cortados y cancelados, separados por semana y mes.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-secondary/20 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg leading-none">Esta semana</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Movimiento acumulado de los últimos días.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                período
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              <PeriodMetricCard
                label="Cortados"
                value={isLoading ? "—" : data?.week?.cut || 0}
              />
              <PeriodMetricCard
                label="Cancelados"
                value={isLoading ? "—" : data?.week?.cancelled || 0}
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-secondary/20 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg leading-none">Este mes</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  Acumulado general del mes en curso.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                período
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              <PeriodMetricCard
                label="Cortados"
                value={isLoading ? "—" : data?.month?.cut || 0}
              />
              <PeriodMetricCard
                label="Cancelados"
                value={isLoading ? "—" : data?.month?.cancelled || 0}
              />
            </div>
          </div>
        </div>
      </Glass>
    </div>
  );
}
