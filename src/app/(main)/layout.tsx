import { cookies } from "next/headers";
import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";
import { getCart } from "@/lib/api/checkout";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const token = store.get("jwt")?.value ?? "";

  const queryClient = new QueryClient();

  // Seed the cart cache on the server — client useQuery finds data immediately,
  // no loading flash, no duplicate network request.
  if (token) {
    await queryClient.prefetchQuery({
      queryKey: ["cart"],
      queryFn: () => getCart(token),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
