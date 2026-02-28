// Using pdfjs-dist dynamic import; avoid importing types that may not be exported

// Lightweight PDF -> text helper using pdfjs-dist
// Returns an array of strings (lines) extracted from the PDF.
export async function pdfToLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  // dynamic import to avoid bundling issues
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
  // set worker src if needed (Vite will handle most cases)
  // @ts-ignore
  if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
    // try to set workerSrc to a CDN fallback
    // @ts-ignore
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(pdfjs as any).version}/build/pdf.worker.min.js`;
  }

  const loadingTask = pdfjs.getDocument({ data: buffer } as any);
  const pdf = await loadingTask.promise;
  const lines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageLines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    content.items.forEach((it: any) => {
      const transform = it.transform; // [a,b,c,d,e,f]
      const y = transform[5];
      const str = it.str?.toString?.() || '';

      if (lastY === null || Math.abs(y - lastY) < 5) {
        currentLine += (currentLine ? ' ' : '') + str;
      } else {
        pageLines.push(currentLine.trim());
        currentLine = str;
      }
      lastY = y;
    });
    if (currentLine) pageLines.push(currentLine.trim());

    lines.push(...pageLines);
  }

  return lines.filter(Boolean).map(l => l.replace(/\s+\u00A0\s+/g, ' '));
}
