/**
 * Header para la librería del servidor de PONG.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 * @version 1.0.0
 */


/**
 * Constantes para cantidades máximas.
 */
#define PONG_CANTIDAD_MAXIMA_CLIENTES   1
#define PONG_CANTIDAD_MAXIMA_PLAYERS    2
#define PONG_CANTIDAD_MAXIMA_GOLES      10


/**
 * Tipos de clientes que se pueden conectar al servidor.
 */
#define PONG_CLIENTE_TIPO_NULO    0 //Valor por defecto, "sin instanciar".
#define PONG_CLIENTE_TIPO_DISPLAY 1 
#define PONG_CLIENTE_TIPO_PLAYER  2
#define PONG_CLIENTE_TIPO_MIXTO   3 //"mixto" implica display y player(s).



/**
 * Tipos de players.
 */
#define PONG_PLAYER_TIPO_NULO    0 //Se usa cuando no hay players definidos.
#define PONG_PLAYER_TIPO_BOT     1
#define PONG_PLAYER_TIPO_HUMANO  2


/**
 * Tipos de conexiones al server.
 */
#define PONG_CONEXION_TIPO_SERIAL 1
#define PONG_CONEXION_TIPO_RADIO  2
#define PONG_CONEXION_TIPO_TCP    3
#define PONG_CONEXION_TIPO_HTTP   4

/**
 * Tipos de protocolos. De momento, sólo hay uno.
 */
#define PONG_PROTOCOLO_TIPO_PONG 1

/**
 * Tipos de formatos para los protocolos.
 */
#define PONG_PROTOCOLO_FORMATO_PONG 1
#define PONG_PROTOCOLO_FORMATO_JSON 2
#define PONG_PROTOCOLO_FORMATO_XML  3

/**
 * Constante para el tamaño del buffer de mensajes de entrada.
 */
#define PONG_PROTOCOLO_INPUT_BUFFER 255


/**
 * Velocidad por defecto de la pelota
 */

#define PONG_PELOTA_VELOCIDAD_MIN   3
#define PONG_PELOTA_VELOCIDAD_MAX   1


/**
 * Estructura de datos para gestión de posición en un espacio. 
 */
struct pong_posicion {
    int x;
    int y;
    int z; //En futuras versiones se puede implementar eje z.
};

/**
 * Estructura de datos para gestión de colores. 
 */
struct pong_color {
    char rojo;
    char verde;
    char azul; 
    char alfa;
};

/**
 * Estructura de datos gestión de la pantalla del juego. 
 */
struct pong_cancha {
    int                 largo;
    int                 alto;
    int                 ancho; //Por si algún día se usa el eje z.
    struct pong_color   color;
};

/**
 * Estructura de datos gestión de la pelota del juego. 
 */
struct pong_pelota {
    struct pong_posicion    posicion;   
    struct pong_color       color;      
    unsigned char           tamanio;    // siempre es cuadrada.
    unsigned char           velocidad;  // Velocidad actual de la pelota.
    unsigned char           counter;    // Contador para la velocidad.
    unsigned char           direccionx; // Flag. Izquierda o derecha ( 0 / !0).
    unsigned char           direcciony; // Flag. Arriba o abajo ( 0 / !0).
};


/**
 * Estructura de datos para gestión de diferentes protocolos. 
 */
struct pong_protocolo {
    char version;
    char tipo;
    char formato; 
};


/**
 * Estructura de datos para gestión de la información de los clientes.
 */
struct pong_cliente {
    char tipo;          // Algún valor de constante PONG_CLIENTE_TIPO_*
    char tipo_conexion; // Algún valor de constante PONG_CONEXION_TIPO_*
    char protocolo;     // Índice al array global de protocolos posibles.
    unsigned char id;   // Identificador autogenerado por el servidor.
    unsigned char input_buffer[PONG_PROTOCOLO_INPUT_BUFFER];
};

/**
 * Estructura de datos para gestión de la información de los jugadores.
 */
struct pong_player {
    
    char            tipo;           // Un valor de constante PONG_PLAYER_TIPO
    char            puntaje;    
    char*           nombre;         // Nombre del jugador.
    unsigned char   alto;           // Alto de la paleta en la cancha
    char            largo;          // Largo de la paleta en la cancha.
    unsigned char   id;             // Un ID autogenerado por el server.
    
    struct pong_posicion posicion;
    struct pong_cliente * cliente;  // Puntero a una instancia de pong_cliente.
};


/**
 * Estructura de datos para gestión de la información de las partidas.
 */
struct pong_partida {
    struct pong_cancha      cancha;
    struct pong_pelota      pelota;
    struct pong_player      players[PONG_CANTIDAD_MAXIMA_PLAYERS];
    char                    iniciado;
    char                    finalizado;
    char                    pausa;
    char                    gol;        // Se usa para timing durante el gol.
    char                    last_gol;   // Persiste un dato sobre el último gol.
    
};


