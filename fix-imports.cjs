const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importStart = code.indexOf('} from "lucide-react";');
if (importStart !== -1) {
  // Add missing icons
  code = code.replace('} from "lucide-react";', '  Users,\n  UserCheck,\n  Menu,\n  LayoutGrid,\n  Bell,\n} from "lucide-react";');
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed imports');
} else {
  console.log('Could not find lucide import');
}
