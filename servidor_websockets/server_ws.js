/**
 * Este programa se encarga de hacer de puente entre el PIC18F4520 
 * conectado al puerto serie (RS-232) y alguna aplicación web conectada 
 * vía websocket.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151024
 * @version 1.0.0
 * @license LGPLv3 (http://www.gnu.org/licenses/lgpl-3.0.html)
 * 
 * @require nodejs-websocket
 * @require q
 * @require serialport
 */


/**
 * Imprime un texto que explica cómo se usa el programa. Luego, termina
 * la ejecución del programa con status de error.
 */
var usage = function() {
    console.log("\nModo de uso: node server_ws.js --rs232=/path/al/puerto [--puerto=numero]\n");
    console.log("\nOpciones: \n--rs232 \tObligatorio. Establece la dirección del puerto RS232 al que se va a conectar el programa.\n--puerto\tOpcional. Establece el puerto en el que se servirá el websocket. Por defecto es el 8001.\n-h | --help\tMuestra este mensaje de ayuda.\n");
    process.exit(1);
};

var TTY         = null;
var port        = 8001;
var buffer      = "";

process.argv.forEach(function (val, index, array) {
  
  var tmparr = val.split("=");
  if ( tmparr[0].toLowerCase() == "--rs232" ) {
      TTY = tmparr[1];
  }
  
  var tmparr = val.split("=");
  if ( tmparr[0].toLowerCase() == "--puerto" ) {
      port = Math.round(tmparr[1]);
  }
  
  if ( tmparr[0].toLowerCase() == "--help" || tmparr[0].toLowerCase() == "-h" ) {
      usage();
  }
  
});

if (TTY === null) {
    console.log("\nEl parámetro rs232 es obligatorio. Imposible continuar.")
    usage();
}





var ws          = require("nodejs-websocket");
var q           = require("q");
var serialport  = require("serialport");
var conexion    = null;
var SP          = serialport.SerialPort;
var puerto      = new SP( TTY , { baudrate: 9600 }, false ); 

var server      = ws.createServer ( 
    function (conn) {
        console.log( "Nueva conexion websocket." );
        
        conn.on("text", function (str) {
            console.log( "Recibido desde el websocket " + str);
            puerto.write( str );
        });
        
        conn.on("close", function (code, reason) {
            console.log( "Conexion websocket cerrada." );
        });
        
        conexion = conn; //global
        conexion.validada = false;
    }
).listen( port );


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
            def.resolve( "Setup OK." );

            puerto.on (
                'data' , 
                function( data ) {
                    buffer += data;
                    if ( data.indexOf(">") >= 0 ) {
                        console.log('Recibí esto vía rs232 : ' + buffer);
                        if (conexion !== null) {
                            conexion.sendText(buffer);
                        }
                        buffer = "";
                    }
                }
            );
            
            puerto.on(
                'error' , 
                function( data ) {
                    console.log('error en el puerto rs232 : ' + data);
                    puerto.close();
                }
            );

        }
    });
    
    return def.promise;
};

setup();
