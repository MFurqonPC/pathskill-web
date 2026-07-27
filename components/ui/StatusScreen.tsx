import type { LucideIcon } from "lucide-react";
import { RefreshCcw, Sparkles } from "lucide-react";

/**
 * Full-screen state used for "belum bisa lanjut" kondisi (belum pilih karier,
 * belum assessment, dsb). Dipakai bareng oleh SkillMapPage & LearningPathPage
 * supaya icon, spacing, dan copy-style-nya konsisten di semua halaman.
 */
interface StatusScreenProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: LucideIcon;
}

export function StatusScreen({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Sparkles,
}: StatusScreenProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0B1739] flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-1">
        <Icon className="w-6 h-6 text-purple-400" aria-hidden="true" />
      </div>
      <p className="text-white font-semibold">{title}</p>
      <p className="text-white/60 text-sm max-w-xs">{description}</p>
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1739] bg-white hover:bg-gray-100 px-4 py-2.5 rounded-lg mt-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739]"
      >
        <ActionIcon className="w-4 h-4" aria-hidden="true" />
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * Full-screen state khusus untuk technical error (gagal fetch, dsb),
 * dengan tombol "Coba lagi". Dipisah dari StatusScreen karena nggak
 * punya icon lingkaran ungu & tombolnya beda style (outline, bukan solid putih).
 */
interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0B1739] flex flex-col items-center justify-center gap-3 text-center px-6">
      <p className="text-white/70 text-sm max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <RefreshCcw className="w-4 h-4" aria-hidden="true" />
        Coba lagi
      </button>
    </div>
  );
}