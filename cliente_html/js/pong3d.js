    //contenedores y referencias
    var container, stats, mapa, composer, clock, meshes, infos;
    //cámaras
    var camera, camera_UI, camera_content, camera_bg, camera_overlay;
    //escenas, renderers, y controles
    var scene_bg, scene_UI, scene_UI_CSS, scene_overlay, scene_content, 
        renderer, cssRenderer, controls;
    
    //Helpers globales.
    var mouseX = 0, mouseY = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    meshes = [];
    
    function init() {
        
        container = $("#juego")[0];
        //container.style="position:absolute;left:0px;top:0px;z-index:1;"
        //document.body.appendChild( container );
        
        var VIEW_ANGLE = 45, ASPECT = window.innerWidth / window.innerHeight, NEAR = 0.1, FAR = 200000;
        // set up camera
        camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set( 5, 5, 5);

        
        clock = new THREE.Clock();
        
        // scenes
        scene_bg        = new THREE.Scene();
        scene_overlay   = new THREE.Scene();
        scene_UI        = new THREE.Scene();
        scene_content   = new THREE.Scene();
        
        //camera.lookAt( scene_bg.position );
        
        initLights();
        
        controls = new THREE.OrbitControls( camera, container );
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.autoClear = false;
        container.appendChild( renderer.domElement );
        
        window.addEventListener( 'resize', onWindowResize, false );
        
        
        sceneArtifacts();
        
        
        //meshes[0].add(camera);
        scene_bg.add(camera);
        controls.target = meshes[0].position;
        controls.noKeys = true;
        
    }
    
    //Devuelve una caja random.
    function randomBox(){
        var size = Math.round(Math.random() * 300) + 1;
        var dg = new THREE.BoxGeometry( size, size, size );
        
        var ma = new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff
        });
        var me = new THREE.Mesh( dg, ma );
        return me;
    }
    
    // Agrega los meshes necesarios para el contenido de la demo.
    // Las dos paletas, y la pelotita.
    function addContentMeshes(){
        var m, p;
        
        // La bola
        var size  = pong.bolas[0].dom.width();
        var size2 = $("#juego").height() * 0.05;
        var dg = new THREE.BoxGeometry( size, size, size );
        var ma = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });
        var me = new THREE.Mesh( dg, ma );
        pong.bolas[0].mesh = me;
        meshes = [ me ];
        me.position.set( parseInt(pong.bolas[0].dom.css("left")), parseInt(pong.bolas[0].dom.css("top")), 1 );
        scene_content.add(me);
        
        // la paleta del player 1
        size = pong.players[0].dom.width();
        dg = new THREE.BoxGeometry( size, size2 , size2 * 10);
        ma = new THREE.MeshLambertMaterial({
            color: 0x00ff00
        });
        me = new THREE.Mesh( dg, ma );
        pong.players[0].mesh = me;
        meshes.push(me);
        me.position.set( parseInt(pong.players[0].dom.css("left")), parseInt(pong.players[0].dom.css("top")), 1 );
        scene_content.add(me);
        
        // la paleta del player 2
        size = pong.players[1].dom.width();
        dg = new THREE.BoxGeometry( size, size2 , size2 * 10);
        ma = new THREE.MeshLambertMaterial({
            color: 0x0000ff
        });
        me = new THREE.Mesh( dg, ma );
        pong.players[1].mesh = me;
        meshes.push(me);
        me.position.set( parseInt(pong.players[1].dom.css("left")), parseInt(pong.players[1].dom.css("top")), 1 );
        scene_content.add(me);
        
        // El piso
        dg = new THREE.BoxGeometry( $("#juego").width(), 1, $("#juego").height() );
        ma = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent : true,
            opacity : 0.5
        });
        me = new THREE.Mesh( dg, ma );
        meshes.push(me);
        me.position.set( $("#juego").width() / 2,0,0 );
        scene_content.add(me);
        
        
        // El techo
        dg = new THREE.BoxGeometry( $("#juego").width(), 1, $("#juego").height() );
        ma = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent : true,
            opacity : 0.5
        });
        me = new THREE.Mesh( dg, ma );
        meshes.push(me);
        me.position.set( $("#juego").width() / 2,$("#juego").height(),0 );
        scene_content.add(me);
    }
    
    function addLightToScenes(luz) {
        scene_bg.add( luz );
        scene_content.add( luz );
        scene_overlay.add( luz );
    }
    
    function initLights() {
        //para el skybox:
        var ambient = new THREE.AmbientLight( 0x444444 );
        addLightToScenes(ambient);
        scene_bg.add( new THREE.AmbientLight( 0x666666 ) );
        

        var light = new THREE.DirectionalLight( 0xdfebff, 1.75 );
        light.position.set( 50, 200, 100 );
        light.position.multiplyScalar( 1.3 );

        light.castShadow = true;
        //light.shadowCameraVisible = true;

        light.shadowMapWidth = 1024;
        light.shadowMapHeight = 1024;

        var d = 300;

        light.shadowCameraLeft = -d;
        light.shadowCameraRight = d;
        light.shadowCameraTop = d;
        light.shadowCameraBottom = -d;

        light.shadowCameraFar = 1000;
        light.shadowDarkness = 0.5;
        
        var ambientLight = new THREE.AmbientLight(0x111111);
        scene_bg.add(ambientLight);
        scene_content.add(light);
        
       
    }
    
    function buildSkybox(numero) {
        var tmpsky = scene_bg.getObjectByName("skybox");
        if ( tmpsky !== undefined ) {
            scene_bg.remove( tmpsky );
        }
        
        var skyBoxGeometry = new THREE.BoxGeometry( 100000, 100000, 100000 );
        
        var urlPrefix = "img/skyboxes/" + numero + "/" ;
        //var urlPrefix = "images/skyboxes/4/" ;
        var urls = [
            urlPrefix + "1.png",
            urlPrefix + "3.png",
            urlPrefix + "5.png",
            urlPrefix + "0.png", 
            urlPrefix + "4.png",
            urlPrefix + "2.png"
            
        ];
        
        var materialArray = [];
        for (var i = 0; i < 6; i++)
            materialArray.push( new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture( urls[i] ),
                side: THREE.BackSide
            }));
        var skyBoxMaterial = new THREE.MeshFaceMaterial( materialArray );
        
        skybox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
        skybox.position.y = 5000;
        skybox.name = "skybox";
        scene_bg.add(skybox);
    }
    
    function sceneArtifacts(){
        var cantidad_skyboxes = 5;
        
        addContentMeshes();
        buildSkybox( ( Math.round( Math.random() * (cantidad_skyboxes - 1) ) ) );
        
    }
    
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function onDocumentMouseMove( event ) {
        mouseX = ( event.clientX - windowHalfX ) / 2;
        mouseY = ( event.clientY - windowHalfY ) / 2;
    }
    
    function animate() {
        TWEEN.update();
        rotateMeshes();
        render();
        requestAnimationFrame( animate );
    }

    function render() {
        
        renderer.clear();
        //composer.render();
        //renderer.render( scene, camera );
        //renderer.clearDepth();
        renderer.render( scene_bg, camera );
        //renderer.clearDepth();
        renderer.render( scene_content, camera );
        //renderer.clearDepth();
        //renderer.render( scene_UI, camera );
        //renderer.clearDepth();
        //renderer.render( scene_overlay, camera );
        //cssRenderer.render( scene_UI_CSS, camera );
        //cssRenderer.clearDepth();
        controls.update();
        
        
    }
    
    
    function moveTo(position, target) {
        TWEEN.removeAll();
        console.log("moveTo",position,target);
        if (target === undefined) {
            target = position;
        }
        
        var f = function(){
            console.log("moveTo finish",position,target);
        }
        //camera.lookAt(target);
        
        
        var t = new TWEEN.Tween( camera.position ).to( {
                x: position.x,
                y: position.y,
                z: position.z
            },
            600
        ).easing( TWEEN.Easing.Quartic.Out)
        .onComplete(f);
        
        /*
        var t = new TWEEN.Tween( controls.target ).to( {
                x: target.x,
                y: target.y,
                z: target.z
            }, 
            600
        ).easing( TWEEN.Easing.Quartic.Out)
        .onComplete(f).start();
        */
        
        return t;
    }
    
    function rotateMeshes(){
        var SPEED = 0.01;
        //var length = meshes.length;
        var length = 1; //sólo la pelota.
        for (var i = 0; i < length; i++){
            if (meshes[i] && meshes[i].visible){
                meshes[i].rotation.x -= SPEED * 2;
                meshes[i].rotation.y -= SPEED ;
                meshes[i].rotation.z -= SPEED * 3;
            }
        }
        
        controls.rotateLeft(SPEED);
        
    }
    

