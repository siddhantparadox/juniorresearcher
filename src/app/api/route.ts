import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  console.log("Streaming started");
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set' }, { status: 500 });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is missing' }, { status: 400 });
    }

    console.log('Sending request with query:', query);
    // Call Perplexity Sonar API
    const perplexityResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/openrouter-dev/openrouter-examples',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        // perplexity/sonar-reasoning can be used as well instead of perplexity/sonar (https://sonar.perplexity.ai/)
        messages: [{ role: 'user', content: query }],
        response_format: { type: "json_object" },
        include_reasoning: true,
        max_tokens: 80000, // Add max_tokens to prevent token limit errors
        top_p: 1,
        temperature: 0.2,
        repetition_penalty: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      let errorDetails;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorJson.error || errorText;
      } catch {
        errorDetails = errorText;
      }
      
      console.error('Perplexity API Error:', {
        status: perplexityResponse.status,
        statusText: perplexityResponse.statusText,
        error: errorDetails,
        headers: Object.fromEntries(perplexityResponse.headers.entries())
      });
      
      return NextResponse.json({ 
        error: 'Failed to call Perplexity API',
        details: errorDetails
      }, { status: perplexityResponse.status });
    }

    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity API Response:', perplexityData);
    
    // Check if perplexityData contains an error or if choices array is missing
    if (perplexityData.error || !perplexityData.choices || !perplexityData.choices.length) {
      const errorMessage = perplexityData.error?.message || 'Unknown error from Perplexity API';
      console.error('Perplexity API Error:', errorMessage);
      return NextResponse.json({ 
        error: 'Failed to call Perplexity API',
        details: errorMessage
      }, { status: 400 });
    }
    
    const message = perplexityData.choices[0].message;
    console.log("Full Perplexity message object:", JSON.stringify(message));
    const searchResults = message?.content || "";
    const reasoning = message?.reasoning || "";
    const fullOutput = reasoning ? (searchResults + "\n\nReasoning:\n" + reasoning) : searchResults;

    // Call Gemini Flash 2.0 API
    // Format search results with explicit citation markers
    let searchResultsWithCitations = "";
    if (Array.isArray(perplexityData.citations)) {
      searchResultsWithCitations = fullOutput + "\n\nSources:\n" + perplexityData.citations.map((citation: string, index: number) => `[${index + 1}] ${citation}`).join("\n");
    } else {
      searchResultsWithCitations = fullOutput + "\n\nSources:\n" + "No citations found.";
    }

    // Modify the prompt to explicitly instruct Gemini to cite all provided sources
    const prompt = `Using the entire context provided below—including all search results, citations, and any supporting data (up to 1 million tokens of input)—please synthesize an exhaustive, well-organized, and meticulously detailed research report on the topic. Your report should meet the following requirements:

Comprehensiveness & Detail:
- Process every single piece of information provided without omitting any details, even if they appear minor.
- Ensure that your response is thorough and addresses every aspect of the input data.
- Explain not only the main conclusions but also the nuanced insights and supporting evidence found in the context.

Structure & Organization:
- Organize your report with clear headings and subheadings that logically group related content.
- Use bullet points or numbered lists where appropriate to enhance readability and emphasize key points.
- Begin with an executive summary that encapsulates the most critical findings and follow with detailed sections covering methodology, analysis, and conclusions.

Citations & Attribution:
- Integrate all relevant citations directly into your text using the format [1], [2], etc., so that each fact or claim is clearly supported by the corresponding source from the input context.
- If multiple pieces of evidence support a point, list all appropriate citation markers.
- Ensure that every major section of your report references the original sources where applicable.

Analytical Depth & Reasoning:
- Provide clear explanations and reasoning behind each conclusion.
- Where there are conflicting pieces of evidence or multiple viewpoints, compare and contrast them, and discuss the implications.
- Elaborate on how the evidence fits together to support a cohesive overall narrative.

Output Constraints:
- Although the model's maximum output capacity is 8,000 tokens, do not pad your answer unnecessarily; generate as many tokens as are needed to be complete, concise, and insightful.
- Ensure that your final output is coherent, well-edited, and makes optimal use of the available token budget to provide a truly comprehensive report.

Search Results and Citations:
${searchResultsWithCitations}`;

    const geminiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/openrouter-dev/openrouter-examples',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.2,
        stream: true,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      let errorDetails;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorJson.error || errorText;
      } catch {
        errorDetails = errorText;
      }
      
      console.error('Gemini API Error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        error: errorDetails,
        headers: Object.fromEntries(geminiResponse.headers.entries())
      });
      
      return NextResponse.json({ 
        error: 'Failed to call Gemini API',
        details: errorDetails
      }, { status: geminiResponse.status });
    }

    if (!geminiResponse.body) {
      console.error('Gemini API Error: No response body');
      return NextResponse.json({ error: 'Failed to call Gemini API' }, { status: 500 });
    }

    // Create a transform stream to process the Gemini response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Create a closure to maintain buffer state
    let buffer = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Decode the chunk, appending any leftover from previous chunk
        const text = buffer + decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');
        // The last element might be a partial line—save it for the next chunk
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // End processing if we see the done signal.
              controller.terminate();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                const update = JSON.stringify({
                  type: 'content',
                  content: content,
                });
                console.log("Sent chunk:", update);
                controller.enqueue(encoder.encode(`data: ${update}\n\n`));
              }
            } catch (e) {
              if (!line.includes('OPENROUTER PROCESSING')) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      },
      flush(controller) {
        console.log("Flushing remaining data");
        // Flush any remaining text in the buffer.
        const remaining = buffer + decoder.decode(); // decoder.decode() without options flushes any buffered data
        if (remaining) {
          const lines = remaining.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  const update = JSON.stringify({
                    type: 'content',
                    content: content,
                  });
                  console.log("Sent chunk (flush):", update);
                  controller.enqueue(encoder.encode(`data: ${update}\n\n`));
                }
              } catch (e) {
                if (!line.includes('OPENROUTER PROCESSING')) {
                  console.error('Error parsing JSON on flush:', e);
                }
              }
            }
          }
        }
        controller.terminate();
      }
    });

    // Create a ReadableStream that combines citations and content
    const combinedStream = new ReadableStream({
      async start(controller) {
        // Send citations first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'citations',
          citations: perplexityData.citations || []
        })}\n\n`));

        // Pipe the Gemini response through the transform stream if body exists
        if (!geminiResponse.body) {
          throw new Error('No response body from Gemini API');
        }
        const reader = geminiResponse.body.pipeThrough(transformStream).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
        console.log("Streaming ended");
      }
    });

    return new NextResponse(combinedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
