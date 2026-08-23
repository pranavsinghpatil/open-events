import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SearchIcon, LightningIcon } from './Icons.jsx';

/* ── Inject keyframes once ── */
const STYLE_ID = 'sv-glass-navbar-kf';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes sv-glass-slide-down {
      from { opacity:0; transform:translateY(-22px) scale(0.97); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes sv-glass-pulse {
      0%,100%{ opacity:1; transform:scale(1); }
      50%    { opacity:0.45; transform:scale(0.75); }
    }
    @keyframes sv-badge-pop {
      0%  { transform:scale(0.6); opacity:0; }
      60% { transform:scale(1.18); }
      100%{ transform:scale(1); opacity:1; }
    }
    @keyframes sv-mobile-drop {
      from{ opacity:0; transform:translateY(-10px); }
      to  { opacity:1; transform:translateY(0); }
    }
    @keyframes sv-pill-pop {
      0%  { transform:scaleX(0.85); opacity:0.6; }
      60% { transform:scaleX(1.04); }
      100%{ transform:scaleX(1); opacity:1; }
    }
    @keyframes sv-nav-drop {
      0%   { transform: translateY(-40px) scale(0.93); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes sv-nav-grow {
      0%   { max-width: 175px; }
      100% { max-width: 1340px; }
    }
    @keyframes sv-nav-fade-in {
      0%   { opacity: 0; filter: blur(6px); transform: translateX(15px); pointer-events: none; }
      100% { opacity: 1; filter: blur(0); transform: translateX(0); pointer-events: auto; }
    }
  `;
  document.head.appendChild(s);
}

/* ── tiny hover hook ── */
function useHover() {
  const [h, setH] = useState(false);
  return { hovered: h, onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) };
}

/* ── colour tokens ── */
const G = {
  textPrimary: 'rgba(255,255,255,1.00)',
  textSecondary: 'rgba(255,255,255,0.90)',
  textMuted: 'rgba(255,255,255,0.65)',
  glassBg: 'rgba(10, 14, 40, 0.38)',
  glassBorder: 'rgba(255,255,255,0.18)',
  activeBg: 'rgba(255,255,255,0.20)',
  activeBorder: 'rgba(255,255,255,0.45)',
};

export default function FluidNavbar({
  page = 'home',
  onNavigate,
  savedCount = 0,
  onOpenConsole,
  onOpenSearch,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navItems = [
    { key: 'home', label: 'Overview' },
    { key: 'discover', label: 'Discover' },
    { key: 'calendar', label: 'Timeline' },
    { key: 'venues', label: 'Venues' },
    { key: 'my-week', label: 'My Constellation', count: savedCount },
  ];

  const handleNav = (key) => { onNavigate(key); setMobileMenuOpen(false); };

  /* wrapper */
  const wrapperSt = {
    position: 'sticky',
    top: '14px',
    zIndex: 100,
    width: 'min(1340px, calc(100% - 48px))',
    margin: '0 auto',
    borderRadius: '100px',
    overflow: 'hidden',
    background: scrolled ? 'rgba(10, 14, 40, 0.52)' : G.glassBg,
    border: `1px solid ${G.glassBorder}`,
    backdropFilter: 'blur(26px) saturate(160%)',
    WebkitBackdropFilter: 'blur(26px) saturate(160%)',
    boxShadow: scrolled
      ? '0 12px 40px rgba(10,14,40,0.50), 0 2px 12px rgba(10,14,40,0.24), inset 0 1px 0 rgba(255,255,255,0.14)'
      : '0 8px 32px rgba(10,14,40,0.38), 0 2px 8px rgba(10,14,40,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
    transition: 'background 0.35s ease, box-shadow 0.35s ease',
    animation: 'sv-nav-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, sv-nav-grow 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both',
  };

  return (
    <header style={wrapperSt}>
      {/* ── inner row ── */}
      <div style={{
        height: '64px', padding: '0 10px 0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <a
            href="/"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none'
            }}
            onClick={(e) => { e.preventDefault(); handleNav('home'); }}
          >
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(18,22,21,0.85)', display: 'grid', placeItems: 'center',
              border: '1px solid rgba(255,255,255,0.18)', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
            }}>
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#f59e0b', boxShadow: '0 0 12px #f59e0b',
              }} />
            </span>
            <span style={{
              fontFamily: 'Inter,system-ui,sans-serif',
              fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.04em',
              color: G.textPrimary, lineHeight: 1,
            }}>openevents</span>
          </a>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '24px', padding: '0 10px', borderRadius: '100px',
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 12px rgba(168,85,247,0.25)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            animation: 'sv-nav-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s both',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#d8b4fe', boxShadow: '0 0 10px #d8b4fe', flexShrink: 0,
              animation: 'sv-glass-pulse 2s infinite ease-in-out',
            }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#d8b4fe', letterSpacing: '0.04em' }}>Hyderabad</span>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '0.62rem', fontWeight: 700, color: '#f3e8ff',
                letterSpacing: '0.1em', textShadow: '0 2px 10px rgba(233,213,255,0.6)'
              }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav — sliding pill indicator */}
        <div style={{ animation: 'sv-nav-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s both' }}>
          <SlidingNav navItems={navItems} page={page} onNav={handleNav} />
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
          animation: 'sv-nav-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s both'
        }}>
          <GlassSearchBtn onOpenSearch={onOpenSearch} />
          <GlassConsoleBtn onOpenConsole={onOpenConsole} />
          <GlassCtaBtn onNav={() => handleNav('discover')} />
          <MobileToggle open={mobileMenuOpen} onToggle={() => setMobileMenuOpen(v => !v)} />
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <GlassMobileMenu
          navItems={navItems}
          page={page}
          handleNav={handleNav}
          onOpenSearch={onOpenSearch}
          onOpenConsole={onOpenConsole}
        />
      )}
    </header>
  );
}

/* ═══════════════════════ Sliding Nav ═══════════════════════ */

/**
 * Premium magic-pill nav: a single glass pill slides smoothly
 * between active items using measured DOM positions.
 */
function SlidingNav({ navItems, page, onNav }) {
  const navRef = useRef(null);
  const btnRefs = useRef({});
  const [localPage, setLocalPage] = useState(page);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  /* Sync if parent changes page */
  useEffect(() => {
    setLocalPage(page);
  }, [page]);

  /* measure active button position relative to nav container */
  useLayoutEffect(() => {
    const nav = navRef.current;
    const btn = btnRefs.current[localPage];
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPill({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
      ready: true,
    });
  }, [localPage, navItems]);

  const handleNavClick = (key) => {
    setLocalPage(key); // update locally immediately
    // allow the GPU to start the animation before triggering parent work
    setTimeout(() => onNav(key), 10);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: '3px',
        background: 'rgba(255,255,255,0.07)', padding: '4px',
        borderRadius: '100px', border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* ── Sliding glass pill ── */}
      {pill.ready && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '4px', height: 'calc(100% - 8px)',
            left: 0,
            width: pill.width + 'px',
            transform: `translateX(${pill.left}px)`,
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.20)',
            border: '1px solid rgba(255,255,255,0.42)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 2px 12px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            /* THE smooth slide animation — using GPU-accelerated transform */
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), width 0.3s cubic-bezier(0.23,1,0.32,1)',
            zIndex: 0,
            willChange: 'transform, width',
          }}
        />
      )}

      {/* ── Nav buttons (transparent — pill handles active look) ── */}
      {navItems.map((item) => {
        const isActive = localPage === item.key;
        return (
          <NavPillBtn
            key={item.key}
            item={item}
            isActive={isActive}
            onNav={handleNavClick}
            btnRef={(el) => { btnRefs.current[item.key] = el; }}
          />
        );
      })}
    </nav>
  );
}

function NavPillBtn({ item, isActive, onNav, btnRef }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <button
      ref={btnRef}
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onNav(item.key)}
      style={{
        position: 'relative', zIndex: 1,
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '36px', padding: '0 14px', borderRadius: '100px',
        fontSize: '0.80rem', lineHeight: 1, letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', cursor: 'pointer',
        fontWeight: isActive ? 600 : 500,
        /* text brightens on active/hover, pill provides the background */
        color: isActive
          ? 'rgba(255,255,255,1.00)'
          : hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)',
        background: hovered && !isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none',
        transition: 'color 0.18s ease, background 0.18s ease, font-weight 0.18s ease',
      }}
    >
      <span>{item.label}</span>
      {item.count > 0 && (
        <span style={{
          minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '100px',
          background: '#f59e0b', color: '#fff', fontSize: '0.60rem', fontWeight: 700,
          display: 'inline-grid', placeItems: 'center',
          animation: 'sv-badge-pop 0.3s ease both',
        }}>{item.count}</span>
      )}
    </button>
  );
}

function GlassSearchBtn({ onOpenSearch }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <button
      type="button"
      onClick={onOpenSearch}
      title="Search events (⌘K / Ctrl+K)"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        height: '38px', padding: '0 14px', borderRadius: '100px', cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.22)'}`,
        color: hovered ? 'rgba(255,255,255,1.00)' : 'rgba(255,255,255,0.90)',
        fontSize: '0.76rem', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
        transition: 'all 0.20s ease',
      }}
    >
      <SearchIcon className="w-3.5 h-3.5" style={{ opacity: 0.75 }} />
      <span className="sv-search-placeholder">Quick search...</span>
      <kbd style={{
        padding: '2px 6px', borderRadius: '5px',
        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
        color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace',
        fontSize: '0.62rem', fontWeight: 600, lineHeight: 1,
      }}>⌘K</kbd>
    </button>
  );
}

