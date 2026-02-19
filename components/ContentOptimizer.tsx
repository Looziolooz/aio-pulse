
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Loader2, CheckCircle2, AlertCircle, Wand2, Link as LinkIcon, 
  FileText, Trash2, Share2, 
  Copy, Twitter, Linkedin, Check, Mail, Globe, BarChart3, Sparkles,
  MousePointer2, Info, Lightbulb, Target,
  Zap, Trophy, ChevronDown, Layers,
  Gauge, HelpCircle, MapPin, ShoppingCart,
  FileStack, Layout, Bot, Cpu, Fingerprint, Download, Mountain, BookOpen, UserCircle, 
  Music, AlertTriangle, ShieldAlert, Hash, PieChart as PieChartIcon,
  Languages, MessageSquareQuote, Volume2, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { analyzeContentForAIO } from '../services/geminiService';
import { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShareStats {
  copies: number;
  shares: number;
}

const engines = [
  { id: 'all', label: 'All Engines', color: 'bg-indigo-500', text: 'text-indigo-400', desc: 'Universal AIO strategy.' },
  { id: 'chatgpt', label: 'ChatGPT', color: 'bg-emerald-500', text: 'text-emerald-400', desc: 'SearchGPT citations.' },
  { id: 'gemini', label: 'Gemini', color: 'bg-blue-500', text: 'text-blue-400', desc: 'SGE & Knowledge Graph.' },
  { id: 'perplexity', label: 'Perplexity', color: 'bg-purple-500', text: 'text-purple-400', desc: 'Fact-first answer engine.' },
  { id: 'claude', label: 'Claude', color: 'bg-orange-500', text: 'text-orange-400', desc: 'Nuanced logical depth.' },
];

const analysisModels = [
  { id: 'default', label: 'AIO Pulse Standard', icon: Sparkles },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)', icon: Bot },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Google)', icon: Cpu },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)', icon: Bot },
  { id: 'perplexity-sonar', label: 'Sonar Large (Perplexity)', icon: Globe },
];

