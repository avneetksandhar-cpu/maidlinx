export function BookingQr({ value, label }: { value: string; label: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(value)}`;
  return (
    <figure className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`QR code for ${label}`} width={88} height={88} className="h-[88px] w-[88px] rounded-lg bg-white" />
    </figure>
  );
}
