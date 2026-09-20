export const Gauge = ({ value, min, max, label, unit, warnAt, critAt, color = "#10B981", testId }) => {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -120 + pct * 240;
  const R = 64;
  const C = 90;
  const polar = (a, r = R) => [C + r * Math.cos((a * Math.PI) / 180), C + r * Math.sin((a * Math.PI) / 180)];
  const arc = (a0, a1, r = R) => {
    const [x0, y0] = polar(a0, r);
    const [x1, y1] = polar(a1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const level = critAt !== undefined && value >= critAt ? "#EF4444" : warnAt !== undefined && value >= warnAt ? "#F59E0B" : color;
  const [nx, ny] = polar(angle, R - 18);
  return (
    <div data-testid={testId} className="flex flex-col items-center">
      <svg viewBox="0 0 180 130" className="w-full max-w-[190px]">
        <path d={arc(-120, 120)} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
        {pct > 0.005 && (
          <path d={arc(-120, angle)} fill="none" stroke={level} strokeWidth="10" strokeLinecap="round"
            style={{ transition: "stroke 0.4s" }} />
        )}
        {warnAt !== undefined && (
          <circle cx={polar(-120 + ((warnAt - min) / (max - min)) * 240)[0]} cy={polar(-120 + ((warnAt - min) / (max - min)) * 240)[1]} r="2.5" fill="#F59E0B" />
        )}
        {critAt !== undefined && (
          <circle cx={polar(-120 + ((critAt - min) / (max - min)) * 240)[0]} cy={polar(-120 + ((critAt - min) / (max - min)) * 240)[1]} r="2.5" fill="#EF4444" />
        )}
        <line x1={C} y1={C} x2={nx} y2={ny} stroke={level} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }} />
        <circle cx={C} cy={C} r="5" fill="#f1f5f9" stroke={level} strokeWidth="2" />
        <text x={C} y={C - 22} textAnchor="middle" fill={level} fontSize="22" fontWeight="800" fontFamily="JetBrains Mono, monospace"
          style={{ transition: "fill 0.4s" }}>
          {typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}
        </text>
        <text x={C} y={C - 8} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono, monospace">{unit}</text>
      </svg>
      <div className="sd-label -mt-1 text-center">{label}</div>
    </div>
  );
};