// Sobrecarga
// Hace lo mismo que el pong 2d, pero con otros objetos.
pong.parse_command = function ( str ) {
    
    // puede haber varios comandos concatenados.
    
    var comandos = str.split("<");
    
    comandos.forEach( 
        function( value , indice, array ) {
            if (value.trim() == "") {
                return;
            }
            
            var comando = value.replace("<","").replace(">","").split(":");
            console.log("comando", comando);
            
            if ( comando[0].trim() === "" ) {
                //nada
            } else if (comando[0] === "HOLA") {
                
                // Parte del handshake
                u = new URL( pong.uri );
                
                // Me quedo con el ID de cliente asignado por el server.
                pong.conexion.id = comando[4];
                
                app.desespere("Conectando a " + u.hostname );
            
            } else if (comando[0] === "START") {
                
                pong.bolas = [ new pong.bola() ];
                pong.bolas[0].position.x = Math.round(comando[1]);
                pong.bolas[0].position.y = Math.round(comando[2]);
                pong.bolas[0].dom.css("top"  , pong.bolas[0].position.x + "px");
                pong.bolas[0].dom.css("left" , pong.bolas[0].position.y + "px");
                
                pong.players = [ new pong.player(), new pong.player() ];
                pong.players[0].nombre      = "player 1";
                pong.players[1].nombre      = "player 2";
                pong.players[0].timer_key   = null;
                pong.players[1].timer_key   = null;
                pong.players[0].scoredom    = $("#puntaje1");
                pong.players[1].scoredom    = $("#puntaje2");
                
                pong.players[0].position.x  = Math.round(comando[3]);
                pong.players[0].position.y  = Math.round(comando[4]);
                pong.players[1].position.x  = Math.round(comando[5]);
                pong.players[1].position.y  = Math.round(comando[6]);
                
                pong.players[0].dom.css("top"  , pong.players[0].position.x + "px");
                pong.players[0].dom.css("left" , pong.players[0].position.y + "px");
                pong.players[1].dom.css("top"  , pong.players[1].position.x + "px");
                pong.players[1].dom.css("left" , pong.players[1].position.y + "px");
                
                
                pong.bolas[0].dom.css("width"  , comando[7] + "px");
                pong.bolas[0].dom.css("height" , comando[7] + "px");
                pong.players[0].dom.css("width" , comando[7] + "px");
                pong.players[1].dom.css("width" , comando[7] + "px");
                pong.players[0].dom.css("height" , comando[8] + "px");
                pong.players[1].dom.css("height" , comando[8] + "px");
                
                // Oculto las cosas que no uso, porque es todo 3D ahora.
                pong.bolas[0].dom.css("opacity"   , 0);
                pong.players[0].dom.css("opacity" , 0);
                pong.players[1].dom.css("opacity" , 0);
                
                
                // inicio el render 3D
                init();
                animate();
                
            } else if (comando[0] === "DATA") {
                
                var to = [
                    { x : Math.round(comando[1]), y : Math.round(comando[2]), velocidad : Math.round(comando[7])}, // pelota
                    { x : Math.round(comando[3]), y : Math.round(comando[4]), velocidad : 100 }, // player 1
                    { x : Math.round(comando[5]), y : Math.round(comando[6]), velocidad : 100 }, // player 2
                ];
                pong.bolas[0].velocidad = comando[7];
                pong.mover( pong.bolas[0], pong.players , to );
                
                
                pong.players[0].scoredom.html( pong.players[0].score ); 
                pong.players[1].scoredom.html( pong.players[1].score ); 
                
            } else if (comando[0] === "GOL") {
                pong.players[parseInt(comando[1]) - 1].score++;
                $("#audio-gol")[0].play();
            } else if (comando[0] === "COLISION") {
                $("#audio-colision")[0].play();
                
                if (comando[1] == 3) {
                    moveTo( pong.players[0].mesh );
                } else if (comando[1] == 4) {
                    moveTo( pong.players[1].mesh );
                }
                
            } else if (comando[0] === "END") {
                $("#audio-game-over")[0].play();
            }
        }
    );
    
}

