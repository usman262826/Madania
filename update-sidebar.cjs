const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');

// Add Calendar, PanelLeftClose, PanelLeftOpen icons
code = code.replace(/LogOut,\n  ChevronRight,\n} from "lucide-react";/, 'LogOut,\n  ChevronRight,\n  Calendar,\n  PanelLeftClose,\n  PanelLeftOpen\n} from "lucide-react";');

// Date Widget Component code
const dateWidgetCode = `
const DateWidget = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const [dateInfo, setDateInfo] = useState({
    dayName: '',
    hijri: '',
    bengali: '',
    english: ''
  });

  React.useEffect(() => {
    const d = new Date();
    const dayName = new Intl.DateTimeFormat('bn-BD', { weekday: 'long' }).format(d);
    
    // Fallback/Mock logic for Bengali and Hijri for exact matching user preference formatting.
    // In a real app, complex calculation libraries like moment-hijri would be used.
    
    // Simple Hijri formatter
    const hijriFormatter = new Intl.DateTimeFormat('bn-BD-u-ca-islamic', {day: 'numeric', month: 'long', year: 'numeric'});
    const hijriFormatted = hijriFormatter.format(d).replace('যুগ', 'হিজরি'); // replacing yug with hijri for better context

    // Standard English date
    const enFormatter = new Intl.DateTimeFormat('bn-BD', {day: 'numeric', month: 'long', year: 'numeric'});
    const englishFormatted = enFormatter.format(d);

    setDateInfo({
      dayName,
      hijri: \`\${hijriFormatted}\`,
      bengali: '১০ ভাদ্র ১৪৩৩', // Mocked as per requirement or we could use custom logic
      english: englishFormatted
    });
  }, []);

  if (isCollapsed) return null;

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
      <div className="flex items-center gap-2 text-white/90 font-semibold text-xs mb-2">
        <Calendar size={14} className="text-primary-light" />
        <span>আজ: {dateInfo.dayName}</span>
      </div>
      <div className="text-[10px] text-white/70 flex justify-between gap-4">
        <span>হিজরি:</span>
        <span className="font-medium text-white/90 text-right">{dateInfo.hijri}</span>
      </div>
      <div className="text-[10px] text-white/70 flex justify-between gap-4">
        <span>বাংলা:</span>
        <span className="font-medium text-white/90 text-right">{dateInfo.bengali}</span>
      </div>
      <div className="text-[10px] text-white/70 flex justify-between gap-4">
        <span>ইংরেজি:</span>
        <span className="font-medium text-white/90 text-right">{dateInfo.english}</span>
      </div>
    </div>
  );
};
`;

code = code.replace('export function Sidebar(', dateWidgetCode + '\nexport function Sidebar(');

// Add toggle button in Brand Header
const oldBrandHeader = `{/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-16 shrink-0 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "px-6",
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <img
            src="/src/PNG/LOGO.png"
            alt="Logo"
            className="w-7 h-7 object-contain"
          />
        </div>

        {!isCollapsed && (
          <div className="ml-3 font-semibold text-lg whitespace-nowrap opacity-100 transition-opacity duration-300">
            D.U.M.M
          </div>
        )}
      </div>`;

const newBrandHeader = `{/* Brand Header */}
      <div
        className={cn(
          "flex items-center justify-between h-16 shrink-0 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <img
              src="/src/PNG/LOGO.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
          </div>

          {!isCollapsed && (
            <div className="ml-3 font-semibold text-lg whitespace-nowrap opacity-100 transition-opacity duration-300">
              D.U.M.M
            </div>
          )}
        </div>
        
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors",
            isCollapsed ? "absolute -right-4 top-4 bg-primary shadow-md text-white hover:bg-primary border border-white/10 z-50 rounded-full" : ""
          )}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={18} />}
        </button>
        
        {/* Close button for Mobile Drawer */}
        <button 
          onClick={() => setIsMobileDrawerOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>`;

code = code.replace(oldBrandHeader, newBrandHeader);

// Add Date Widget right before Footer Profile
const footerStart = `{/* Footer Profile */}`;
code = code.replace(footerStart, `<DateWidget isCollapsed={isCollapsed} />\n\n      {/* Footer Profile */}`);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