function GlassConsoleBtn({ onOpenConsole }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <button
      type="button"
      onClick={onOpenConsole}
      title="Bright Data Scraper & Pipeline Console"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        height: '38px', padding: '0 14px', borderRadius: '100px', cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.22)'}`,
        color: 'rgba(255,255,255,1.00)', fontSize: '0.76rem', fontWeight: 500, whiteSpace: 'nowrap',
        transition: 'all 0.20s ease',
      }}
    >
      <LightningIcon className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
      <span>Data Console</span>
    </button>
  );
}

function GlassCtaBtn({ onNav }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <button
      type="button"
      onClick={onNav}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '38px', padding: '0 18px', borderRadius: '100px', cursor: 'pointer',
        background: hovered ? 'rgba(245,158,11,0.92)' : 'rgba(18,22,21,0.82)',
        color: '#fff', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        boxShadow: hovered
          ? '0 8px 24px rgba(245,158,11,0.40), inset 0 1px 0 rgba(255,255,255,0.20)'
          : '0 4px 14px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.12)',
        transform: hovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'all 0.22s cubic-bezier(0.23,1,0.32,1)',
      }}
    >
      <span>Explore City</span>
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>↗</span>
    </button>
  );
}

function MobileToggle({ open, onToggle }) {
  const bar = {
    display: 'block', width: '18px', height: '2px',
    background: 'rgba(255,255,255,0.85)', borderRadius: '2px', transition: 'all 0.25s ease',
  };
  return (
    <button
      type="button"
      aria-label="Toggle mobile menu"
      onClick={onToggle}
      className={`sv-mobile-toggle ${open ? 'open' : ''}`}
      style={{
        display: 'none', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '5px', width: '40px', height: '40px',
        borderRadius: '12px', background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.20)', cursor: 'pointer',
        transition: 'background 0.2s ease',
      }}
    >
      <span className="bar bar-1" style={{ ...bar, transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
      <span className="bar bar-2" style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span className="bar bar-3" style={{ ...bar, transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
    </button>
  );
}

function GlassMobileMenu({ navItems, page, handleNav, onOpenSearch, onOpenConsole }) {
  const itemBase = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
    padding: '11px 14px', borderRadius: '12px', background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.60)', fontSize: '0.88rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.18s ease', textAlign: 'left',
  };
  return (
    <div style={{
      animation: 'sv-mobile-drop 0.30s cubic-bezier(0.23,1,0.32,1) both',
      padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '0 0 28px 28px', background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Search */}
      <button
        type="button"
        onClick={() => { handleNav(null); onOpenSearch(); }}
        style={{
          ...itemBase, marginBottom: '6px',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        <SearchIcon className="w-4 h-4" />
        <span>Search events, venues, topics...</span>
        <kbd style={{
          marginLeft: 'auto', padding: '2px 6px', borderRadius: '5px',
          background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace', fontSize: '0.62rem',
        }}>⌘K</kbd>
      </button>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleNav(item.key)}
            style={{
              ...itemBase,
              background: page === item.key ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: page === item.key ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.60)',
              fontWeight: page === item.key ? 600 : 500,
            }}
          >
            <span>{item.label}</span>
            {item.count > 0 && (
              <span style={{
                marginLeft: 'auto', minWidth: '18px', height: '18px', padding: '0 5px',
                borderRadius: '100px', background: '#f59e0b', color: '#fff',
                fontSize: '0.60rem', fontWeight: 700, display: 'inline-grid', placeItems: 'center',
              }}>{item.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={() => { handleNav(null); onOpenConsole(); }}
          style={{
            ...itemBase, justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          <LightningIcon className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <span>Open Data Console</span>
        </button>
        <button
          type="button"
          onClick={() => handleNav('discover')}
          style={{
            ...itemBase, justifyContent: 'center',
            background: 'rgba(18,22,21,0.76)', border: '1px solid rgba(255,255,255,0.14)',
            color: '#fff', fontWeight: 600,
          }}
        >
          <span>Explore Live Hyderabad Index ↗</span>
        </button>
      </div>
    </div>
  );
}