// Sobrecarga
// Hace lo mismo que el pong 2D, pero con otros objetos.
pong.mover      = function ( bola, players, to ) {
    //TWEEN.removeAll();
    pong.mover_obj ( bola       , to[0] );
    pong.mover_obj ( players[0] , to[1] );
    pong.mover_obj ( players[1] , to[2] );
    
    /*
    if ( bola.dirx === 0 ) {
        camera.lookAt( players[0].mesh );
        //moveTo( players[0].mesh );
    } else {
        camera.lookAt( players[1].mesh );
        //moveTo( players[1].mesh );
    }
    */
    //dest = ( bola.dirx === 0 ) ? pong.players[0].mesh : pong.players[1].mesh ;
    //no   = ( bola.dirx === 0 ) ? pong.players[1].mesh : pong.players[0].mesh ;
    /*
    camera.position.set ( 
        bola.mesh.position.x -10,
        bola.mesh.position.y -20,
        bola.mesh.position.z -30
    );
    */
}

var update_cam = function() {
    //var bola = pong.bolas[0];
    
    /*
    camera.position.set ( 
        bola.mesh.position.x -10,
        bola.mesh.position.y -20,
        bola.mesh.position.z -30
    );
    */
    
    //dest = ( bola.dirx === 0 ) ? pong.players[0] : pong.players[1] ;
    //no   = ( bola.dirx === 0 ) ? pong.players[1] : pong.players[0] ;
    //moveTo( dest.position );
    
}


