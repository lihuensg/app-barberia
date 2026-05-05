import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, type Usuario } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (token: string, user: Usuario) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("nazabarber_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  const login = (newToken: string, newUser: Usuario) => {
    localStorage.setItem("nazabarber_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const logout = () => {
    localStorage.removeItem("nazabarber_token");
    setToken(null);
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
  };

  const isAdmin = user?.rol === "admin";

  return (
    <AuthContext.Provider value={{ user: user || null, token, login, logout, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
