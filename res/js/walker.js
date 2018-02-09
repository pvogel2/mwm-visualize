var MWM = window.MWM || {};

MWM.walker = function() {
};

MWM.walker.prototype = {
  constructor: MWM.walker,
  functions: {
    Program: function(node, state, c) {
      console.log('node', node);
      node.body.forEach(item => {c(item, state)});
      ;
    },
    ExpressionStatement: function(node, state, c) {
      console.log('node', node);
      c(node.expression, state);
    }
  }
};