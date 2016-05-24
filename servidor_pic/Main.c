#include <xc.h>
#include <adc.h>
#include <timers.h>
#include <usart.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include "System.h"
#include "FunDis.h"
#include "Config.h"
#include "pong.h"


/**
 * Limpia el buffer de entrada de datos serial, y reestablece variables 
 * vinculadas al proceso de lectura de datos por el puerto serie.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @date 20151017
 */
void reset_input_buffer();


struct    pong_servidor    server;                //Server global.
struct    pong_cliente    *cliente_serial;    //Sólo puede haber uno de estos.

// Variables para la gestión del input desde RS232
unsigned char    input_buffer[PONG_PROTOCOLO_INPUT_BUFFER] ;
unsigned char    input_buffer_index    = 0;
char             buffering             = 0;

// Variables y constantes para timers y estados.
#define            TIEMPO_STATS      100
unsigned int    timer_stats        = 0; 
unsigned int    timer_pelota    = 0; 


/**
 * Servidor de PONG para PIC18F4520.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 * @author Bárbara Menares Aguilar
 * @date 20151017
 */
void main(void) 
{
    InitPorts();
    InitInterrupt();
    InitTimer2();
    initUSART();
    
    pong_boot_server( &server );
    
    while ( 1 ) {
        
        // Solo realiza operaciones por fuera de las interrupciones en caso de 
        // que haya alguna partida guardada.
        if ( server.listo != 0 && server.partida.iniciado != 0 ) {
            
            if ( timer_stats >= TIEMPO_STATS ) {
                
                if ( server.partida.gol > 0 ) {
                    server.partida.gol--;
                    if (server.partida.gol == 0) {
                        pong_reset_pelota( &server, server.partida.last_gol );
                    }
                } else {
                    pong_update_stats( &server );
                }
                
                timer_stats = 0;
            } 
            
        }
        
    }
}

//high_priority interrupt
void high_priority interrupt MyHighIsr(void) {
    
    // Interrumpio Timer2 ?
    if ( PIR1bits.TMR2IF ) {
        PIR1bits.TMR2IF = 0;    // Limpia el flag de interrupcion    
        
        if ( server.listo != 0 && server.partida.iniciado != 0 ) {
            timer_stats++;
            //timer_pelota++;
            
            /*
            if ( server.partida.gol == 0 ) {
                pong_update_pelota( &server.partida.pelota );

                
                if ( pong_check_colision( &server.partida ) == 1 ) {
                    // Hubo colisión, refresco la pelota.
                    pong_update_pelota( &server.partida.pelota );
                    //pong_update_stats( &server );
                }
                
            }
            */
        }
        
    }
    
    //Interrumpio USART RX (llego un dato por el puerto serie ?)
    if(PIR1bits.RCIF) {

        PIR1bits.RCIF = 0;
        
        // Si el server está preparado para recibir datos, los proceso.
        if ( server.listo > 0 ) {
            
            //Primero proceso fín de comando.
            if ( RCREG == '>' || input_buffer_index == PONG_PROTOCOLO_INPUT_BUFFER ) {
                pong_parse_input( &input_buffer , &server , 1);
                GREEN = 1;
                reset_input_buffer();
            }
            
            //Luego, en caso de que se haya iniciado previamente algún comando, 
            //junto caracteres en el buffer hasta detectar un cierre de comando.
            if ( buffering > 0 ) {
                input_buffer[ input_buffer_index ] = RCREG;
                input_buffer_index++;
                //TXREG = RCREG;
            }
            
            //Y finalmente, continúo con la mecánica de comandos. Detecto el 
            //inicio de algún comando.
            if ( RCREG == '<' ) {
                reset_input_buffer();
                buffering = 1;
            }
            
        }
    }
}

void low_priority interrupt MyLowIsr(void)
{
    //¿conversor A/D?
    if (PIR1bits.ADIF)
    {
        PIR1bits.ADIF=0;
        //adend=1;
    }
    
}


void reset_input_buffer() {
    
    //borro el buffer y reinicio el índice.
    input_buffer_index    = 0;
    buffering            = 0;
    memset(input_buffer,0,sizeof(input_buffer));
}