// Sobrecarga
// Hace lo mismo que el pong 2D, pero con otros objetos.
pong.mover_obj = function ( obj , to) {
    
    var t = new TWEEN.Tween( obj.position ).to( {
            x: to.x,
            y: to.y
        }, 
        to.velocidad 
    )
    .onUpdate( 
        function () {
            obj.mesh.position.set(obj.position.x, obj.position.y , obj.position.z);
            update_cam();
        }
    )
    .start();
    
    return t;
};

// Sobrecarga
pong.start = function () {
    
    var setup = function () {
        var def = Q.defer();
        
        setTimeout( function() {
            if ( pong.conexion.socket !== null ) {
                
                // Registro mi tipo de cliente.
                // 3 = PONG_CLIENTE_TIPO_MIXTO. 
                // Significa "display y players".
                var cmd = "<CLIENTE_TIPO:" 
                            + pong.conexion.id
                            + ":3:" 
                            + $("#cantidad-players").val() 
                            + ">";
                console.log("SETUP: ", cmd);
                pong.conexion.socket.send(cmd);
                def.resolve("SETUP OK");
            } else {
                def.reject("SETUP FAIL");
            }
        }, 100);
        
        return def.promise;
    };
    
    var _start = function () {
        var def = Q.defer();
        
        setTimeout( function () {
            if ( pong.conexion.socket !== null ) {
                // Envío los datos de inicio de partida.
                cmd = "<START:" + $("#juego").width() + ":" + $("#juego").height() + ">";
                console.log("_START: ", cmd);
                pong.conexion.socket.send(cmd);
                def.resolve("START OK");
            } else {
                def.reject("START FAIL");
            }
        }, 100);
        
        return def.promise;
    };
    
    
    var movimiento = function() {
        TWEEN.update();
        requestAnimationFrame( movimiento );
    };
    
    pong.conexion.open( pong.uri )
    .then ( setup  )
    .then ( _start );
    
    
    
};

/*
	var outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.BackSide } );
	var outlineMesh1 = new THREE.Mesh( sphereGeometry, outlineMaterial1 );
	outlineMesh1.position = sphere.position;
	outlineMesh1.scale.multiplyScalar(1.05);
	scene.add( outlineMesh1 );
	
	var cubeGeometry = new THREE.CubeGeometry( 80, 80, 80 );
	var cube = new THREE.Mesh( cubeGeometry, material );
	cube.position.set(60, 60, 0);
	scene.add( cube );		
	
	var outlineMaterial2 = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } );
	var outlineMesh2 = new THREE.Mesh( cubeGeometry, outlineMaterial2 );
	outlineMesh2.position = cube.position;
	outlineMesh2.scale.multiplyScalar(1.05);
	scene.add( outlineMesh2 );
 */


/*
    if ( bola.dirx === 0 ) {
        //camera.lookAt( players[0].mesh );
        moveTo( players[0].mesh );
    } else {
        //camera.lookAt( players[1].mesh );
        moveTo( players[1].mesh );
    }
    */
