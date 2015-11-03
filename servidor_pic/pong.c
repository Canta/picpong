/**
 * Librería de código para el servidor de PONG.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 * @version 1.0.0
 */

#include <xc.h>
#include <stdlib.h> 
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "pong.h"

void pong_boot_server ( struct pong_servidor *server ) {
	
	int i;
	
	server->listo = 0;
	
	//Primero establezco los protocolos posibles para comunicación con clientes.
	struct pong_protocolo prot1;
	
	prot1.formato = PONG_PROTOCOLO_FORMATO_PONG;
	prot1.tipo    = PONG_PROTOCOLO_TIPO_PONG;
	prot1.version = 1;
	
	server->protocolos[0] = prot1;
	
	//Luego, instancio el resto de las variables necesarias para el juego.
	for ( i = 0; i < PONG_CANTIDAD_MAXIMA_CLIENTES ; i++ ) {
		server->clientes[i].tipo = PONG_CLIENTE_TIPO_NULO;
	}
	
	for ( i = 0; i < PONG_CANTIDAD_MAXIMA_PLAYERS ; i++ ) {
		server->partida.players[i].tipo = PONG_PLAYER_TIPO_NULO;
	}
	
	server->partida.iniciado			= 0;
	server->partida.pelota.velocidad	= PONG_PELOTA_VELOCIDAD_MIN;
	server->partida.gol					= 0;
	server->partida.finalizado			= 0;
	server->partida.pausa				= 0;
	server->partida.cancha.alto			= 480;
	server->partida.cancha.largo		= 640;
	
	
	//Después de todos los seteos, activo el server
	server->listo = 1;
	
}

void pong_reset_pelota( struct pong_servidor * server , char donde ) {
	
	server->partida.pelota.velocidad	= PONG_PELOTA_VELOCIDAD_MIN;
	server->partida.pelota.posicion.y = 
			server->partida.cancha.alto / 2 - server->partida.pelota.tamanio / 2;
	
	if ( donde == 0 ) {
		//La pelota arranca centrada en la cancha.
		server->partida.pelota.posicion.x = 
			server->partida.cancha.largo / 2 - server->partida.pelota.tamanio / 2;
		
		if ( (rand() * 1000) % 2 == 0 ) {
			server->partida.pelota.direccionx = 0;
		} else {
			server->partida.pelota.direccionx = 1;
		}

	} else if (donde == 1) {
		// Después de un gol del player 2
		server->partida.pelota.posicion.x = 
			server->partida.players[0].posicion.x + server->partida.players[0].largo;
		server->partida.pelota.direccionx = 1;
	} else {
		// Después de un gol del player 1
		server->partida.pelota.posicion.x = 
			server->partida.players[1].posicion.x;
		server->partida.pelota.direccionx = 0;
	}
	
}

void pong_iniciar_partida( struct pong_servidor *server , int width, int height ) {
	
    char output[20]; //Array para gestión de stings para los clientes.
    
    server->partida.cancha.largo = width;
    server->partida.cancha.alto  = height;
    
    //Posición y tamaño inicial de la pelotita.
	
	// El tamaño de los cuerpos (la pelotita y las paletas).
    // 1% del largo de la cancha, pero mínimo 10.
	unsigned char cuerpo = (unsigned char) round(server->partida.cancha.largo * 0.01);
	if ( cuerpo < 10 ) {
		cuerpo = 10; 
	}
	
	server->partida.pelota.tamanio = cuerpo; 
	
	
	//La pelota arranca centrada en la pantalla.
	pong_reset_pelota( server, 0 );
	
	//Ahora, establezco los parámetros de los jugadores.
	//Si no llegan a estar instanciados, agrego bots.
	//Caso contrario, fueron instanciados previamente por los clientes.
	struct pong_player * player1 = &server->partida.players[0];
	struct pong_player * player2 = &server->partida.players[1];
	
	if ( player1->tipo == PONG_PLAYER_TIPO_NULO ) {
		
		player1->tipo	= PONG_PLAYER_TIPO_BOT;
		player1->nombre	= "Player 1";
		player1->id		= (char) rand() * 255 + 1;
		
	}
	
	if ( player2->tipo == PONG_PLAYER_TIPO_NULO ) {
		
		player2->tipo	= PONG_PLAYER_TIPO_BOT;
		player2->nombre	= "Player 2";
		player2->id		= (char) rand() * 255 + 1;
	}
	
	player1->puntaje	= 0;
	player2->puntaje	= 0;
	player1->id			= 1;
	player2->id			= 2;
	
	//Las posiciones y tamaños de las paletas de los jugadores son relativas a 
	//los tamaños de la cancha, tal y como sucedía con la pelotita. 
	
	// La altura de las paletas.
	// 5% del alto de la cancha, pero mínimo 50.
	unsigned char altura = (unsigned char) round(server->partida.cancha.largo * 0.05);
	if ( altura < 50 ) {
		altura = 50; 
	}
	
	player1->posicion.x = cuerpo; 
	player1->largo		= cuerpo;
	
	player1->alto		= altura; 
	player1->posicion.y	= 
		(int) round(server->partida.cancha.alto / 2 - altura / 2);
	
	//Player2 obtiene los valores directamente de los cálculos de player1, total
	//es lo mismo pero del otro lado de la pantalla. 
	
	player2->posicion.x = 
		server->partida.cancha.largo - ( cuerpo * 2 ) ; 
	
	player2->posicion.y	= player1->posicion.y;
	player2->alto		= player1->alto;
	
	sprintf(
		&output,
		"<START:%d:%d:%d:%d:%d:%d:%d:%d>",
        server->partida.pelota.posicion.x ,
        server->partida.pelota.posicion.y ,
        player1->posicion.x ,
        player1->posicion.y ,
        player2->posicion.x ,
        player2->posicion.y ,
		cuerpo ,
		altura 
	);
	
	pong_send_data( &output, pong_get_current_client( server ) );
	
	server->partida.iniciado   = 1;
	
}


