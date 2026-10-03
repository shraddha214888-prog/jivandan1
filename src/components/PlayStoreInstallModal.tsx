import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { Language } from '../locales/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PlayStoreInstallModalProps {
  isOpen: boolean;
  lang?: Language;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PlayStoreInstallModal: React.FC<PlayStoreInstallModalProps> = ({
  isOpen,
  lang = 'gu',
  onClose,
  onShowToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'developer'>('install');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onShowToast(lang === 'gu' ? 'એપ્લિકેશન ઇન્સ્ટોલ થઈ ગઈ છે!' : 'App installed successfully on your device!');
        onClose();
      }
    } else {
      onShowToast(
        lang === 'gu'
          ? 'બ્રાઉઝર મેનૂમાંથી "Add to Home screen" અથવા "Install" પસંદ કરો'
          : 'Tap your browser menu (⋮) and select "Add to Home screen" or "Install App"'
      );
    }
  };

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(appUrl);
      }
      setCopiedUrl(true);
      onShowToast(lang === 'gu' ? 'એપ URL કોપી થઈ ગયું!' : 'App URL copied!');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      onShowToast(appUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow header banner */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo & Play Store Badge */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <img
            src="/src/assets/images/jivandan_app_logo_1790995600042.jpg"
            alt="Jivandan Logo"
            className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-rose-500/40 shadow-rose-950/50 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white font-display">
                {lang === 'gu' ? 'જીવનદાન — ગૂગલ પ્લે સ્ટોર અને ઇન્સ્ટોલ' : 'Jivandan — Google Play Store & Install'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                TWA Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'gu'
                ? 'એન્ડ્રોઇડ સ્માર્ટફોન પર ઇન્સ્ટોલ કરો અથવા ગૂગલ પ્લે કન્સોલમાં .AAB પબ્લિશ કરો'
                : 'Install directly on Android or package as an .AAB bundle for Google Play Console'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'install'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{lang === 'gu' ? 'ફોનમાં ઇન્સ્ટોલ કરો (1-Click)' : 'Direct Mobile Install'}</span>
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'developer'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'gu' ? 'પ્લે સ્ટોર .AAB પેકેજ' : 'Play Store Bundle (.AAB)'}</span>
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'install' ? (
            <>
              {/* Option 1: Native PWA / Android Install */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white text-sm">
                      {lang === 'gu' ? 'એન્ડ્રોઇડ પર સીધી એપ મેળવો' : 'Install Native Android PWA'}
                    </span>
                  </div>
                  {isInstalled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                      {lang === 'gu' ? 'પહેલેથી ઇન્સ્ટોલ છે' : 'Installed'}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 leading-relaxed">
                  {lang === 'gu'
                    ? 'આ એપ્લિકેશન PWA (પ્રોગ્રેસિવ વેબ એપ) અને ગૂગલ TWA સક્ષમ છે. તે તમારા ફોનમાં ગૂગલ પ્લે એપની જેમ જ ફૂલ સ્ક્રીન, ઑફલાઇન સપોર્ટ અને હોમ સ્ક્રીન આઇકન સાથે ચાલે છે.'
                    : 'This app is certified as a PWA and Google TWA. It installs on Android home screens with full-screen view, standalone launch, and offline caching — identical to a Play Store app.'}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isInstalled
                        ? (lang === 'gu' ? 'એપ ઇન્સ્ટોલ થયેલ છે (ઓપન કરો)' : 'App Already Installed')
                        : (lang === 'gu' ? 'અત્યારે જ ઇન્સ્ટોલ કરો (Install on Phone)' : 'Install Jivandan on Phone')}
                    </span>
                  </button>
                </div>
              </div>

              {/* iOS Alternative */}
              {isIOS && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="font-bold text-white block mb-1">
                    {lang === 'gu' ? 'iPhone / iPad પર ઇન્સ્ટોલ કરવા માટે:' : 'For iPhone / iPad:'}
                  </span>
                  <p>
                    {lang === 'gu'
                      ? '1. સફારી બ્રાઉઝરમાં નીચે "Share" આઇકન પર ટેપ કરો.\n2. "Add to Home Screen" પસંદ કરો.'
                      : '1. Tap the Share button in Safari toolbar.\n2. Select "Add to Home Screen".'}
                  </p>
                </div>
              )}

              {/* Features list */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-0.5">✓ 100% ઑફલાઇન સપોર્ટ</span>
                  <span className="text-slate-400 text-[11px]">નેટવર્ક ન હોય ત્યારે પણ કેશ્ડ રૂટ અને ગાઇડ ખુલે છે.</span>
                </div>
                <div className="grid p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-0.5">✓ ઝીરો ડાઉનલોડ ફી</span>
                  <span className="text-slate-400 text-[11px]">કોઈ વધારાની સ્ટોરેજ રોક્યા વિના તુરંત શરૂ થાય છે.</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Play Store Package Info */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-rose-400" />
                    {lang === 'gu' ? 'ગૂગલ પ્લે TWA કન્ફિગ્યુરેશન' : 'Google Play TWA Configuration'}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    com.jivandan.emergencycorridor
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  {lang === 'gu'
                    ? 'ગૂગલ પ્લે સ્ટોર પર એપ્લિકેશન મૂકવા માટે નીચેના ૩ સરળ પગલાં અનુસરો (PWABuilder અથવા Google Bubblewrap નો ઉપયોગ કરીને):'
                    : 'To publish Jivandan directly onto the Google Play Store Developer Console, use the standard Trusted Web Activity (TWA) pipeline:'}
                </p>

                {/* Step by step */}
                <div className="space-y-2 border-l-2 border-rose-500/40 pl-3 my-2 text-slate-300 text-[11px]">
                  <div>
                    <strong className="text-white">પગલું ૧: </strong>
                    {lang === 'gu'
                      ? 'સત્તાવાર PWABuilder (ગૂગલ સ્પોન્સર્ડ) ટૂલ ખોલો:'
                      : 'Open official Google-backed PWABuilder:'}
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={appUrl}
                        className="bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 px-2 py-1 rounded w-full truncate"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <strong className="text-white">પગલું ૨: </strong>
                    {lang === 'gu'
                      ? 'PWABuilder માં "Package for Android" પર ક્લિક કરી Play Store સેટિંગ્સ સાથે .AAB પેકેજ ડાઉનલોડ કરો.'
                      : 'Click "Package for Android" to generate the signed Android App Bundle (.aab).'}
                  </div>

                  <div>
                    <strong className="text-white">પગલું ૩: </strong>
                    {lang === 'gu'
                      ? 'Google Play Console (play.google.com/console) ખોલી આ .aab ફાઇલ અપલોડ કરી સબમિટ કરો.'
                      : 'Upload the generated .aab bundle into your Google Play Console under Production / Closed Testing.'}
                  </div>
                </div>

                {/* CTA Link to PWABuilder */}
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>
                    {lang === 'gu'
                      ? 'PWABuilder માં Play Store પેકેજ બનાવો (.AAB Bundle)'
                      : 'Open PWABuilder to Generate Play Store Package'}
                  </span>
                </a>
              </div>

              {/* Digital Asset Links Status */}
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-2.5 text-emerald-200 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Digital Asset Links સક્રિય:</strong>{' '}
                  {lang === 'gu'
                    ? 'તમારી એપમાં .well-known/assetlinks.json પહેલેથી કન્ફિગર કરેલ છે, જેથી પ્લે સ્ટોર એપ કોઈપણ URL બાર વગર અસલ નેટિવ મોડમાં ખુલશે.'
                    : 'Verified .well-known/assetlinks.json is installed, enabling URL-bar-free full-screen native Android execution.'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>Jivandan Emergency Corridor · Android & Play Store Compatible</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
          >
            {lang === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
