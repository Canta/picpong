/**
 * Emulador por software del PIC18F4520 conectado vía serial con el PONG
 * cargado. Lo que hace es conectarse a un puerto serie virtual, y 
 * procesar comandos del protocolo PONG tal y como lo haría el software 
 * grabado en el PIC. El propósito de este programa es agilizar el 
 * desarrollo de clientes de PONG aún sin disponer del hardware.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151024
 * @version 1.0.0
 * @licence LGPLv3 (http://www.gnu.org/licenses/lgpl-3.0.html) 
 * 
 * @requires q
 * @requires serialport
 */

/**
 * Imprime un texto que explica cómo se usa el programa. Luego, termina
 * la ejecución del programa con status de error.
 */
var usage = function() {
    console.log("Modo de uso: node fake_RS232.js --puerto=/path/al/puerto\n");
    console.log("\nOpciones: \n--puerto\tObligatoria. Establece el puerto al que se va a conectar el programa.\n-h | --help\tMuestra este mensaje de ayuda.\n");
    process.exit(1);
};

var TTY         = null;
process.argv.forEach(function (val, index, array) {
  
  var tmparr = val.split("=");
  if ( tmparr[0].toLowerCase() == "--puerto" ) {
      TTY = tmparr[1];
  }
  
  if ( tmparr[0].toLowerCase() == "--help" || tmparr[0].toLowerCase() == "-h" ) {
      usage();
  }
  
});

if (TTY === null) {
    console.log("\nEl parámetro puerto es obligatorio. Imposible continuar.")
    usage();
}



var q           = require("q");
var serialport  = require("serialport");
var speed       = 500;
var speed_base  = 500;
var SP          = serialport.SerialPort;
var timer_col   = null;
var max_score   = 10;
var partida     = {
    
    iniciada : false ,
    largo    : 640 ,
    alto     : 480 ,
    raqueta  : 50  ,
    players  : [
        { position : { x : 0 , y : 0 }, tipo : 1, puntaje : 0 } ,
        { position : { x : 0 , y : 0 }, tipo : 1, puntaje : 0 }
    ] ,
    pelota   : {
        position : {
            x : 0,
            y : 0
        } ,
        cuerpo : 10 , 
        dirx   : 1 ,
        diry   : 1
    } ,
    gol        : 0 ,
    last_gol   : 0
    
};


var puerto = new SP( TTY , 
    {
        baudrate: 9600 ,
        parser  : serialport.parsers.readline(">")
    } , 
    false // this is the openImmediately flag [default is true]
); 


/**
 * Función para la gestión de comandos.
 * 
 * @param String str Un texto a procesar.
 * @return Promise Una promesa de Q.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151024
 * @version 1.0.0
 */
