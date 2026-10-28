// A tiny in-memory stand-in for the subset of the supabase-js query builder
// that AppContext actually uses (select/insert/update/delete, eq/lt/gt,
// order/limit, plus storage.upload/createSignedUrl and rpc). Deliberately
// has no dependency on vitest or any mocked module, so it's safe to import
// from inside a `vi.mock(...)` factory in any test file.

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

function emptyTables(): Tables {
  return {
    accounts: [],
    transactions: [],
    employees: [],
    employee_loans: [],
    payroll_history: [],
    recurring_expenses: [],
    tasks: [],
    businesses: [],
  };
}

function makeBuilder(tables: Tables, table: string) {
  let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let payload: Row | Row[] | undefined;
  const filters: Array<(row: Row) => boolean> = [];
  let orderCol: string | null = null;
  let orderAsc = true;
  let limitN: number | null = null;

  const builder: any = {
    select: () => builder,
    order: (col: string, opts?: { ascending?: boolean }) => {
      orderCol = col;
      orderAsc = opts?.ascending !== false;
      return builder;
    },
    limit: (n: number) => {
      limitN = n;
      return builder;
    },
    eq: (col: string, val: any) => {
      filters.push((row) => row[col] === val);
      return builder;
    },
    lt: (col: string, val: any) => {
      filters.push((row) => row[col] < val);
      return builder;
    },
    gt: (col: string, val: any) => {
      filters.push((row) => row[col] > val);
      return builder;
    },
    insert: (obj: Row | Row[]) => {
      op = 'insert';
      payload = obj;
      return builder;
    },
    update: (obj: Row) => {
      op = 'update';
      payload = obj;
      return builder;
    },
    delete: () => {
      op = 'delete';
      return builder;
    },
    then: (resolve: (v: any) => any, reject?: (e: any) => any) => {
      let result: { data: any; error: any };
      try {
        if (!tables[table]) tables[table] = [];
        if (op === 'select') {
          let rows = tables[table].filter((row) => filters.every((f) => f(row)));
          if (orderCol) {
            const col = orderCol;
            rows = [...rows].sort((a, b) => {
              const av = a[col];
              const bv = b[col];
              const cmp = av < bv ? -1 : av > bv ? 1 : 0;
              return orderAsc ? cmp : -cmp;
            });
          }
          if (limitN !== null) rows = rows.slice(0, limitN);
          result = { data: rows, error: null };
        } else if (op === 'insert') {
          const rowsToInsert = Array.isArray(payload) ? payload : [payload];
          tables[table].push(...(rowsToInsert as Row[]));
          result = { data: rowsToInsert, error: null };
        } else if (op === 'update') {
          tables[table] = tables[table].map((row) =>
            filters.every((f) => f(row)) ? { ...row, ...(payload as Row) } : row
          );
          result = { data: null, error: null };
        } else {
          tables[table] = tables[table].filter((row) => !filters.every((f) => f(row)));
          result = { data: null, error: null };
        }
      } catch (e) {
        result = { data: null, error: e };
      }
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return builder;
}

export function createMockSupabaseModule() {
  const tables = emptyTables();

  const supabase = {
    from: (table: string) => makeBuilder(tables, table),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/signed-url' }, error: null }),
      }),
    },
    rpc: async () => ({ error: null }),
  };

  return { supabase, tables };
}
