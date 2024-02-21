const selectMatcher = /^\s*SELECT\s+(.+)$/i;
const distinctMatcher = /^\s*DISTINCT\s+(.+)$/i;
const starMatcher = /^\s*(\*)\s+(.*)/;
const fromMatcher = /^\s*FROM\s+(.+)$/i;
const whereMatcher = /^\s*WHERE\s+(.+)$/i;
const orderByMatcher = /^\s*ORDER\s+BY\s+(.+)$/i;
const columnMatcher = /^\s*([.\w]+)\s*(.*)/;
const specialColumnMatcher = /^\s*(\w+\['.+'\])\s*(.*)/;
const tableMatcher = /^\s*(\w+)\s+(.*)/;
const doneMatcher = /^(\s*)$/;
const valueMatcher = /^(\d+|'[\w\s]+'|"[\w\s]+")(.*)/;

export interface SuccessParsedQuery {
  success: true;
  columns: string[];
  tables: string[];
  filters: string[];
  sorts: string[];
}
export interface FailedParsedQuery {
  success: false;
  message: string;
}

const errorReturn: FailedParsedQuery = {
  success: false,
  message: "Invalid query",
};

type ChainedParser = (
  parser: Parser,
  callback?: (value: string) => void
) => Parser;

export type ParsedQuery = SuccessParsedQuery | FailedParsedQuery;

class Parser {
  constructor(fragment: string, failedMessage?: string) {
    this.fragment = fragment;
    this.failedMessage = failedMessage;
  }

  readonly fragment: string;

  readonly failedMessage: string | undefined;

  get failed(): boolean {
    return this.failedMessage !== undefined;
  }

  execute(matcher: RegExp, callback?: (value: string) => void): Parser {
    if (this.failed) {
      return this;
    }

    const match = this.fragment.match(matcher);
    if (match === null) {
      return new Parser(
        "",
        `failed to parse: ${this.fragment} with: ${matcher}`
      );
    } else {
      if (callback !== undefined) {
        callback(match[1]);
      }
      return new Parser(match[match.length - 1]);
    }
  }

  loop(elementChain: ChainedParser, separatorChain: ChainedParser): Parser {
    if (this.failed) {
      return this;
    }

    const element = elementChain(this);
    if (element.failed) {
      return element;
    }

    const separator = separatorChain(element);
    if (separator.failed) {
      return element;
    }

    return separator.loop(elementChain, separatorChain);
  }

  optional(
    optionalChain: ChainedParser,
    followupChain: ChainedParser = (p) => p
  ): Parser {
    if (this.failed) {
      return this;
    }

    const result = optionalChain(this);
    if (result.failed) {
      return this;
    } else {
      return followupChain(result);
    }
  }

  optional2(
    optionalChain: ChainedParser,
    followupChain: ChainedParser = (p) => p
  ): Parser {
    if (this.failed) {
      return this;
    }

    console.log("optional2", this.fragment);
    const result = optionalChain(this);
    console.log(" result", result);
    if (result.failed) {
      return this;
    } else {
      return followupChain(result);
    }
  }

  or(...parserDefinitions: ChainedParser[]): Parser {
    if (this.failed) {
      return this;
    }

    for (const parserDefinition of parserDefinitions) {
      const result = parserDefinition(this);
      if (!result.failed) {
        return result;
      }
    }

    return new Parser("", `failed to parse: ${this.fragment}`);
  }

  done(): Parser {
    return this.execute(doneMatcher);
  }

  select(): Parser {
    return this.execute(selectMatcher);
  }

  distinct(): Parser {
    return this.execute(distinctMatcher);
  }

  star(callback: (value: string) => void): Parser {
    return this.execute(starMatcher, callback);
  }

  comma(): Parser {
    return this.execute(/^\s*,\s*(.*)/);
  }

  from(): Parser {
    return this.execute(fromMatcher);
  }

  where(): Parser {
    return this.execute(whereMatcher);
  }

  orderBy(): Parser {
    return this.execute(orderByMatcher);
  }

  column(callback: (value: string) => void): Parser {
    return this.or(
      (p) => p.execute(specialColumnMatcher, callback),
      (p) => p.execute(columnMatcher, callback),
      (p) => p.execute(valueMatcher, callback)
    );
  }

  columns(callback: (value: string) => void): Parser {
    return this.loop(
      (p) => p.column(callback),
      (p) => p.comma()
    );
  }

  tables(callback: (value: string) => void): Parser {
    return this.loop(
      (p) => p.execute(tableMatcher, callback),
      (p) => p.comma()
    );
  }

  filters(callback: (value: string) => void): Parser {
    return this.loop(
      (p) => p.filter(callback),
      (p) => p.execute(/^\s*AND\s+(.*)/)
    );
  }

  binaryOperator(callback: (value: string) => void): Parser {
    return this.execute(/^\s*(=|<|>|<=|>=)\s*(.*)/, callback);
  }

  filter(callback: (value: string) => void = () => {}): Parser {
    let left: string = "";
    let operator: string = "";
    let right: string = "";
    const result = this.column((v) => (left = v))
      .binaryOperator((v) => (operator = v))
      .column((v) => (right = v));

    callback(`${left} ${operator} ${right}`);
    return result;
  }

  sorts(callback: (value: string) => void): Parser {
    return this.loop(
      (p) =>
        p.column(callback).optional((p) => p.execute(/^\s*(ASC|DESC)\s+(.*)/i)),
      (p) => p.comma()
    );
  }
}

function use(fragment: string): Parser {
  return new Parser(fragment + " ");
}

export function parseQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    success: true,
    columns: [],
    tables: [],
    filters: [],
    sorts: [],
  };
  const parser = use(query)
    .select()
    .or(
      (p) => p.star((c) => result.columns.push(c)),
      (p) =>
        p
          .optional((p) => p.distinct())
          .loop(
            (p) => p.column((c) => result.columns.push(c)),
            (p) => p.comma()
          )
    )
    .optional(
      (p) => p.from(),
      (p) =>
        p
          .tables((t) => result.tables.push(t))
          .optional(
            (p) => p.where(),
            (p) => p.filters((f) => result.filters.push(f))
          )
          .optional(
            (p) => p.orderBy(),
            (p) => p.sorts((s) => result.sorts.push(s))
          )
    )
    .done();

  if (parser.failed) {
    console.error(parser.failedMessage);
    return errorReturn;
  } else {
    return result;
  }
}
