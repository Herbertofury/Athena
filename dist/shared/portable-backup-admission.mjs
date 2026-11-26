// Shared by Projects and Continuity; no imports, persistence or network.
export function parsePortableBackup(bytes, validate, maxBytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > maxBytes) throw Error('Backup exceeds the local import budget or is not bytes');
  const text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
  const parsed = JSON.parse(text);
  // Reject duplicate keys and numerically lossy values before JSON's last-key-wins
  // normalization can silently change an explicit backup. No raw input is logged.
  // Keep just one look-ahead token instead of allocating a second array
  // with an entry for every delimiter and value in the selected file.
  const lexer = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g;
  const next = () => lexer.exec(text)?.[0];
  let upcoming = next();
  function take() {
    const current = upcoming;
    upcoming = next();
    return current;
  }
  function decimal(token) {
    const [mantissa, exponent = '0'] = token.toLowerCase().split('e');
    const negative = mantissa.startsWith('-');
    const parts = mantissa.replace(/^-/, '').split('.');
    let digits = (parts[0] + (parts[1] || '')).replace(/^0+/, '');
    if (!digits) return negative ? '-0' : '0';
    let power = BigInt(exponent) - BigInt((parts[1] || '').length);
    let end = digits.length;
    while (end > 0 && digits[end - 1] === '0') end--;
    const trailing = digits.length - end;
    if (trailing) {digits = digits.slice(0,-trailing);power += BigInt(trailing);}
    return (negative ? '-' : '') + digits + 'e' + power;
  }
  function scan(depth = 0) {
    if (depth > 128) throw Error('Backup nesting exceeds admission budget');
    const token = take();
    if (token === '{') {
      const keys = new Set();
      if (upcoming !== '}') do {
        const key = JSON.parse(take());
        if (keys.has(key)) throw Error('Duplicate backup property');
        keys.add(key); take(); scan(depth + 1);
      } while (upcoming === ',' && take());
      take();
    } else if (token === '[') {
      if (upcoming !== ']') do {scan(depth + 1);} while (upcoming === ',' && take());
      take();
    } else if (/^-?\d/.test(token)) {
      const number = Number(token);
      if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number))) throw Error('Lossy backup number');
      const canonicalNumber = JSON.stringify(number);
      if (token !== canonicalNumber && decimal(token) !== decimal(canonicalNumber)) throw Error('Lossy backup number');
    }
  }
  scan();
  return validate(parsed);
}
