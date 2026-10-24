/**
 * PromptFlow Document Parser Module
 * Handles DOCX, PDF, Markdown, and Text files offline.
 */

const DocumentParser = {
  /**
   * Parse an uploaded file based on its extension
   * @param {File} file
   * @returns {Promise<{ html: string, rawText: string, title: string }>}
   */
  async parseFile(file) {
    const fileName = file.name || 'Untitled Talk';
    const ext = fileName.split('.').pop().toLowerCase();
    
    let html = '';
    let rawText = '';
    
    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        if (window.PrompterParsers && window.PrompterParsers.parseDocx) {
          html = await window.PrompterParsers.parseDocx(arrayBuffer);
        } else {
          throw new Error('DOCX parser bundle not loaded.');
        }
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        if (window.PrompterParsers && window.PrompterParsers.parsePdf) {
          html = await window.PrompterParsers.parsePdf(arrayBuffer);
        } else {
          throw new Error('PDF parser bundle not loaded.');
        }
      } else if (ext === 'md' || ext === 'markdown') {
        const text = await file.text();
        rawText = text;
        if (window.PrompterParsers && window.PrompterParsers.parseMarkdown) {
          html = window.PrompterParsers.parseMarkdown(text);
        } else {
          html = this.simpleMarkdown(text);
        }
      } else if (ext === 'html' || ext === 'htm') {
        html = await file.text();
      } else if (ext === 'rtf') {
        const text = await file.text();
        const cleanText = this.stripRtf(text);
        rawText = cleanText;
        html = this.formatPlainText(cleanText);
      } else {
        // Plain text (.txt or unrecognized)
        const text = await file.text();
        rawText = text;
        html = this.formatPlainText(text);
      }

      // Post-process HTML to highlight speech cues like [PAUSE 3s], [CLICK SLIDE], etc.
      html = this.highlightCues(html);
      
      // Calculate plain text if not yet done
      if (!rawText) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        rawText = tmp.innerText || tmp.textContent;
      }

      return {
        html,
        rawText,
        title: fileName.replace(/\.[^/.]+$/, '')
      };
    } catch (err) {
      console.error('Error parsing document:', err);
      throw new Error(`Failed to parse ${fileName}: ${err.message}`);
    }
  },

  /**
   * Parse plain text string from editor or paste
   */
  parseTextContent(content, title = 'Custom Speech') {
    let html = '';
    // Detect if markdown-like
    if (content.includes('#') || content.includes('**') || content.includes('> ')) {
      if (window.PrompterParsers && window.PrompterParsers.parseMarkdown) {
        html = window.PrompterParsers.parseMarkdown(content);
      } else {
        html = this.simpleMarkdown(content);
      }
    } else {
      html = this.formatPlainText(content);
    }
    html = this.highlightCues(html);
    return {
      html,
      rawText: content,
      title
    };
  },

  /**
   * Highlights bracketed speaking cues like [PAUSE 2s], [SMILE], [CLICK SLIDE]
   */
  highlightCues(html) {
    // Matches bracketed directions like [PAUSE 3s], [LAUGHTER], [SLIDE 2], etc.
    // Avoids replacing brackets inside HTML tags or attributes
    return html.replace(/(?<!<[^>]*?)\[([A-Za-z0-9\s\-_:,\.!?]+)\](?![^<]*?>)/g, (match, cue) => {
      return `<span class="cue-badge" title="Stage Cue">[${cue.trim()}]</span>`;
    });
  },

  /**
   * Strips RTF formatting syntax to plain text
   */
  stripRtf(rtf) {
    return rtf
      .replace(/\\par[d]?\s*/g, '\n')
      .replace(/\\line\s*/g, '\n')
      .replace(/\{\*?\\[^{}]+;?\}|[{}]|\\\w+\s?/g, '')
      .replace(/\r?\n\s*\r?\n/g, '\n\n')
      .trim();
  },

  /**
   * Formats plain text into paragraph tags with line breaks preserved
   */
  formatPlainText(text) {
    const escaped = this.escapeHtml(text);
    return escaped
      .split(/\r?\n\r?\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
      .join('\n');
  },

  /**
   * Fallback markdown parser if bundle is somehow omitted
   */
  simpleMarkdown(text) {
    let out = this.escapeHtml(text);
    // Headers
    out = out.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Bold & italic
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Blockquotes
    out = out.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    // Paragraphs
    out = out.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
    return out;
  },

  escapeHtml(string) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(string).replace(/[&<>"']/g, s => entityMap[s]);
  },

  /**
   * Count words in raw text
   */
  countWords(text) {
    if (!text) return 0;
    const matches = text.trim().match(/\b[\w'-]+\b/g);
    return matches ? matches.length : 0;
  },

  /**
   * Estimate total speech duration in seconds at a given speaking pace (default 135 words/min)
   */
  estimateDurationSeconds(wordCount, wpm = 135) {
    if (!wordCount || wpm <= 0) return 0;
    return Math.round((wordCount / wpm) * 60);
  },

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
};

window.DocumentParser = DocumentParser;
