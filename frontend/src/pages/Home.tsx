import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Glass, GoldDivider } from "@/components/Glass";
import { useGetAdminPublicos } from "@workspace/api-client-react";
import { Scissors, Sparkles, Calendar, Instagram, MessageCircle } from "lucide-react";

export default function Home() {
  const { data: admin } = useGetAdminPublicos();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.12),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(212,175,55,0.06),_transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 sm:pt-20 md:pt-28 md:pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-[0.2em] mb-6">
                <Sparkles className="h-3 w-3" />
                Premium Barber Studio
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl leading-tight tracking-tight">
                El detalle hace
                <br />
                <span className="text-primary">la diferencia.</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-muted-foreground text-base sm:text-lg max-w-md">
                Cortes, barba y experiencia. Reservá tu turno online y vení a sentir
                la atención de NazaBarber.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-hero-reservar">
                  <Link href="/reservar">
                    <Calendar className="h-4 w-4" /> Reservar turno
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/feed">Ver el trabajo</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  10+ años de oficio
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Palermo, CABA
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative hidden sm:block"
            >
              <Glass variant="strong" className="p-6 sm:p-8 md:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/30 p-[2px]">
                    <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                      {admin?.foto ? (
                        <img
                          src={admin.foto}
                          alt={admin.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Scissors className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-2xl">{admin?.nombre ?? "Naza"}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Master Barber
                    </div>
                  </div>
                </div>
                <GoldDivider />
                <p className="mt-6 text-muted-foreground">
                  {admin?.bio ??
                    "Cortes clásicos y modernos, barba esculpida y atención personalizada en un ambiente cálido."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {admin?.instagram && (
                    <a
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover-elevate"
                      href={`https://instagram.com/${admin.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Instagram className="h-3.5 w-3.5" /> @{admin.instagram.replace(/^@/, "")}
                    </a>
                  )}
                  { (admin?.whatsappNormalizado || admin?.whatsapp) && (
                    <a
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover-elevate"
                      href={`https://wa.me/${(admin?.whatsappNormalizado || admin?.whatsapp || "").toString().replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </div>
              </Glass>
              <div className="absolute -bottom-6 -right-6 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: "Corte clásico", desc: "Forma, terminación y producto." },
            { title: "Barba esculpida", desc: "Diseño, perfilado y aceites." },
            { title: "Combo completo", desc: "Corte + barba en una sesión." },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Glass className="p-6 h-full">
                <Scissors className="h-5 w-5 text-primary mb-4" />
                <div className="font-serif text-xl mb-1">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </Glass>
            </motion.div>
          ))}
        </div>
      </section>



      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <Glass variant="strong" className="px-6 py-12 md:p-12 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
            Listo cuando vos quieras
          </div>
          <h2 className="font-serif text-3xl md:text-4xl mb-3">
            Reservá tu próximo turno
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Elegí día y horario. Si ya tenés cuenta, llevamos tu historial.
          </p>
          <Button asChild size="lg" data-testid="button-cta-reservar">
            <Link href="/reservar">Reservar ahora</Link>
          </Button>
        </Glass>
      </section>
    </div>
  );
}
