import React, { useState, useRef, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CompareSlider } from './components/CompareSlider';
import { enhanceImage } from './services/gemini';
import { ProcessState } from './types';
import { Wand2, Download, RefreshCcw, AlertCircle, Info, Sofa, Palette, Layers, Sparkles } from 'lucide-react';

// 内部プロンプト定義（ユーザーには見せない）
const PROMPTS = {
  // 厳密なリアル化（小物なし）
  strict: `
Transform this architectural rendering into a photorealistic photograph.
GOAL: Remove "CG look", enhance material fidelity, strictly preserve geometry.

INSTRUCTIONS:
- Remove synthetic smoothness. Add microscopic surface imperfections to wood, concrete, glass.
- Keep lighting EXACTLY as is.
- DO NOT add any new objects.
- DO NOT change furniture or layout.
  `.trim(),

  // 小物追加モード
  props: `
Transform this architectural rendering into a photorealistic photograph with "lived-in" atmosphere.
GOAL: Remove "CG look", enhance materials, and tastefully add small props.

INSTRUCTIONS:
- Remove synthetic smoothness.
- ADD SMALL PROPS: Place coffee cups, open books, magazines, or small plants on tables/shelves.
- PLACEMENT: Must be natural and follow the lighting.
- DO NOT change main furniture shapes or room layout.
  `.trim()
};

// フィルター定義
type FilterType = 'none' | 'cinematic' | 'vivid' | 'warm' | 'cool' | 'bw';