var wsparser = function( str ) {
    var comando = str.replace("<","").replace(">","").split(":");
    var ret     = "";
    
    if ( comando[0] === "HOLA" ) {
        
        ret = "<HOLA:1:1:1:" + Math.round(Math.random() * 255) + ">"
        
    } else if ( comando[0] === "START" ) {
        
        if (comando.length > 1) {
            partida.largo = comando[1];
            partida.alto  = comando[2];
        }
        
        // El tamaño de los cuerpos (la pelotita y las paletas).
        // 1% del largo de la cancha, pero mínimo 10.
        var cuerpo = Math.round(partida.largo * 0.01);
        if ( cuerpo < 10 ) {
            cuerpo = 10; 
        }
        
        // La altura de las paletas.
        // 5% del alto de la cancha, pero mínimo 50.
        var altura = Math.round(partida.largo * 0.05);
        if ( altura < 50 ) {
            altura = 50; 
        }
        
        // Posiciones iniciales de las paletas.
        var positiony = Math.round((partida.alto / 2) - (altura / 2));
        partida.players[0].position.y = positiony;
        partida.players[1].position.y = positiony;
        
        partida.players[0].position.x = cuerpo;
        partida.players[1].position.x = partida.largo - (cuerpo * 2);
        
        partida.pelota.cuerpo         = cuerpo;
        partida.raqueta               = altura;
        
        reset_posicion_pelota(0);
        
        ret = "<START:" + 
                partida.pelota.position.x + ":" + 
                partida.pelota.position.y + ":" + 
                partida.players[0].position.x + ":" + 
                partida.players[0].position.y + ":" + 
                partida.players[1].position.x + ":" + 
                partida.players[1].position.y + ":" + 
                cuerpo + ":" + 
                altura + ">";
        
        partida.iniciada = true;
        
    } else if ( str === "<MOVEUP:1" ) {
        var tmp = partida.players[0].position.y - partida.raqueta ;
        if ( partida.players[0].position.y > 0) {
            partida.players[0].position.y = ( tmp < 0 ) ? 0 : tmp;
            send_data();
        }
    } else if ( str === "<MOVEUP:2" ) {
        var tmp = partida.players[1].position.y - partida.raqueta ;
        if ( partida.players[1].position.y > 0) {
            partida.players[1].position.y = ( tmp < 0 ) ? 0 : tmp;
            send_data();
        }
    } else if ( str === "<MOVEDOWN:1" ) {
        var tmp = partida.players[0].position.y + partida.raqueta ;
        if (tmp < partida.alto && partida.players[0].position.y < (partida.alto - partida.raqueta) ) {
            partida.players[0].position.y = (tmp + partida.raqueta < partida.alto) ? tmp : partida.alto - partida.raqueta;
            send_data();
        }
    } else if ( str === "<MOVEDOWN:2" ) {
        var tmp = partida.players[1].position.y + partida.raqueta ;
        if ( partida.players[1].position.y < (partida.alto - partida.raqueta) ) {
            partida.players[1].position.y = (tmp + partida.raqueta < partida.alto) ? tmp : partida.alto - partida.raqueta;
            send_data();
        }
    }
    
    return q.when(ret);
};

var reset_posicion_pelota = function ( tipo_reset ) {
    console.log("reset_posicion_pelota", tipo_reset);
    speed = speed_base;
    partida.pelota.position.y     = Math.round( ( partida.alto / 2  ) - (partida.pelota.cuerpo / 2) );
    partida.pelota.diry           = Math.round( Math.random() );
    if ( tipo_reset === 0 ) {
        // saque inicial
        partida.pelota.position.x     = Math.round( ( partida.largo / 2 ) - (partida.pelota.cuerpo / 2) );
        partida.pelota.dirx           = Math.round( Math.random() );
    } else if ( tipo_reset === 2 ) {
        // saque después de un gol del player 2
        partida.pelota.position.x     = partida.players[0].position.x + partida.pelota.cuerpo;
        partida.pelota.dirx           = 0;
    } else if ( tipo_reset === 1 ) {
        // saque después de un gol del player 1
        partida.pelota.position.x     = partida.players[1].position.x - partida.pelota.cuerpo;
        partida.pelota.dirx           = 1;
    }
};


/**
 * Envía los datos actualizados de la partida actual a los clientes.
 */
var send_data = function () {
    if ( puerto.isOpen() && partida.iniciada && partida.gol <= 0) {
        puerto.write( "<DATA:" + 
                            partida.pelota.position.x +
                            ":" + 
                            partida.pelota.position.y +
                            ":" + 
                            partida.players[0].position.x +
                            ":" + 
                            partida.players[0].position.y +
                            ":" + 
                            partida.players[1].position.x +
                            ":" + 
                            partida.players[1].position.y +
                            ":" + 
                            speed + 
                            ">"
        );
    }
}



/**
 * Función principal, que se ejecutará en pseudoloop infinito mediante
 * timers (timeouts, no intervals) determinados por la variable global 
 * "speed". 
 * 
 * @author Daniel Cantarín
 * @date 20151024
 * @version 1.0.0
  */
var mainloop = function () {
    send_data();
    setTimeout(mainloop, speed);
};