void pong_send_data( char * string , struct pong_cliente * cliente) {
	
	int longitud = strlen( string );
	int i;
	printf( "%s", string );
}

void pong_parse_input( char * string, struct pong_servidor * server , char tipo) {
	
	// Reviso los comandos posibles, uno por uno.
	
	
	char output[30];
	/*
	sprintf ( 
		&output , 
		"<DEBUG:%s>" ,	
		string 
	);
	pong_send_data( &output , &server->clientes[0] );
	*/
	
	
	if ( strcmp( string , "HOLA"  ) == 0 ) {
		// Inicio el handshake con un cliente.
		pong_handshake( server , tipo);
	} else if ( strcmp( string , "CHAU"  ) == 0 ) {
		// Desconecta al cliente actual
		
	} else {
		
		// Necesito realizar un split. 
		char *token;
		char *search = ":";
		char i		 = 0;

		// Token va a tener la primera acepción de un texto antes del ":".
		// En adelante, sucesivos llamados devuelve el resto de los parámetros.
		// Con esto parseo cualquier parámetro.
		token = strtok( string, search);
		
		if ( strcmp( token , "CLIENTE_TIPO"  ) == 0 ) { 
			// Establece el tipo de cliente. 
			// El segundo parámetro debería ser el id del cliente.
			token = strtok( NULL, search);
			unsigned char id = atoi( token );
			
			for( i=0; i < PONG_CANTIDAD_MAXIMA_CLIENTES; i++) {
				if ( server->clientes[i].id == id ) {
					// Si encontré el cliente, proceso el comando.
					
					token = strtok( NULL, search); // Tipo de cliente.
					char tipo = (char) atoi(token);
					token = strtok( NULL, search); // Cantidad players.
					char cant = (char) atoi(token);
					
					// Si es un tipo válido, lo registro.
					if ( 
						tipo == PONG_CLIENTE_TIPO_DISPLAY
						|| tipo == PONG_CLIENTE_TIPO_PLAYER
						|| tipo == PONG_CLIENTE_TIPO_MIXTO
						) {
						server->clientes[i].tipo = tipo;
					}
					
					// Si es un tipo que implica players, registro la cantidad
					// de players provistos para este cliente.
					if ( 
						tipo == PONG_CLIENTE_TIPO_PLAYER
						|| tipo == PONG_CLIENTE_TIPO_MIXTO
						) {
						
						if ( cant > 0 ) {
							for ( char i2 = 0 ; i2 < PONG_CANTIDAD_MAXIMA_PLAYERS; i2++ ) {
								if (i2 >= cant) {
									break;
								}
								server->partida.players[i2].tipo = PONG_PLAYER_TIPO_HUMANO;
							}
						}
					}
				}
				
				break;
			}
			
		} else if ( strcmp( token , "MOVEUP"  ) == 0 ) { 
			// Mueve un player hacia arriba
			
			token = strtok( NULL, search); // Acá obtengo el número de player.
			int index = atoi(token) - 1;
			
			int tmp   = server->partida.players[ index ].posicion.y 
					  - server->partida.players[ index ].alto;
			
			//char output[30];
			/*
			sprintf ( 
				&output , 
				"<DEBUG_MOVEUP:%d:%d:%d>" ,	
				index , 
				tmp   , 
				server->partida.players[ index ].posicion.y
			);
			pong_send_data( &output , &server->clientes[i] );
			*/
			
			if ( server->partida.players[ index ].posicion.y > 0) {
				
				server->partida.players[ index ].posicion.y = 
															( tmp < 0 ) 
															? 0 
															: tmp;
				//pong_update_stats( server );
			}
			
			
		} else if ( strcmp( token , "MOVEDOWN"  ) == 0 ) { 
			// Mueve un player hacia abajo
			
			token = strtok( NULL, search); // Acá obtengo el número de player.
			int index =  atoi(token) - 1;
			
			int tmp   = server->partida.players[ index ].posicion.y 
						+ server->partida.players[ index ].alto;
			
			//char output[30];
			/*
			sprintf ( 
				&output , 
				"<DEBUG_MOVEDOWN:%d:%d:%d>" ,	
				index , 
				tmp   , 
				server->partida.players[ index ].posicion.y
			);
			pong_send_data( &output , &server->clientes[i] );
			*/
			
			if (	tmp < server->partida.cancha.alto 
					&& server->partida.players[ index ].posicion.y 
						< ( server->partida.cancha.alto - server->partida.players[ index ].alto ) 
				) {
				
				server->partida.players[ index ].posicion.y  = 
					(tmp + server->partida.players[ index ].alto < server->partida.cancha.alto) 
					? tmp 
					: server->partida.cancha.alto - server->partida.players[ index ].alto;
				//pong_update_stats( server );
			}
			
		} else if ( strcmp( token , "START"  ) == 0 ) { 
			// Comienza una partida
            char width[5];
            strcpy( width, strtok( NULL, search));
            char height[5];
            strcpy( height, strtok( NULL, search));
            
            pong_iniciar_partida( server , atoi(width), atoi(height) );
			
		} else if ( strcmp( token , "REGISTRAR_PLAYER"  ) == 0 ) { 
			// Dá de alta un jugador 
			token = strtok( NULL, search);
			pong_registrar_player( server , token );
		} else {
			
			sprintf ( 
				&output , 
				"<DEBUG_NOTFOUND:%s>" ,	
				token 
			);
			pong_send_data( &output , &server->clientes[i] );
			
		}
		
	}
	
}

