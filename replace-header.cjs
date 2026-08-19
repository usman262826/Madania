const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const startStr = "{/* Mobile Header (Pristine Deep Teal Banner exactly matching Image 1) */}";
const endStr = "<div className=\"px-4 lg:px-8 py-4 lg:py-6 lg:pb-10\">";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  // Find the exact <header>...</header> that's just before endIdx
  const lastHeaderEnd = code.lastIndexOf("</header>", endIdx);
  if (lastHeaderEnd !== -1 && lastHeaderEnd > startIdx) {
      const finalEndIdx = lastHeaderEnd + "</header>".length;
      const newHeaderCode = `<Header 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearchResults={showSearchResults}
          setShowSearchResults={setShowSearchResults}
          searchResults={searchResults}
          setJumpToStudentId={setJumpToStudentId}
          setActiveTab={setActiveTab}
          pendingApplications={academicFilteredPending}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
        />`;
      
      // Look for "<header className=\"md:hidden bg-gradient" part before startIdx to be safe, actually startIdx is pointing right at the comment.
      let removeStart = code.lastIndexOf("<header className=\"md:hidden", startIdx);
      if (removeStart === -1) removeStart = startIdx; // fallback
      
      code = code.substring(0, removeStart) + newHeaderCode + code.substring(finalEndIdx);
      fs.writeFileSync('src/App.tsx', code);
      console.log('Success');
  } else {
      console.log('Error finding end');
  }
} else {
  console.log('Could not find boundaries', startIdx, endIdx);
}