/**
 * Estructura de datos para las instancias de servidores de PONG.
 */
struct pong_servidor {
    /**
     * A la fecha 20151017, sólo existe un protocolo de comunicación posible.
     * En versiones futuras se podrán agregar múltiples protocolos.
     */
    struct pong_protocolo   protocolos[1];  // Lista de protocolos disponibles.
    struct pong_cliente     clientes[PONG_CANTIDAD_MAXIMA_CLIENTES];
    struct pong_partida     partida;        // Instancia de partida actual.
    unsigned char           listo;          // Indica que el server está listo.
};

/**
 * Dado un servidor de PONG, lo bootea. 
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 * @version 1.0.0
 */
void pong_boot_server( struct pong_servidor *server );

/**
 * Dada una instancia de pong_servidor, y tamaños de pantalla, inicia una 
 * partida. 
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 * @version 1.0.0
 */
void pong_iniciar_partida( struct pong_servidor *server, int width, int height );


/**
 * Dado un texto y un cliente de pong, envía ese texto hacia ese cliente.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 */
void pong_send_data( 
    char * string , 
    struct pong_cliente * cliente
);


/**
 * Dado un texto y un servidor, lee el texto y evalúa si se trata de un comando
 * válido. El output lo envía al cliente correspondiente que haya enviado el 
 * texto.
 * 
 * @param string Puntero al string que será evaluado.
 * @param server Puntero a una instancia de servidor que será manipulada para 
 * trabajar instancias de clientes y establecer valores.
 * @param tipo_conexion Alguno de los valores de constantes de tipo de conexión
 * (PONG_CONEXION_TIPO_*).
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 */
void pong_parse_input( 
    char * string , 
    struct pong_servidor * server, 
    char tipo_conexion 
);


/**
 * Dada una instancia de servidor, y un tipo de conexión, ejecuta una apertura
 * de conexión válida para clientes.
 * 
 * @param server Puntero a una instancia de pong_servidor.
 * @param tipo_conexion Alguno de los valores de constante de tipo de conexión.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 */
void pong_handshake ( 
    struct pong_servidor * server , 
    char tipo_conexion
);


/**
 * Dado un servidor, y un nombre de jugador, registra un nuevo jugador en la 
 * partida.
 * 
 * @param server Un puntero a una instancia de pong_servidor.
 * @param nombre Un puntero a un string que guarda el nombre del jugador.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_registrar_player( 
    struct pong_servidor * server , 
    char * nombre 
);


/**
 * Dado un servidor, devuelve el llamado "cliente actual". Útil para manejar 
 * eventos de interacción con diferentes clientes.
 * 
 * @param server Un puntero a una instancia de pong_servidor.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
struct pong_cliente * pong_get_current_client( struct pong_servidor * server );


/**
 * Dado un servidor de pong, actualiza los stats internos (la pelotita, la 
 * colisión, etc).
 * 
 * @param server Un puntero a una instancia de pong_servidor.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_update_stats ( struct pong_servidor * server );


/**
 * Dada una partida, revisa el estado de la pelotita para ver si colisionó.
 * 
 * @param partida Un puntero a una instancia de pong_partida.
 * @return Devuelve 1 cuando hubo colisión, y 0 cuando no la hubo.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
char pong_check_colision ( struct pong_partida * partida );


/**
 * Dada una partida y un player, suma un gol. Si se llegara al límite de goles,
 * entonces finaliza también la partida.
 * 
 * @param partida Un puntero a una instancia de pong_partida.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_gol ( struct pong_partida * partida , struct pong_player * player );


/**
 * Dada una partida, la finaliza.
 * 
 * @param partida Puntero a una instancia de pong_partida.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_finalizar_partida( struct pong_partida * partida );

/**
 * Mueve un jugador en la dirección especificada.
 * 
 * @param partida Un puntero a una instancia de pong_partida.
 * @param player Un puntero a una instancia de pong_player
 * @param direccion Flag. 0 mueve hacia arriba, !0 mueve hacia abajo.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_mover_player ( struct pong_partida * partida, struct pong_player * player, char direccion );

/**
 * Mueve un bot (player controlado por la computadora).
 * 
 * @param partida Puntero a una instancia de pong_partida.
 * @param player Puntero a una instancia de pong_player.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_mover_bot ( struct pong_partida * partida, struct pong_player * player );


/**
 * Reestablece la posición de la pelota luego de algún evento especial. Eso es, 
 * cuando se centra la pelota al comienzo, o cuando algún player hace un gol.
 * 
 * @param server Puntero a una instancia de pong_servidor
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_reset_pelota( struct pong_servidor * server , char donde );


/**
 * Actualiza los datos de una pelota.
 * 
 * @param pelota Puntero a una instancia de pong_pelota.
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151018
 */
void pong_update_pelota( struct pong_pelota * pelota );