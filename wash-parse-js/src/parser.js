const tokens = require('./tokens');

const isError = tokens.is(tokens.ERROR);

function getToken(lexer) {
  const token = lexer.getToken();
  if (isError(token)) {
    throw new Error("Lexer error at line " + lexer.currentPosition.line + " column " + lexer.currentPosition.column + ": '" + lexer.input.slice(lexer.currentPosition.offset, lexer.currentPosition.offset + 10) + "...'");
  }
  return token;
}

function expect(ty, lexer) {
  const token = lexer.getCurrentToken();

  if (!tokens.is(ty, token)) {
    var expected = ty;
    if (ty === tokens.string) {
      expected = "a string value";
    }
    if (ty === tokens.EOF) {
      expected = "EOF";
    }
    if (ty === tokens.ERROR) {
      expected = "ERROR";
    }

    var actual = token;
    if (tokens.is(tokens.string, token)) {
      actual = "the string \"" + token.value + "\"";
    }
    if (tokens.is(tokens.EOF, token)) {
      actual = "EOF";
    }
    if (tokens.is(tokens.ERROR, token)) {
      actual = "ERROR";
    }

    console.error("Expected " + expected + ", saw " + actual);
    throw new Error("Unhandled failure!");
  }
  getToken(lexer);

  return token;
}

function isSimple(token) {
  return tokens.is(tokens.i32, token)
      || tokens.is(tokens.i64, token)
      || tokens.is(tokens.f32, token)
      || tokens.is(tokens.f64, token);
}

function getType(token) {
  if (tokens.is(tokens.i32, token)) return 'i32';
  if (tokens.is(tokens.i64, token)) return 'i64';
  if (tokens.is(tokens.f32, token)) return 'f32';
  if (tokens.is(tokens.f64, token)) return 'f64';
}

function parseSimpleTypes(lexer) {
  const types = [];

  while (isSimple(lexer.getCurrentToken())) {
    const ty = getType(lexer.getCurrentToken());
    types.push(ty);

    getToken(lexer);
  }

  return types;
}

function parseType(lexer) {
  var params = [];
  var result = 'none';

  if (tokens.is(tokens.OPEN_PAREN, lexer.getCurrentToken())) {
    const dir = getToken(lexer);

    if (tokens.is(tokens.param, dir)) {
      getToken(lexer);
      params = parseSimpleTypes(lexer);
    }
    else if (tokens.is(tokens.result, dir)) {
      getToken(lexer);
      const resultTypes = parseSimpleTypes(lexer);
      if (resultTypes && resultTypes.length) {
        result = resultTypes[0];
      }
    }
    else {
      throw new Error("token problem " + dir);
    }
    expect(tokens.CLOSE_PAREN, lexer);
  }

  if (tokens.is(tokens.OPEN_PAREN, lexer.getCurrentToken())) {
    const res = getToken(lexer);

    if (tokens.is(tokens.result, res)) {
      getToken(lexer);
      const resTypes = parseSimpleTypes(lexer);
      if (resTypes && resTypes.length) {
        result = resTypes[0];
      }
    }
    else {
      throw new Error("token problem " + res);
    }
    expect(tokens.CLOSE_PAREN, lexer);
  }

  return { params, result }
}

function parseImport(lexer) {
  expect(tokens.import, lexer);

  const module = expect(tokens.string, lexer).value;
  const base = expect(tokens.string, lexer).value;
  const type = parseType(lexer);
  expect(tokens.CLOSE_PAREN, lexer);

  return { module, base, type };
}

function parseExport(lexer) {
  expect(tokens.export, lexer);

  const base = expect(tokens.string, lexer).value;
  const type = parseType(lexer);
  expect(tokens.CLOSE_PAREN, lexer);

  return { base, type };
}

function parse(lexer) {
  lexer.getToken();
  expect(tokens.OPEN_PAREN, lexer);
  expect(tokens.header, lexer);

  var imports = [], exports = [];

  while (tokens.is(tokens.OPEN_PAREN, lexer.getCurrentToken())) {
    var token = getToken(lexer);

    if (tokens.is(tokens.import, token)) {
      imports.push(parseImport(lexer));
    }
    else if (tokens.is(tokens.export, token)) {
      exports.push(parseExport(lexer));
    }
    else {
      throw new Error("token issue! " + token);
    }
  }

  expect(tokens.CLOSE_PAREN, lexer);
  expect(tokens.EOF, lexer);

  return { imports, exports };
}

module.exports = parse;
