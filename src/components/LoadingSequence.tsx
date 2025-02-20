'use client';

import React from 'react';

export type LoadingStage = 'idle' | 'analyzing' | 'researching' | 'synthesizing';

interface LoadingSequenceProps {
  stage: LoadingStage;
}

const getPreviousStage = (currentStage: LoadingStage): LoadingStage => {
  switch (currentStage) {
    case 'analyzing':
      return 'idle';
    case 'researching':
      return 'analyzing';
    case 'synthesizing':
      return 'researching';
    default:
      return 'idle';
  }
};

export function LoadingSequence({ stage }: LoadingSequenceProps) {
  const stages = {
    analyzing: {
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      text: "Analyzing query",
    },
    researching: {
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
        </svg>
      ),
      text: "Gathering sources",
    },
    synthesizing: {
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      text: "Synthesizing report",
    }
  };

  const currentStage = stages[stage as Exclude<LoadingStage, 'idle'>];
  if (!currentStage || stage === 'idle') return null;

  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <div className="relative">
        {/* Outer ring with continuous rotation */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50 rounded-full animate-spin-slow opacity-20"></div>
        
        {/* Icon container with fade transition */}
        <div className="relative bg-card backdrop-blur-sm rounded-full p-3 shadow-lg shadow-primary/10 transition-all duration-500 ease-in-out transform border border-border/40">
          <div className="relative w-5 h-5">
            {/* Previous icon with fade out */}
            <div className="absolute inset-0 transition-opacity duration-500 ease-in-out opacity-0">
              {stage !== 'analyzing' && stages[getPreviousStage(stage) as Exclude<LoadingStage, 'idle'>]?.icon}
            </div>
            {/* Current icon with fade in */}
            <div className="absolute inset-0 transition-opacity duration-500 ease-in-out opacity-100">
              {currentStage.icon}
            </div>
          </div>
        </div>
      </div>

      {/* Text with slide transition */}
      <div className="flex items-center space-x-2 h-6 overflow-hidden">
        <div className="transition-transform duration-500 ease-in-out transform">
          <span className="text-foreground font-medium inline-block">{currentStage.text}</span>
        </div>
        <span className="flex space-x-1">
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
      </div>

      {/* Progress bar with continuous animation */}
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary/50 to-primary animate-progress-indeterminate"
          style={{ backgroundSize: '200% 100%' }}
        ></div>
      </div>
    </div>
  );
}