void pong_handshake ( struct pong_servidor * server , char tipo_conexion ) {
	
	char clientes_detectados = 0;
	char i;
	
	for (i = 0; i < PONG_CANTIDAD_MAXIMA_CLIENTES; i++) {
		
		if ( server->clientes[i].tipo != PONG_CLIENTE_TIPO_NULO ) {
			clientes_detectados++;
		} else {
			break;
		}
		
	}
	
	
	if (clientes_detectados >= PONG_CANTIDAD_MAXIMA_CLIENTES) {
		//No se puede efectuar el handshake. Demasiadas conexiones.
		return;
	}
	
	//Si llegó hasta acá, es porque hay lugar para más clientes.
	//El índice del próximo cliente libre lo tengo en la misma variable.
	//Por defecto asigna que el cliente es de tipo display. El cliente en otro 
	//momento (mediante comando) va a poder cambiar su tipo de cliente.
	server->clientes[clientes_detectados].tipo = PONG_CLIENTE_TIPO_DISPLAY;
	server->clientes[clientes_detectados].tipo_conexion = tipo_conexion;
	server->clientes[clientes_detectados].protocolo = 0; // El único de momento.
	server->clientes[clientes_detectados].id = (unsigned char) rand() * 255 + 1; 
	
	//devuelvo información relevante al cliente para que continúe el proceso.
	char output[30];
	sprintf ( 
		&output , 
		"<HOLA:%d:%d:%d:%d>" ,	
		server->protocolos[0].tipo , 
		server->protocolos[0].formato , 
		server->protocolos[0].version ,
		server->clientes[clientes_detectados].id
	);
	pong_send_data( &output , &server->clientes[clientes_detectados] );
}

