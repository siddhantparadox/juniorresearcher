import React from 'react';

async function getCrawlData() {
  const res = await fetch('/api/crawl');

  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function CrawlResultsPage() {
  const crawlData = await getCrawlData();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Crawl Results</h1>

      {crawlData.success ? (
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 rounded-md p-4">
            <code className="text-sm">
              {JSON.stringify(crawlData.data, null, 2)}
            </code>
          </pre>
        </div>
      ) : (
        <div className="text-red-500">
          Error: {crawlData.error}
        </div>
      )}
    </div>
  );
}
