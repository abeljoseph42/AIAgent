import { ConvexHttpClient } from "convex/browser";

// Create a single instance of the Convex HTTP Client
export const getConvexClient = () => {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
};
