import { useState } from "react";
import { motion } from "framer-motion";
import { useListClientes } from "@workspace/api-client-react";
import { Glass } from "@/components/Glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { inicialesDe } from "@/lib/format";
import { Search, Mail, Phone, Instagram } from "lucide-react";

export default function AdminClientes() {
  const [search, setSearch] = useState("");
  const params = search.trim() ? { search: search.trim() } : {};
  const { data: clientes, isLoading } = useListClientes(params);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">
          Comunidad
        </div>
        <h1 className="font-serif text-3xl">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Tu base de clientes con cuenta en NazaBarber.
        </p>
      </div>

      <Glass className="p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="border-0 bg-transparent focus-visible:ring-0"
          data-testid="input-buscar-cliente"
        />
      </Glass>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Cargando...</div>
      ) : !clientes || clientes.length === 0 ? (
        <Glass className="p-10 text-center text-sm text-muted-foreground">
          {search ? "No encontramos clientes con ese filtro." : "Todavía no hay clientes registrados."}
        </Glass>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Glass className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={c.foto ?? undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {inicialesDe(c.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.nombre}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                    {c.whatsapp && (
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {c.whatsapp}
                      </div>
                    )}
                    {c.instagram && (
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Instagram className="h-3 w-3" /> @{c.instagram.replace(/^@/, "")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {c.totalTurnos} turnos
                  </Badge>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    cliente #{c.id}
                  </span>
                </div>
              </Glass>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
