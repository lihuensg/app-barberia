const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function fechaLarga(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]} ${d} de ${MESES[m - 1]}`;
}

export function fechaCorta(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]?.slice(0, 3)} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastOrToday(yyyymmdd: string): boolean {
  return yyyymmdd <= todayISO();
}

export function tiempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-AR");
}

export function inicialesDe(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
