import React from 'react';
import { formatDate, formatPrice, getCategoryMeta } from '../lib/constants.js';
import { CalendarIcon, LocationIcon, TicketIcon, SourceIcon, BookmarkIcon, CategoryGlyph } from './Icons.jsx';

export default function EventCard({
  event,
  onClick,
  isSaved = false,
  onToggleSave
}) {
  if (!event) return null;

  const {
    event_id = '0000',
    title = 'Untitled Signal',
    category = 'Music',
    date,
    time,
    venue = 'Independent Venue',
    area = 'Hyderabad',
    price,
    description,
    sources = [],
    image
  } = event;

  const meta = getCategoryMeta(category);
  const displayPrice = formatPrice(price);
  const isFree = displayPrice.toLowerCase().includes('free');
  const primarySource = sources[0] || {};
  const cardImage = image || meta.fallbackImage;
  const cleanArea = area ? area.split(',')[0].trim() : 'Hyderabad';
  const cleanId = String(event_id).replace(/[^0-9]/g, '').slice(-4).padStart(4, '0') || '0842';

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(event);
  };

  return (
    <article
      className="sv-hud-card group"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Event Signal: ${title}`}
    >
      {/* Digitized Top Telemetry Bar */}
      <div className="sv-hud-top-bar font-mono">
        <span className="sv-hud-sig-id">SIG_NODE #{cleanId}</span>
        <span className="sv-hud-status-dot">● ACTIVE</span>
      </div>

      {/* Media Window with Scanline Effect */}
      <div className="sv-card-media">
        <img
          src={cardImage}
          alt={title}
          className="sv-card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = meta.fallbackImage;
          }}
        />
        <div className="sv-hud-scanlines" />
        <div className="sv-card-media-overlay" />

        {/* Category & Bookmark Bar */}
        <div className="sv-card-badges-top">
          <span
            className="sv-category-badge font-mono"
            style={{
              borderColor: meta.border,
              backgroundColor: 'rgba(8, 12, 10, 0.88)',
              color: '#F4F3EE'
            }}
          >
            <span className="badge-glyph-wrap" style={{ color: meta.color }}>
              <CategoryGlyph category={category} className="w-3.5 h-3.5" />
            </span>
            <span className="badge-category-text">{category}</span>
          </span>

          <button
            type="button"
            className={`sv-bookmark-btn ${isSaved ? 'active' : ''}`}
            onClick={handleBookmarkClick}
            aria-label={isSaved ? 'Saved in constellation' : 'Save to constellation'}
            title={isSaved ? 'Saved in My Constellation' : 'Save signal'}
          >
            <BookmarkIcon className="w-3.5 h-3.5" filled={isSaved} />
          </button>
        </div>

        {/* Source Verified Telemetry Tag */}
        {primarySource.site_name && (
          <div className="sv-card-source-bottom font-mono">
            <span className="sv-source-chip">
              <SourceIcon className="w-3 h-3 text-jade" />
              <span>CRAWLED // {primarySource.site_name.toUpperCase()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="sv-card-body">
        <div className="sv-hud-meta-grid font-mono">
          <div className="sv-hud-meta-cell">
            <span className="sv-hud-meta-label">DATE</span>
            <span className="sv-hud-meta-val">{formatDate(date)}</span>
          </div>
          <div className="sv-hud-meta-cell">
            <span className="sv-hud-meta-label">LOCALITY</span>
            <span className="sv-hud-meta-val truncate">{cleanArea}</span>
          </div>
        </div>

        <h3 className="sv-card-title font-serif" title={title}>
          {title}
        </h3>

        <div className="sv-card-venue font-mono">
          <LocationIcon className="w-3 h-3 text-saffron" />
          <span className="truncate">{venue}</span>
        </div>
      </div>

      {/* Digitized Footer Specs */}
      <div className="sv-card-footer font-mono">
        <span className={`sv-price-pill ${isFree ? 'price-free' : 'price-paid'}`}>
          <TicketIcon className="w-3 h-3 opacity-80" />
          <span>{displayPrice}</span>
        </span>

        <span className="sv-hud-action-btn">
          <span>ACCESS SIGNAL</span>
          <span className="sv-hud-arrow">→</span>
        </span>
      </div>
    </article>
  );
}
