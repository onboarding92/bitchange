import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  return {
    user,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}
