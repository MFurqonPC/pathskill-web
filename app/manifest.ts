import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PathSkill - Petakan Skill, Susun Jalur Belajar Personal",
    short_name: "PathSkill",
    description:
      "PathSkill memetakan kesenjangan skill kamu terhadap standar industri, lalu menyusun jalur belajar personal yang disusun AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1739",
    theme_color: "#0B1739",
    icons: [
      {
        src: "/logo/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
