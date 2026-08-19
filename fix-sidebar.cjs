const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');

const oldBrandHeader = `{/* Brand Header */}
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
            isCollapsed
              ? "absolute -right-4 top-4 bg-primary shadow-md text-white hover:bg-primary border border-white/10 z-50 rounded-full"
              : "",
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>

        {/* Close button for Mobile Drawer */}
        <button
          onClick={() => setIsMobileDrawerOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>`;

const newBrandHeader = `{/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-16 shrink-0 transition-all duration-300 relative",
          isCollapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <div className="flex items-center overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <img
              src="/src/PNG/LOGO.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
          </div>

          {!isCollapsed && (
            <div className="ml-3 flex flex-col justify-center opacity-100 transition-opacity duration-300 min-w-0">
              <span className="font-bold text-[15px] leading-tight whitespace-nowrap text-white truncate">মাদানিয়া</span>
              <span className="text-[10px] text-white/70 tracking-wide uppercase whitespace-nowrap truncate">ম্যানেজমেন্ট সিস্টেম</span>
            </div>
          )}
        </div>
      </div>`;

code = code.replace(oldBrandHeader, newBrandHeader);

// Adjust menu spacing
code = code.replace('pb-6 px-3 pt-4 space-y-1', 'pb-6 px-2.5 pt-3 space-y-0.5');

// Adjust button padding
code = code.replace('isCollapsed ? "justify-center p-3" : "px-4 py-3"', 'isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"');

// Adjust icon size
code = code.replace('size={20}', 'size={18}');

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