void pong_registrar_player( struct pong_servidor * server , char * nombre ) {
	
	char players_detectados = 0;
	for ( char i = 0; i < PONG_CANTIDAD_MAXIMA_PLAYERS ; i++) {
		if ( server->partida.players[i].tipo != PONG_PLAYER_TIPO_NULO ) {
			players_detectados++;
		} else {
			break;
		}
	}
	
	if ( players_detectados >= PONG_CANTIDAD_MAXIMA_PLAYERS ) {
		//No se pueden registrar más players.
		return;
	}
	
	struct pong_player * player;
	player = &server->partida.players[players_detectados];
	
	player->nombre	= nombre;
	player->tipo	= PONG_PLAYER_TIPO_HUMANO;
	player->id		= (unsigned char) rand() * 255 + 1;
	player->cliente = pong_get_current_client( server );
	
	
}

struct pong_cliente * pong_get_current_client( struct pong_servidor * server ) {
	// De momento, devuelve sólo un cliente. Más adelante idearé algún mecanismo
	// para identificar clientes de manera no ambigua. Hoy no tengo este 
	// problema porque el prototipo sólo va a tener un cliente conectado por 
	// RS232.
	return &server->clientes[0]; 
}


void pong_update_pelota( struct pong_pelota * pelota ) {
	pelota->counter++;
	if ( pelota->counter >= pelota->velocidad  ) {
		pelota->counter = 0;
	} 
	
	if (pelota->counter == 0) {
		if ( pelota->direccionx == 0 ) {
			pelota->posicion.x = pelota->posicion.x - pelota->tamanio;
		} else {
			pelota->posicion.x = pelota->posicion.x + pelota->tamanio;
		}

		if ( pelota->direcciony == 0 ) {
			pelota->posicion.y = pelota->posicion.y - pelota->tamanio;
		} else {
			pelota->posicion.y = pelota->posicion.y + pelota->tamanio;
		}
	}
}

void pong_update_stats ( struct pong_servidor * server ) {
	
	struct pong_pelota * pelota  = &server->partida.pelota; 
	struct pong_player * player1 = &server->partida.players[0];
	struct pong_player * player2 = &server->partida.players[1];
	char i = 0;
	char output[60]; // Para construir un string que se enviará a los clientes.
	
	// Primero los players
	if ( player1->tipo == PONG_PLAYER_TIPO_BOT ) {
		pong_mover_bot( &server->partida, player1 );
	}
	
	if ( player2->tipo == PONG_PLAYER_TIPO_BOT ) {
		pong_mover_bot( &server->partida, player2 );
	}
	
	// Luego la pelotita.
	pong_update_pelota( pelota );
	
	if ( pong_check_colision( &server->partida ) == 1 ) {
		// Hubo colisión, refresco la pelota.
		pong_update_pelota( pelota );
	}
	
	// Envío los datos actualizados a los clientes.
	
	sprintf ( 
		&output , 
		"<DATA:%d:%d:%d:%d:%d:%d:%d>" ,
		pelota->posicion.x  , 
		pelota->posicion.y  , 
		player1->posicion.x ,
		player1->posicion.y ,
		player2->posicion.x ,
		player2->posicion.y , 
        pelota->velocidad * 100
	);
	
	for ( i = 0; i < PONG_CANTIDAD_MAXIMA_CLIENTES ; i++ ) {
		if ( server->clientes[i].tipo == PONG_CLIENTE_TIPO_DISPLAY  
			|| server->clientes[i].tipo == PONG_CLIENTE_TIPO_MIXTO ) {
			pong_send_data( &output, &server->clientes[i] );
		}
	}
}

