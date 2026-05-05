import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import RequireAuth from "@/components/RequireAuth";
import Home from "@/pages/Home";
import Reservar from "@/pages/Reservar";
import Login from "@/pages/Login";
import Registro from "@/pages/Registro";
import Recuperar from "@/pages/Recuperar";
import Restablecer from "@/pages/Restablecer";
import Feed from "@/pages/Feed";
import Perfil from "@/pages/Perfil";
import MisTurnos from "@/pages/MisTurnos";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminTurnos from "@/pages/admin/Turnos";
import AdminReservas from "@/pages/admin/Reservas";
import AdminPosts from "@/pages/admin/Posts";
import AdminClientes from "@/pages/admin/Clientes";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth requireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAuth>
  );
}

function ClienteRoute({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PublicLayout>{children}</PublicLayout>
    </RequireAuth>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/"><PublicRoute><Home /></PublicRoute></Route>
      <Route path="/reservar"><PublicRoute><Reservar /></PublicRoute></Route>
      <Route path="/login"><PublicRoute><Login /></PublicRoute></Route>
      <Route path="/registro"><PublicRoute><Registro /></PublicRoute></Route>
      <Route path="/recuperar"><PublicRoute><Recuperar /></PublicRoute></Route>
      <Route path="/restablecer/:token">
        {(params) => (
          <PublicRoute>
            <Restablecer token={params.token} />
          </PublicRoute>
        )}
      </Route>
      <Route path="/feed"><PublicRoute><Feed /></PublicRoute></Route>
      <Route path="/perfil"><ClienteRoute><Perfil /></ClienteRoute></Route>
      <Route path="/mis-turnos"><ClienteRoute><MisTurnos /></ClienteRoute></Route>
      <Route path="/admin"><AdminRoute><AdminDashboard /></AdminRoute></Route>
      <Route path="/admin/turnos"><AdminRoute><AdminTurnos /></AdminRoute></Route>
      <Route path="/admin/reservas"><AdminRoute><AdminReservas /></AdminRoute></Route>
      <Route path="/admin/posts"><AdminRoute><AdminPosts /></AdminRoute></Route>
      <Route path="/admin/clientes"><AdminRoute><AdminClientes /></AdminRoute></Route>
      <Route><PublicRoute><NotFound /></PublicRoute></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Sonner position="top-right" richColors theme="dark" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
