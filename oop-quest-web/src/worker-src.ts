/** Laboratuvar kodunu izole çalıştıran Web Worker kaynağı (Blob olarak yüklenir). */
export const WORKER_SRC = String.raw`
function inspect(v, d, seen) {
  d = d || 0; seen = seen || [];
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  var t = typeof v;
  if (t === 'string') return d === 0 ? v : "'" + v.replace(/'/g, "\\'") + "'";
  if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
  if (t === 'symbol') return v.toString();
  if (t === 'function') return /^class\s/.test(Function.prototype.toString.call(v)) ? '[class ' + v.name + ']' : '[Function ' + (v.name || 'anonymous') + ']';
  if (seen.indexOf(v) >= 0) return '[Circular]';
  if (d > 2) return Array.isArray(v) ? '[Array]' : '[Object]';
  seen = seen.concat([v]);
  if (Array.isArray(v)) return v.length ? '[ ' + v.map(function (x) { return inspect(x, d + 1, seen); }).join(', ') + ' ]' : '[]';
  if (v instanceof Map) return 'Map(' + v.size + ') { ' + Array.from(v.entries()).map(function (e) { return inspect(e[0], d + 1, seen) + ' => ' + inspect(e[1], d + 1, seen); }).join(', ') + ' }';
  if (v instanceof Set) return 'Set(' + v.size + ') { ' + Array.from(v.values()).map(function (x) { return inspect(x, d + 1, seen); }).join(', ') + ' }';
  if (v instanceof Error) return v.name + ': ' + v.message;
  var name = v.constructor && v.constructor.name && v.constructor.name !== 'Object' ? v.constructor.name + ' ' : '';
  var keys = Object.keys(v);
  if (!keys.length) return name + '{}';
  return name + '{ ' + keys.map(function (k) { return k + ': ' + inspect(v[k], d + 1, seen); }).join(', ') + ' }';
}
onmessage = function (e) {
  var out = [];
  var show = function () {
    out.push(Array.prototype.map.call(arguments, function (x) { return typeof x === 'string' ? x : inspect(x); }).join(' '));
  };
  var error;
  try {
    new Function('show', 'console', 'exports', e.data)(show, { log: show }, {});
  } catch (err) {
    error = ((err && err.name) || 'Error') + ': ' + ((err && err.message) || String(err));
  }
  postMessage({ out: out, error: error });
};
`;
