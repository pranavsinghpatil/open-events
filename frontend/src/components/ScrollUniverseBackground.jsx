import React, { memo } from 'react';

/**
 * ScrollUniverseBackground
 * 
 * Clean, lightweight ambient backdrop with obsidian noir canvas,
 * atmospheric nebula glow orbs, subtle tactile grain, and coordinate grid lines.
 * Morphing rings WebGL layer has been completely removed.
 */
function ScrollUniverseBackgroundComponent({ page = 'home' }) {
  return (
    <div className="sv-universe-bg-root" aria-hidden="true">
      {/* Ambient Atmospheric Glow Orbs */}
      <div className="sv-nebula-orb orb-top-left" />
      <div className="sv-nebula-orb orb-center-right" />
      <div className="sv-nebula-orb orb-bottom-saffron" />

      {/* Tactile Noise Grain Overlay */}
      <div className="sv-universe-grain" />

      {/* Subtle Coordinate Grid Lines */}
      <div className="sv-universe-grid" />
    </div>
  );
}

export default memo(ScrollUniverseBackgroundComponent);
