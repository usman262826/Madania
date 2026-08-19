const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/Analytics.tsx', 'utf-8');

const statsDeclStart = code.indexOf('const stats = [');
const statsDeclEnd = code.indexOf('];', statsDeclStart) + 2;

const newStatsDecl = `const stats = [
    { id: 'students', label: 'শিক্ষার্থী', value: yearStudents.length, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', trend: '+12%', graphColor: '#9333ea' },
    { id: 'teachers', label: 'শিক্ষক', value: 45, icon: Briefcase, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', trend: '+2', graphColor: '#2563eb' },
    { id: 'attendance', label: 'উপস্থিতি', value: '92%', icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', trend: '+5%', graphColor: '#16a34a' },
    { id: 'result', label: 'ফলাফল', value: '98%', icon: Award, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', trend: '+3%', graphColor: '#ea580c' },
    { id: 'notice', label: 'নোটিশ', value: 12, icon: Megaphone, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', trend: 'New', graphColor: '#db2777' },
    { id: 'fees', label: 'ফি সংগ্রহ', value: '৳ 1.2M', icon: Coins, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', trend: '+15%', graphColor: '#0d9488' },
    { id: 'library', label: 'লাইব্রেরি', value: 3450, icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', trend: '+120', graphColor: '#4f46e5' },
    { id: 'routine', label: 'রুটিন', value: 7, icon: CalendarDays, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', trend: 'Updated', graphColor: '#0284c7' },
  ];`;

code = code.substring(0, statsDeclStart) + newStatsDecl + code.substring(statsDeclEnd);

const renderStartStr = '{/* Primary Stats Grid */}';
const renderEndStr = '{/* Interactive Mobile-Friendly Quick Menu / Fast Links Section (Inspired by Image 1 Fast Menu and Image 5 Grid UI) */}';

const renderStartIdx = code.indexOf(renderStartStr);
const renderEndIdx = code.indexOf(renderEndStr);

if (renderStartIdx !== -1 && renderEndIdx !== -1) {
  const newRenderCode = `{/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={stat.id} 
              onClick={() => {
                  if (setActiveTab) setActiveTab(stat.id);
              }}
              className={\`group relative overflow-hidden bg-card rounded-[1.125rem] p-5 border transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-lg \${stat.border} hover:border-transparent\`}
            >
              {/* Gradient Border Effect */}
              <div className={\`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-current to-transparent \${stat.color}\`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={\`\${stat.bg} \${stat.color} p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300\`}>
                  <stat.icon size={20} className="stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-1 bg-step-bg px-2 py-1 rounded-full text-[10px] font-bold text-text-light group-hover:text-text-main transition-colors">
                  <TrendingUp size={12} className={stat.color} />
                  <span>{stat.trend}</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-text-light/80 font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                <h2 className="text-2xl font-black tracking-tight text-text-main">
                  {typeof stat.value === 'number' ? enToBnNumber(stat.value.toString()) : stat.value}
                </h2>
              </div>

              {/* Mini Graph Placeholder (Decorative) */}
              <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 group-hover:opacity-40 transition-opacity duration-300" style={{ background: \`linear-gradient(to top, \${stat.graphColor}, transparent)\` }}>
                 <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,20 Q25,5 50,15 T100,5 L100,20 L0,20 Z" fill={stat.graphColor} />
                 </svg>
              </div>
            </motion.div>
          );
        })}
      </div>\n\n      `;
      
      code = code.substring(0, renderStartIdx) + newRenderCode + code.substring(renderEndIdx);
      fs.writeFileSync('src/components/dashboard/Analytics.tsx', code);
      console.log('Success Analytics rendering');
} else {
    console.log('Could not find render bounds in Analytics.tsx');
}
