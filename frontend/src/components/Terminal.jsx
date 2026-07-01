import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TermIcon, Copy, Check, Search, ArrowDown } from 'lucide-react';

const Terminal = ({ logs = [], isRunning = false }) => {
  const terminalEndRef = useRef(null);
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Parse ANSI escape codes into colored HTML spans
  const parseAnsi = (text) => {
    if (!text) return [{ text: '', className: '' }];
    
    const regex = /\u001B\[([0-9;]+)m/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let currentClass = 'text-gray-300';

    while ((match = regex.exec(text)) !== null) {
      const textSegment = text.substring(lastIndex, match.index);
      if (textSegment) {
        parts.push({ text: textSegment, className: currentClass });
      }

      const code = match[1];
      if (code === '0') {
        currentClass = 'text-gray-300';
      } else if (code.includes('36')) {
        currentClass = 'text-cyan-400 font-medium';
      } else if (code.includes('32')) {
        currentClass = 'text-emerald-400 font-medium';
      } else if (code.includes('31')) {
        currentClass = 'text-rose-400 font-medium';
      } else if (code.includes('33')) {
        currentClass = 'text-amber-400 font-medium';
      } else if (code.includes('30')) {
        currentClass = 'text-slate-500';
      }

      lastIndex = regex.lastIndex;
    }

    const finalSegment = text.substring(lastIndex);
    if (finalSegment) {
      parts.push({ text: finalSegment, className: currentClass });
    }

    return parts;
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll logic
  useEffect(() => {
    if (!showScrollBtn) {
      scrollToBottom();
    }
  }, [logs]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Show scroll button if user scrolls up significantly
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBtn(isUp);
  };

  const copyToClipboard = () => {
    const rawLogs = logs.join('\n').replace(/\u001B\[[0-9;]+m/g, ''); // strip ansi codes
    navigator.clipboard.writeText(rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter logs based on search
  const filteredLogs = logs.filter(line => 
    line.toLowerCase().replace(/\u001B\[[0-9;]+m/g, '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#05070f] rounded-xl border border-dark-border/60 overflow-hidden font-mono text-sm shadow-2xl relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0d16] border-b border-dark-border/40 select-none">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="h-4 w-px bg-dark-border/40 mx-2"></span>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <TermIcon size={14} />
            <span className="text-xs font-semibold tracking-wider">BUILD_CONSOLE</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-dark-bg/60 border border-dark-border/40 rounded-md text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44 transition-all duration-300 focus:w-56"
            />
          </div>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 bg-dark-bg/60 hover:bg-dark-border/40 border border-dark-border/50 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs transition-colors duration-200 focus:outline-none"
            title="Copy Raw Logs"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto terminal-scrollbar leading-relaxed whitespace-pre-wrap select-text h-[400px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-8 italic select-none">
            {searchQuery ? 'No matching logs found.' : 'Terminal ready. Awaiting log stream...'}
          </div>
        ) : (
          filteredLogs.map((line, idx) => (
            <div key={idx} className="hover:bg-slate-900/40 px-1 py-0.5 rounded transition-colors duration-100 flex items-start">
              <span className="text-slate-600 w-8 select-none text-right pr-3 font-light text-[11px] mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">
                {parseAnsi(line).map((part, pIdx) => (
                  <span key={pIdx} className={part.className}>
                    {part.text}
                  </span>
                ))}
              </span>
            </div>
          ))
        )}
        
        {isRunning && (
          <div className="flex items-center space-x-2 text-cyan-400/80 pl-8 py-1 select-none">
            <span className="w-1.5 h-3 bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] animate-pulse">Executing step...</span>
          </div>
        )}
        
        <div ref={terminalEndRef} />
      </div>

      {/* Float Scroll-to-bottom Button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full shadow-glow-cyan animate-bounce transition-colors duration-200 focus:outline-none"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default Terminal;
