var MWM = window.MWM || {};

Walker = {
  labels: [],
  ensureGroup: function(state, type) {
    var g = null;
    g = state.children.find(child => {
      return (child.type === 'Group' && child.name === type);
    });
    if (!g) {
      g = new THREE.Group();
      g.name = type;
      state.add(g);
    }
    return g;
  },

  ensureLines: function(state, type, material) {
    var l = null;
    l = state.children.find(child => {
      return (child.isLineSegments && child.name === type);
    });
    if (!l) {
      if (!material) {
        material = new THREE.LineBasicMaterial({
          color: 0x888888
        });
      }
      const geometry = new THREE.Geometry();
      l = new THREE.LineSegments(geometry, material);
      l.name = type;
      state.add(l);
    }
    return l;
  },

  getDefaultGeometry: function() {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0xbbbbbb} );
    return new THREE.Mesh( geometry, material );
  },

  addRenderItem: function(group, lines, item) {
    lines.geometry.vertices.push(group.position);
    lines.geometry.vertices.push(item.position);
    group.add(item);
    var l = group.children.length;
    var r = l > 1 ? l * 0.2 : 0;
    var phi = Math.PI *0.5;
    var theta = 0.0;
    group.children.forEach((child, idx) => {
      theta = 2 * Math.PI / l * idx;
      var s = new THREE.Spherical(r, phi, theta);
      var p = new THREE.Vector3();
      child.position.setFromSpherical(s);
      child.position.y += l * 0.2;
    });
  },

  addDefaultRepresentation: function(node, state) {
    const obj = this.getDefaultGeometry();
    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addDeclarationRepresentation: function(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0xbb0000} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addExpressionRepresentation: function(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0x00bb00} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },


  addClauseRepresentation: function(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0x00bbbb} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addMiscRepresentation: function(node, state) {
    const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    const material = new THREE.MeshBasicMaterial( {color: 0x00ff} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addDomItem(label, obj) {
    const div = document.createElement('div');
    div.classList.add('walker');
    div.classList.add('label');
    div.style.display = 'block';
    div.textContent = label;
    div.walker = {
      ref: obj
    };
    document.querySelector('#threejs-container').append(div);
    this.labels.push(div);
  },

  iterateBody(body, obj, c) {
    if (Array.isArray(body)) {
      body.forEach(item => {
        c(item, obj);
      });
    } else {
      c(body, obj);
    }
  },

  iterateOptional(items, obj, c) {
    if (Array.isArray(items)) {
      items.forEach(item => {
        c(item, obj);
      });
    } else if(items) {
      c(items, obj);
    }
  },

  Program: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    this.addDomItem(node.type, obj);
    this.iterateBody(node.body, obj, c);
  },

  EmptyStatement: function(node, state, c) {
    this.addDefaultRepresentation(node, state);
  },

  BlockStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    this.iterateBody(node.body, obj, c);
  },

  ExpressionStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.expression, obj);
  },

  IfStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    c(node.consequent, obj);
    if (node.alternate) {
      c(node.alternate, obj);
    }
  },

  LabeledStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.label, obj);
    this.iterateBody(node.body, obj, c);
  },

  BreakStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.label) {
      c(node.label, obj);
    }
  },

  ContinueStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.label) {
      c(node.label, obj);
    }
  },

  WithStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.object, obj);
    this.iterateBody(node.body, obj, c);
  },

  SwitchStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.discriminant, obj);
    node.cases.forEach(_case => {
      c(_case, obj)
    });
  },

  ReturnStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.argument) {
      c(node.argument, obj);
    }
  },

  ThrowStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.argument, obj);
  },

  TryStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.block, obj);
    if (node.finalizer) {
      c(node.handler, obj);
    }    c(node.handler, obj);
    if (node.finalizer) {
      c(node.finalizer, obj);
    }
  },

  WhileStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    this.iterateBody(node.body, obj, c);
  },

  DoWhileStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    this.iterateBody(node.body, obj, c);
  },

  ForStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.init) {
      c(node.init, obj);
    }
    if (node.test) {
      c(node.test, obj);
    }
    if (node.update) {
      c(node.update, obj);
    }
    this.iterateBody(node.body, obj, c);
  },

  ForInStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
    this.iterateBody(node.body, obj, c);
  },

  ForOfStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
    this.iterateBody(node.body, obj, c);
  },

  LetStatement: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    node.head.forEach(item => {
      c(item, obj)
    });
    this.iterateBody(node.body, obj, c);
  },

  /*DECLARATIONS*/

  FunctionDeclaration: function(node, state, c) {
    const obj = this.addDeclarationRepresentation(node, state);
    node.params.forEach(param => {
      c(param, obj);
    });
    node.defaults.forEach(_default => {
      c(_default, obj);
    });
    if(node.rest) {
      c(node.rest, obj);
    }
    this.iterateBody(node.body, obj, c);
  },

  VariableDeclaration: function(node, state, c) {
    const obj = this.addDeclarationRepresentation(node, state);
    node.declarations.forEach(declaration => {
      c(declaration, obj);
    });
  },

  VariableDeclarator: function(node, state, c) {
    const obj = this.addDeclarationRepresentation(node, state);
    if (node.init) {
      c(node.init, obj);
    }
  },

  /*EXPRESSIONS*/

  ThisExpression: function(node, state, c) {
    this.addExpressionRepresentation(node, state);
  },

  ArrayExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.elements, obj, c);
  },

  ObjectExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.properties, obj, c);
  },

  Property: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.key, obj);
    c(node.value, obj);
  },

  FunctionExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.params, obj, c);
    this.iterateOptional(node.defaults, obj, c);
    if(node.rest) {
      c(node.rest, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  ArrowExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.params, obj, c);
    this.iterateOptional(node.defaults, obj, c);
    if(node.rest) {
      c(node.rest, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  SequenceExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.expressions, obj, c);
  },

  UnaryExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.argument, obj);
  },

  BinaryExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },

  AssignmentExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },
 
  UpdateExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.argument, obj);
  },

  LogicalExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },

  ConditionalExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.test, obj);
    c(node.alternate, obj);
    c(node.consequent, obj);
  },

  NewExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.callee, obj);
    this.iterateOptional(node.arguments, obj, c);
  },

  CallExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.callee, obj);
    this.iterateOptional(node.arguments, obj, c);
  },

  MemberExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.object, obj);
    c(node.property, obj);
  },

  YieldExpression: function(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    if (node.argument) {
      c(node.argument, obj);
    }
  },

  /*PATTERNS*/

  
  /* working ??? */
  ObjectPattern: function(node, state, c) {
    const obj = this.addPatternRepresentation(node, state);
    this.iterateOptional(node.properties, obj, c);
  },

  ArrayPattern: function(node, state, c) {
    const obj = this.addPatternRepresentation(node, state);
    this.iterateOptional(node.elements, obj, c);
  },

  /*CLAUSES*/

  SwitchCase: function(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
    if (node.test) {
      c(node.test, obj);
    }
    this.iterateOptional(node.consequent, obj, c);
  },

  CatchClause: function(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
    if (node.guard) {
      c(node.guard, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  ComprehensionBlock: function(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
      c(node.right, obj);
  },
 
  ComprehensionIf: function(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
      c(node.test, obj);
  },

  /*MISCELLANEOUS*/

  Identifier: function(node, state, c) {
    const obj = this.addMiscRepresentation(node, state);
    this.addDomItem(node.name, obj);
  },

  Literal: function(node, state, c) {
    this.addMiscRepresentation(node, state);
  },
};
