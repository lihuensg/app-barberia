/**
 * Extended API hooks for PASO 5 features
 * These wrap the native customFetch for endpoints not yet in generated API
 */
import { useMutation } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ============================================================================
// Delete Comment
// ============================================================================

export const deleteComment = async (
  comentarioId: number,
  options?: RequestInit,
): Promise<{ message: string }> => {
  return customFetch<{ message: string }>(
    `/api/redsocial/comentar/${comentarioId}`,
    {
      ...options,
      method: "DELETE",
    }
  );
};

export const useDeleteComment = (options: {
  mutation?: any;
  request?: any;
} = {}) => {
  return useMutation({
    mutationFn: (comentarioId: number) => deleteComment(comentarioId),
    ...options?.mutation,
  });
};

// ============================================================================
// Upload Post Image
// ============================================================================

export interface UploadImageResponse {
  imageUrl: string;
  imagePublicId: string;
}

export const uploadPostImage = async (
  file: File,
  options?: RequestInit,
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return customFetch<UploadImageResponse>(
    `/api/redsocial/upload-image`,
    {
      ...options,
      method: "POST",
      body: formData,
    }
  );
};

export const useUploadPostImage = (options: {
  mutation?: any;
  request?: any;
} = {}) => {
  return useMutation({
    mutationFn: (file: File) => uploadPostImage(file),
    ...options?.mutation,
  });
};

// ============================================================================
// Upload Profile Image
// ============================================================================

export const uploadProfileImage = async (
  file: File,
  options?: RequestInit,
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  // El backend devuelve directamente el usuario actualizado
  return customFetch<any>(`/api/usuario/subir-foto`, {
    ...options,
    method: 'PUT',
    body: formData,
  });
};

export const useUploadProfileImage = (options: {
  mutation?: any;
  request?: any;
} = {}) => {
  return useMutation({
    mutationFn: (file: File) => uploadProfileImage(file),
    ...options?.mutation,
  });
};

// ============================================================================
// Delete Post (existing but enhanced)
// ============================================================================

export const deletePostImage = async (
  postId: number,
  options?: RequestInit,
): Promise<{ message: string }> => {
  return customFetch<{ message: string }>(
    `/api/redsocial/eliminar-post/${postId}`,
    {
      ...options,
      method: "DELETE",
    }
  );
};

export const useDeletePostImage = (options: {
  mutation?: any;
  request?: any;
} = {}) => {
  return useMutation({
    mutationFn: (postId: number) => deletePostImage(postId),
    ...options?.mutation,
  });
};

// ============================================================================
// Admin Cancel Reservation
// ============================================================================

export interface CancelarReservaAdminResponse {
  message: string;
  turno: any;
}

export const cancelarReservaAdmin = async (
  turnoId: number,
  payload?: { motivo?: string },
  options?: RequestInit,
): Promise<CancelarReservaAdminResponse> => {
  return customFetch<CancelarReservaAdminResponse>(
    `/api/turnos/admin/cancelar/${turnoId}`,
    {
      ...options,
      method: "PUT",
      body: JSON.stringify(payload ?? {}),
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    }
  );
};

export const useCancelarReservaAdmin = (options: {
  mutation?: any;
  request?: any;
} = {}) => {
  return useMutation({
    mutationFn: (vars: { id: number; motivo?: string }) =>
      cancelarReservaAdmin(vars.id, vars.motivo ? { motivo: vars.motivo } : undefined),
    ...options?.mutation,
  });
};

// ============================================================================
// Rate Limit Info Hook (client-side tracking)
// ============================================================================

export interface RateLimitInfo {
  remaining: number;
  resetAt: Date | null;
  isLimited: boolean;
}

/**
 * Hook para rastrear rate limits del cliente
 * Mantiene un contador local de requests para mostrar advertencias
 */
export const useRateLimitTracker = (
  endpoint: "comments" | "likes",
  limits: {
    commentsPerWindow?: number;
    likesPerWindow?: number;
    windowMs?: number;
  } = {}
) => {
  const defaultLimits = {
    commentsPerWindow: 10,
    likesPerWindow: 60,
    windowMs: 600000, // 10 minutos
    ...limits,
  };

  const limit =
    endpoint === "comments"
      ? defaultLimits.commentsPerWindow
      : defaultLimits.likesPerWindow;

  // Esto se mantendría en estado si fuera necesario persistencia
  // Por ahora retornamos un tracker que el componente puede usar
  return {
    limit,
    windowMs: defaultLimits.windowMs,
    getWarningLevel: (used: number) => {
      const percentage = (used / limit) * 100;
      if (percentage >= 100) return "error";
      if (percentage >= 80) return "warning";
      if (percentage >= 50) return "info";
      return "ok";
    },
    getRemainingText: (used: number) => {
      const remaining = Math.max(0, limit - used);
      return `${remaining}/${limit}`;
    },
  };
};
