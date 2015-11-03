
var tmpurl = new URL(location.href);
console.log("hostname ", tmpurl.hostname, tmpurl);

pong = {
   players  : [],
   bolas    : [],
   conexion : {
       open     : null,
       id       : null,
       socket   : null
   },
   uri      : "ws://" + ((tmpurl.hostname.trim() == "") ? "localhost" : tmpurl.hostname) + ":8001"
};

pong.player = function (){
    var id = Math.round(Math.random() * 9999999);
    $("#juego").append( $('<div class="raqueta" id="raqueta' + id + '"></div>') );
    var tmpdom = $("#raqueta"+id);
    var tmp = {
        position : { 
            x    : 0 ,
            y    : 0 ,
            z    : 0
        },
        score    : 0,
        nombre   : "player",
        raqueta  : tmpdom , 
        dom      : tmpdom ,
        timer_key: null
    };
    
    return tmp;
};

pong.bola = function (){
    var tmp = {
        position  : {
            x : 0,
            y : 0,
            z : 0
        },
        direccion : {
            x : 0,
            y : 0
        },
        velocidad : 60,
        counter   : 0,
        timer     : 1000,
        dom       : $("#juego").append( $('<div class="bola"></div>') ).find(".bola")
    };
    return tmp;
};


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
    .then ( _start )
    .then ( movimiento );
    
};


pong.pause = function () {

};

pong.mover      = function ( bola, players, to ) {
    TWEEN.removeAll();
    pong.mover_obj ( bola ,       to[0] );
    pong.mover_obj ( players[0] , to[1] );
    pong.mover_obj ( players[1] , to[2] );
}

pong.mover_obj = function ( obj , to) {
    
    var t = new TWEEN.Tween( obj.position ).to( {
            x: to.x,
            y: to.y
        }, 
        to.velocidad - 1
    )
    .onUpdate( 
        function () {
            obj.dom.css("left", obj.position.x + "px");
            obj.dom.css("top" , obj.position.y + "px");
        }
    )
    .start();
    
};

pong.gol = function( player ) {
    
};


pong.conexion.open = function ( uri ) {
    
    var u = new URL(uri);
    
    var tmp = function() {
        var websocket = new WebSocket( uri );
        
        websocket.onopen = function(evt) { 
            
            pong.conexion.socket.send("<HOLA>");
            
        };
        
        websocket.onclose = function(evt) { 
            console.log(evt); 
        };
        
        websocket.onmessage = function(evt) { 
            
            pong.parse_command(evt.data);
            
            //websocket.close();
        };
        
        websocket.onerror = function(evt) { 
            console.log(evt); 
        };
        
        pong.conexion.socket = websocket;
    }
    
    return app.espere("Conectando a " + u.hostname , "...listo.").then( tmp );
}


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
            } else if (comando[0] === "END") {
                $("#audio-game-over")[0].play();
            }
        }
    );
    
}


pong.send_player_cmd = function( player, cmd) {
    //console.log("ejecutar " + cmd);
    pong.clear_player_timers(player);
    
    player.timer_key = setInterval( function() {
        pong.conexion.socket.send(cmd);
    } , 50 );
    
    //console.log("timer = " + player.timer_key);
}

pong.clear_player_timers = function ( player ) {
    if (player.timer_key !== null) {
        clearInterval(player.timer_key);
        player.timer_key = null;
    };
    //console.log("se limpió el timer de " + player.nombre);
};
