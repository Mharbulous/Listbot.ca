import React, { useState } from 'react';
import { Folder, Layers } from 'lucide-react';

export default function App() {
  const [containerWidth, setContainerWidth] = useState(100);
  const [activeTab, setActiveTab] = useState('tab-1');

  const proceedings = [
    { id: 'tab-1', title: 'Smith v. Jones', subtitle: 'Vancouver • SC-2023 • 8921' },
    { id: 'tab-2', title: 'R. v. Anderson', subtitle: 'Victoria • PC-2023 • 1120' },
    { id: 'tab-3', title: 'Est. of H. Wong', subtitle: 'Richmond • SC-2024 • 0032' },
    { id: 'tab-4', title: 'TechCorp v. Doe', subtitle: 'Vancouver • SC-2024 • 4451' },
    { id: 'tab-5', title: 'Family Law Act', subtitle: 'Burnaby • FL-2023 • 9982' },
    { id: 'tab-6', title: 'In Re: Building', subtitle: 'Kelowna • SC-2022 • 2211' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      
      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Folder className="w-6 h-6 text-blue-600" />
          CSS-Only Adaptive Tabs
        </h1>
        <p className="mb-6 text-slate-600">
          Resize the slider. I have added <b>Folder Icons</b> back into the design to restore the visual metaphor. The layout logic remains locked to prevent overflow.
        </p>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Container Width: {containerWidth}%
          </label>
          <input
            type="range"
            min="25"
            max="100"
            value={containerWidth}
            onChange={(e) => setContainerWidth(e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* THE DEMO CONTAINER */}
      <div 
        className="mx-auto border-x border-t border-dashed border-slate-300 bg-slate-100 relative transition-all duration-75 ease-linear"
        style={{ width: `${containerWidth}%`, maxWidth: '1000px', height: '300px' }}
      >
        <div className="absolute -top-6 left-0 text-xs text-slate-400 font-mono">Container Edge</div>
        <div className="absolute -top-6 right-0 text-xs text-slate-400 font-mono">Container Edge</div>

        <div className="w-full px-4 pt-4">
          <ul className="flex items-end w-full relative h-[64px]">
            
            {/* 1. THE TABS */}
            {proceedings.map((proc, index) => {
              const isLast = index === proceedings.length - 1;
              const isActive = activeTab === proc.id;
              
              return (
                <li 
                  key={proc.id}
                  className={`
                    relative 
                    mr-2 
                    flex-shrink
                    
                    /* HOVER LOGIC */
                    hover:z-[100]
                    focus-within:z-[100]
                    
                    /* THE MAGIC FIX (Retained from previous working version): 
                       - Normal tabs can shrink to 0 (min-w-0).
                       - The LAST tab has a min-width floor (min-w-[140px]).
                    */
                    ${isLast ? 'min-w-[140px]' : 'min-w-0'}
                  `}
                  style={{ 
                    flexBasis: '220px' 
                  }}
                >
                  <button
                    onClick={() => setActiveTab(proc.id)}
                    className={`
                      /* FIXED DIMENSIONS */
                      w-[220px] 
                      h-[64px]
                      
                      /* Visual Styling */
                      rounded-t-xl 
                      border 
                      border-b-0
                      px-4
                      flex items-center gap-3
                      transition-all duration-200 ease-out
                      
                      /* Typography */
                      text-left
                      whitespace-nowrap
                      
                      /* State Styling */
                      ${isActive 
                        ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300 text-slate-900 shadow-sm translate-y-1 z-[60]' 
                        : 'bg-gradient-to-b from-slate-50 to-slate-200 border-slate-300 text-slate-500 hover:text-slate-700 hover:from-slate-100 hover:to-slate-200 translate-y-2'
                      }
                    `}
                  >
                    {/* FOLDER ICON */}
                    <Folder 
                      size={20} 
                      className={`flex-shrink-0 ${isActive ? 'text-blue-500 fill-blue-100' : 'text-slate-400'}`} 
                    />
                    
                    <div className="overflow-hidden flex flex-col">
                      <span className="font-bold text-sm block truncate w-full">{proc.title}</span>
                      <span className="text-[10px] opacity-70 block truncate w-full">{proc.subtitle}</span>
                    </div>
                  </button>
                </li>
              );
            })}

            {/* 2. THE SUPER SPACER */}
            <li className="flex-grow shrink-[10000] min-w-0"></li>

            {/* 3. THE 'ALL' TAB */}
            <li className="flex-shrink-0 relative z-[50]">
              <button
                onClick={() => setActiveTab('all')}
                className={`
                  w-[80px] 
                  h-[60px]
                  rounded-t-xl 
                  border 
                  border-b-0
                  font-bold
                  text-sm
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  
                  /* Left shadow helps visualize the stacking order */
                  shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]
                  
                  ${activeTab === 'all'
                    ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300 text-slate-900 shadow-sm translate-y-1 z-[60]' 
                    : 'bg-gradient-to-b from-slate-50 to-slate-200 border-slate-300 text-slate-500 translate-y-2'
                  }
                `}
              >
                <Layers size={16} className={activeTab === 'all' ? 'text-blue-600' : 'text-slate-400'} />
                ALL
              </button>
            </li>
          </ul>

          {/* Content Area */}
          <div className="w-full h-48 bg-white border border-slate-300 shadow-sm relative z-40 -mt-[1px] rounded-b-lg p-8">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
               {activeTab === 'all' ? (
                 <>
                   <Layers className="text-slate-400" />
                   All Proceedings
                 </>
               ) : (
                 <>
                   <Folder className="text-blue-500 fill-blue-50" />
                   {proceedings.find(p => p.id === activeTab)?.title}
                 </>
               )}
            </h2>
            <p className="text-slate-500 mt-4 ml-9">
               The folder icons are back, helping to visually distinguish the tabs. The "ALL" tab uses a stack icon to represent the aggregate view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}