import { useState, useEffect } from 'react';
import { fetchFixtureEvents, fetchEvents } from './lib/api.ts';
import OpenEventsHeader from './components/OpenEventsHeader.jsx';
import HomePage from './pages/HomePage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import VenuePage from './pages/VenuePage.jsx';
import MyWeekPage from './pages/MyWeekPage.jsx';
import TriggerPanel from './components/TriggerPanel.jsx';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home'|'discover'|'calendar'|'detail'|'venue'|'myweek'
  const [dataMode, setDataMode] = useState('fixture');         // 'fixture' | 'database'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected entities for drill-down screens
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);

  // Saved events for "My Week"
  const [savedEvents, setSavedEvents] = useState([]);

  // Load events based on active data mode ('fixture' vs 'database')
  async function loadEvents(mode = dataMode) {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (mode === 'database') {
        res = await fetchEvents({ limit: 300 });
      } else {
        res = await fetchFixtureEvents({ limit: 300 });
      }
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents(dataMode);
  }, [dataMode]);

  // Handlers for navigation and drilldown
  function handleSelectEvent(evt) {
    setSelectedEvent(evt);
    setCurrentScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectVenue(venueName) {
    setSelectedVenue(venueName);
    setCurrentScreen('venue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleToggleSaveEvent(evt) {
    setSavedEvents(prev => {
      const exists = prev.some(e => e.event_id === evt.event_id);
      if (exists) {
        return prev.filter(e => e.event_id !== evt.event_id);
      } else {
        return [...prev, evt];
      }
    });
  }

  function handleScrapeFinished() {
    setDataMode('database');
    loadEvents('database');
  }

  const events = data?.events || [];

  return (
    <div className="open-events-app">
      {/* ── Top Header Navigation Bar ── */}
      <OpenEventsHeader
        activeTab={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        dataSourceMode={dataMode}
        onToggleDataSource={() => setDataMode(prev => prev === 'fixture' ? 'database' : 'fixture')}
        savedCount={savedEvents.length}
      />

      {/* ── Main Screen Container ── */}
      <main className="open-events-main">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-text">Loading Hyderabad city events feed…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">Could not connect to backend server</h2>
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => loadEvents(dataMode)}>↺ Retry Connection</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {currentScreen === 'home' && (
              <HomePage
                events={events}
                onNavigate={setCurrentScreen}
                onSelectEvent={handleSelectEvent}
                onSelectCategory={(cat) => {
                  setActiveCategoryFilter(cat);
                  setCurrentScreen('discover');
                }}
              />
            )}

            {currentScreen === 'discover' && (
              <DiscoverPage
                events={events}
                initialCategory={activeCategoryFilter}
                onSelectEvent={handleSelectEvent}
                onSelectVenue={handleSelectVenue}
                savedEvents={savedEvents}
                onToggleSave={handleToggleSaveEvent}
              />
            )}

            {currentScreen === 'calendar' && (
              <CalendarPage
                events={events}
                onSelectEvent={handleSelectEvent}
                onSelectVenue={handleSelectVenue}
              />
            )}

            {currentScreen === 'detail' && selectedEvent && (
              <EventDetailPage
                event={selectedEvent}
                allEvents={events}
                onBack={() => setCurrentScreen('discover')}
                onSelectVenue={handleSelectVenue}
                onSelectEvent={handleSelectEvent}
                isSaved={savedEvents.some(e => e.event_id === selectedEvent.event_id)}
                onToggleSave={() => handleToggleSaveEvent(selectedEvent)}
              />
            )}

            {currentScreen === 'venue' && selectedVenue && (
              <VenuePage
                venueName={selectedVenue}
                events={events}
                onBack={() => setCurrentScreen('discover')}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {currentScreen === 'myweek' && (
              <MyWeekPage
                savedEvents={savedEvents}
                onSelectEvent={handleSelectEvent}
                onRemoveEvent={handleToggleSaveEvent}
                onNavigate={setCurrentScreen}
              />
            )}
          </>
        )}

        {/* ── Scrape Control & Self-Healing Telemetry Widget ── */}
        <TriggerPanel onTriggered={handleScrapeFinished} />
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          © 2026 Scrapeverse · Open Events City Culture Digest · Powered by Bright Data Scraper Studio · Hyderabad Pilot
        </p>
      </footer>
    </div>
  );
}
