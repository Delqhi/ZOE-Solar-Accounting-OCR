import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

const features = [
  {
    icon: '📄',
    title: 'Belege digitalisieren',
    desc: 'PDF-Rechnungen und Fotos per Drag & Drop hochladen. Automatische Texterkennung via KI.',
  },
  {
    icon: '🤖',
    title: 'KI-gestützte Analyse',
    desc: 'Automatisches Erkennen von Rechnungsdatum, Betrag, Lieferant und MwSt. mit Gemini Vision.',
  },
  {
    icon: '📊',
    title: 'Automatische Buchung',
    desc: 'Intelligente Kontierungsvorschläge basierend auf Lieferantenregeln und Steuereinstellungen.',
  },
  {
    icon: '📅',
    title: 'Filter & Suche',
    desc: 'Schnell finden nach Jahr, Monat, Lieferant, Status oder Betrag.',
  },
  {
    icon: '💾',
    title: 'DATEV Export',
    desc: 'SQL-Export kompatibel mit DATEV. Alle Buchungsdaten inkl. Steuerschema.',
  },
  {
    icon: '☁️',
    title: 'Cloud Sync',
    desc: 'Supabase-Integration für Backup und Synchronisation über mehrere Geräte.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header mit Login Button */}
      <header className="p-6 flex justify-end">
        <button
          onClick={onLogin}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-white/10"
        >
          Anmelden
        </button>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto pt-16 pb-24 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          ZOE Solar Accounting
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Deine Buchhaltung <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            intelligent gemeistert
          </span>
        </h1>
        <p className="text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto">
          Automatische Belegerfassung, KI-Analyse und DATEV-Export für dein Solarunternehmen.
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40"
        >
          Jetzt starten
        </button>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-blue-200/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-blue-300/50 text-sm">
          © 2025 ZOE Solar Accounting. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};
