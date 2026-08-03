import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Draftline", short_name: "Draftline", description: "A thoughtful publishing platform for independent creators.", start_url: "/", display: "standalone", background_color: "#f8f5ef", theme_color: "#b2472f" };
}
