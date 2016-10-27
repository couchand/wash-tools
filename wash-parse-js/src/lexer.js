const tokens = require('./tokens');

const tokenRE = /^(header|import|export|param|result|i32|i64|f32|f64|none)/;
const stringRE = /^"([^"]*)"/;
const spaceRE = /^( |\t)+/;
const newlineRE = /^(\r\n|\r|\n)/;

const isError = tokens.is(tokens.ERROR);
const isEOF = tokens.is(tokens.EOF);

const isErrorOrEOF = function (tok) {
  return isError(tok) || isEOF(tok);
}

function lex(originalInput) {
  var input = originalInput;
  var currentToken = tokens.ERROR;
  const currentPosition = {
    offset: 0,
    line: 1,
    column: 0
  };

  function consume(thing) {
    if (isErrorOrEOF(thing)) return;

    currentPosition.offset += thing.length;
    currentPosition.column += thing.length;
    input = input.slice(thing.length);

    return thing;
  }

  function consumeNewlines() {
    var match = newlineRE.exec(input);
    while (match) {
      consume(match[0]);
      currentPosition.line += 1;
      currentPosition.column = 0;

      match = newlineRE.exec(input);
    }
  }

  function consumeWhitespace() {
    var match = spaceRE.exec(input);
    while (match) {
      consume(match[0]);

      match = spaceRE.exec(input);
    }
  }

  function getToken() {
    if (!input.length) {
      return currentToken = tokens.EOF;
    }

    var prev = 0;
    var curr = input.length;

    while (prev !== curr) {
      prev = curr;
      consumeWhitespace();
      consumeNewlines();
      curr = input.length;
    }

    // because we might have just made it empty
    if (!input.length) {
      return currentToken = tokens.EOF;
    }

    switch (input[0]) {
      case '(':
        return currentToken = consume(tokens.OPEN_PAREN);
      case ')':
        return currentToken = consume(tokens.CLOSE_PAREN);
      case '"':
        const strMatch = stringRE.exec(input);
        if (!strMatch) {
          return currentToken = tokens.ERROR;
        }
        return currentToken = consume(tokens.string(strMatch[1]));
    }

    const tokMatch = tokenRE.exec(input);

    if (!tokMatch || !tokens.hasOwnProperty(tokMatch[0])) {
      return currentToken = tokens.ERROR;
    }

    return currentToken = consume(tokens[tokMatch[0]]);
  }

  return {
    currentPosition,
    input: originalInput,

    getToken,
    getCurrentToken: function () { return currentToken; }
  };
}

module.exports = lex;
