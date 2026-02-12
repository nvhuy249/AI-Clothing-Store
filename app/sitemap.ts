import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const routes = ["", "/shop", "/login", "/profile", "/wishlist", "/checkout"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
  return routes;
}

