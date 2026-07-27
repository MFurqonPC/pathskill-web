import Image from "next/image";

type LogoMarkProps = {
  size?: number;
  /**
   * Pakai "chip" saat logo ditaruh di atas background gelap (mis. navy navbar/footer)
   * supaya background putih asli logo tidak menyatu dengan background gelap.
   * Pakai "plain" saat sudah di atas background putih/terang.
   */
  variant?: "chip" | "plain";
};

export function LogoMark({ size = 32, variant = "chip" }: LogoMarkProps) {
  const image = (
    <Image
      src="/logo/pathskill-icon.png"
      alt="PathSkill"
      width={size}
      height={size}
      className="rounded-md"
      priority
    />
  );

  if (variant === "plain") return image;

  return (
    <div
      className="bg-white rounded-lg p-0.5 flex items-center justify-center shrink-0"
      style={{ width: size + 4, height: size + 4 }}
    >
      {image}
    </div>
  );
}
