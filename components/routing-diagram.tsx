/** Abstract SVG line-art hero visual — deliberately not stock photography or a literal circuit-board cliché. */
export function RoutingDiagram({ brandLabels }: { brandLabels: string[] }) {
  const nodes = brandLabels.slice(0, 4).map((label, i) => ({ x: 40, y: 40 + i * 80, label }));
  return (
    <svg viewBox="0 0 420 340" width="100%" height="auto" style={{ maxWidth: 440 }} role="img" aria-label="Diagram showing Wisscano routing a request from multiple brands to a deployed solution">
      {nodes.map((n, i) => <line key={i} x1={n.x + 24} y1={n.y} x2={210} y2={170} stroke="rgba(148,163,184,0.14)" strokeWidth="1" />)}
      <line x1="210" y1="170" x2="390" y2="170" stroke="#2F6FED" strokeWidth="1.5" />
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x - 24} y={n.y - 14} width="76" height="28" rx="3" fill="#101B30" stroke="rgba(148,163,184,0.28)" />
          <text x={n.x + 14} y={n.y + 5} textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="10" fill="#93A1B8">{n.label}</text>
        </g>
      ))}
      <circle cx="210" cy="170" r="34" fill="rgba(47,111,237,0.14)" stroke="#2F6FED" strokeWidth="1.5" />
      <text x="210" y="166" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="10" fill="#48D8E8">WISSCANO</text>
      <text x="210" y="180" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="8" fill="#93A1B8">routes request</text>
      <rect x="360" y="153" width="58" height="34" rx="3" fill="#101B30" stroke="#48D8E8" strokeWidth="1.2" />
      <text x="389" y="167" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="9" fill="#EDF1F7">You</text>
      <text x="389" y="180" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="8" fill="#93A1B8">deployed</text>
    </svg>
  );
}
