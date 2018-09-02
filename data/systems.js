angular.module('threejs', []).factory('renderer', function() {
	return new MWM.appl();
});

var eliteApp = angular.module("eliteApp", ['threejs']);

eliteApp.filter("byName", function() {
        return function(list, name) {
			if (!list || typeof list.length == "undefined") {
				console.log("Warning: no array provided in eliteApp.filter.");
				return null;
			}
			for (var i = 0; i < list.length; i++) {
                if (list[i].name == name) {
                    return list[i];
                }
            }
            return null;
        }
});

eliteApp.controller("eliteCtrl", [ '$scope','$window','$http','$filter','renderer', function($scope, $window, $http, $filter, renderer) {
	$scope.renderer = renderer;
	$scope.lang = {en:true, de:false};
    $scope.minDistance = 160;
	$scope.navs = ["Map","Edit","Routing","Materials"];
	$scope.activeNav = $scope.navs[0];
	$scope.systems = [];
	$scope.route = {
		systems:[]
	};
	$scope.system = {};
	$scope.planet = {};
    $scope.commodity = {};
	$scope.systemKey = "";
	$scope.planetKey = "";
	$scope.materialKey = "";
	$scope.baseKey = "";
    $scope.commodityKey = "";
    $scope.illealKey = "";

	$scope.systemTemplate = {
		name : "",
		station : "",
		pos : [0, 0, 0],
		commodities : [],
        fuel:true,
        fraction:"",
		distance : 0,
		showLabel: true,
		illegal : [],
        planets : []
	};
    $scope.commodityTemplate = {
		rare:true,
		max:-1,
		name:"",
		de:""
	};

    $scope.planetTemplate = {
        name : "",
        materials : [],
        bases : [],
        barnacles : {},
        _materials : "",
        _bases : ""
    };

	$scope.illegalTemplate = "";
    $scope.stationTemplate = {
		name : "",
		distance : 0,
		type : "coriolis",
        backmarket:false
	};
    $scope.colors = {
        standard : (new THREE.Color( 0xFFFFFF)),
        distant : (new THREE.Color( 0x00FF00)),
        target : (new THREE.Color( 0xFFFF00)),
		alliance : (new THREE.Color( 0x029E4C)),
		federation : (new THREE.Color( 0xFF0000)),
		empire : (new THREE.Color( 0x00B3F7)),
		independent : (new THREE.Color( 0xee00ee))
    };
    $scope.fractionTypes = [
        "empire", "federation", "alliance", "independent"
    ];

	$scope.stationTypes = [
		"coriolis", "outpost", "base", "camp"
	];

    $scope.materials = [];

    /*configure map items*/
    $scope.showFuel = false;
	$scope.showStations = false;
	$scope.showGrid = true;
	$scope.showRouting = true;
    $scope.showBasic = false;

    /*configure edit items*/
    $scope.showAll = true;

    /* SYSTEM ----------------------------------------------------------------*/
    $scope.addSystem = function() {
        var name = jQuery("#newSystem").val();
		if (!name) return;
		var system = $filter("byName")($scope.systems, name);
		if (!system){
			system = angular.copy($scope.systemTemplate);
			system.name = name;
			$scope.systems.push(system);
		}
		$scope.setSystem(system);
		jQuery("#newSystem").val("");
        var url = '/data/find?name=' +encodeURIComponent(name);
        $http.get(url).then(function(res){
            if (res.data) {
                console.log(res.data);
                system.pos[0] = Math.round(res.data.x);
                system.pos[1] = Math.round(res.data.y);
                system.pos[2] = Math.round(res.data.z);
            };
        });
    };

    $scope.filterByProps = function(s, idx, arr) {
        if ($scope.showAll) return true;
        return (s.commodities && s.commodities.length > 0);
    };

    $scope.changeSystem = function() {
        var system = $filter("byName")($scope.systems, $scope.systemKey);
		if (system){
			$scope.calc(system);
		}
    };

    $scope.setSystem = function(system) {
		if (system) {
			$scope.system = system;
		} else {
			$scope.system = angular.copy($scope.systemTemplate);
		}
		$scope.system.planets.length > 0
			? $scope.setPlanet($scope.system.planets[0])
			: $scope.setPlanet($scope.planetTemplate)
		;


        if (!$scope.system.commodities) {
			$scope.system.commodities = [];
		}
        $scope.system.commodities.length > 0
            ? $scope.setCommodity($scope.system.commodities[0])
            : $scope.setCommodity($scope.commodityTemplate)
        ;

        if (!$scope.system.illegal) {
			$scope.system.illegal = [];
		}
        $scope.system.illegal.length > 0
            ? $scope.setIllegal($scope.system.illegal[0])
            : $scope.setIllegal($scope.illegalTemplate)
        ;
        $scope.systemKey = $scope.system.name;
    };

    $scope.removeSystem = function() {
        for (var i = 0; i < $scope.systems.length; i++) {
			if ($scope.systemKey == $scope.systems[i].name) {
				$scope.systems.splice(i, 1);
				//TODO:$scope._unsetMaterialSource("*", $scope.system.name, key);

				if (i > 0) {
					$scope.setSystem($scope.systems[0]);
				} else {
					$scope.setSystem($scope.systemTemplate);
				}
				return;
			}
		}
    };
    /* COMMODITIY ------------------------------------------------------------*/
    $scope.addCommodity = function(){
		var name = jQuery("#newCommodity").val();
		if (!name) return;
		var comm = $filter("byName")($scope.system.commodities, name);
		if (!comm){
			comm = angular.copy($scope.commodityTemplate);
			comm.name = name;
			$scope.system.commodities.push(comm);
		}
		$scope.setCommodity(comm);
		jQuery("#newCommodity").val("");
    };

    $scope.setCommodity = function(comm) {
        $scope.commodity = comm;
        $scope.commodityKey = $scope.commodity.name;
    };

    $scope.changeCommodity = function() {
		var comm = $filter("byName")($scope.system.commodities, $scope.commodityKey);
		if (comm){
			$scope.setCommodity(comm);
		}
	};

    $scope.removeCommodity = function() {
		for (var i = 0; i < $scope.system.commodities.length; i++) {
			if ($scope.commodityKey == $scope.system.commodities[i].name) {
				$scope.system.commodities.splice(i, 1);

				if (i > 0) {
					$scope.setCommodity($scope.system.commodities[0]);
				} else {
					$scope.setCommodity($scope.commodityTemplate);
				}
				return;
			}
		}
    };

    /* PLANET ----------------------------------------------------------------*/
    $scope.addPlanet = function(){
		var name = jQuery("#newPlanet").val();
		if (!name) return;
		var planet = $filter("byName")($scope.system.planets, name);
		if (!planet){
			planet = angular.copy($scope.planetTemplate);
			planet.name = name;
			$scope.system.planets.push(planet);
		}
		$scope.setPlanet(planet);
		jQuery("#newPlanet").val("");
    };

    $scope.setPlanet = function(planet) {
		$scope.planet = planet;
		$scope.planetKey = $scope.planet.name;
		if ($scope.planet.materials.length > 0) {
			$scope.materialKey = $scope.planet.materials[0];
		} else {
			$scope.materialKey = "";
		}
		if ($scope.planet.bases.length > 0) {
			$scope.baseKey = $scope.planet.bases[0];
		} else {
			$scope.baseKey = "";
		}
	};

    $scope.updatePlanet = function(index) {
        var p = $scope.system.planets[index];
        p.materials = p._materials.split(",");
        for (var i = 0; i < p.materials.length; i++) {
            p.materials[i] = p.materials[i].trim();
            $scope._setMaterialSource(p.materials[i], $scope.system.name, p.name);
        }
        p._materials = p.materials.join();

        p.bases = p._bases.split(",");
        for (var i = 0; i < p.bases.length; i++) {
            p.bases[i] = p.bases[i].trim();
        }
        p._bases = p.bases.join();
    };

    $scope.changePlanet = function() {
		var planet = $filter("byName")($scope.system.planets, $scope.planetKey);
		if (planet){
			$scope.setPlanet(planet);
		}
	};

    $scope.removePlanet = function() {
		var key = $scope.planetKey;
		for (var i = 0; i < $scope.system.planets.length; i++) {
			if (key == $scope.system.planets[i].name) {
				$scope.system.planets.splice(i, 1);
				$scope._unsetMaterialSource("*", $scope.system.name, key);

				if (i > 0) {
					$scope.setPlanet($scope.system.planets[0]);
				} else {
					$scope.setPlanet($scope.planetTemplate);
				}
				return;
			}
		}
    };

    /* BASE ------------------------------------------------------------------*/
    $scope.addBase = function() {
		var base = jQuery("#newBase").val();
		if (!base) return;
		var push = true;
		for (var i = 0; i < $scope.planet.bases.length; i++) {
			if ($scope.planet.bases[i] == base) {
				push = false;
			}
		}
		if (push) $scope.planet.bases.push(base);

		$scope.baseKey = base;
		jQuery("#newBase").val("");
	};

	$scope.removeBase = function() {
		for (var i = 0; i < $scope.planet.bases.length; i++) {
			if ($scope.planet.bases[i] == $scope.baseKey) {
				$scope.planet.bases.splice(i, 1);
				if ($scope.planet.bases.length > 0) {
					$scope.baseKey = $scope.planet.bases[0];
				}
				return;
			}
		}
    };

    /* ILLEGAL COMMODITIES ---------------------------------------------------*/
    $scope.addIllegal = function() {
        if (!$scope.system.illegal) {
			$scope.system.illegal = [];
		}
        var illegal = jQuery("#newIllegal").val();
        for (var i = 0; i < $scope.system.illegal.length; i++) {
            if ($scope.system.illegal[i] == illegal) {
                $scope.setIllegal(illegal);
                return;
            }
        }
        $scope.system.illegal.push(illegal);
        $scope.setIllegal(illegal);
	};

    $scope.setIllegal = function(illegal) {
        $scope.illegalKey = illegal;
    };

    $scope.removeIllegal = function(){
        for (var i = 0; i < $scope.system.illegal.length; i++) {
            if ($scope.system.illegal[i] == $scope.illegalKey) {
                $scope.system.illegal.splice(i, 1);
                if ($scope.system.illegal.length > 0) {
                    $scope.setIllegal($scope.system.illegal[0]);
                }
                return;
            }
        }
	};

    /* MATERIAL --------------------------------------------------------------*/
    $scope.addMaterial = function() {
		var material = jQuery("#newMaterial").val();
		if (!material) return;
		var push = true;
		for (var i = 0; i < $scope.planet.materials.length; i++) {
			if ($scope.planet.materials[i] == material) {
				push = false;
			}
		}
		if (push) $scope.planet.materials.push(material);

		$scope.materialKey = material;
		jQuery("#newMaterial").val("");
		$scope._setMaterialSource(material, $scope.system.name, $scope.planet.name);
	};

	$scope.removeMaterial = function() {
		for (var i = 0; i < $scope.planet.materials.length; i++) {
			if ($scope.planet.materials[i] == $scope.materialKey) {
				$scope.planet.materials.splice(i, 1);
				$scope._unsetMaterialSource($scope.materialKey, $scope.system.name, $scope.planet.name);
				if ($scope.planet.materials.length > 0) {
					$scope.materialKey = $scope.planet.materials[0];
				} else {
					$scope.materialKey = "";
				}
				return;
			}
		}
    };

	$scope._setMaterialSource = function(material, system, planet) {
		var m = $filter("byName")($scope.materials, material);
		if (!m) {
            m = {
				"name": material,
				"systems": [{"name" : system, "planets" : [planet]}]
			};
        }
		var s = $filter("byName")(m.systems, system);
        if (!s) {
            s = {"name" : system, "planets" : []};
			m.systems.push(s);
        }
		var p = $filter("byName")(s.planets, planet);
		if (!p) {
			s.planets.push(planet);
		}
    };

	$scope._unsetMaterialSource = function(material, system, planet) {

		var mList = material == "*" ? $scope.materials : [$filter("byName")($scope.materials, material)];

		for (m in mList) {
			var s = $filter("byName")(m.systems, system);
			if (!s) continue;
			for (var i = 0; i < s.planets.length; i++) {
				if (s.planets[i] == planet) {
					s.planets.splice(i, 1);
				}
			}
		}
	};

    /* ROUTING ---------------------------------------------------------------*/
    $scope.addRouteSystem = function(){
        var system = $filter("byName")($scope.systems, $scope.name);
        $scope.route.systems.push({"name":system.name});
	};

	$scope.removeRouteSystem = function(key){
		for (var i = 0; i < $scope.route.systems.length; i++) {
			if (key == $scope.route.systems[i].name) {
				$scope.route.systems.splice(i, 1);
			}
		}
	};

    /* -----------------------------------------------------------------------*/
	$scope.setNav = function(nav) {
		$scope.activeNav = nav;
	};

    $scope.new = function() {
        $scope.system = angular.copy($scope.systemTemplate);
        $scope.planetTemplate = {
            name : "",
            materials : [],
            bases : [],
            _materials : "",
            _bases : ""
        };
	};

	$scope.edit = function(obj) {
		if (obj) {
			$scope.setSystem(obj);
			$scope.activeNav = "Edit";
		}
	};

    $scope.filter = function(obj) {
        return $scope.activeNav == "Edit" ? obj.distance > 160 : true;
    };

    $scope.reset = function(){
        $scope.new();
    };

	$scope.remove = function(obj) {
		if (obj) {
			for (var i = 0; i < $scope.systems.length; i++) {
                if ($scope.systems[i].name == obj.name) {
                    $scope.systems.splice(i, 1);
                }
            }
		}
	};

	$scope.toggleShowRouting = function(){
		$scope.renderer.showObject("route", $scope.showRouting);
	};

	$scope.toggleShowBasic = function(){
		for (var i = 0; i < $scope.systems.length; i++) {
			$scope.systems[i].showLabel = $scope.showBasic
				? true
				: $scope.systems[i].commodities && $scope.systems[i].commodities.length > 0;
		}
	};

	$scope.toggleShowGrid = function(){
		$scope.renderer.showObject(["grid","dlLines","dlCircles"], $scope.showGrid);
	};

    $scope.save = function() {

		if ($scope.system.name && ! $filter("byName")($scope.systems, $scope.system.name)) {
            $scope.systems.push(angular.copy($scope.system));
	    }

        for (var i = 0; i < $scope.systems.length; i++) {
            if (typeof $scope.systems[i].fuel =="undefined") {
                $scope.systems[i].fuel = true;
            }
        }

        for (var i = 0; i < $scope.systems.length; i++) {
            if (typeof $scope.systems[i].planets =="undefined") {
                $scope.systems[i].planets = [];
            }
            if (typeof $scope.systems[i].fraction =="undefined") {
                $scope.systems[i].fraction = "";
            }
        }

		var data = {
				systems: $scope.systems,
				routes: $scope.route,
                materials: $scope.materials
		};

        $http.post('/data/write', data).then(function(res){
	    	console.log("saved: ",res);
	    },
	    function(err) {
	    	console.log("failed: ", err);
	    });
	};

    $scope.coords = function(obj) {
        return new THREE.Vector3(obj.pos[0], obj.pos[1], -1 * obj.pos[2]);
    };

    $scope.search = function() {
		var system = $filter("byName")($scope.systems, $scope.systemKey);
		if (system){
			$scope.calc(system);

		}
	};

    $scope._systemcolor = function(s) {
		if ($scope._systemvalid(s)) {
			return $scope.colors.distant;
		} else if (s.distance == 0) {
			return $scope.colors.target;
		} else if (s.fraction) {
			return $scope.colors[s.fraction];
		} else if (s.commodities && s.commodities.length) {
			return $scope.colors.standard;
		} else {
			return $scope.colors.standard;
		};

	};

	$scope._systemvalid = function(s) {
		return (s.distance >= $scope.minDistance && s.station && s.station.name);
	};

	$scope._systemsize = function(s) {
		if (s.commodities && s.commodities.length) {
			return 30;
		} else {
			return 15;
		};

	};
	$scope.calc = function(obj) {
		if (obj) {
			$scope.setSystem(obj);
            var v0 = $scope.coords(obj);
            var p = $scope.renderer.getObject("points");
    		var li = $scope.renderer.getObject("elite");
    		var li_pos = li.geometry.attributes.position.array;
    		var li_idx = 0;
    		/*1*/

			for (var i = 0; i < $scope.systems.length; i++) {
                var s = $scope.systems[i];
                var v1 = $scope.coords(s);

				s.distance = v1.distanceTo(v0);
                if ($scope._systemvalid(s)) {
    				if (li_idx < 20 * 3) {
    					v0.toArray(li_pos, li_idx);
                        v1.toArray(li_pos, li_idx + 3);
    					li_idx += 6;
    				}
                }
				$scope._systemcolor(s).toArray( p.geometry.attributes.color.array, i*3 );

			}
            for (var i = li_idx; i < li_pos.length; i++) {
    			li_pos[i] = li_pos[i+1] = li_pos[i+2]
    			= li_pos[i+3] = li_pos[i+4] = li_pos[i+5]
    			= 0;
    		}
    		p.geometry.attributes.color.needsUpdate = true;
            li.visible = true;
    		li.geometry.attributes.position.needsUpdate = true;
    		li.geometry.attributes.color.needsUpdate = true;
        }
	};

    $http.get('/data/read').then(function(res){
		$scope.systems = res.data.systems;
		$scope.route = res.data.routes;
        $scope.materials = res.data.materials;

        //add axes to map
		var a_geometry = new THREE.Geometry();

		var a_material = new THREE.ShaderMaterial({
			vertexColors: THREE.VertexColors,
			//shading : THREE.SmoothShading,
			vertexShader : 'varying vec4 axColor;void main() {\n\taxColor = vec4( color, 1.0 );gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
			fragmentShader : 'varying vec4 axColor;void main() {\n\tgl_FragColor = axColor;\n}'
	    });

        a_geometry.colors[ 0 ] = a_geometry.colors[ 1 ] = new THREE.Color( 1, 0, 0);
        a_geometry.colors[ 2 ] = a_geometry.colors[ 3 ] = new THREE.Color( 0, 1, 0);
        a_geometry.colors[ 4 ] = a_geometry.colors[ 5 ] = new THREE.Color( 0, 0, 1);

		a_geometry.vertices.push(
				new THREE.Vector3(0,0,0), new THREE.Vector3(10,0,0),
				new THREE.Vector3(0,0,0), new THREE.Vector3(0,10,0),
				new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-10)
		);
		$scope.renderer.addObject("axes", new THREE.LineSegments( a_geometry, a_material) );

  		//add route to map
        if ($scope.route.systems.length > 1) {
            var r_geometry = new THREE.BufferGeometry();

            var positions = new Float32Array( $scope.route.systems.length * 3 );
            var colors = new Float32Array( $scope.route.systems.length * 3 );
            var lengths = new Float32Array( $scope.route.systems.length );

            var p0 = new THREE.Vector3();
            var l = 0.0;
            for (var i = 0; i < $scope.route.systems.length; i++) {
				var s = $filter("byName")($scope.systems, $scope.route.systems[i].name);

                var p1 = $scope.coords(s);
                p1.toArray(positions, i*3);
                var m = Math.random();
                colors[ i*3 + 0 ] = m;
                colors[ i*3 + 1 ] = m*0.5;
                colors[ i*3 + 2 ] = m*0.5;
                if (i>0) {
                    l += p1.distanceTo(p0);
                }
                lengths[i] = l;
                p0.copy(p1);
			}
            for (var i = 0; i < lengths.length; i++) {
                lengths[i] = lengths[i] * lengths.length / l;
            }
            r_geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
            r_geometry.addAttribute( 'vcolor', new THREE.BufferAttribute( colors, 3 ));
            r_geometry.addAttribute( 'vdistance', new THREE.BufferAttribute( lengths, 1 ));

            var	r_uniforms = {
				texture:   { type: "t", value: $scope.renderer.getTexture( "random.png" ) },
                time:{type:"f", value:0.0},
                route:{type:"f", value:l}
			};
			r_uniforms.texture.value.wrapS = r_uniforms.texture.value.wrapT = THREE.RepeatWrapping;
            var r_material = new THREE.ShaderMaterial({
                uniforms : r_uniforms,
                transparent: true,
                vertexShader : document.getElementById( 'routevertexshader' ).textContent,
    		    fragmentShader : document.getElementById( 'routefragmentshader' ).textContent
    	    });

            $scope.renderer.addObject("route", new THREE.Line( r_geometry, r_material) );
		}

        /*setpu connection lines*/
        //for now some hard coded limit for buffer size
        var MAX_POINTS = 2 * Math.ceil($scope.systems.length / 2);

        var c_material = new THREE.ShaderMaterial({
            vertexColors: THREE.VertexColors,
            //shading : THREE.SmoothShading,
            vertexShader : 'varying vec4 vColor;\n\tvoid main() {\n\tvColor = vec4( color, 1.0 );\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
            fragmentShader : 'varying vec4 vColor;\n\tvoid main() {\n\tgl_FragColor = vColor;\n}'
        });
        // geometry, need to buffer due to dynamic changing values
        var c_geometry = new THREE.BufferGeometry();

        // attributes
        var c_positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
        var c_colors = new Float32Array( MAX_POINTS * 3 );

        for ( var i = 0; i < MAX_POINTS * 0.5; i ++ ) {

            // positions

            c_positions[ i * 6 + 0 ] = 0;
            c_positions[ i * 6 + 1 ] = 0;
            c_positions[ i * 6 + 2 ] = 0;
            c_positions[ i * 6 + 3 ] = 0;
            c_positions[ i * 6 + 4 ] = 0;
            c_positions[ i * 6 + 5 ] = 0;

            $scope.colors.target.toArray(c_colors, i * 6);
            $scope.colors.distant.toArray(c_colors, i * 6 + 3);

        }

        c_geometry.addAttribute( 'position', new THREE.BufferAttribute( c_positions, 3 ) );
        c_geometry.addAttribute( 'color', new THREE.BufferAttribute( c_colors, 3 ) );

        $scope.renderer.addObject("elite", new THREE.LineSegments( c_geometry, c_material) );

        /*add base grid*/
        var gridHelper = new THREE.GridHelper( 150, 10 );
        gridHelper.setColors(
            new THREE.Color( 0x111122 ),
            new THREE.Color( 0x222244 )
        );
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;

        $scope.renderer.addObject("grid", gridHelper);

        /*visualize systems*/
        /*distance lines to base grid*/
        var dl_geometry = new THREE.Geometry();
        var dl_material = new THREE.LineBasicMaterial({
            color: 0x444444,
            opacity : 0.3,
            transparent : true
        });

        /*base circle of distant line (template)*/
        var dl_baseObj = new THREE.Object3D();
        var dl_base = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 8),
            new THREE.MeshLambertMaterial({
                color: 0x444444,
                opacity : 0.6,
                side: THREE.DoubleSide,
                transparent : true
            })
        );

        /*stars setup*/
        var	s_uniforms = {
            texture:   { type: "t", value: $scope.renderer.getTexture( "disc.png" ) },
        };
        s_uniforms.texture.value.wrapS = s_uniforms.texture.value.wrapT = THREE.RepeatWrapping;

        var s_material = new THREE.ShaderMaterial( {
            uniforms: s_uniforms,
            depthWrite: false,
            transparent: true,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent

        });

        var s_geometry = new THREE.BufferGeometry();
        var s_positions = new Float32Array( $scope.systems.length * 3 );
        var s_colors = new Float32Array( $scope.systems.length * 3 );
        var s_sizes = new Float32Array( $scope.systems.length);

        for (var i = 0; i < $scope.systems.length; i++) {
            var s = $scope.systems[i];
            /*reset distance value of the loaded system*/
			s.distance = -1.0;
			/*reset showLabel value of the loaded system*/
			s.showLabel = s.commodities && s.commodities.length > 0;
			/*add distance line for system*/
            var v0 = $scope.coords(s);
            dl_geometry.vertices.push(
                v0.clone(),
                v0.clone().setY(0)
            );
            /*add base circle for system*/
            var c = dl_base.clone();
            c.translateX(s.pos[0]);
            c.translateZ(-1 * s.pos[2]);
            c.rotateOnAxis(new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(-90));
            dl_baseObj.add(c);

            /*add star for system*/
            $scope.coords(s).toArray(s_positions, i * 3);
            $scope._systemcolor(s).toArray( s_colors, i * 3);
            s_sizes[i] = $scope._systemsize(s);
        }
        $scope.renderer.addObject( "dlCircles", dl_baseObj );
        $scope.renderer.addObject("dlLines", new THREE.LineSegments( dl_geometry, dl_material) );

        s_geometry.addAttribute( 'position', new THREE.BufferAttribute( s_positions, 3 ));
        s_geometry.addAttribute( 'size', new THREE.BufferAttribute( s_sizes, 1 ));
        s_geometry.addAttribute( 'color', new THREE.BufferAttribute( s_colors, 3 ));
        s_geometry.dynamic = true;

        $scope.renderer.addObject("points", new THREE.Points( s_geometry, s_material), true);

 		$scope.renderer.registerEventCallback("move", (event, intersections) => {
            var intersected = intersections && intersections.length ? intersections[0] : null;
 			if (!$scope.visibleDomItems) {
                $scope.visibleDomItems = [];
            }
			var div = null;
			for (var i = 0; i < $scope.visibleDomItems.length; i++) {
				var index = $scope.visibleDomItems[i];
				div = $("#label-system-"+ index + "-details");
				div.addClass("hidden");
				var s = $scope.systems[index];
				s.showLabel = ($scope.showBasic || s.commodities && s.commodities.length > 0);
            }
            $scope.visibleDomItems = [];

            if (intersected && intersected.index) {
            	div = $("#label-system-"+ intersected.index + "-details");
            	$scope.systems[intersected.index].showLabel = true;
            	$scope.$apply();
            	div.removeClass("hidden");
            	$scope.visibleDomItems.push(intersected.index);
            }
        });
 
 	    $scope.renderer.registerEventCallback("click", (event, intersections) => {
            var intersected = intersections && intersections.length ? intersections[0] : null;
            var s = null;
			if (intersected && intersected.index) {
                s = $scope.systems[intersected.index];
				$scope.calc(s);
			    $scope.$apply();
            } else {
                //$scope.updateStars();
            }
			if (event.shiftKey) {
				var c = new THREE.Vector3();
				if (s) {
					c = $scope.coords(s);
				}
				$scope.renderer.transition(c, 1.0);
			}
 	    });

 	    $scope.renderer.registerEventCallback("render", (event, intersections) => {
                r_uniforms.time.value += 0.1;
				var offset = $($scope.renderer.three.renderer.domElement).offset();
                var widthHalf = 0.5*$scope.renderer.three.renderer.context.canvas.width;
			    var heightHalf = 0.5*$scope.renderer.three.renderer.context.canvas.height;

				var frustum = new THREE.Frustum();
				frustum.setFromMatrix(
					new THREE.Matrix4().multiplyMatrices(
						$scope.renderer.three.camera.projectionMatrix,
						$scope.renderer.three.camera.matrixWorldInverse
					)
				);
				for (var i = 0; i < s_geometry.attributes.position.count; i ++) {
					var div = $("#label-system-"+i);
					var vector = (new THREE.Vector3()).fromArray(s_geometry.attributes.position.array, 3*i);
					if(frustum.containsPoint( vector )){
				    	vector.project($scope.renderer.three.camera);

				    	vector.x = ( vector.x * widthHalf ) + widthHalf + 20;
				    	vector.y = - ( vector.y * heightHalf ) + heightHalf + 5;

						div.css("top", vector.y);
						div.css("left", vector.x);
						div.css("display","block");
					} else {
						div.css("display","none");
					}
				}
 	    });

 	    $scope.renderer.registerEventCallback("keydown", (event, data) => {
            if (event.keyCode == 82 ) {
				$scope.showRouting = !$scope.showRouting;
                $scope.toggleShowRouting();
				$scope.$apply();
            } else if (event.keyCode == 71 ) {
				$scope.showGrid = !$scope.showGrid;
				$scope.toggleShowGrid();
				$scope.$apply();
			} else if (event.keyCode == 66 ) {
				$scope.showBasic = !$scope.showBasic;
				$scope.toggleShowBasic();
				$scope.$apply();
			} else if (event.keyCode == 70 ) {
				$scope.showFuel = !$scope.showFuel;
				$scope.$apply();
			} else if (event.keyCode == 83 ) {
				$scope.showStations = !$scope.showStations;
				$scope.$apply();
			}
 	    });

        $scope.renderer.start();
    });
}]);