const ContentOptimizer: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [input, setInput] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('all');
  const [selectedModel, setSelectedModel] = useState('default');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [stats, setStats] = useState<ShareStats>(() => {
    const saved = localStorage.getItem('aio_pulse_stats');
    return saved ? JSON.parse(saved) : { copies: 0, shares: 0 };
  });

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aio_pulse_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
  }, [input, mode]);

  const isValidUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(trimmed)) return false;
    try {
      const testUrl = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(testUrl);
      return parsed.hostname.length > 3 && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  };

  const isUrlInvalid = mode === 'url' && input.trim().length > 0 && !isValidUrl(input);
  const isInputValid = mode === 'text' ? input.trim().length > 0 : isValidUrl(input);

  const handleAnalyze = async () => {
    if (!input.trim() || !isInputValid) return;
    setErrorMessage('');
    setIsAnalyzing(true);
    setResult(null);
    try {
      let finalInput = input.trim();
      if (mode === 'url' && !finalInput.match(/^https?:\/\//i)) {
        finalInput = `https://${finalInput}`;
      }
      const data = await analyzeContentForAIO(finalInput, mode, selectedEngine, selectedModel);
      setResult(data as AnalysisResult);
    } catch (error: any) {
      setErrorMessage(error.message || "Analysis failed. Please check the URL and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !result) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#030712',
        scale: 2,
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`AIO-Pulse-Audit-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      setErrorMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setStats(prev => ({ ...prev, copies: prev.copies + 1 }));
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const handleEmailShare = () => {
    if (!result) return;
    const subject = encodeURIComponent(`AIO Visibility Report: ${result.visibilityScore}% Health`);
    const body = encodeURIComponent(
      `Hi,\n\nI just completed an AI Optimization (AIO) audit for: ${result.source}\n\n` +
      `Summary of results:\n` +
      `- Visibility Score: ${result.visibilityScore}%\n` +
      `- Search Intent: ${result.intent} (${result.intentConfidence}% confidence)\n` +
      `- Content Type: ${result.contentType}\n` +
      `- Reading Level: ${result.readingLevel}\n` +
      `- Tone: ${result.tone}\n\n` +
      `View the full report on AIO Pulse.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
    setShowShareMenu(false);
  };

  const handleSocialShare = (platform: string) => {
    setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
    const text = `Check out my AIO Visibility Report on AIO Pulse! Current SEO Health: ${seoScoreDetails.total}%`;
    const url = encodeURIComponent(window.location.href);
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
    if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (shareUrl) window.open(shareUrl, '_blank');
    setShowShareMenu(false);
  };

  const keywordDensity = useMemo(() => {
    if (!result || !result.analyzedText) return [];
    const text = result.analyzedText.toLowerCase();
    const words = text.match(/\b[\w'-]+\b/g) || [];
    const totalWords = words.length;
    if (totalWords === 0) return [];
    return result.keywords.map(kw => {
      const regex = new RegExp(`\\b${kw.word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      const density = (count / totalWords) * 100;
      return { ...kw, count, density };
    }).sort((a, b) => b.density - a.density);
  }, [result]);

  const seoScoreDetails = useMemo(() => {
    if (!result || keywordDensity.length === 0) return { total: 0, density: 0, strategy: 0, difficulty: 0, visibility: 0 };
    const densityScores = keywordDensity.map(kw => {
      const diff = Math.abs(kw.density - 2.5);
      return Math.max(0, 100 - (diff * diff * 15));
    });
    const avgDensity = densityScores.reduce((a, b) => a + b, 0) / keywordDensity.length;
    const avgImpact = keywordDensity.reduce((a, b) => a + b.impact, 0) / keywordDensity.length;
    const difficultyHealth = keywordDensity.reduce((a, b) => a + (100 - b.difficulty), 0) / keywordDensity.length;
    const visibility = result.visibilityScore;
    const total = Math.round((avgDensity * 0.3) + (avgImpact * 0.35) + (difficultyHealth * 0.2) + (visibility * 0.15));
    return { total, density: Math.round(avgDensity), strategy: Math.round(avgImpact), difficulty: Math.round(difficultyHealth), visibility: Math.round(visibility) };
  }, [result, keywordDensity]);

  const radarData = useMemo(() => {
    if (!seoScoreDetails) return [];
    return [
      { subject: 'Density', A: seoScoreDetails.density, fullMark: 100 },
      { subject: 'Impact', A: seoScoreDetails.strategy, fullMark: 100 },
      { subject: 'Market Ease', A: seoScoreDetails.difficulty, fullMark: 100 },
      { subject: 'Visibility', A: seoScoreDetails.visibility, fullMark: 100 },
      { subject: 'Semantic Fit', A: 85, fullMark: 100 },
    ];
  }, [seoScoreDetails]);

  const avgDifficulty = useMemo(() => {
    if (!result || result.keywords.length === 0) return 0;
    const sum = result.keywords.reduce((acc, kw) => acc + kw.difficulty, 0);
    return Math.round(sum / result.keywords.length);
  }, [result]);

  const getIntentUI = (intent: string) => {
    switch (intent.toLowerCase()) {
      case 'informational': return { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Targeting users seeking knowledge or answers.' };
      case 'navigational': return { icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', desc: 'Targeting users looking for a specific brand or site.' };
      case 'transactional': return { icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Targeting users ready to complete a purchase.' };
      case 'commercial': return { icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Targeting users researching products before buying.' };
      default: return { icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', desc: 'Mixed or ambiguous search intent pattern.' };
    }
  };

  const getDifficultyCategory = (score: number) => {
    if (score >= 70) return { label: 'Authority Required', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', advice: 'Focus on high-quality external citations and E-E-A-T markers.' };
    if (score >= 35) return { label: 'Strategic Positioning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', advice: 'Optimize for long-tail variations and entity-based relevance.' };
    return { label: 'Aggressive Expansion', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', advice: 'Low barrier entry. Prioritize factual density to claim the #1 spot.' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Content Optimizer</h1>
          <p className="text-gray-400">Audit your web pages or text for maximum Generative Engine visibility.</p>
          <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-1.5"><Share2 className="w-3 h-3" /> {stats.shares} Shared</span>
            <span className="flex items-center gap-1.5"><Copy className="w-3 h-3" /> {stats.copies} Copied</span>
          </div>
        </div>
        {result && (
          <div className="flex items-center gap-2 relative">
            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all rounded-xl shadow-lg disabled:opacity-50">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <div className="relative" ref={shareMenuRef}>
              <button onClick={() => setShowShareMenu(!showShareMenu)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-xl shadow-lg border ${showShareMenu ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-800 border-gray-800 text-gray-200 hover:text-white hover:bg-gray-700'}`}>
                <Share2 className="w-4 h-4" /> Share Report
              </button>
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleCopyLink} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                    <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Link'}</span>
                    {copied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button onClick={handleEmailShare} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                    <Mail className="w-3.5 h-3.5" /> Email Report
                  </button>
                  <div className="h-px bg-gray-800 my-1 mx-2" />
                  <button onClick={() => handleSocialShare('twitter')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                    <Twitter className="w-3.5 h-3.5" /> Twitter / X
                  </button>
                  <button onClick={() => handleSocialShare('linkedin')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => {setResult(null); setInput('');}} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all rounded-xl">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="space-y-8" onKeyDown={(e) => e.key === 'Enter' && isInputValid && !isAnalyzing && handleAnalyze()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    <Layers className="w-3 h-3 text-indigo-400" /> Target AI Profile
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
                    {engines.map((engine) => (
                      <button 
                        key={engine.id} 
                        onClick={() => setSelectedEngine(engine.id)} 
                        role="radio"
                        aria-checked={selectedEngine === engine.id}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all relative overflow-hidden group ${selectedEngine === engine.id ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-black border-gray-800 hover:border-gray-700'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mb-1 ${engine.color} ${selectedEngine === engine.id ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-bold ${selectedEngine === engine.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{engine.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Analysis Model
                  </label>
                  <div className="relative">
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl py-3 px-4 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all hover:border-gray-700">
                      {analysisModels.map((model) => (<option key={model.id} value={model.id}>{model.label}</option>))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 p-1 bg-black rounded-xl border border-gray-800 w-fit">
                <button onClick={() => setMode('text')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'text' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><FileText className="w-4 h-4" /> Text Mode</button>
                <button onClick={() => setMode('url')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'url' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><LinkIcon className="w-4 h-4" /> URL Mode</button>
              </div>
              {mode === 'text' ? (
                <textarea className="w-full h-80 bg-black border border-gray-800 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm transition-all" placeholder="Paste your content here..." value={input} onChange={(e) => setInput(e.target.value)} />
              ) : (
                <div className="relative">
                  <input type="url" className={`w-full bg-black border ${isUrlInvalid ? 'border-red-500/50' : 'border-gray-800'} rounded-xl py-4 pl-12 pr-4 text-gray-200 focus:ring-2 ${isUrlInvalid ? 'focus:ring-red-500' : 'focus:ring-indigo-500'} outline-none font-mono text-sm transition-all`} placeholder="example.com or https://example.com" value={input} onChange={(e) => setInput(e.target.value)} />
                  <LinkIcon className={`absolute left-4 top-4.5 w-5 h-5 ${isUrlInvalid ? 'text-red-400' : 'text-gray-600'}`} />
                  {isUrlInvalid && <p className="text-[10px] text-red-400 mt-2 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-left-2"><AlertTriangle className="w-3 h-3" /> Please enter a valid website URL.</p>}
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-between items-center">
              <span className="text-xs text-gray-500">{input.length} characters</span>
              <button onClick={handleAnalyze} disabled={isAnalyzing || !isInputValid} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">
                {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Wand2 className="w-5 h-5" /> Audit Content</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6" ref={reportRef}>
          {result ? (
            <div className="space-y-6">
              {/* SEO SCORE & RADAR */}
              <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="72" stroke="#1f2937" strokeWidth="12" fill="transparent" />
                        <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452.4} strokeDashoffset={452.4 - (452.4 * seoScoreDetails.total) / 100} strokeLinecap="round" className={`${seoScoreDetails.total > 80 ? 'text-emerald-500' : seoScoreDetails.total > 50 ? 'text-indigo-500' : 'text-rose-500'} transition-all duration-1000`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white">{seoScoreDetails.total}</span>
                        <span className="text-[10px] font-black text-gray-500 uppercase mt-1">SEO Health</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Gauge className="w-6 h-6 text-indigo-400" /> SEO Score</h3>
                    <div className="h-48 w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#374151" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Health" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEARCH INTENT */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2"><MousePointer2 className="w-5 h-5 text-indigo-400" /> Search Intent</h3>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Confidence</span>
                    <span className="text-lg font-black text-white">{result.intentConfidence}%</span>
                  </div>
                </div>
                <div className="flex gap-4 items-center mb-6">
                  <div className="shrink-0">
                    {(() => {
                      const ui = getIntentUI(result.intent);
                      const Icon = ui.icon;
                      return (
                        <div className={`w-16 h-16 rounded-2xl ${ui.bg} border ${ui.border} flex items-center justify-center shadow-lg`}>
                          <Icon className={`w-8 h-8 ${ui.color}`} />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getIntentUI(result.intent).bg} ${getIntentUI(result.intent).color} border ${getIntentUI(result.intent).border}`}>
                      {result.intent}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{getIntentUI(result.intent).desc}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Semantic Signals</p>
                  <div className="flex flex-wrap gap-2">
                    {result.intentSignals?.map((signal, idx) => (
                      <span key={idx} className="px-2 py-1 bg-black/40 border border-gray-800 rounded text-[10px] text-gray-300 italic">"{signal}"</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* COMPREHENSIVE CONTENT DNA SECTION */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -z-10 group-hover:bg-rose-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><FileStack className="w-5 h-5 text-rose-400" /> Content DNA Analysis</h3>
                    <p className="text-xs text-gray-500 mt-1">Classification and stylistic profiling for GenAI ingestion.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-black block uppercase tracking-tighter">Classification Accuracy</span>
                    <span className="text-2xl font-black text-white">{result.contentTypeConfidence}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-gray-800 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <Layout className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Type</span>
                      <p className="text-sm font-bold text-white">{result.contentType}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-gray-800 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Complexity</span>
                      <p className="text-sm font-bold text-white">{result.readingLevel}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-gray-800 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Target Audience</span>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]" title={result.audience}>{result.audience}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-gray-800 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">AIO Context</span>
                      <p className="text-sm font-bold text-white">Semantic-Ready</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LINGUISTIC TONE PROFILE SECTION */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/5 blur-3xl -z-10 group-hover:bg-amber-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><Volume2 className="w-5 h-5 text-amber-400" /> Linguistic Tone Profile</h3>
                    <p className="text-xs text-gray-500 mt-1">Sentiment and stylistic analysis of content voice.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-black block uppercase tracking-tighter">Tone Accuracy</span>
                    <span className="text-2xl font-black text-white">{result.toneConfidence}%</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="#1f2937" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="58" 
                        stroke="#f59e0b" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={364.4} 
                        strokeDashoffset={364.4 - (364.4 * result.toneConfidence) / 100} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                        <MessageSquareQuote className="w-8 h-8 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-gray-800 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Primary Voice</span>
                        <p className="text-lg font-black text-white">{result.tone}</p>
                      </div>
                      <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase">
                        {result.toneConfidence > 80 ? 'Authoritative' : result.toneConfidence > 50 ? 'Defined' : 'Mixed'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 border border-gray-800 rounded-xl">
                      <p className="text-[11px] text-gray-400 leading-relaxed italic">
                        The content exhibits a <strong>{result.tone.toLowerCase()}</strong> tone which directly influences its retrieval by LLMs for users seeking 
                        {result.tone.toLowerCase().includes('formal') || result.tone.toLowerCase().includes('serious') 
                          ? ' professional and structured expertise' 
                          : ' an engaging and relatable perspective'}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE INSIGHTS */}
              <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl shadow-indigo-600/20 border border-white/10 relative overflow-hidden">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> AIO Improvements</h3>
                <div className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-white/10 backdrop-blur-md rounded-xl text-sm text-white font-medium border border-white/5">
                      <span className="shrink-0 w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                      <p className="leading-snug">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* KEYWORD INTELLIGENCE */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-400" /> Keyword Intelligence</h3>
                <div className="space-y-4">
                  {keywordDensity.map((kw, i) => {
                    const diffStatus = (difficulty: number) => {
                      if (difficulty >= 71) return { label: 'High Competition', color: 'text-rose-400', icon: ShieldAlert };
                      if (difficulty >= 31) return { label: 'Moderate Effort', color: 'text-amber-400', icon: Zap };
                      return { label: 'Low Barrier', color: 'text-emerald-400', icon: CheckCircle2 };
                    };
                    const diff = diffStatus(kw.difficulty);
                    const DiffIcon = diff.icon;
                    return (
                      <div key={i} className="p-4 bg-black/40 border border-gray-800 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-bold text-white">{kw.word}</span>
                          <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${diff.color}`}><DiffIcon className="w-3 h-3" /> {diff.label}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="relative group/impact">
                            <span className="text-[9px] text-gray-600 font-black uppercase flex items-center gap-1">Impact <Info className="w-2.5 h-2.5" /></span>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1"><div className="h-full bg-indigo-500" style={{ width: `${kw.impact}%` }} /></div>
                          </div>
                          <div className="relative group/difficulty">
                            <span className="text-[9px] text-gray-600 font-black uppercase flex items-center gap-1">Difficulty <Info className="w-2.5 h-2.5" /></span>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1"><div className="h-full bg-rose-500" style={{ width: `${kw.difficulty}%` }} /></div>
                          </div>
                          <div className="relative group/density">
                            <span className="text-[9px] text-gray-600 font-black uppercase flex items-center gap-1">Density <Info className="w-2.5 h-2.5" /></span>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1"><div className="h-full bg-emerald-500" style={{ width: `${kw.density * 10}%` }} /></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KEYWORD DENSITY ANALYSIS SECTION */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-400" /> Keyword Density Analysis</h3>
                    <p className="text-xs text-gray-500 mt-1">Precise frequency mapping for semantic optimization.</p>
                  </div>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AIO Target: 2.5%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {keywordDensity.map((kw, i) => {
                    const status = kw.density > 4.5 ? 'over' : kw.density < 0.5 ? 'under' : 'optimal';
                    return (
                      <div key={i} className="p-4 bg-black/40 border border-gray-800/50 rounded-xl hover:border-gray-700 transition-all group/card">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-bold text-white group-hover/card:text-indigo-400 transition-colors">{kw.word}</span>
                          <span className="text-[10px] font-black text-gray-500 bg-gray-800 px-2 py-0.5 rounded uppercase">{kw.count} Occurrences</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-600 mb-1">
                              <span>Density</span>
                              <span className={status === 'over' ? 'text-rose-400' : status === 'under' ? 'text-amber-400' : 'text-emerald-400'}>
                                {kw.density.toFixed(2)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${status === 'over' ? 'bg-rose-500' : status === 'under' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(100, kw.density * 15)}%` }} 
                              />
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-lg border flex items-center justify-center ${status === 'over' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : status === 'under' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            {status === 'over' ? <AlertCircle className="w-3.5 h-3.5" /> : status === 'under' ? <Info className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COMPETITIVE BARRIER ANALYSIS */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -z-10 group-hover:bg-rose-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><Mountain className="w-5 h-5 text-rose-400" /> Competitive Barrier Analysis</h3>
                    <p className="text-xs text-gray-500 mt-1">A comparative look at keyword difficulty and strategic feasibility.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-black block uppercase tracking-tighter">Avg. Market Entry</span>
                    <span className="text-2xl font-black text-white">{avgDifficulty}<span className="text-xs text-gray-600">/100</span></span>
                  </div>
                </div>
                <div className="space-y-4">
                  {result.keywords.map((kw, i) => {
                    const cat = getDifficultyCategory(kw.difficulty);
                    return (
                      <div key={i} className="p-4 bg-black/40 border border-gray-800/50 rounded-2xl flex flex-col md:flex-row md:items-center gap-6 group/item hover:border-gray-700 transition-all">
                        <div className="w-full md:w-32">
                          <p className="text-sm font-bold text-white truncate" title={kw.word}>{kw.word}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${cat.color} mt-1 block`}>{cat.label}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-600 mb-1">
                            <span>Difficulty Score</span>
                            <span className={cat.color}>{kw.difficulty}/100</span>
                          </div>
                          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${cat.color.replace('text', 'bg')} transition-all duration-1000 ease-out`} style={{ width: `${kw.difficulty}%` }} />
                          </div>
                        </div>
                        <div className={`md:w-56 p-2 rounded-xl ${cat.bg} border ${cat.border} flex items-start gap-2`}>
                          <Lightbulb className={`w-4 h-4 shrink-0 ${cat.color} mt-0.5`} />
                          <p className={`text-[10px] leading-tight font-medium ${cat.color}`}>{cat.advice}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REPORT ENGAGEMENT SECTION */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400" /> Report Engagement</h3>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Outreach</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-black/40 border border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center group/engagement hover:border-indigo-500/30 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover/engagement:scale-110 transition-transform">
                      <Share2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Times Shared</span>
                    <span className="text-3xl font-black text-white">{stats.shares}</span>
                  </div>
                  
                  <div className="p-6 bg-black/40 border border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center group/engagement hover:border-emerald-500/30 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover/engagement:scale-110 transition-transform">
                      <Copy className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Links Copied</span>
                    <span className="text-3xl font-black text-white">{stats.copies}</span>
                  </div>
                </div>
                
                <p className="text-[11px] text-gray-500 mt-6 text-center italic">
                  Engagement metrics are persisted locally to help you track your optimization workflow efficiency across sessions.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Search className="w-10 h-10 text-gray-600 mb-6" />
              <p className="text-xl font-bold text-gray-300">Awaiting Input</p>
              <p className="text-sm mt-3 leading-relaxed">Submit content to begin the AIO audit and intent mapping.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentOptimizer;