const FILTERS: Record<FilterType, { name: string; filter: string }> = {
  none: { name: '標準', filter: 'none' },
  cinematic: { name: 'シネマティック', filter: 'contrast(1.1) brightness(0.9) saturate(0.9) sepia(0.2)' },
  vivid: { name: 'ビビッド (スマホ向)', filter: 'saturate(1.3) contrast(1.1)' },
  warm: { name: 'ウォーム', filter: 'sepia(0.3) saturate(1.1)' },
  cool: { name: 'クール', filter: 'hue-rotate(180deg) sepia(0.1) saturate(0.8) hue-rotate(-180deg)' }, // 簡易的な青み
  bw: { name: 'モノクロ', filter: 'grayscale(1)' },
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processState, setProcessState] = useState<ProcessState>({ status: 'idle' });
  
  // モード管理: 'strict' = 初回/通常, 'props' = 小物追加後
  const [currentMode, setCurrentMode] = useState<'strict' | 'props'>('strict');
  
  // フィルター管理
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');

  const handleImageSelected = (base64: string) => {
    setOriginalImage(base64);
    setProcessedImage(null);
    setProcessState({ status: 'idle' });
    setCurrentMode('strict');
    setActiveFilter('none');
  };

  const executeEnhancement = async (mode: 'strict' | 'props') => {
    if (!originalImage) return;

    const message = mode === 'props' 
      ? '小物を配置して生活感を出しています...' 
      : 'テクスチャと光を計算し、リアル化しています...';

    setProcessState({ status: 'processing', message });

    try {
      // UI更新のための待機
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 常にオリジナル画像をソースとして使用し、劣化を防ぐ
      const prompt = PROMPTS[mode];
      const result = await enhanceImage(originalImage, prompt);
      
      setProcessedImage(result);
      setCurrentMode(mode);
      setProcessState({ status: 'success' });
    } catch (error: any) {
      setProcessState({ 
        status: 'error', 
        message: error.message || '処理に失敗しました。もう一度お試しください。' 
      });
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setProcessState({ status: 'idle' });
    setActiveFilter('none');
    setCurrentMode('strict');
  };

  // フィルターを適用してダウンロードする機能
  const handleDownload = async () => {
    if (!processedImage) return;

    // キャンバスを作成してフィルタを焼き付ける
    const img = new Image();
    img.src = processedImage;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // フィルター適用
      const filterStr = FILTERS[activeFilter].filter;
      ctx.filter = filterStr === 'none' ? 'none' : filterStr;

      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `lumion-enhanced-${currentMode}-${activeFilter}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-200 selection:text-black pb-20 font-sans">
      
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Lumion <span className="text-gray-500">Realism Enhancer</span>
            </h1>
          </div>
          <div className="text-xs font-mono text-gray-400">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Empty State */}
        {!originalImage && (
          <div className="text-center py-20 animate-fade-in">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-6">
              CGパースを<span className="text-gray-500">写真品質</span>へ
            </h2>
            <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto mb-10">
              Lumionでレンダリングした画像をアップロードしてください。<br/>
              形状や照明はそのままに、質感を高め、CG特有の違和感をAIが除去します。
            </p>
            <ImageUploader onImageSelected={handleImageSelected} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left max-w-4xl mx-auto">
              {[
                { title: 'CGっぽさを除去', desc: '表面の不自然な滑らかさを消し、微細な傷や質感を加えます。' },
                { title: '形状・照明を維持', desc: '間取りや家具の形、光の当たり方は厳密にキープします。' },
                { title: '選べる仕上げ', desc: 'シンプルな高画質化の後、小物追加やフィルター加工が可能です。' }
              ].map((feature, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                  <div className="w-2 h-2 bg-black rounded-full mb-4"></div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspace */}
        {originalImage && (
          <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
            
            {/* Left Column: Image Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-2xl p-2 shadow-sm border border-gray-200 overflow-hidden">
                {processedImage ? (
                  // 処理完了後は、フィルター適用結果を表示
                  // 比較スライダーはフィルター適用前を見るために使用できるが、
                  // フィルター適用のプレビューのためにシンプルな画像表示 + CSSフィルタに切り替える手もある。
                  // ここでは「比較スライダー」自体にCSSフィルタをかけることで、Before/Afterも見れるようにする。
                  <div style={{ filter: FILTERS[activeFilter].filter }} className="transition-all duration-300">
                    <CompareSlider beforeImage={originalImage} afterImage={processedImage} />
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-full object-contain opacity-90 transition-opacity" 
                    />
                    {processState.status === 'processing' && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-medium animate-pulse">{processState.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-2"
                  disabled={processState.status === 'processing'}
                >
                  <RefreshCcw className="w-4 h-4" />
                  別の画像にする
                </button>

                {processedImage ? (
                   <button
                   onClick={handleDownload}
                   className="px-8 py-3 rounded-lg font-bold bg-black hover:bg-gray-800 text-white shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
                 >
                   <Download className="w-5 h-5" />
                   エクスポート
                 </button>
                ) : (
                  <button
                    onClick={() => executeEnhancement('strict')}
                    disabled={processState.status === 'processing'}
                    className={`
                      px-8 py-3 rounded-lg font-bold text-white shadow-lg shadow-gray-200 transition-all flex items-center gap-2
                      ${processState.status === 'processing' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-black hover:bg-gray-800 hover:scale-105 active:scale-95'}
                    `}
                  >
                    <Wand2 className="w-5 h-5" />
                    リアル化を実行
                  </button>
                )}
              </div>

              {processState.status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">エラーが発生しました</h4>
                    <p className="text-sm opacity-90">{processState.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Controls */}
            {processedImage && (
              <div className="w-full lg:w-80 shrink-0 animate-fade-in-up">
                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24 space-y-8 shadow-sm">
                  
                  {/* Step 1: Add Props */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sofa className="w-4 h-4" />
                      オプション: 小物追加
                    </h3>
                    
                    {currentMode === 'strict' ? (
                       <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                         <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                           テーブルや棚に本やカップなどの小物を追加し、生活感を出しますか？
                           <br />
                           <span className="text-xs text-gray-400">※画像が再生成されます</span>
                         </p>
                         <button
                           onClick={() => executeEnhancement('props')}
                           disabled={processState.status === 'processing'}
                           className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 shadow-sm"
                         >
                           <Sparkles className="w-4 h-4 text-gray-400" />
                           小物を追加して再生成
                         </button>
                       </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                        <div className="bg-white border border-gray-200 p-2 rounded-full">
                          <Sparkles className="w-4 h-4 text-gray-900" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">小物追加済み</p>
                          <button 
                            onClick={() => executeEnhancement('strict')}
                            className="text-xs text-gray-500 hover:underline mt-1"
                          >
                            元に戻す（再生成）
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Filters */}
                  <div>
                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      カラーフィルター
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(FILTERS) as [FilterType, typeof FILTERS[FilterType]][]).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setActiveFilter(key)}
                          className={`
                            relative h-20 rounded-lg overflow-hidden border-2 transition-all
                            ${activeFilter === key ? 'border-black ring-2 ring-black/10' : 'border-transparent hover:border-gray-300'}
                          `}
                        >
                          {/* フィルタープレビュー用の背景画像 */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ 
                              backgroundImage: `url(${processedImage})`, 
                              filter: config.filter 
                            }} 
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[0px]">
                            <span className="text-xs font-bold text-white drop-shadow-md">{config.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 flex gap-2 border border-gray-100">
                    <Info className="w-4 h-4 shrink-0" />
                    <p>エクスポートボタンを押すと、現在のフィルターが適用された状態で保存されます。</p>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
