'use client';

import { DownloadIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingDots } from './LoadingDots';
import { useState } from 'react';

interface PdfButtonProps {
  targetId: string;
  filename: string;
  className?: string;
  disabled?: boolean;
}

export function PdfButton({ targetId, filename, className, disabled = false }: PdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    const element = document.getElementById(targetId);

    if (!element) {
      console.error('PDF target element not found');
      setIsGenerating(false);
      return;
    }

    const options = {
      margin: [0.5, 0.5],
      filename: `${filename}`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0, logging: true },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
        hotfixes: ['px_scaling'],
      },
    };

    const importHtml2pdf = async () => {
      try {
        const html2pdfModule = await import('html2pdf.js');
        return html2pdfModule.default;
      } catch (error) {
        console.error('Error importing html2pdf:', error);
        return null;
      }
    };

    try {
      const html2pdf = await importHtml2pdf();
      if (!html2pdf) {
        setIsGenerating(false);
        return;
      }
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Handle error appropriately, maybe show an error message to the user
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating || disabled}
      className={cn(
        'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl',
        'bg-muted hover:bg-muted/80',
        'text-muted-foreground font-medium transition-all duration-200',
        'shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10',
        'border border-border/40 hover:border-border/60',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
        'active:scale-[0.98]',
        className
      )}
    >
      {isGenerating ? (
        <LoadingDots className="text-muted-foreground" />
      ) : (
        <DownloadIcon className="w-5 h-5" />
      )}
      Export PDF
    </button>
  );
}
