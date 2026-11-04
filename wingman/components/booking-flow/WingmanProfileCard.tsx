"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";

export function WingmanProfileCard({
  name,
  verified,
  photoUrl,
  rating,
  responseTime,
}: {
  name: string;
  verified: boolean;
  photoUrl: string | null;
  rating?: string | null;
  responseTime?: string | null;
}) {
  const firstName = name.split(/[\s·]+/)[0] || name;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white/[0.04]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <WingmanLogo size={56} title="Wingman" />
        )}
      </div>
      <h2 className="mt-6 text-[22px] font-medium tracking-[-0.02em] text-white">{firstName}</h2>
      {verified ? <p className="mt-2 text-[13px] text-white/50">Verified</p> : null}
      {rating ? <p className="mt-1 text-[13px] text-white/50">{rating}</p> : null}
      {responseTime ? <p className="mt-1 text-[13px] text-white/50">{responseTime}</p> : null}
    </div>
  );
}
