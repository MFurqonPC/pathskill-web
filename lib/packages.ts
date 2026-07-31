import { Sprout, Rocket, Target, type LucideIcon } from "lucide-react";

export type Package = {
  id: "starter" | "pro" | "mentor";
  icon: LucideIcon;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
};

export const PACKAGES: Package[] = [
  {
    id: "starter",
    icon: Sprout,
    name: "Starter",
    price: "Gratis",
    period: "selamanya",
    description: "Cocok untuk kamu yang baru mau mulai mengenali skill gap.",
    features: [
      "1x Skill Assessment",
      "Skill map & gap analysis",
      "Dashboard progress dasar",
    ],
    highlight: false,
  },
  {
    id: "pro",
    icon: Rocket,
    name: "Pro",
    price: "Rp49.000",
    period: "/bulan",
    description:
      "Untuk yang serius mengejar target karier dalam beberapa bulan.",
    features: [
      "Skill assessment tanpa batas",
      "Jalur belajar personal by AI",
      "Semua modul & assignment praktis",
      "Dashboard progress lengkap",
    ],
    highlight: true,
  },
  {
    id: "mentor",
    icon: Target,
    name: "Career Mentor",
    price: "Rp199.000",
    period: "/bulan",
    description:
      "Dampingan personal biar nggak salah arah dan lebih cepat siap kerja.",
    features: [
      "Semua fitur Pro",
      "1:1 mentoring session (2x/bulan)",
      "Review portofolio & CV",
      "Prioritas job-matching partner",
      "Grup diskusi eksklusif mentor",
    ],
    highlight: false,
  },
];

export function ctaLabel(id: Package["id"]) {
  switch (id) {
    case "starter":
      return "Mulai Gratis";
    case "pro":
      return "Coba Pro";
    case "mentor":
      return "Pilih Career Mentor";
  }
}