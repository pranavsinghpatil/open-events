import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { fetchEvents, fetchFixtureEvents } from './lib/api.ts';

// Components
import FluidNavbar from './components/FluidNavbar.jsx';
import SearchModal from './components/SearchModal.jsx';
import TriggerPanel from './components/TriggerPanel.jsx';
import ScrollUniverseBackground from './components/ScrollUniverseBackground.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import VenuePage from './pages/VenuePage.jsx';
import MyWeekPage from './pages/MyWeekPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('fixture'); // 'fixture' | 'database'

  // Navigation State
  const [page, setPage] = useState('home'); // 'home' | 'discover' | 'calendar' | 'venues' | 'my-week' | 'detail'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters State
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Bookmarks / My Constellation (persisted in localStorage with openevents key)
  const [saved, setSaved] = useState(() => {
    try {
      const stored = localStorage.getItem('openevents_saved_events') || localStorage.getItem('scrapeverse_saved_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toast message
  const [toast, setToast] = useState(null);

  // Load events
  async function load(modeName = mode) {
    setLoading(true);
    setError(null);
    try {
      const res = modeName === 'database'
        ? await fetchEvents({ limit: 300 })
        : await fetchFixtureEvents({ limit: 300 });
      setData(res);
    } catch (err) {
      setError(err?.message || 'Could not load city events feed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(mode);
  }, [mode]);

  // Sync saved to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('openevents_saved_events', JSON.stringify(saved));
    } catch {}
  }, [saved]);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allEvents = useMemo(() => data?.events || [], [data]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSaved = (event) => {
    setSaved((prev) => {
      const exists = prev.some((item) => item.event_id === event.event_id);
      if (exists) {
        showToast(`Removed "${event.title.slice(0, 30)}..." from My Constellation`);
        return prev.filter((item) => item.event_id !== event.event_id);
      } else {
        showToast(`Saved "${event.title.slice(0, 30)}..." to My Constellation ✦`);
        return [...prev, event];
      }
    });
  };

  const navigateTo = (nextPage) => {
    setPage(nextPage);
    setSelectedEvent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inspectEvent = (event) => {
    setSelectedEvent(event);
    setPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render current view
  const renderContent = () => {
    if (page === 'detail' && selectedEvent) {
      return (
        <EventDetailPage
          event={selectedEvent}
          onBack={() => navigateTo('discover')}
          isSaved={saved.some((item) => item.event_id === selectedEvent.event_id)}
          onToggleSave={toggleSaved}
          onSelectEvent={inspectEvent}
          allEvents={allEvents}
        />
      );
    }

    if (page === 'discover') {
      return (
        <DiscoverPage
          events={allEvents}
          activeCategory={category}
          onSelectCategory={setCategory}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSelectEvent={inspectEvent}
          savedEvents={saved}
          onToggleSave={toggleSaved}
        />
      );
    }

    if (page === 'calendar') {
      return (
        <CalendarPage
          events={allEvents}
          onSelectEvent={inspectEvent}
          savedEvents={saved}
          onToggleSave={toggleSaved}
        />
      );
    }

    if (page === 'venues') {
      return (
        <VenuePage
          events={allEvents}
          onSelectEvent={inspectEvent}
          savedEvents={saved}
          onToggleSave={toggleSaved}
        />
      );
    }

    if (page === 'my-week') {
      return (
        <MyWeekPage
          savedEvents={saved}
          onSelectEvent={inspectEvent}
          onRemoveSaved={toggleSaved}
          onNavigate={navigateTo}
        />
      );
    }

    // Default: Home page
    return (
      <HomePage
        events={allEvents}
        data={data}
        activeCategory={category}
        onSelectCategory={setCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onNavigate={navigateTo}
        onSelectEvent={inspectEvent}
        onOpenTriggerPanel={() => setConsoleOpen(true)}
        savedEvents={saved}
        onToggleSave={toggleSaved}
      />
    );
  };

  return (
    <div className="sarvam-root">
      {/* Dynamic Scroll & Motion Universe Background */}
      <ScrollUniverseBackground page={page} />

      {/* Fluid Sticky Glass Header */}
      <FluidNavbar
        page={page}
        onNavigate={navigateTo}
        savedCount={saved.length}
        onOpenConsole={() => setConsoleOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main View Area with Smooth Motion */}
      <main className="sv-main-container">
        {loading && page === 'home' && !data ? (
          <div className="sv-loading-screen font-mono">
            <div className="sv-loading-spinner" />
            <p>STREAMING HYDERABAD CULTURAL ORBIT...</p>
          </div>
        ) : error && !data ? (
          <div className="sv-error-card">
            <h2 className="sv-error-title font-serif">Could not reach live event stream.</h2>
            <p className="sv-error-desc">{error}</p>
            <button
              type="button"
              className="sv-primary-btn mt-4"
              onClick={() => load(mode)}
            >
              <span>Retry Connection</span>
              <span className="ml-1">↻</span>
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={page + (selectedEvent?.event_id || '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Modern Sarvam Footer */}
      <footer className="sv-global-footer">
        <div className="sv-footer-inner">
          <div className="sv-footer-brand-col">
            <div className="sv-footer-brand font-serif">
              <span className="sv-footer-orb" />
              <span>openevents</span>
            </div>
            <p className="sv-footer-tagline">
              Autonomous cultural observatory for the city of Hyderabad.
            </p>
          </div>

          <div className="sv-footer-meta-col font-mono">
            <div className="sv-footer-status">
              <span className="sv-live-dot" />
              <span>COLLECTORS ACTIVE: FULLHYD · HIGHAPE · AROUNDU</span>
            </div>
            <div className="sv-footer-copy">
              <span>© 2026 OPENVENTS // POWERED BY BRIGHT DATA SCRAPING CLOUD</span>
            </div>
          </div>

          <div className="sv-footer-action-col font-mono">
            <button
              type="button"
              className="sv-mode-switch-btn"
              onClick={() => {
                const nextMode = mode === 'fixture' ? 'database' : 'fixture';
                setMode(nextMode);
                load(nextMode);
              }}
              title="Toggle between Normalized Fixture and Live Pipeline Database"
            >
              <span>FEED: {mode === 'fixture' ? 'FIXTURE ARCHIVE' : 'LIVE DATABASE'}</span>
              <span className="ml-1 text-saffron">↗</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Global Command Palette Search Modal (⌘K) */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        events={allEvents}
        onSelectEvent={inspectEvent}
      />

      {/* Scraper / DCA Console Modal */}
      <TriggerPanel
        isOpen={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        onTriggerScrape={async () => {
          setMode('database');
          await load('database');
        }}
      />

      {/* Toast Notification Alert */}
      {toast && (
        <div className="sv-toast font-mono" role="status">
          <span>✦</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
