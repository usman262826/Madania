import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Search, UserCheck, AlertCircle, Camera, CheckCircle } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import jsQR from "jsqr";
import toast from "react-hot-toast";

interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export function QuickScanModal({ isOpen, onClose, setActiveTab }: QuickScanModalProps) {
  const { students } = useData();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<any | null>(null);
  const [manualId, setManualId] = useState<string>("");
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Sound play for successful QR scan (built-in oscillator)
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.value = 1000; // Beep frequency
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio playback not supported or blocked by browser autocomplete:", e);
    }
  };

  // Student matching logic
  const handleMatchedStudent = (student: any) => {
    playSuccessBeep();
    setMatchedStudent(student);
    
    const studentId = student.id || student["রেজিস্ট্রেশন/আইডি নম্বর"] || student.studentId || "";
    toast.success(`শিক্ষার্থী পাওয়া গেছে: ${student["শিক্ষার্থীর নাম"] || student.name}`);
    
    // Set temp ID in localStorage for StudentFees to pick up
    localStorage.setItem("madrasah-temp-student-id", String(studentId));
    
    // Wait a brief moment to show success UI, then redirect and close
    setTimeout(() => {
      setActiveTab("student-fees");
      onClose();
    }, 1200);
  };

  // Check QR Code value against student records
  const processScannedValue = (value: string) => {
    const cleanVal = value.trim().toLowerCase();
    if (!cleanVal) return;

    // Search in students list
    const found = students.find((s: any) => {
      const sId = String(s.id || "").trim().toLowerCase();
      const sReg = String(s["রেজিস্ট্রেশন/আইডি নম্বর"] || "").trim().toLowerCase();
      const sReg2 = String(s["রেজিস্ট্রেশন/আইডি"] || "").trim().toLowerCase();
      const sStudentId = String(s.studentId || "").trim().toLowerCase();
      const sRoll = String(s["রোল নম্বর"] || s.roll || "").trim().toLowerCase();

      return sId === cleanVal || 
             sReg === cleanVal || 
             sReg2 === cleanVal || 
             sStudentId === cleanVal || 
             sRoll === cleanVal ||
             cleanVal.includes(sId) ||
             sId.includes(cleanVal);
    });

    if (found) {
      setScannedResult(value);
      handleMatchedStudent(found);
    } else {
      toast.error(`কোনো শিক্ষার্থী পাওয়া যায়নি এই আইডি দিয়ে: ${value}`);
    }
  };

  // Camera start/stop inside useEffect hook
  useEffect(() => {
    if (!isOpen || isManualMode) {
      // Clean up camera stream if closed or manual mode active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let active = true;

    const startCamera = async () => {
      try {
        setErrorMsg("");
        setHasPermission(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch((err) => {
            console.error("Video play failed:", err);
          });
          setHasPermission(true);
          
          // Start the scanning loop
          animationRef.current = requestAnimationFrame(scanLoop);
        }
      } catch (err: any) {
        console.error("Camera startup error:", err);
        if (active) {
          setHasPermission(false);
          setErrorMsg("ক্যামেরা ব্যবহারের অনুমতি পাওয়া যায়নি বা ক্যামেরা পাওয়া যায়নি।");
        }
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isOpen, isManualMode]);

  // Decoupled scan decoding loop
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          processScannedValue(code.data);
          return; // Stop scan loop on success
        }
      }
    }

    if (isOpen && !scannedResult && !isManualMode) {
      animationRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) {
      toast.error("আইডি নম্বরটি লিখুন");
      return;
    }
    processScannedValue(manualId);
  };

  // Reset scanner state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setMatchedStudent(null);
      setManualId("");
      setIsManualMode(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="quick-scan-container" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-hind-siliguri">
          {/* Backdrop blur & close action */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            id="quick-scan-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-card border border-border-main/50 rounded-2xl overflow-hidden shadow-2xl relative z-10"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-step-bg border-b border-border-main/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <QrCode className="w-5 h-5 shrink-0" />
                <span className="font-black text-sm">আইডি কার্ড কুইক স্ক্যানার</span>
              </div>
              <button
                id="quick-scan-close-btn"
                onClick={onClose}
                className="p-1 rounded-full text-text-light hover:bg-black/10 hover:text-text-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col items-center">
              {matchedStudent ? (
                /* Success View */
                <div id="scan-success-panel" className="w-full flex flex-col items-center py-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-500">শিক্ষার্থী পাওয়া গেছে!</h3>
                    <p className="text-sm font-semibold text-text-main mt-1">
                      {matchedStudent["শিক্ষার্থীর নাম"] || matchedStudent.name}
                    </p>
                    <p className="text-xs text-text-light mt-0.5">
                      আইডি: {matchedStudent.id || matchedStudent["রেজিস্ট্রেশন/আইডি নম্বর"]} | জামাত: {matchedStudent["জামাত/শ্রেণী"] || matchedStudent.class}
                    </p>
                  </div>
                  <p className="text-xs text-primary font-bold animate-pulse">
                    ফি সংগ্রহ মডিউলে রিডাইরেক্ট করা হচ্ছে...
                  </p>
                </div>
              ) : isManualMode ? (
                /* Manual Entry Form */
                <form id="scan-manual-form" onSubmit={handleManualSearch} className="w-full space-y-4 py-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-text-light">শিক্ষার্থীর আইডি/রেজিস্ট্রেশন নম্বর দিন</p>
                  </div>
                  <div className="relative">
                    <input
                      id="scan-manual-input"
                      type="text"
                      placeholder="যেমন: 10101"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-step-bg border border-border-main focus:border-primary/50 rounded-xl text-sm font-semibold outline-none text-text-main"
                      autoFocus
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                  </div>
                  <button
                    id="scan-manual-submit-btn"
                    type="submit"
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 shadow-md active:scale-[0.98] transition-transform text-xs cursor-pointer"
                  >
                    খতিয়ান খুঁজুন
                  </button>
                  <button
                    id="scan-toggle-camera-btn"
                    type="button"
                    onClick={() => setIsManualMode(false)}
                    className="w-full py-2 bg-step-bg text-text-main border border-border-main/50 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black/5"
                  >
                    <Camera className="w-4 h-4" /> ক্যামেরা স্ক্যানে ফিরুন
                  </button>
                </form>
              ) : (
                /* Camera Scanner View */
                <div id="scan-camera-panel" className="w-full flex flex-col items-center space-y-4">
                  {/* Camera feed or prompt state */}
                  {hasPermission === null ? (
                    <div className="w-full aspect-square max-w-[280px] bg-step-bg rounded-2xl flex flex-col items-center justify-center border border-border-main text-text-light p-4 text-center space-y-2">
                      <Camera className="w-8 h-8 animate-pulse text-primary" />
                      <p className="text-xs font-bold">ক্যামেরা চালু করা হচ্ছে...</p>
                    </div>
                  ) : hasPermission === false ? (
                    <div className="w-full aspect-square max-w-[280px] bg-red-500/5 rounded-2xl flex flex-col items-center justify-center border border-red-500/20 text-error p-6 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 shrink-0 text-error" />
                      <p className="text-xs font-semibold">{errorMsg}</p>
                      <button
                        id="scan-manual-trigger-btn"
                        onClick={() => setIsManualMode(true)}
                        className="mt-3 px-4 py-2 bg-primary text-white text-[11px] font-black rounded-lg cursor-pointer"
                      >
                        ম্যানুয়ালি আইডি লিখুন
                      </button>
                    </div>
                  ) : (
                    /* Real Camera Video Output */
                    <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border-2 border-primary/30 shadow-inner">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Overlaid QR Reticle Outline */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/40 rounded-xl relative">
                          {/* Blinking Scanning laser line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary animate-[scan-laser_2s_infinite]" />
                          
                          {/* Corner Highlight borders */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-md" />
                        </div>
                      </div>

                      {/* Quick Scanning Indicator text overlay */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full border border-white/10 text-[9px] text-white/90 font-bold whitespace-nowrap animate-pulse">
                        আইডি কার্ডের QR কোডটি ফ্রেমের ভেতর রাখুন
                      </div>
                    </div>
                  )}

                  <div className="w-full flex gap-2">
                    <button
                      id="scan-manual-toggle-btn"
                      onClick={() => setIsManualMode(true)}
                      className="flex-1 py-3 bg-step-bg border border-border-main text-text-main text-xs font-bold rounded-xl cursor-pointer hover:bg-black/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-4 h-4" /> ম্যানুয়ালি আইডি দিন
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom CSS Animation for Scanning Laser */}
            <style>{`
              @keyframes scan-laser {
                0%, 100% { top: 5%; }
                50% { top: 95%; }
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
