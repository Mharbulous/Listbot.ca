/*
 * CSS-ONLY ADAPTIVE OVERLAPPING TABS
 *
 * CRITICAL TECHNIQUE: Two-Layer Structure for True Overlap
 * ========================================================
 *
 * This example demonstrates the CORRECT way to create adaptive tabs that
 * squeeze together and overlap without exceeding container width.
 *
 * KEY INSIGHT:
 * - Each tab has TWO elements: a WRAPPER (li) and a BUTTON inside
 * - The WRAPPER shrinks adaptively (flex-shrink, min-width: 0)
 * - The BUTTON stays at FIXED width (220px - never shrinks)
 * - When wrapper < button width, the button OVERFLOWS and creates overlap!
 *
 * COMMON MISTAKE TO AVOID:
 * ❌ Making the button itself shrink (flex-shrink on button)
 *    This causes tabs to squeeze but NOT overlap
 *
 * ✅ CORRECT: Wrapper shrinks, button stays fixed
 *    This creates true overlap as button overflows its container
 *
 * HOW IT WORKS:
 * 1. Super spacer (shrink: 10000) absorbs extra space first
 * 2. When spacer is exhausted, tab wrappers start shrinking
 * 3. Buttons stay 220px wide and overflow their shrinking wrappers
 * 4. Result: Tabs overlap and squeeze together adaptively
 * 5. Last wrapper has min-width: 140px to prevent complete collapse
 *
 * FLEXBOX PROPERTIES:
 * - flex-basis: 220px (preferred width)
 * - flex-shrink: 1 (can shrink)
 * - min-width: 0 (KEY! allows shrinking below content size)
 * - Last wrapper: min-width: 140px (floor to prevent total collapse)
 */

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

            {/* ================================================================
                1. THE TAB WRAPPERS - This is the KEY to overlap behavior!
                ================================================================

                CRITICAL: Each tab has TWO layers:
                - Outer <li> wrapper: SHRINKS adaptively
                - Inner <button>: FIXED width (220px), creates overlap

                Wrapper properties (li element):
                - flex-shrink: 1 (allows shrinking)
                - flex-basis: 220px (preferred width)
                - min-width: 0 (allows shrinking below 220px - KEY!)
                - margin-right: 8px (spacing between tabs)

                Last wrapper exception:
                - min-width: 140px (prevents complete collapse)

                When wrapper shrinks below 220px:
                → The 220px button OVERFLOWS its wrapper
                → Creates overlap with next tab (only 8px away)
                → This is how true overlap happens!
            */}
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

                    /* HOVER LOGIC - Bring hovered tab to front */
                    hover:z-[100]
                    focus-within:z-[100]

                    /* THE MAGIC: Wrapper shrinks, button inside stays fixed
                       - Normal tabs: can shrink to 0 (min-w-0)
                       - LAST tab: has min-width floor (min-w-[140px])
                       This prevents the last tab from disappearing completely
                    */
                    ${isLast ? 'min-w-[140px]' : 'min-w-0'}
                  `}
                  style={{
                    flexBasis: '220px' // Preferred width for wrapper
                  }}
                >
                  {/* ============================================================
                      BUTTON: FIXED WIDTH - Never shrinks!
                      ============================================================

                      This button is ALWAYS 220px wide, even when its wrapper
                      shrinks below 220px. This overflow creates the overlap.

                      Example:
                      - Wrapper shrinks to 180px
                      - Button stays at 220px
                      - Button overflows by 40px
                      - Next wrapper is 8px away (margin-right)
                      - Net overlap: ~32px with next tab
                  */}
                  <button
                    onClick={() => setActiveTab(proc.id)}
                    className={`
                      /* FIXED DIMENSIONS - NEVER SHRINKS! */
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

            {/* ================================================================
                2. THE SUPER SPACER - Absorbs extra space FIRST
                ================================================================

                Properties:
                - flex-grow: 1 (takes all available space)
                - flex-shrink: 10000 (VERY HIGH - shrinks before tabs)
                - min-width: 0 (can shrink completely)

                Purpose:
                This spacer absorbs extra space and pushes the ALL tab to
                the right. When container shrinks, this spacer shrinks FIRST
                (because of very high shrink value). Only when this spacer
                is exhausted do the tab wrappers start shrinking.

                This creates two-phase behavior:
                1. Wide container: Spacer takes space, tabs stay full width
                2. Narrow container: Spacer gone, tabs start overlapping
            */}
            <li className="flex-grow shrink-[10000] min-w-0"></li>

            {/* ================================================================
                3. THE 'ALL' TAB - Never shrinks
                ================================================================

                Properties:
                - flex-shrink: 0 (NEVER shrinks)
                - Fixed width: 80px
                - z-index: 50 (always visible, below active tabs)

                Purpose:
                This tab always stays at full 80px width, even when other
                tabs are overlapping. It's pinned to the right side.
            */}
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