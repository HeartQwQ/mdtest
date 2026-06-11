import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10 * 1000
    }
  }
})
