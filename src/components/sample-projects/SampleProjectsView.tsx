import React, { useState } from 'react';
import { SAMPLE_PROJECTS, SampleProjectCard } from '../../data/sampleData';

interface SampleProjectsViewProps {
  onLoadSample: (sample: SampleProjectCard) => void;
}

export const SampleProjectsView: React.FC<SampleProjectsViewProps> = ({
  onLoadSample,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Web app', 'Mobile app', 'Checkout', 'SaaS'];

  const filteredSamples = SAMPLE_PROJECTS.filter(
    (s) => selectedCategory === 'All' || s.category === selectedCategory
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header matching Figma */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-[#78716C] uppercase mb-1">
          LIBRARY
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">
          Sample projects
        </h1>
        <p className="text-sm text-[#78716C] mt-1">
          Use realistic examples to understand the review flow before auditing your own product.
        </p>
      </div>

      {/* Filter Buttons matching Figma */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'bg-white border border-[#D6D0C7] text-[#2D2A26] hover:bg-[#F9F8F6]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 6 Sample Cards Grid matching Figma */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE6DF] shadow-xs flex flex-col justify-between space-y-5 hover:border-[#D6D0C7] transition-all"
          >
            <div className="space-y-3">
              <span className="w-8 h-8 rounded-lg bg-[#FDF4EE] text-[#B45309] text-xs font-bold flex items-center justify-center">
                {sample.number}
              </span>

              <div>
                <h2 className="text-base font-bold text-[#1C1917]">
                  {sample.title}
                </h2>
                <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="text-xs text-[#A8A29E] font-medium pt-1">
                {sample.checks_count} checks · {sample.screens_count} screens
              </div>
            </div>

            <button
              type="button"
              onClick={() => onLoadSample(sample)}
              className="w-full py-2.5 px-4 border border-[#D6D0C7] hover:border-[#B45309] hover:bg-[#FDF4EE] text-[#1C1917] hover:text-[#B45309] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 group"
            >
              <span>Open sample</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
