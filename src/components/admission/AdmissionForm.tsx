import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface AdmissionFormProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function AdmissionForm({ onClose }: AdmissionFormProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card w-full max-w-4xl h-[100vh] sm:h-[90vh] rounded-none sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col border border-border-main"
    >
      <div className="p-4 border-b border-border-main flex justify-between items-center bg-card sticky top-0 z-10">
        <h2 className="text-xl font-black text-text-main">অনলাইন ভর্তি আবেদন</h2>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-step-bg rounded-xl text-text-light hover:text-error transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 w-full overflow-hidden">
        <iframe 
          src="/online%20admit%20forom.html" 
          className="w-full h-full border-none"
          title="Admission Form"
        />
      </div>
    </motion.div>
  );
}
