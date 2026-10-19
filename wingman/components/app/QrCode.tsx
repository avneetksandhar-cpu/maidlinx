type QrCodeProps = {
  value: string;
  size?: number;
  className?: string;
};

/** Visual QR stand-in for the mock ticket. Not a live scannable encoder. */
export function QrCode({ value, size = 220, className }: QrCodeProps) {
  const modules = 25;
  const cells: boolean[] = [];

  let seed = 0;
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 33 + value.charCodeAt(i)) >>> 0;
  }

  function bit(n: number) {
    seed = (seed * 1664525 + 1013904223 + n) >>> 0;
    return seed % 2 === 0;
  }

  function inFinder(x: number, y: number, ox: number, oy: number) {
    const dx = x - ox;
    const dy = y - oy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  }

  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      const finder =
        inFinder(x, y, 0, 0) ??
        inFinder(x, y, modules - 7, 0) ??
        inFinder(x, y, 0, modules - 7);
      if (finder !== null) {
        cells.push(finder);
      } else {
        cells.push(bit(x * 31 + y * 17));
      }
    }
  }

  const cell = size / modules;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" rx="8" />
      {cells.map((on, index) => {
        if (!on) return null;
        const x = index % modules;
        const y = Math.floor(index / modules);
        return (
          <rect
            key={index}
            x={x * cell + 1}
            y={y * cell + 1}
            width={cell - 0.6}
            height={cell - 0.6}
            fill="#111111"
          />
        );
      })}
    </svg>
  );
}
