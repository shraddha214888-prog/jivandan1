import React, { useState, useEffect } from 'react';
import { EmergencyVehicle, MotoristVehicle, TrafficSignal, CorridorAlertLog } from '../types/emergency';
import { Language } from '../locales/translations';
import { 
  Siren, 
  Volume2, 
  VolumeX, 
  Radio, 
  Hospital, 
  Navigation, 
  ShieldAlert, 
  Gauge, 
  Activity, 
  CheckCircle, 
  Clock, 
  Zap, 
  Sliders,
  Send,
  AlertCircle,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume1,
  Waves
} from 'lucide-react';
import { audioAlertService } from '../services/audioAlertService';

interface AmbulanceCockpitProps {
  ambulance: EmergencyVehicle;
  motorists: MotoristVehicle[];
  signals: TrafficSignal[];
  logs: CorridorAlertLog[];
  lang?: Language;
  onToggleSiren: () => void;
  onChangeSirenMode: (mode: 'yelp' | 'wail' | 'hi_lo' | 'silent_v2x') => void;
  onChangeRadius: (radiusMeters: number) => void;
  onSendCustomBroadcast: (text: string) => void;
  onForcePreemption: (signalId: string) => void;
}

export const AmbulanceCockpit: React.FC<AmbulanceCockpitProps> = ({
  ambulance,
  motorists,
  signals,
  logs,
  lang = 'en',
  onToggleSiren,
  onChangeSirenMode,
  onChangeRadius,
  onSendCustomBroadcast,
  onForcePreemption,
}) => {
  const [customMsg, setCustomMsg] = useState(
    lang === 'gu'
      ? 'સાવધાન: પાછળથી એમ્બ્યુલન્સ આવી રહી છે. કૃપા કરીને વચ્ચેની લેન ખાલી કરી જમણી બાજુ ખસી જાઓ.'
      : 'Attention motorists: Emergency ambulance approaching from rear. Please merge right and clear center lane.'
  );
  const [isHornActive, setIsHornActive] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [speechPace, setSpeechPace] = useState<'normal' | 'urgent'>('normal');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'speechSynthesis' in window;
      setHasSpeechSupport(supported);
      if (supported) {
        const updateVoices = () => {
          const v = audioAlertService.getAvailableVoices();
          setAvailableVoices(v);
        };
        updateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateVoices;
        }
      }
    }
  }, []);

  // Update default message when language changes if field matches prior default
  useEffect(() => {
    if (lang === 'gu') {
      setCustomMsg('સાવધાન: પાછળથી એમ્બ્યુલન્સ આવી રહી છે. કૃપા કરીને વચ્ચેની લેન ખાલી કરી જમણી બાજુ ખસી જાઓ.');
    } else {
      setCustomMsg('Attention motorists: Emergency ambulance approaching from rear. Please merge right and clear center lane.');
    }
  }, [lang]);

  const motoristsAhead = motorists.filter(
    m => m.position.x > ambulance.position.x && m.position.x <= ambulance.position.x + ambulance.alertRadiusMeters
  );
  const clearedCount = motoristsAhead.filter(m => m.hasYielded || m.currentLane === 'right').length;
  const clearanceRatio = motoristsAhead.length > 0 ? Math.round((clearedCount / motoristsAhead.length) * 100) : 100;

  const handleHornBurst = () => {
    setIsHornActive(true);
    audioAlertService.startSiren('yelp');
    setTimeout(() => {
      audioAlertService.stopSiren();
      setIsHornActive(false);
    }, 600);
  };

  const handleBroadcast = (textToSpeak?: string) => {
    const text = (textToSpeak || customMsg).trim();
    if (!text) return;

    // Send to parent event log
    onSendCustomBroadcast(text);

    // Rate based on pace selection
    const rate = speechPace === 'urgent' ? 1.15 : 0.98;
    const pitch = speechPace === 'urgent' ? 1.06 : 1.01;

    // Speak aloud using Web Speech API with realistic emergency vehicle PA microphone squelch
    setIsTransmitting(true);
    audioAlertService.broadcastPA(
      text,
      lang,
      () => setIsTransmitting(true),
      () => setIsTransmitting(false),
      {
        rate,
        pitch,
        voiceURI: selectedVoiceURI || undefined,
      }
    );
  };

  const handleStopBroadcast = () => {
    audioAlertService.cancelBroadcast(() => {
      setIsTransmitting(false);
    });
  };

  const presetAnnouncements = lang === 'gu' ? [
    {
      label: 'લેન ખાલી કરો',
      text: 'સાવધાન: પાછળથી એમ્બ્યુલન્સ આવી રહી છે. કૃપા કરીને વચ્ચેની લેન ખાલી કરી જમણી બાજુ ખસી જાઓ.',
    },
    {
      label: 'ચાર રસ્તા સંકેત',
      text: 'એમ્બ્યુલન્સ યુનિટ ૧૦૪ ચાર રસ્તા તરફ આવી રહી છે. બધા વાહનો જગ્યા આપી ઊભા રહો.',
    },
    {
      label: 'ગ્રીન કોરિડોર',
      text: 'અતિ ગંભીર દર્દી ટ્રાન્ઝિટમાં છે. તાત્કાલિક માર્ગ ખુલ્લો રાખો.',
    },
    {
      label: 'રાહદારીઓ સાવચેત',
      text: 'રાહદારીઓ કૃપા કરીને રસ્તો ક્રોસ ન કરશો. એમ્બ્યુલન્સ ઝડપથી આવી રહી છે.',
    },
  ] : [
    {
      label: 'Vacate Center Lane',
      text: 'Attention motorists: Emergency ambulance approaching from rear. Please merge right and clear center lane.',
    },
    {
      label: 'Intersection Hold',
      text: 'Ambulance Unit 104 approaching intersection. All vehicles hold position and yield right of way.',
    },
    {
      label: 'Critical Priority',
      text: 'Critical patient in transit. Keep emergency rescue corridor open.',
    },
    {
      label: 'Pedestrian Alert',
      text: 'Pedestrians use caution: Do not cross intersection. Emergency vehicle approaching at high speed.',
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Top Unit Tactical Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/avatar_paramedic_lead_1790844671280.jpg"
            alt="Paramedic Commander"
            className="w-12 h-12 rounded-lg object-cover border border-rose-500/50 shadow-md"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-wide font-mono">
                {ambulance.unitCode}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm">
                {lang === 'gu' ? 'કોડ ૩ પ્રાથમિકતા' : 'CODE 3 PRIORITY'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {lang === 'gu' ? 'કમાન્ડર' : 'Commander'}: {ambulance.driverName} · {lang === 'gu' ? 'કોલ સાઇન' : 'Call Sign'}: {ambulance.callSign}
            </div>
          </div>
        </div>

        {/* Destination & Triage Info */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-end gap-1">
              <Hospital className="w-3 h-3 text-rose-400" />
              {lang === 'gu' ? 'મંઝિલ હોસ્પિટલ' : 'DESTINATION HOSPITAL'}
            </div>
            <div className="text-sm font-semibold text-white">
              {ambulance.destination}
            </div>
            <div className="text-[11px] text-rose-300 font-mono">
              ETA: {ambulance.timeToDestinationMin.toFixed(1)} {lang === 'gu' ? 'મિનિટ' : 'mins'} · {ambulance.patientCondition}
            </div>
          </div>

          <div className="text-center pl-4 border-l border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400">
              {lang === 'gu' ? 'ઝડપ' : 'SPEED'}
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              {ambulance.speedKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Telemetry + Corridor Clearance */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Siren, Modes, V2X Radius (5 Cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Siren & Emergency Lightbar Control */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <Siren className="w-4 h-4 text-rose-500" />
                {lang === 'gu' ? 'V2X બીકન અને સાયરન હાર્ડવેર' : 'V2X BEACON & SIREN HARDWARE'}
              </span>
              <span className={`text-xs font-mono font-bold ${ambulance.sirenActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                {ambulance.sirenActive 
                  ? (lang === 'gu' ? 'પ્રસારણ ચાલુ' : 'TRANSMITTING') 
                  : (lang === 'gu' ? 'સ્ટેન્ડબાય' : 'STANDBY')}
              </span>
            </div>

            {/* Big Siren Toggle Button */}
            <button
              onClick={onToggleSiren}
              className={`w-full py-4 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                ambulance.sirenActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Siren className={`w-5 h-5 ${ambulance.sirenActive ? 'animate-spin' : ''}`} />
              <span>
                {ambulance.sirenActive 
                  ? (lang === 'gu' ? 'ઇમરજન્સી કોરિડોર બંધ કરો' : 'DEACTIVATE EMERGENCY CORRIDOR') 
                  : (lang === 'gu' ? 'કોડ-૩ ઇમરજન્સી કોરિડોર શરૂ કરો' : 'ACTIVATE CODE-3 CORRIDOR')}
              </span>
            </button>

            {/* Siren Tone Presets */}
            <div className="mt-4">
              <span className="text-[11px] font-mono text-slate-400 block mb-2">
                {lang === 'gu' ? 'સાયરન અવાજ અને બીકન મોડ:' : 'SIREN AUDIO & BEACON TONE:'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['yelp', 'wail', 'hi_lo', 'silent_v2x'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChangeSirenMode(mode)}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-colors cursor-pointer capitalize font-medium ${
                      ambulance.sirenMode === mode
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'silent_v2x' 
                      ? (lang === 'gu' ? 'સાયલન્ટ V2X (રાત્રિ)' : 'Silent V2X (Night)') 
                      : mode === 'yelp'
                      ? (lang === 'gu' ? 'યેલ્પ (ઝડપી)' : 'Yelp (Rapid)')
                      : mode === 'wail'
                      ? (lang === 'gu' ? 'વેલ (ક્લાસિક)' : 'Wail (Classic)')
                      : (lang === 'gu' ? 'હાઇ-લો (૨-ટોન)' : 'Hi-Lo (European)')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Horn Burst */}
            <button
              onClick={handleHornBurst}
              className={`w-full mt-3 py-2.5 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow ${
                isHornActive ? 'bg-amber-500 scale-[0.98]' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'ઇન્સ્ટન્ટ એકોસ્ટિક હોર્ન અવાજ' : 'Instant Acoustic Horn Pulse'}</span>
            </button>
          </div>

          {/* Broadcast Radius Geofence */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 tracking-wider">
                {lang === 'gu' ? 'પ્રી-એલર્ટ જીઓફેન્સ રેન્જ' : 'PRE-ALERT GEOFENCE CONE'}
              </span>
              <span className="text-xs font-mono text-rose-400 font-bold tabular-nums">
                {ambulance.alertRadiusMeters} {lang === 'gu' ? 'મીટર' : 'meters'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              {lang === 'gu' 
                ? 'આ ત્રિજ્યામાં આગળ રહેલા તમામ વાહનોને તેમના સ્ક્રીન પર તુરંત સૂચના અને ચાઇમ મળે છે.' 
                : 'Motorists within this forward radius receive instant in-cabin HUD notifications and acoustic chimes.'}
            </p>

            <div className="flex items-center gap-2">
              {[500, 750, 1000, 1200].map((radius) => (
                <button
                  key={radius}
                  onClick={() => onChangeRadius(radius)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                    ambulance.alertRadiusMeters === radius
                      ? 'bg-rose-950 border-rose-500 text-rose-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {radius}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clearance Radar & Green Wave Signals (7 Cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Corridor Clearance Telemetry */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 tracking-wider">
                {lang === 'gu' ? 'લાઈવ કોરિડોર ક્લિયરન્સ ઇન્ડેક્સ' : 'LIVE CORRIDOR CLEARANCE INDEX'}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                {clearanceRatio}% {lang === 'gu' ? 'માર્ગ ખુલ્લો' : 'Path Clear'}
              </span>
            </div>

            {/* Clearance Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${clearanceRatio}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">
                  {lang === 'gu' ? 'રેન્જમાં વાહનો' : 'VEHICLES IN CONE'}
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {motoristsAhead.length}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">
                  {lang === 'gu' ? 'ખસી ગયેલા વાહનો' : 'YIELDED TO SHOULDER'}
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {clearedCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">
                  {lang === 'gu' ? 'બાકી વાહનો' : 'PENDING CLEARANCE'}
                </div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5 tabular-nums">
                  {motoristsAhead.length - clearedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Signal Preemption Intersections */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'gu' ? 'ટ્રાફિક લાઇટ "ગ્રીન વેવ" પ્રિ-એમ્પશન' : 'TRAFFIC LIGHT "GREEN WAVE" PREEMPTION'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {lang === 'gu' ? 'ઓટો-ટ્રિગર ≤ ૪૫૦ મીટર' : 'Auto-Trigger ≤ 450m'}
              </span>
            </div>

            <div className="space-y-2">
              {signals.map((sig) => {
                const isPreempted = sig.state === 'preempted_green';
                const distToSig = Math.round(sig.position.x - ambulance.position.x);
                return (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isPreempted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block">{sig.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {distToSig > 0 
                            ? `${distToSig}${lang === 'gu' ? ' મીટર આગળ' : 'm Ahead'}` 
                            : (lang === 'gu' ? 'પસાર થઈ ગયા' : 'Passed')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isPreempted
                            ? 'bg-emerald-950 border border-emerald-600/60 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPreempted 
                          ? (lang === 'gu' ? 'ગ્રીન વેવ સક્રિય' : 'GREEN WAVE ACTIVE') 
                          : (lang === 'gu' ? 'રેડ સિગ્નલ' : 'CYCLE RED')}
                      </span>

                      {!isPreempted && (
                        <button
                          onClick={() => onForcePreemption(sig.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-800 text-slate-300 hover:text-white rounded transition-colors text-[10px] font-bold cursor-pointer"
                        >
                          {lang === 'gu' ? 'ગ્રીન કરો' : 'Force Green'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emergency Vehicle Public Address (PA) & Web Speech API Vocal Broadcast */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden shadow-xl">
            {/* Background live transmission indicator glow */}
            {isTransmitting && (
              <div className="absolute inset-0 bg-rose-600/10 border-2 border-rose-500 rounded-xl animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isTransmitting ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 tracking-wider block">
                    {lang === 'gu' ? 'ઇમરજન્સી પબ્લિક એડ્રેસ (PA) સ્પીચ સિસ્ટમ' : 'EMERGENCY VEHICLE PA SYSTEM'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lang === 'gu' 
                      ? 'વેબ સ્પીચ API · વાહનચાલકોને સાંભળી શકાય તેવી સીધી ઘોષણા' 
                      : 'Web Speech API · Direct Vocal Broadcast to Motorists'}
                  </span>
                </div>
              </div>

              {/* Status Badge with Live Equalizer */}
              <div className="flex items-center gap-2">
                {isTransmitting ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950 border border-rose-600 text-rose-200 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{lang === 'gu' ? 'લાઈવ અવાજ પ્રસારિત થાય છે...' : 'TRANSMITTING ALOUD...'}</span>
                    {/* Audio Equalizer Bars */}
                    <div className="flex items-end gap-0.5 h-3.5 ml-1">
                      <div className="w-0.5 h-3 bg-rose-400 animate-pulse" />
                      <div className="w-0.5 h-2 bg-rose-400 animate-pulse" style={{ animationDelay: '0.12s' }} />
                      <div className="w-0.5 h-3.5 bg-rose-400 animate-pulse" style={{ animationDelay: '0.24s' }} />
                      <div className="w-0.5 h-1.5 bg-rose-400 animate-pulse" style={{ animationDelay: '0.36s' }} />
                      <div className="w-0.5 h-2.5 bg-rose-400 animate-pulse" style={{ animationDelay: '0.48s' }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{hasSpeechSupport ? 'SPEECH API READY' : 'SPEECH API OFFLINE'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls: Speech Pace + Voice Selection */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {lang === 'gu' ? 'ઘોષણા ગતિ:' : 'PA Urgency Pace:'}
                </span>
                <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSpeechPace('normal')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                      speechPace === 'normal' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'gu' ? 'સામાન્ય' : 'Standard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeechPace('urgent')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                      speechPace === 'urgent' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'gu' ? 'ઝડપી / અર્જન્ટ' : 'High Urgency'}
                  </button>
                </div>
              </div>

              {availableVoices.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Voice:</span>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    className="bg-slate-900 text-slate-300 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono max-w-[170px] truncate focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">{lang === 'gu' ? 'સ્વચાલિત (Auto System)' : 'Auto System Matching'}</option>
                    {availableVoices.slice(0, 10).map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Preset Emergency PA Announcements */}
            <div className="mb-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                {lang === 'gu' ? 'ઝડપી ઇમરજન્સી ઘોષણાઓ (એક ક્લિકમાં બ્રોડકાસ્ટ કરો):' : 'QUICK PA PRESETS (CLICK TO BROADCAST ALOUD):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetAnnouncements.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomMsg(preset.text);
                      handleBroadcast(preset.text);
                    }}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/60 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                    title={preset.text}
                  >
                    <Volume2 className="w-3 h-3 text-rose-400" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom PA Broadcast Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBroadcast();
              }}
              className="space-y-2.5"
            >
              <div className="relative">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder={lang === 'gu' ? 'કસ્ટમ સંદેશ લખો અને બ્રોડકાસ્ટ પર ક્લિક કરો...' : 'Type custom emergency message to speak aloud over PA...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 pr-10 font-sans"
                />
                {customMsg && (
                  <button
                    type="button"
                    onClick={() => setCustomMsg('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {lang === 'gu' ? 'રેડિયો માઇક સ્કવેલ્ચ + બ્રાઉઝર સ્પીચ સિન્થેસિસ' : 'Vehicular PA squelch chirp + Speech Synthesis'}
                </span>

                <div className="flex items-center gap-2">
                  {isTransmitting && (
                    <button
                      type="button"
                      onClick={handleStopBroadcast}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-rose-900 transition-colors cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{lang === 'gu' ? 'અટકાવો' : 'Stop'}</span>
                    </button>
                  )}

                  {/* Primary 'Broadcast' Button */}
                  <button
                    type="submit"
                    disabled={!customMsg.trim()}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                      isTransmitting
                        ? 'bg-rose-700 text-white animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 active:scale-95'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Click to speak broadcast message aloud via Web Speech API"
                  >
                    <Mic className={`w-4 h-4 ${isTransmitting ? 'animate-bounce' : ''}`} />
                    <span>{lang === 'gu' ? 'બ્રોડકાસ્ટ કરો (અવાજ સંભળાવો)' : 'Broadcast (Speak Aloud)'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
