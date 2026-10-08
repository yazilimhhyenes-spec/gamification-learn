export const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KW = /\b(class|abstract|interface|implements|extends|super|constructor|new|return|get|set|this|const|let|if|else|for|of|throw|static|private|protected|public|readonly|override|instanceof|as|is|type|function|export|import|from|while|true|false|null|undefined)\b/g;
const TY = /\b(number|string|boolean|void|unknown|any|never)\b/g;

export function highlightLine(line: string): string {
  const i = line.indexOf('//');
  const code = i >= 0 ? line.slice(0, i) : line;
  const comment = i >= 0 ? `<span class="cm">${esc(line.slice(i))}</span>` : '';
  const body = esc(code)
    .replace(KW, '<span class="kw">$1</span>')
    .replace(TY, '<span class="ty">$1</span>')
    .replace(/#\w+/g, (m) => `<span class="pv">${m}</span>`)
    .replace(/(&#39;|')([^']*?)\1/g, (m) => `<span class="str">${m}</span>`)
    .replace(/`[^`]*`/g, (m) => `<span class="str">${m}</span>`);
  return body + comment;
}

export function dedent(src: string): string {
  const ls = src.replace(/\s+$/, '').split('\n');
  const indents = ls.filter((l) => l.trim()).map((l) => (l.match(/^ */) as RegExpMatchArray)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return ls.map((l) => l.slice(cut)).join('\n');
}

export const highlight = (src: string): string => dedent(src).split('\n').map(highlightLine).join('\n');
