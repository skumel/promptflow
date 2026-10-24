import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
if (typeof globalThis !== 'undefined') {
  globalThis.pdfjsWorker = pdfjsWorker;
}
if (typeof window !== 'undefined') {
  window.pdfjsWorker = pdfjsWorker;
}

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from '../node_modules/mammoth/mammoth.browser.js';
import { marked } from 'marked';

if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'self';
}

export async function parsePdf(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullHtml = '';
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items into lines and paragraphs
    let lastY = null;
    let pageText = '';
    
    for (const item of content.items) {
      if (item.str === undefined) continue;
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n';
      } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
        pageText += ' ';
      }
      pageText += item.str;
      lastY = item.transform[5];
    }
    
    const paragraphs = pageText
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
      
    fullHtml += `
      <div class="pdf-page-marker" data-page="${i}">[Page ${i} of ${numPages}]</div>
      ${paragraphs || '<p><em>(Empty or scanned page)</em></p>'}
    `;
  }
  return fullHtml;
}

export async function parseDocx(arrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export function parseMarkdown(text) {
  return marked.parse(text);
}

export function parsePlainText(text) {
  const escaped = escapeHtml(text);
  const paragraphs = escaped
    .split(/\r?\n\r?\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
    .join('\n');
  return paragraphs || `<p>${escaped}</p>`;
}

function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}

if (typeof window !== 'undefined') {
  window.PrompterParsers = {
    parsePdf,
    parseDocx,
    parseMarkdown,
    parsePlainText
  };
}

export default {
  parsePdf,
  parseDocx,
  parseMarkdown,
  parsePlainText
};
