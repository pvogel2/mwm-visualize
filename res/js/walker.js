var MWM = window.MWM || {};

Walker = {
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

  ensureLines: function(state, type) {
    var l = null;
    l = state.children.find(child => {
      return (child.isLineSegments && child.name === type);
    });
    if (!l) {
      const material = new THREE.LineBasicMaterial({
        color: 0x888888
      });
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
    var r = l > 1 ? l * 0.1 : 0;
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

  iterateBody(body, obj, c) {
    if (Array.isArray(body)) {
      body.forEach(item => {
        c(item, obj);
      });
    } else {
      c(body, obj);
    }
  },

  Program: function(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
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
};
