import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Zap, RefreshCw, Keyboard, ChevronDown, Loader2, AlertCircle, ImagePlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addTicket, uploadTicketImage } from '../services/tickets';
import { preprocessForOcr, captureFrame, captureFrameFromImage, preprocessImageForOcr } from '../lib/imagePreprocess';
import { parseTicketOcr, type ParsedPlay } from '../lib/parseTicketOcr';
import { getOcrWorker, terminateOcrWorker } from '../lib/ocrWorker';

interface TicketScannerProps {
  onClose: () => void;
  poolId?: string;
}

type ScanPhase = 'preview' | 'processing' | 'review';

const TicketScanner: React.FC<TicketScannerProps> = ({ onClose, poolId: initialPoolId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, pools } = useStore();

  // Shared state
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualNumbers, setManualNumbers] = useState(['', '', '', '', '']);
  const [manualBonus, setManualBonus] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId || '');
  const [selectedGame, setSelectedGame] = useState<'powerball' | 'mega_millions'>('powerball');
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPoolPicker, setShowPoolPicker] = useState(false);

  // Scan mode state
  const [scanPhase, setScanPhase] = useState<ScanPhase>('preview');
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [parsedPlays, setParsedPlays] = useState<ParsedPlay[]>([]);
  const [selectedPlayIndex, setSelectedPlayIndex] = useState(0);
  const [editableNumbers, setEditableNumbers] = useState(['', '', '', '', '']);
  const [editableBonus, setEditableBonus] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start/stop camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setCameraError('Camera access denied. Please allow camera access or enter manually.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  // Camera lifecycle
  useEffect(() => {
    if (isManualEntry) return;
    if (scanPhase === 'preview') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isManualEntry, scanPhase, startCamera, stopCamera]);

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => { terminateOcrWorker(); };
  }, []);

  // Capture & OCR
  const handleCapture = async () => {
    if (!videoRef.current) return;

    setScanPhase('processing');
    setOcrProgress(0);
    setError(null);
    setOcrRawText('');

    try {
      // 1. Capture raw frame for display + upload
      const rawCanvas = captureFrame(videoRef.current);
      const dataUrl = rawCanvas.toDataURL('image/jpeg', 0.85);
      setCapturedImageUrl(dataUrl);

      // Save blob for upload
      rawCanvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, 'image/jpeg', 0.85);

      // Stop camera to save battery
      stopCamera();

      // 2. Preprocess for OCR
      const processedCanvas = preprocessForOcr(videoRef.current);

      // 3. Run OCR
      const worker = await getOcrWorker((progress) => setOcrProgress(progress));
      const { data: { text } } = await worker.recognize(processedCanvas);
      setOcrRawText(text);

      // 4. Parse results
      const result = parseTicketOcr(text);

      if (result.plays.length > 0) {
        setParsedPlays(result.plays);
        setSelectedPlayIndex(0);
        const play = result.plays[0];
        setEditableNumbers(play.numbers.map(n => n.toString()));
        setEditableBonus(play.bonusNumber.toString());
        if (play.gameType) setSelectedGame(play.gameType);
      } else {
        setParsedPlays([]);
        setEditableNumbers(['', '', '', '', '']);
        setEditableBonus('');
      }

      setScanPhase('review');
    } catch (err) {
      console.error('OCR failed:', err);
      setError('OCR processing failed. Please try again or enter manually.');
      setScanPhase('review');
    }
  };

  // Retake — reset scan state and restart camera
  const handleRetake = () => {
    setCapturedImageUrl(null);
    setCapturedBlob(null);
    setParsedPlays([]);
    setEditableNumbers(['', '', '', '', '']);
    setEditableBonus('');
    setOcrRawText('');
    setError(null);
    setOcrProgress(0);
    setScanPhase('preview');
  };

  // Upload image from file picker
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    setScanPhase('processing');
    setOcrProgress(0);
    setError(null);
    setOcrRawText('');
    stopCamera();

    try {
      // Load file into an Image element
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectUrl;
      });

      // Capture raw frame for display
      const rawCanvas = captureFrameFromImage(img);
      const dataUrl = rawCanvas.toDataURL('image/jpeg', 0.85);
      setCapturedImageUrl(dataUrl);

      // Save blob for upload
      rawCanvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, 'image/jpeg', 0.85);

      // Preprocess for OCR
      const processedCanvas = preprocessImageForOcr(img);
      URL.revokeObjectURL(objectUrl);

      // Run OCR
      const worker = await getOcrWorker((progress) => setOcrProgress(progress));
      const { data: { text } } = await worker.recognize(processedCanvas);
      setOcrRawText(text);

      // Parse results
      const result = parseTicketOcr(text);

      if (result.plays.length > 0) {
        setParsedPlays(result.plays);
        setSelectedPlayIndex(0);
        const play = result.plays[0];
        setEditableNumbers(play.numbers.map(n => n.toString()));
        setEditableBonus(play.bonusNumber.toString());
        if (play.gameType) setSelectedGame(play.gameType);
      } else {
        setParsedPlays([]);
        setEditableNumbers(['', '', '', '', '']);
        setEditableBonus('');
      }

      setScanPhase('review');
    } catch (err) {
      console.error('Image OCR failed:', err);
      setError('Failed to process image. Please try again or enter manually.');
      setScanPhase('review');
    }
  };

  // Select a different parsed play
  const handleSelectPlay = (index: number) => {
    setSelectedPlayIndex(index);
    const play = parsedPlays[index];
    setEditableNumbers(play.numbers.map(n => n.toString()));
    setEditableBonus(play.bonusNumber.toString());
    if (play.gameType) setSelectedGame(play.gameType);
  };

  // Save ticket
  const handleSaveTicket = async () => {
    if (!user?.id) {
      setError('You must be logged in');
      return;
    }
    if (!selectedPoolId) {
      setError('Please select a pool');
      return;
    }

    const isScanMode = !isManualEntry;
    const numbers = isScanMode
      ? editableNumbers.map(n => parseInt(n)).filter(n => !isNaN(n))
      : manualNumbers.map(n => parseInt(n)).filter(n => !isNaN(n));
    const bonusNumber = isScanMode
      ? parseInt(editableBonus)
      : parseInt(manualBonus);

    if (numbers.length !== 5 || !bonusNumber || isNaN(bonusNumber)) {
      setError('Please enter all 6 numbers');
      return;
    }

    setIsSaving(true);
    setError(null);

    const { data: ticket, error: saveError } = await addTicket({
      pool_id: selectedPoolId,
      game_type: selectedGame,
      numbers,
      bonus_number: bonusNumber,
      draw_date: drawDate,
      entered_by: user.id,
      entry_method: isScanMode ? 'scan' : 'manual',
    });

    if (saveError || !ticket) {
      setError(saveError || 'Failed to create ticket');
      setIsSaving(false);
      return;
    }

    // Upload captured image (fire-and-forget)
    if (isScanMode && capturedBlob && ticket.id) {
      const file = new File([capturedBlob], `ticket-${ticket.id}.jpg`, { type: 'image/jpeg' });
      uploadTicketImage(selectedPoolId, ticket.id, file).catch(err => {
        console.error('Image upload failed:', err);
      });
    }

    setIsSaving(false);

    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
      });
    }
    onClose();
  };

  const selectedPool = pools.find(p => p.id === selectedPoolId);

  // ──────────────────────────────────────────────
  // MANUAL ENTRY MODE (unchanged)
  // ──────────────────────────────────────────────
  if (isManualEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] bg-[#EDF6F9] flex flex-col"
      >
        <div className="px-4 sm:px-8 flex justify-between items-center" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 rounded-xl bg-white text-[#006D77] shadow-lg border border-[#FFDDD2]"
          >
            <X size={20} strokeWidth={3} />
          </motion.button>
          <h2 className="text-lg font-black text-[#006D77]">Enter Ticket</h2>
          <div className="w-11" />
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Pool Selector */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Select Pool</label>
            <button
              onClick={() => setShowPoolPicker(!showPoolPicker)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-[#FFDDD2] flex items-center justify-between"
            >
              <span className="font-bold text-[#006D77]">
                {selectedPool?.name || 'Choose a pool...'}
              </span>
              <ChevronDown size={20} className="text-[#83C5BE]" />
            </button>
            <AnimatePresence>
              {showPoolPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-white rounded-2xl border-2 border-[#FFDDD2] overflow-hidden"
                >
                  {pools.map(pool => (
                    <button
                      key={pool.id}
                      onClick={() => {
                        setSelectedPoolId(pool.id);
                        setSelectedGame(pool.game_type as 'powerball' | 'mega_millions');
                        setShowPoolPicker(false);
                      }}
                      className="w-full p-4 text-left hover:bg-[#EDF6F9] border-b border-[#FFDDD2] last:border-0"
                    >
                      <p className="font-bold text-[#006D77]">{pool.name}</p>
                      <p className="text-xs text-[#83C5BE] capitalize">{pool.game_type?.replace('_', ' ')}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Game Type */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Game</label>
            <div className="flex gap-3">
              {(['powerball', 'mega_millions'] as const).map(game => (
                <button
                  key={game}
                  onClick={() => setSelectedGame(game)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                    selectedGame === game
                      ? 'bg-[#006D77] text-white'
                      : 'bg-white border-2 border-[#FFDDD2] text-[#006D77]'
                  }`}
                >
                  {game === 'powerball' ? 'Powerball' : 'Mega Millions'}
                </button>
              ))}
            </div>
          </div>
          {/* Draw Date */}
          <div>
            <label htmlFor="ticket-draw-date" className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Draw Date</label>
            <input
              id="ticket-draw-date"
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-[#FFDDD2] font-bold text-[#006D77]"
            />
          </div>
          {/* Numbers Entry */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">
              Main Numbers (1-{selectedGame === 'powerball' ? '69' : '70'})
            </label>
            <div className="flex gap-2">
              {manualNumbers.map((num, i) => (
                <input
                  key={i}
                  type="number"
                  min="1"
                  max={selectedGame === 'powerball' ? 69 : 70}
                  value={num}
                  onChange={(e) => {
                    const newNumbers = [...manualNumbers];
                    newNumbers[i] = e.target.value;
                    setManualNumbers(newNumbers);
                  }}
                  className="flex-1 p-3 rounded-xl bg-white border-2 border-[#FFDDD2] font-black text-center text-[#006D77] text-lg"
                  placeholder="#"
                />
              ))}
            </div>
          </div>
          {/* Bonus Number */}
          <div>
            <label htmlFor="ticket-bonus-number" className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">
              {selectedGame === 'powerball' ? 'Powerball' : 'Mega Ball'} (1-{selectedGame === 'powerball' ? '26' : '25'})
            </label>
            <input
              id="ticket-bonus-number"
              type="number"
              min="1"
              max={selectedGame === 'powerball' ? 26 : 25}
              value={manualBonus}
              onChange={(e) => setManualBonus(e.target.value)}
              className={`w-24 p-3 rounded-xl border-2 font-black text-center text-lg ${
                selectedGame === 'powerball'
                  ? 'bg-[#FFDDD2] border-[#E29578] text-[#E29578]'
                  : 'bg-[#EDF6F9] border-[#006D77] text-[#006D77]'
              }`}
              placeholder="#"
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm font-bold text-center"
            >
              {error}
            </motion.p>
          )}
        </div>
        {/* Bottom Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#FFDDD2] safe-area-bottom">
          <div className="flex gap-3">
            <button
              onClick={() => setIsManualEntry(false)}
              className="flex-1 py-4 rounded-2xl bg-[#FFDDD2] text-[#006D77] font-black flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Scan Instead
            </button>
            <button
              onClick={handleSaveTicket}
              disabled={isSaving}
              className="flex-1 py-4 rounded-2xl bg-[#E29578] text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSaving ? 'Saving...' : 'Save Ticket'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────
  // SCAN MODE
  // ──────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col"
    >
      {/* Camera / Captured Image Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {scanPhase === 'preview' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              <div className="flex-1 bg-black/50" />
              <div className="flex h-[220px] sm:h-[280px]">
                <div className="flex-1 bg-black/50" />
                <div className="w-[260px] sm:w-[320px] relative">
                  <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-[#83C5BE] rounded-tl-lg sm:rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-[#83C5BE] rounded-tr-lg sm:rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-[#83C5BE] rounded-bl-lg sm:rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-[#83C5BE] rounded-br-lg sm:rounded-br-xl" />
                </div>
                <div className="flex-1 bg-black/50" />
              </div>
              <div className="flex-1 bg-black/50 flex flex-col items-center pt-6 sm:pt-8">
                {!cameraError && (
                  <p className="text-white/70 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-4 text-center">
                    Position ticket numbers in frame
                  </p>
                )}
                {cameraError && (
                  <div className="flex flex-col items-center gap-3 px-6">
                    <AlertCircle size={24} className="text-[#E29578]" />
                    <p className="text-white/70 text-xs sm:text-sm font-bold text-center">{cameraError}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Processing or Review — show captured still image
          capturedImageUrl && (
            <img
              src={capturedImageUrl}
              alt="Captured ticket"
              className={`absolute inset-0 w-full h-full object-cover ${
                scanPhase === 'processing' ? 'opacity-40' : 'opacity-30'
              }`}
            />
          )
        )}
      </div>

      {/* Top controls */}
      <div className="absolute left-0 right-0 px-4 sm:px-8 flex justify-between items-center z-[410]" style={{ top: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white text-[#006D77] shadow-xl border border-[#FFDDD2]"
        >
          <X size={20} strokeWidth={3} />
        </motion.button>
        {scanPhase === 'preview' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsManualEntry(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"
          >
            <Keyboard size={14} />
            Enter Manually
          </motion.button>
        )}
      </div>

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ── PREVIEW PHASE: Capture + Upload buttons ── */}
      {scanPhase === 'preview' && !cameraError && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-10 safe-area-bottom z-[420]">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center"
          >
            <ImagePlus size={22} className="text-white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleCapture}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white flex items-center justify-center shadow-2xl"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center">
              <Camera size={28} className="text-[#006D77]" />
            </div>
          </motion.button>
          <div className="w-[54px]" /> {/* Spacer to keep capture button centered */}
        </div>
      )}

      {/* Camera error fallback buttons */}
      {scanPhase === 'preview' && cameraError && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 px-6 pb-10 safe-area-bottom z-[420]">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 max-w-[200px] py-4 rounded-2xl bg-[#E29578] text-white font-black shadow-xl flex items-center justify-center gap-2"
          >
            <ImagePlus size={18} />
            Upload Photo
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsManualEntry(true)}
            className="flex-1 max-w-[200px] py-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black shadow-xl flex items-center justify-center gap-2"
          >
            <Keyboard size={18} />
            Enter Manually
          </motion.button>
        </div>
      )}

      {/* ── PROCESSING PHASE: Progress overlay ── */}
      {scanPhase === 'processing' && (
        <div className="absolute inset-0 z-[415] flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-white font-black text-sm sm:text-base">
                {ocrProgress === 0 ? 'Initializing...' : 'Reading ticket...'}
              </p>
              <div className="w-48 h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-[#83C5BE] rounded-full"
                  initial={{ width: '5%' }}
                  animate={{ width: `${Math.max(5, ocrProgress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-white/60 text-xs font-bold">{ocrProgress}%</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── REVIEW PHASE: Results bottom sheet ── */}
      <AnimatePresence>
        {scanPhase === 'review' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] sm:rounded-t-[32px] border-t-4 sm:border-t-8 border-[#83C5BE] p-5 sm:p-8 shadow-[0_-15px_50px_rgba(0,0,0,0.2)] z-[420] safe-area-bottom max-h-[85vh] overflow-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#E29578]/10 text-[#E29578]">
                    <Zap size={14} fill="currentColor" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight">
                    {parsedPlays.length > 0
                      ? `${selectedGame === 'powerball' ? 'Powerball' : 'Mega Millions'} Detected`
                      : 'Review Ticket'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#83C5BE]">Draw Date: {drawDate}</p>
              </div>
              {parsedPlays.length > 0 && (
                <div className="bg-[#EDF6F9] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#FFDDD2]">
                  <p className="text-[8px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-wider">Scanned OCR</p>
                </div>
              )}
            </div>

            {/* Play selector tabs (if multiple plays) */}
            {parsedPlays.length > 1 && (
              <div className="flex gap-2 mb-4">
                {parsedPlays.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPlay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      selectedPlayIndex === i
                        ? 'bg-[#006D77] text-white'
                        : 'bg-[#EDF6F9] text-[#006D77] border border-[#FFDDD2]'
                    }`}
                  >
                    Play {String.fromCharCode(65 + i)}
                  </button>
                ))}
              </div>
            )}

            {/* OCR failed message */}
            {parsedPlays.length === 0 && !error && (
              <div className="mb-4 p-4 rounded-2xl bg-[#FFDDD2]/30 border border-[#E29578]/30">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-[#E29578] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#006D77]">Couldn't detect numbers automatically</p>
                    <p className="text-xs text-[#83C5BE] mt-1">You can enter them below, or retake the photo with better lighting.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pool Selector */}
            <div className="mb-4">
              <button
                onClick={() => setShowPoolPicker(!showPoolPicker)}
                className="w-full p-3 rounded-xl bg-[#EDF6F9] border border-[#FFDDD2] flex items-center justify-between"
              >
                <span className="text-sm font-bold text-[#006D77]">
                  {selectedPool?.name || 'Select pool to save to...'}
                </span>
                <ChevronDown size={16} className="text-[#83C5BE]" />
              </button>
              <AnimatePresence>
                {showPoolPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 bg-white rounded-xl border-2 border-[#FFDDD2] overflow-hidden max-h-40 overflow-y-auto"
                  >
                    {pools.map(pool => (
                      <button
                        key={pool.id}
                        onClick={() => {
                          setSelectedPoolId(pool.id);
                          setSelectedGame(pool.game_type as 'powerball' | 'mega_millions');
                          setShowPoolPicker(false);
                        }}
                        className="w-full p-3 text-left hover:bg-[#EDF6F9] border-b border-[#FFDDD2] last:border-0"
                      >
                        <p className="font-bold text-sm text-[#006D77]">{pool.name}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Game Type Toggle */}
            <div className="flex gap-2 mb-4">
              {(['powerball', 'mega_millions'] as const).map(game => (
                <button
                  key={game}
                  onClick={() => setSelectedGame(game)}
                  className={`flex-1 py-2 rounded-xl font-black text-xs transition-all ${
                    selectedGame === game
                      ? 'bg-[#006D77] text-white'
                      : 'bg-[#EDF6F9] text-[#006D77] border border-[#FFDDD2]'
                  }`}
                >
                  {game === 'powerball' ? 'Powerball' : 'Mega Millions'}
                </button>
              ))}
            </div>

            {/* Draw Date */}
            <div className="mb-4">
              <input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#EDF6F9] border border-[#FFDDD2] font-bold text-sm text-[#006D77]"
              />
            </div>

            {/* Editable number balls */}
            <div className="mb-2">
              <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">
                Main Numbers (1-{selectedGame === 'powerball' ? '69' : '70'})
              </label>
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
              {editableNumbers.map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#006D77] flex items-center justify-center shadow-lg border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    max={selectedGame === 'powerball' ? 69 : 70}
                    value={num}
                    onChange={(e) => {
                      const newNumbers = [...editableNumbers];
                      newNumbers[i] = e.target.value;
                      setEditableNumbers(newNumbers);
                    }}
                    className="w-full h-full bg-transparent text-center font-black text-white text-sm sm:text-base outline-none relative z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="#"
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E29578] flex items-center justify-center shadow-lg border border-white/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max={selectedGame === 'powerball' ? 26 : 25}
                  value={editableBonus}
                  onChange={(e) => setEditableBonus(e.target.value)}
                  className="w-full h-full bg-transparent text-center font-black text-white text-sm sm:text-base outline-none relative z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="#"
                />
              </motion.div>
            </div>
            <div className="mb-6">
              <p className="text-[10px] text-center text-[#83C5BE] font-bold">
                {selectedGame === 'powerball' ? 'Powerball' : 'Mega Ball'} (1-{selectedGame === 'powerball' ? '26' : '25'})
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm font-bold text-center mb-4"
              >
                {error}
              </motion.p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveTicket}
                disabled={isSaving || !selectedPoolId}
                className="w-full py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Confirm & Save
                    <Check size={18} strokeWidth={3} />
                  </>
                )}
              </motion.button>
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] bg-[#FFDDD2] text-[#006D77] font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Retake
                </button>
                <button
                  onClick={() => setIsManualEntry(true)}
                  className="flex-1 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] bg-[#EDF6F9] text-[#006D77] font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 border border-[#FFDDD2]"
                >
                  <Keyboard size={16} />
                  Manual
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TicketScanner;
