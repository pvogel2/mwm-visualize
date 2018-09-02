class Renderer {
  constructor() {
    this.stats = window.Stats ? new Stats() : null;
    this.running = false;
	this.paused = false;
	this.three = {
		szene : null,
		renderer : null,
		camera : null,
		control : null,
		raycaster : null,
		clock : null
	};

	this.geometry = {
		objects : {},
        intersect : []
	};

	//stuff for intersection detection
	this.mouse = new THREE.Vector2();
	this.frustum = new THREE.Frustum();
	this.INTERSECTED = [];
	this.callbacks = {
		"render": [],
		"move": [],
		"keydown": [],
		"click": []
	};
	//stuff for resource handling
	this.res = "/obj/";

	//setup the three szene
			this.parent = document.querySelector( "#threejs-container" );
			this.three.scene = new THREE.Scene();
            this.width = this.parent.getClientRects()[0].width;
            this.height = this.parent.getClientRects()[0].height;
			//setup the three camera
			this.three.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );
			this.three.camera.position.set(0, 15, 40);
			//setup the used three renderer
			this.three.renderer = new THREE.WebGLRenderer({antialias: false});
			this.three.renderer.setSize( this.width, this.height );
			this.three.renderer.shadowMapSoft = false;
			this.three.renderer.gammaInput = true;
			this.three.renderer.gammaOutput = true;

			this.three.control = new THREE.OrbitControls(this.three.camera, this.three.renderer.domElement);
			//this.three.control.userPanSpeed = 0.2;
			//this.three.controls.target.set(0,0,0);

			// initialize object to perform world/screen calculations

			//this.three.projector = new THREE.Projector();

			// this.three.raycaster = new THREE.Raycaster()
			// this.three.raycaster.params.Points.threshold = 4;

			this.three.clock = new THREE.Clock();
			this.three.loadingmanager = new THREE.LoadingManager();
            this.three.textureLoader = new THREE.TextureLoader( this.three.loadingmanager );
            this.three.loader = new THREE.JSONLoader( this.three.loadingmanager );
			this.three.objloader = new THREE.ObjectLoader( this.three.loadingmanager );

			this.parent.append( this.three.renderer.domElement );

			this.three.renderer.domElement.addEventListener("click", function(event) {
				this.onContainerClick(event);
			}.bind(this));
			this.three.renderer.domElement.addEventListener("mousemove", function(event) {
				this.onContainerMousemove(event);
			}.bind(this));

			window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
			window.addEventListener( 'keydown', this.onKeydown.bind(this), false );
  }

  onWindowResize() {
		    this.width = this.parent.getClientRects()[0].width;
            this.height = this.parent.getClientRects()[0].height;
            this.three.renderer.setSize( this.width, this.height );
			this.three.camera.aspect = this.width / this.height;
			this.three.camera.updateProjectionMatrix();
		}

		onKeydown(event) {
			if (event.keyCode == 80) { //pP
				this.paused ? this.continu() : this.pause();
			}
            this.callbacks["keydown"].forEach(listener => {
				listener(event, this.INTERSECTED);
			});
		}

		onContainerClick(event) {
			event.preventDefault();
			this._setIntersection(event);
            this.callbacks["click"].forEach(listener => {
				listener(event, this.INTERSECTED);
			});
		}

		onContainerMousemove(event) {
            event.preventDefault();
            this._setIntersection(event);

            this.callbacks["move"].forEach(listener => {
				listener({"type": "move"}, this.INTERSECTED);
			});
		}

		start() {
		    if (this.stats) {
		      this.stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		      this.parent.appendChild( this.stats.dom );
		    }
			this._setupLights();
			this.paused = false;
			this.running = true;
			this._render();
		}
		//continue is a reserved word in javascript
		continu() {
			this.paused = false;
			this.three.clock.start();
			this._render();
		}

		pause() {
			this.paused = true;
			this.three.clock.stop();
		}
		stop() {
			this.running = false;
			this.three.clock.stop();
		}

        _setIntersection(event){
            /*var offset = $(this.three.renderer.domElement).offset();
			var scrollLeft = $(window).scrollLeft();
			var scrollTop = $(window).scrollTop();
			this.mouse.x = ( (event.clientX - offset.left + scrollLeft) / this.width ) * 2 - 1;
			this.mouse.y = - ( (event.clientY - offset.top + scrollTop) / this.height ) * 2 + 1;
            this.three.raycaster.setFromCamera( this.mouse, this.three.camera );

			// calculate objects intersecting the picking ray
			this.INTERSECTED = this.three.raycaster.intersectObjects( this.geometry.intersect );*/
        }

        _loadObject(file, name) {
			this.three.loader.load( this.res + file, function ( object, materials ) {
				var obj = new THREE.Mesh( object, new THREE.MeshFaceMaterial( materials ));
				this.geometry.objects[name] = obj;
				obj.castShadow = true;
				this.three.scene.add( obj );
			}.bind(this), this.res);
		}

	getTexture(path) {
		return this.three.textureLoader.load( this.res + path )
	}

	showObject(ids, visible) {
		if (!Object.prototype.toString.call( ids ) === '[object Array]'){
			ids = [ids];
		}
		for (var i = 0; i < ids.length; i++){
			var id = ids[i];
			if (this.geometry.objects[id]) {
				this.geometry.objects[id].visible = !!visible;
			} else {
				console.log("showObject: Object with id " + id + " not found.");
			}
		}
	}

	getObject(id) {
        if (this.geometry.objects[id]) {
			return this.geometry.objects[id];
		} else {
			console.log("getObject: Object with id " + id + " not found.");
			return null;
		}
	}

    addObject(id, obj, intersect) {
        if (this.geometry.objects[id]) {
			console.log("Found object id '" + id +"' , not adding data.");
			return;
		}
		this.geometry.objects[id] = obj;
		this.three.scene.add( obj );
        if (intersect) {
            this.geometry.intersect.push(obj);
        }
	}

        _setupLights() {
			var ambientLight = new THREE.AmbientLight( 0x333333 ); // soft white light
			this.three.scene.add( ambientLight );
		}

		_updateIntersection(){
			this.INTERSECTED = [];
		}

		_updateObjects(){
		}

		_render(){
			//if (this.running && !this.paused) {
				requestAnimationFrame(this._render.bind(this));
				this.three.renderer.render(this.three.scene, this.three.camera);
				// this.update();
			//}
		}

		transition(v, time) {
			if (this.transitioning) return;
			this.transitionVector = v.clone();
			this.transitionTime = Math.max(time, 0.1);
			this.transitionStart = this.three.clock.getElapsedTime();
			//this.transitionPosition = this.three.camera.position.clone();
            //var v = this.transitionPosition.clone().sub(this.three.control.center);
            //this.transitionDistance0 = v.length();
            //this.transitionDistance1 = this.transitionVector.length();
            //this.transitionScaler =  this.transitionDistance0 / this.transitionDistance1;
            //this.transitionTarget = this.transitionVector.clone().sub(this.three.camera.position).setLength(this.three.camera.position.length);
            //this.transitionVector.clone().setLength(this.transitionDistance1-this.transitionDistance0);
            this.transitioning = true;
		}

		_transitionUpdate(){
			if (!this.transitioning) return;
			var alpha = Math.min((this.three.clock.getElapsedTime() - this.transitionStart)/this.transitionTime, 1.0);
			if (alpha >= 1.0) {
				this.transitioning = false;
				this.three.control.center.copy(this.transitionVector);
				//this.three.camera.position.copy(this.transitionTarget);
			} else {
                //this.three.camera.position.lerp(this.transitionTarget, alpha);
                this.three.control.center.lerp(this.transitionVector, alpha);
			}

		}

		update() {
		    if (this.stats) this.stats.begin();
			this.three.control.update();

			/*this.frustum.setFromMatrix(
				new THREE.Matrix4().multiplyMatrices(
					this.three.camera.projectionMatrix,
					this.three.camera.matrixWorldInverse
				)
			);*/

			/*const data = {
				canvasWidth: this.three.renderer.context.canvas.width,
				canvasHeight: this.three.renderer.context.canvas.height
			};*/

			/*this.callbacks["render"].forEach(listener => {
				listener({"type": "render"}, data);
			});*/
			//this._updateObjects();
			//this._updateIntersection();
			//this._transitionUpdate();
			if (this.stats) this.stats.end();
		}

		registerEventCallback(type, listener) {
			if (!this.callbacks[type]) {
				return;
			}
			this.callbacks[type].push(listener);
		}

		addAxes(size) {
			
			var a_geometry = new THREE.Geometry();
	
			var a_material = new THREE.ShaderMaterial({
				vertexColors: THREE.VertexColors,
				shading : THREE.SmoothShading,
				vertexShader : 'varying vec4 axColor;void main() {\n\taxColor = vec4( color, 1.0 );gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
				fragmentShader : 'varying vec4 axColor;void main() {\n\tgl_FragColor = axColor;\n}'
		    });
	
	        a_geometry.colors[ 0 ] = a_geometry.colors[ 1 ] = new THREE.Color( 1, 0, 0);
	        a_geometry.colors[ 2 ] = a_geometry.colors[ 3 ] = new THREE.Color( 0, 1, 0);
	        a_geometry.colors[ 4 ] = a_geometry.colors[ 5 ] = new THREE.Color( 0, 0, 1);
	
			a_geometry.vertices.push(
					new THREE.Vector3(0,0,0), new THREE.Vector3(size,0,0),
					new THREE.Vector3(0,0,0), new THREE.Vector3(0,size,0),
					new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-size)
			);
			this.addObject("axes", new THREE.LineSegments( a_geometry, a_material) );

		}

		addGrid(size, dimension) {
				        /*add base grid*/
	        var gridHelper = new THREE.GridHelper( size, dimension );
	        gridHelper.setColors(
	            new THREE.Color( 0x111122 ),
	            new THREE.Color( 0x222244 )
	        );
	        gridHelper.material.opacity = 0.5;
	        gridHelper.material.transparent = true;
	
	        this.addObject("grid", gridHelper);
		}

		projectVisible(point) {
			var vector = new THREE.Vector3(point[0],point[1],point[2]);
			if(this.frustum.containsPoint( vector )){
			   return vector.project(this.three.camera);
			}
			return null;
		}

		createBufferedGeometry() {
			return new THREE.BufferGeometry();
		}

		createOneDimGraphicArray(length) {
			return new Float32Array( length );
		}

		createThreeDimGraphicArray(length) {
			return new Float32Array( 3* length );
		}
};
export { Renderer };
