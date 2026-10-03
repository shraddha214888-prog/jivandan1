import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink, QrCode } from 'lucide-react';
import { Language } from '../locales/translations';

interface ShareModalProps {
  isOpen: boolean;
  lang?: Language;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  lang = 'en',
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use current window URL or canonical app URL
  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const shareTitle = lang === 'gu' 
    ? 'જીવનદાન (Jivandan) - ઇમરજન્સી એમ્બ્યુલન્સ પ્રી-એલર્ટ' 
    : 'Jivandan - Emergency Ambulance Pre-Alert Corridor';
  const shareText = lang === 'gu'
    ? 'એમ્બ્યુલન્સ માટે રસ્તો ખાલી રાખવા અને રિયલ-ટાઇમ પ્રી-એલર્ટ મેળવવા આ એપ્લિકેશન લિંક જુઓ:'
    : 'Track emergency ambulances in real-time and clear rescue alleys safely with Jivandan:';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = appUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onShowToast(lang === 'gu' ? 'લિંક ક્લિપબોર્ડમાં કોપી થઈ ગઈ!' : 'App link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast(appUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
        onShowToast(lang === 'gu' ? 'લિંક સફળતાપૂર્વક શેર કરી!' : 'Link shared successfully!');
        onClose();
      } catch (err) {
        // User dismissed share dialog
      }
    } else {
      handleCopy();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareTitle}\n${shareText}\n${appUrl}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/src/assets/images/jivandan_app_logo_1790995600042.jpg"
            alt="Jivandan Logo"
            className="w-12 h-12 rounded-xl object-cover shadow-lg border border-rose-500/40 shadow-rose-950/50 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              {lang === 'gu' ? 'જીવનદાન એપ્લિકેશન લિંક શેર કરો' : 'Share Jivandan App Link'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'gu' 
                ? 'વાહનચાલકો અને ઇમરજન્સી રિસ્પોન્ડર્સ સાથે શેર કરો' 
                : 'Share with motorists and emergency dispatch'}
            </p>
          </div>
        </div>

        {/* URL Box */}
        <div className="space-y-3 my-4">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            {lang === 'gu' ? 'ડાયરેક્ટ શેરિંગ લિંક:' : 'Direct Shareable URL:'}
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={appUrl}
              className="bg-transparent text-xs font-mono text-slate-200 w-full px-2 focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'gu' ? 'કોપી થયું' : 'Copied') : (lang === 'gu' ? 'કોપી' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* WhatsApp Share */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Device Share / Clipboard */}
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-rose-400" />
            <span>{lang === 'gu' ? 'અન્ય એપ્સમાં શેર' : 'More Options'}</span>
          </button>
        </div>

        {/* Security & Access Notice */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>
            {lang === 'gu' 
              ? 'કોઈપણ મોબાઇલ અથવા કાર બ્રાઉઝરમાં સીધું ખુલે છે (કોઈ ઇન્સ્ટોલેશન જરૂરી નથી).' 
              : 'Works instantly on any mobile or in-cabin browser without installation.'}
          </span>
        </div>
      </div>
    </div>
  );
};