var check_colision = function () {
    var p = partida.pelota;
    
    if ( partida.gol > 0 ) {
        
        if ( partida.players[1].puntaje >= max_score || partida.players[0].puntaje >= max_score ) {
            puerto.write("<END>");
            partida.iniciada = false;
        }
        
        partida.gol--;
        
        if (partida.gol === 0) {
            reset_posicion_pelota(partida.last_gol);
        }
        
    } else if ( partida.iniciada ) {
        if ( p.dirx === 0 ) {
            //partida.pelota.position.x += p.cuerpo ;
            p.position.x += p.cuerpo ;
        } else {
            //partida.pelota.position.x -= p.cuerpo ;
            p.position.x -= p.cuerpo ;
        }
        
        if ( p.diry === 0 ) {
            //partida.pelota.position.y += p.cuerpo ;
            p.position.y += p.cuerpo ;
        } else {
            //partida.pelota.position.y -= p.cuerpo ;
            p.position.y -= p.cuerpo ;
        }
        
        if ( p.position.y <= 0 ) {
            // Rebota en el techo
            p.position.y = 0;
            p.diry = 0;
            puerto.write("<COLISION:1>");
            subir_velocidad();
        } else if ( p.position.y + p.cuerpo >= partida.alto ) {
            // Rebota en el piso
            p.position.y = partida.alto - p.cuerpo;
            p.diry = 1;
            puerto.write("<COLISION:2>");
            subir_velocidad();
        } else if ( 
            p.position.x <= partida.players[1].position.x
            && p.position.x + p.cuerpo >= partida.players[1].position.x 
            && p.position.y + p.cuerpo >= partida.players[1].position.y
            && p.position.y <= partida.players[1].position.y + partida.raqueta
        ) {
            // Colisión contra el player 2
            p.dirx = 1;
            puerto.write("<COLISION:3>");
            subir_velocidad();
        } else if ( 
            p.position.x + p.cuerpo >= partida.players[0].position.x
            && p.position.x <= partida.players[0].position.x 
            && p.position.y + p.cuerpo >= partida.players[0].position.y
            && p.position.y <= partida.players[0].position.y + partida.raqueta
        ) {
            // Colisión contra el player 1
            p.dirx = 0;
            puerto.write("<COLISION:4>");
            subir_velocidad();
        } else if ( p.position.x <= 0 ) {
            // Gol del player 2
            send_data();
            partida.players[1].puntaje++;
            partida.gol = 10;
            partida.last_gol = 2;
            setTimeout( function () {
                puerto.write("<GOL:2>");
            }, 250);
        } else if ( p.position.x + p.cuerpo >= partida.largo ) {
            // Gol del player 1
            send_data();
            partida.players[0].puntaje++;
            partida.gol = 10;
            partida.last_gol = 1;
            setTimeout( function () {
                puerto.write("<GOL:1>");
            }, 250);
        }
    }
};


var subir_velocidad = function () {
    if ( speed > 200 ) {
        speed--;
    }
};


/**
 * Establece las configuraciones iniciales del programa.
 * 
 * @return Promise Una promesa de Q que se resuelve sólo si el setup fue
 * exitoso.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151024
 * @version 1.0.0
 */
var setup = function () {
    
    var def = q.defer();
    
    puerto.open( function (error) {
        
        if ( error ) {
          
            console.log( 'Error al intentar abrir el puerto : ' + error );
            def.reject ( 'Error al intentar abrir el puerto : ' + error );
            
        } else {
          
            console.log( 'Puerto abierto con éxito.' );
            def.resolve("Setup OK.");

            puerto.on(   'data' , 
                function( data ) {
                    
                    console.log('Recibí esto : ' + data);
                    
                    var tmp = function( str ) {
                        if ( str !== "" ) {
                            // Envío un comando al cliente.
                            puerto.write( str , function(err, results) {
                                console.log( "Enviando " + str );
                                if (err !== undefined) {
                                    console.log('Error en el envío : ' , err);
                                } else {
                                    console.log(results + ' bytes enviados.');
                                }
                            });
                        }
                    };
                    
                    wsparser(data).then( tmp );
                    
                }
            );

        }
    });
    
    return def.promise;
};


// Inicia la aplicación.
setup().then( function() {
    setTimeout(mainloop, speed);
    timer_col = setInterval(check_colision, 100);
});



