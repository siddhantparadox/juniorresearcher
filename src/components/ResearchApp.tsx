'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingSequence, LoadingStage } from './LoadingSequence';
import { MarkdownTable, TableCell, TableRow } from './MarkdownTable';
import { PdfButton } from './PdfButton';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export default function ResearchApp() {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState('');
  interface Citation {
    text: string;
    url: string;
  }
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');

  // Remove sources from report if citations are present
  const processedReport = citations.length > 0 ? report.replace(/Sources:[\s\S]*?(?=(Citations|$))/i, '') : report;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStage('analyzing');
    setReport('');
    setCitations([]);

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/openrouter-dev/openrouter-examples',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Start reading the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      setLoadingStage('researching');
      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.slice(6);
              if (content && content !== '[DONE]') {
                try {
                  const message = JSON.parse(content);
                  if (message.type === 'citations') {
                    // Handle citations
                    // Extract URLs from citations using regex
                    const processedCitations = message.citations.map((citation: string) => {
                      // Try to find a URL in the citation text
                      const urlMatch = citation.match(/https?:\/\/[^\s)]+/);
                      return {
                        text: citation,
                        url: urlMatch ? urlMatch[0] : ''
                      };
                    });
                    setCitations(processedCitations);
                  } else if (message.type === 'content') {
                    // Handle content update
                    setReport(prev => prev + message.content);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              }
            }
          }
        }

        // Handle any remaining data in the buffer
        if (buffer) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.slice(6);
              if (content && content !== '[DONE]') {
                try {
                  const message = JSON.parse(content);
                  if (message.type === 'citations') {
                    const processedCitations = message.citations.map((citation: string) => {
                      const urlMatch = citation.match(/https?:\/\/[^\s)]+/);
                      return {
                        text: citation,
                        url: urlMatch ? urlMatch[0] : ''
                      };
                    });
                    setCitations(processedCitations);
                  } else if (message.type === 'content') {
                    setReport(prev => prev + message.content);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              }
            }
          }
        }
      } finally {
        setLoadingStage('synthesizing');
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      let message;
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      
      // Try to parse the error message if it's from our API
      try {
        const errorData = JSON.parse(message);
        if (errorData.details) {
          setReport(`Error: ${errorData.details}`);
        } else if (errorData.error) {
          setReport(`Error: ${errorData.error}`);
        } else {
          setReport(`Error: ${message}`);
        }
      } catch {
        setReport(`Error: ${message}`);
      }
      setCitations([]);
    } finally {
      setLoadingStage('idle');
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 rounded-2xl p-8 transition-all duration-300 border border-border/40">
          <div className="flex flex-col items-center gap-4 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              Junior Researcher
            </h1>
            <div className="absolute right-8 top-8">
              <ThemeToggle />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <textarea
                  id="query"
                  placeholder=" "
                  autoFocus
                  rows={1}
                  className="block w-full px-4 py-3 text-foreground bg-background/50 backdrop-blur-sm 
                          border border-border/50 rounded-xl transition-all duration-300 
                          focus:ring-2 focus:ring-primary/20 focus:border-primary/50 
                          placeholder-shown:pt-3 pt-6 peer shadow-sm 
                          hover:shadow-md hover:border-primary/30
                          group-hover:border-primary/30
                          resize-none overflow-y-auto
                          min-h-[3.5rem] max-h-32"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    // Auto-adjust height
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                  style={{ height: 'auto' }}
                />
                <label
                  htmlFor="query"
                  className="absolute left-4 top-3 text-muted-foreground text-sm transition-all duration-200
                         peer-placeholder-shown:text-base peer-placeholder-shown:top-3
                         peer-focus:text-sm peer-focus:top-1"
                >
                  Enter your research query
                </label>
              </div>
              <p className="text-sm text-muted-foreground/70 px-1">
                Try asking a specific question (e.g. &ldquo;What are the latest developments in quantum computing?&rdquo;)
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                disabled={loadingStage !== 'idle' || !query.trim()}
                className="relative h-12 px-8 min-w-[180px] rounded-xl bg-gradient-to-br from-primary to-primary/80
                         shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20
                         hover:scale-[1.02] active:scale-[0.98] 
                         transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] 
                              bg-[length:250%_250%] bg-[0%_0%] opacity-0 group-hover:opacity-100 
                              group-hover:bg-[100%_100%] transition-all duration-700"></div>
                {loadingStage !== 'idle' ? (
                  <>
                    <svg
                      className="animate-spin size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="font-medium">Processing...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="group-hover:scale-110 transition-transform duration-300"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.5 12L12 15.5L8.5 12M12 8.5V15.5M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-medium">Generate Report</span>
                  </>
                )}
              </Button>
            </div>
          </form>
          {loadingStage !== 'idle' && <LoadingSequence stage={loadingStage} />}
          {report && (
            <div id="research-report">
              <div className="mt-8 rounded-xl bg-card border border-border/40 overflow-hidden transition-all duration-300 shadow-lg">
                <div className="px-6 py-4 border-b border-border/40 bg-muted/50">
                  <h2 className="text-lg font-medium text-foreground">Research Report</h2>
                </div>
                <div className="p-6 prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (props) => <h1 style={{fontSize: '2em'}} {...props} />,
                      h2: (props) => <h2 style={{fontSize: '1.5em'}} {...props} />,
                      h3: (props) => <h3 style={{fontSize: '1.17em'}} {...props} />,
                      h4: (props) => <h4 style={{fontSize: '1.12em'}} {...props} />,
                      h5: (props) => <h5 style={{fontSize: '.83em'}} {...props} />,
                      h6: (props) => <h6 style={{fontSize: '.75em'}} {...props} />,
                      table: MarkdownTable,
                      tr: TableRow,
                      td: (props) => <TableCell {...props} />,
                      th: (props) => <TableCell isHeader {...props} />
                    }}
                  >
                    {processedReport.replace(/\[(\d+)\]/g, (match, index) => `[${index}]`)}
                  </ReactMarkdown>
                </div>
              </div>
              {citations.length > 0 && (
                <div className="mt-6 rounded-xl bg-card border border-border/40 overflow-hidden transition-all duration-300 shadow-lg">
                  <div className="px-6 py-4 border-b border-border/40 bg-muted/50">
                    <h2 className="text-lg font-medium text-foreground">Citations</h2>
                  </div>
                  <div className="p-6">
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      {citations.map((citation, index) => {
                        const citationRegex = /^(.*?) \((\d{4})\)\. (.*?)\. (.*)$/;
                        const match = citation.text.match(citationRegex);

                        return (
                          <li key={index} className="flex items-start gap-3 group">
                            <div className="flex-grow">
                              {match ? (
                                <>
                                  [{index + 1}] {match[1]}, ({match[2]}). <i>{match[3]}</i>. {match[4]}
                                </>
                              ) : (
                                <>
                                  [{index + 1}] {citation.text}
                                </>
                              )}
                            </div>
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 p-1.5 rounded-md bg-muted/50 hover:bg-accent 
                                         text-muted-foreground hover:text-accent-foreground
                                         transition-all duration-200 inline-flex items-center justify-center 
                                         focus:outline-none focus:ring-2 focus:ring-primary/20
                                         border border-border/40 hover:border-border
                                         hover:shadow-md hover:scale-105"
                                aria-label="View source"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
          {report && (
             <PdfButton targetId="research-report" filename="research-report.pdf" disabled={!report}/>
          )}
        </div>
      </div>
    </div>
  );
}
