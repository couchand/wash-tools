function stringToken(str) {
  return {
    type: stringToken,
    length: str.length + 2,
    value: str
  };
}

module.exports = {
  // meta
  EOF: -1,
  ERROR: -2,

  // punctuation
  OPEN_PAREN: '(',
  CLOSE_PAREN: ')',

  // keywords
  header: 'header',
  import: 'import',
  export: 'export',
  param: 'param',
  result: 'result',

  // types
  i32: 'i32',
  i64: 'i64',
  f32: 'f32',
  f64: 'f64',
  none: 'none',

  // complex
  string: stringToken,

  // helper
  is: function isToken(ty, token) {
    if (typeof token === 'undefined') {
      return function (t) { return isToken(ty, t); };
    }

    return token === ty || token.type === ty;
  }
};
