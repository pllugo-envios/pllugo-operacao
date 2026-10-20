// Compatibility for the app's existing parameterized D1 statements.
// Only server-authored statements reach this adapter. Values remain parameters.
export function translate(sql, values = []) {
  if (!/^(SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql) || /;|--|\/\*/.test(sql))
    throw new Error('Unsupported database statement');
  const ignore = /^INSERT OR IGNORE INTO /i.test(sql);
  let text = sql.replace(/^INSERT OR IGNORE INTO /i, 'INSERT INTO ')
    .replace(/json_extract\(body,'\$\.([A-Za-z][A-Za-z0-9_]*)'\)/g, "(body::jsonb ->> '$1')")
    .replace(/ AS INTEGER\)/g, ' AS BIGINT)');
  text = text.replace(/\b(FROM|JOIN|UPDATE|INTO)\s+(records|users|sessions|login_limits)\b/gi,
    (_, verb, table) => `${verb} operacao.${table.toLowerCase()}`);
  if (!/\boperacao\.(records|users|sessions|login_limits)\b/.test(text))
    throw new Error('Statement must target the operacao schema');
  let quoted = false, count = 0, result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "'") {
      if (quoted && text[i + 1] === "'") { result += "''"; i++; continue; }
      quoted = !quoted;
    }
    result += char === '?' && !quoted ? `$${++count}` : char;
  }
  if (quoted || count !== values.length) throw new Error('Invalid statement parameters');
  if (ignore) result += ' ON CONFLICT DO NOTHING';
  return { text: result, values };
}

export function createDatabase(sql) {
  function prepared(query, values = []) {
    const statement = translate(query, values);
    const execute = client => client.unsafe(statement.text, statement.values);
    return {
      bind(...args) { return prepared(query, args); },
      async first() { const rows = await execute(sql); return rows[0] ?? null; },
      async all() { return { results: [...await execute(sql)] }; },
      async run() { const rows = await execute(sql); return { meta: { changes: rows.count } }; },
      async inTransaction(client) { const rows = await execute(client); return { meta: { changes: rows.count } }; },
    };
  }
  return {
    // Bind parameters arrive after prepare(), as in D1.
    prepare(query) {
      return { bind: (...args) => prepared(query, args),
        first: () => prepared(query).first(), all: () => prepared(query).all(), run: () => prepared(query).run() };
    },
    batch(statements) {
      return sql.begin(async tx => {
        const results = [];
        for (const statement of statements) results.push(await statement.inTransaction(tx));
        return results;
      });
    },
  };
}
