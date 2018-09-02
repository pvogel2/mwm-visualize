var MWM = window.MWM || {};

Walker = {
  labels: [],
  points : [],
  animations: [],
  ensureGroup(state, type) {
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

  ensureLines(state, type, material) {
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

  getDefaultGeometry() {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0xbbbbbb} );
    return new THREE.Mesh( geometry, material );
  },

  addRenderItem(group, lines, item) {
    lines.geometry.vertices.push(group.position);
    lines.geometry.vertices.push(item.position);
    group.add(item);
    const l = group.children.length;
    const r = l > 1 ? l * 0.2 : 0;
    const phi = Math.PI *0.5;
    let theta = 0.0;
    group.children.forEach((child, idx) => {
      theta = 2 * Math.PI / l * idx;
      const s = new THREE.Spherical(r, phi, theta);
      const p = new THREE.Vector3();
      p.setFromSpherical(s);
      p.y += l * 0.2;
      child.userData.position = p;
      this.animations.push(child);
     });
  },

  initPointsCloud(obj) {
    obj.children.forEach(child => {
      if (child.type === 'Group') {
        this.addPoint(child);
      }
      this.initPointsCloud(child);
    });
  },

  addPoint(obj) {
    const v = new THREE.Vector3();
    v.setFromMatrixPosition( obj.matrixWorld );
    this.points.push(v);
  },

  addDefaultRepresentation(node, state) {
    const obj = this.getDefaultGeometry();
    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addDeclarationRepresentation(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0xbb0000} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addExpressionRepresentation(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0x00bb00} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },


  addClauseRepresentation(node, state) {
    const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    const material = new THREE.MeshBasicMaterial( {color: 0x00bbbb} );
    const obj = new THREE.Mesh( geometry, material );

    const group = this.ensureGroup(state, node.type);
    const lines = this.ensureLines(state, node.type, material);
    this.addRenderItem(group, lines, obj);
    return obj;
  },

  addMiscRepresentation(node, state) {
    state.matrixWorldNeedsUpdate = true;
    const v = new THREE.Vector3().setFromMatrixPosition( state.matrixWorld );
    //console.log(state.position);
    // this.points.push(v);
    //const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    //const material = new THREE.MeshBasicMaterial( {color: 0x00ff} );
    //const obj = new THREE.Mesh( geometry, material );

    //const group = this.ensureGroup(state, node.type);
    //const lines = this.ensureLines(state, node.type, material);
    //this.addRenderItem(group, lines, obj);
    //return obj;
  },

  addPointsCloud(){
        /*stars setup*/
        const p_uniforms = {
            texture:   { type: "t", value: renderer.getTexture( "disc.png" ) },
        };
        p_uniforms.texture.value.wrapS = p_uniforms.texture.value.wrapT = THREE.RepeatWrapping;

        const p_material = new THREE.ShaderMaterial( {
            uniforms: p_uniforms,
            depthWrite: false,
            transparent: true,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent

        });

        const c = new THREE.Color( 1, 0, 0);
        
        const p_geometry = new THREE.BufferGeometry();
        const p_positions = new Float32Array( this.points.length * 3 );
        const p_colors = new Float32Array( this.points.length * 3 );
        const p_sizes = new Float32Array( this.points.length);

        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            p.toArray(p_positions, i * 3);
            c.toArray( p_colors, i * 3);
            p_sizes[i] = 20;
        }
        p_geometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ));
        p_geometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ));
        p_geometry.addAttribute( 'color', new THREE.BufferAttribute( p_colors, 3 ));
        p_geometry.dynamic = true;

        renderer.addObject("points", new THREE.Points( p_geometry, p_material), true);
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
    setTimeout(() => {
      if (Array.isArray(body)) {
        body.forEach(item => {
          c(item, obj);
        });
      } else {
        c(body, obj);
      }
    }, 0);
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

  Program(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    this.addDomItem(node.type, obj);
    this.iterateBody(node.body, obj, c);
  },

  EmptyStatement(node, state, c) {
    this.addDefaultRepresentation(node, state);
  },

  BlockStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    this.iterateBody(node.body, obj, c);
  },

  ExpressionStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.expression, obj);
  },

  IfStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    c(node.consequent, obj);
    if (node.alternate) {
      c(node.alternate, obj);
    }
  },

  LabeledStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.label, obj);
    this.iterateBody(node.body, obj, c);
  },

  BreakStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.label) {
      c(node.label, obj);
    }
  },

  ContinueStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.label) {
      c(node.label, obj);
    }
  },

  WithStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.object, obj);
    this.iterateBody(node.body, obj, c);
  },

  SwitchStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.discriminant, obj);
    node.cases.forEach(_case => {
      c(_case, obj)
    });
  },

  ReturnStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    if (node.argument) {
      c(node.argument, obj);
    }
  },

  ThrowStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.argument, obj);
  },

  TryStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.block, obj);
    if (node.finalizer) {
      c(node.handler, obj);
    }    c(node.handler, obj);
    if (node.finalizer) {
      c(node.finalizer, obj);
    }
  },

  WhileStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    this.iterateBody(node.body, obj, c);
  },

  DoWhileStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.test, obj);
    this.iterateBody(node.body, obj, c);
  },

  ForStatement(node, state, c) {
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

  ForInStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
    this.iterateBody(node.body, obj, c);
  },

  ForOfStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
    this.iterateBody(node.body, obj, c);
  },

  LetStatement(node, state, c) {
    const obj = this.addDefaultRepresentation(node, state);
    node.head.forEach(item => {
      c(item, obj)
    });
    this.iterateBody(node.body, obj, c);
  },

  /*DECLARATIONS*/

  FunctionDeclaration(node, state, c) {
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

  VariableDeclaration(node, state, c) {
    const obj = this.addDeclarationRepresentation(node, state);
    node.declarations.forEach(declaration => {
      c(declaration, obj);
    });
  },

  VariableDeclarator(node, state, c) {
    const obj = this.addDeclarationRepresentation(node, state);
    if (node.init) {
      c(node.init, obj);
    }
  },

  /*EXPRESSIONS*/

  ThisExpression(node, state, c) {
    this.addExpressionRepresentation(node, state);
  },

  ArrayExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.elements, obj, c);
  },

  ObjectExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.properties, obj, c);
  },

  Property(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.key, obj);
    c(node.value, obj);
  },

  FunctionExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.params, obj, c);
    this.iterateOptional(node.defaults, obj, c);
    if(node.rest) {
      c(node.rest, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  ArrowExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.params, obj, c);
    this.iterateOptional(node.defaults, obj, c);
    if(node.rest) {
      c(node.rest, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  SequenceExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    this.iterateOptional(node.expressions, obj, c);
  },

  UnaryExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.argument, obj);
  },

  BinaryExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },

  AssignmentExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },
 
  UpdateExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.argument, obj);
  },

  LogicalExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.left, obj);
    c(node.right, obj);
  },

  ConditionalExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.test, obj);
    c(node.alternate, obj);
    c(node.consequent, obj);
  },

  NewExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.callee, obj);
    this.iterateOptional(node.arguments, obj, c);
  },

  CallExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.callee, obj);
    this.iterateOptional(node.arguments, obj, c);
  },

  MemberExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    c(node.object, obj);
    c(node.property, obj);
  },

  YieldExpression(node, state, c) {
    const obj = this.addExpressionRepresentation(node, state);
    if (node.argument) {
      c(node.argument, obj);
    }
  },

  /*PATTERNS*/

  
  /* working ??? */
  ObjectPattern(node, state, c) {
    const obj = this.addPatternRepresentation(node, state);
    this.iterateOptional(node.properties, obj, c);
  },

  ArrayPattern(node, state, c) {
    const obj = this.addPatternRepresentation(node, state);
    this.iterateOptional(node.elements, obj, c);
  },

  /*CLAUSES*/

  SwitchCase(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
    if (node.test) {
      c(node.test, obj);
    }
    this.iterateOptional(node.consequent, obj, c);
  },

  CatchClause(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
    if (node.guard) {
      c(node.guard, obj);
    }
    this.iterateOptional(node.body, obj, c);
  },

  ComprehensionBlock(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
      c(node.right, obj);
  },
 
  ComprehensionIf(node, state, c) {
    const obj = this.addClauseRepresentation(node, state);
      c(node.test, obj);
  },

  /*MISCELLANEOUS*/

  Identifier(node, state, c) {
    this.addMiscRepresentation(node, state);
    //this.addDomItem(node.name, obj);
  },

  Literal(node, state, c) {
    this.addMiscRepresentation(node, state);
  },
};