char pong_check_colision ( struct pong_partida * partida ) {
	
	/*
	 * Necesito chequear: 
	 * 1) Si golpea contra el techo.
	 * 2) Si golpea contra el piso.
	 * 3) Si la pelota pega contra player 2.
	 * 4) Si la pelota pega contra player 1.
	 * 5) Si es gol del player 2.
	 * 6) Si es gol del player 1.
	*/
	
	struct pong_player * player1 = &partida->players[0];
	struct pong_player * player2 = &partida->players[1];
	char colision = 0; // Más tarde, si esto cambió, opero sobre la velocidad.
	
	// 1) 
	
	if ( partida->pelota.posicion.y < 0 ) {
		// Golpeó contra el techo.
		partida->pelota.posicion.y = 0;
		partida->pelota.direcciony = 1; // Distinto de 0 significa "abajo".
		colision = 1;
		pong_send_data( "<COLISION:1>" , player2->cliente);
	}
	
	// 2)
	if ( partida->pelota.posicion.y + partida->pelota.tamanio > partida->cancha.alto ) {
		// Golpeó contra el piso.
		partida->pelota.posicion.y = partida->cancha.alto - partida->pelota.tamanio;
		partida->pelota.direcciony = 0; // 0 significa "arriba".
		colision = 1;
		pong_send_data( "<COLISION:2>" , player2->cliente);
	}
	
	// 3 
	
	if ( 
		partida->pelota.posicion.x <= partida->players[1].posicion.x
		&& partida->pelota.posicion.x + partida->pelota.tamanio >= partida->players[1].posicion.x
		&& partida->pelota.posicion.y + partida->pelota.tamanio >= partida->players[1].posicion.y
		&& partida->pelota.posicion.y <= partida->players[1].posicion.y + partida->players[1].alto
	   ) {
		// Colisión contra player2
		partida->pelota.direccionx = 0; // Cero significa "izquierda".
		colision = 1;
		pong_send_data( "<COLISION:3>" , player2->cliente);
	}
	
	// 4) 
	if ( 
		player1->posicion.x < partida->pelota.posicion.x
		&& partida->pelota.posicion.x < (player1->posicion.x + player1->largo)
		&& player1->posicion.y < (partida->pelota.posicion.y + partida->pelota.tamanio)
		&& (partida->pelota.posicion.y + partida->pelota.tamanio) < (player1->posicion.y + player1->alto)
	   ) {
		// Colisión contra player1
		partida->pelota.direccionx = 1; // Distinto a cero significa "derecha".
		colision = 1;
		pong_send_data( "<COLISION:4>" , player2->cliente);
	}
	
	// 5)
	if ( partida->pelota.posicion.x <= 0 ) {
		// Gol del player 2
		pong_gol( partida , player2 );
	}
	
	// 6)
	if ( partida->pelota.posicion.x + partida->pelota.tamanio >= partida->cancha.largo ) {
		// Gol del player 1
		pong_gol( partida , player1 );
	}
	
	
	// Con cada colisión, la pelota vá más rápido, hasta una velocidad de "10".
	if ( colision != 0 ) {
		if (partida->pelota.velocidad > PONG_PELOTA_VELOCIDAD_MAX ) {
			partida->pelota.velocidad--;
		}
	}
	
	return colision;
	
}


void pong_gol ( struct pong_partida * partida , struct pong_player * player ) {
	partida->gol = 5; // Ciclos del main. Eso está configurado en otra constante
	player->puntaje++;
	char output[12];
	sprintf ( 
		&output , 
		"<GOL:%d>" ,
		player->id
	);
	
	// Persisto data sobre el último gol, para que desde afuera se puedan tomar
	// decisiones con eso. Concretamente, la dirección hacia donde va a ir la 
	// pelota cuando se resetee su posición.
	if ( partida->players[0].id == player->id ) {
		partida->last_gol = 2;
	} else {
		partida->last_gol = 1;
	}
	
	
	pong_send_data( &output , player->cliente );
	
	if ( player->puntaje == PONG_CANTIDAD_MAXIMA_GOLES ) {
		pong_finalizar_partida ( partida );
		pong_send_data( "<END>" , player->cliente );
	}
}


void pong_mover_bot ( struct pong_partida * partida, struct pong_player * player ) {
	
	if ( partida->pelota.posicion.y < player->posicion.y  ) {
		// Mover para arriba
		pong_mover_player( partida, player, 0 );
	} else {
		// Mover para abajo
		pong_mover_player( partida, player, 1 );
	}
	
}

void pong_mover_player ( struct pong_partida * partida, struct pong_player * player, char direccion ) {
	if ( direccion == 0  ) {
		// Mover para arriba
		player->posicion.y = player->posicion.y - partida->pelota.tamanio;
	} else {
		// Mover para abajo
		player->posicion.y = player->posicion.y + partida->pelota.tamanio;
	}
	
	if ( player->posicion.y < 0 ) {
		player->posicion.y = 0;
	}
	
	if ( player->posicion.y > partida->cancha.alto - player->alto ) {
		player->posicion.y = partida->cancha.alto - player->alto;
	}
}

void pong_finalizar_partida( struct pong_partida * partida ) {
	partida->iniciado   = 0;
	partida->finalizado = 1;
}

