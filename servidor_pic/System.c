#include <xc.h>
#include <adc.h>
#include <timers.h>
#include <usart.h>
#include "System.h"
#include "FunDis.h"


void InitPorts(void)
{
    TRISBbits.RB0=0; //RB0 salida
    TRISBbits.RB1=0; //RB1 salida
    TRISBbits.RB2=0; //RB2 salida
    TRISBbits.RB3=0; //RB3 salida
    TRISBbits.RB4=0; //RB4 salida
    TRISBbits.RB5=0; //RB5 salida
    TRISEbits.RE1=0;//RE1 salida
    TRISEbits.RE2=0;//RE2 salida
    TRISCbits.RC0=0;//RC0 salida
    TRISDbits.RD4=0;//RD4 salida
    TRISDbits.RD5=0;//RD5 salida
    TRISDbits.RD6=0;//RD6 salida
    TRISDbits.RD7=0;//RD7 salida
    
    TRISAbits.RA2=0; //RA2 GREEN salida
    TRISAbits.RA3=0; //RA3 RED salida
    TRISAbits.RA4=0; //RA4 BLUE salida
    TRISAbits.RA5=0; //BUZZER salida
    
    TRISDbits.RD0=1; //Pulsador 0 entrada
    TRISDbits.RD1=1; //Pulsador 1 entrada
    TRISDbits.RD2=1; //Pulsador 2 entrada
    TRISDbits.RD3=1; //Pulsador 3 entrada
    
    TRISAbits.RA0=1; //entrada analógica 00
    TRISAbits.RA1=1; //entrada analógica 01
    
    //AN0-AN1 Analogica. el resto digital
	ADCON1bits.PCFG0=1;
	ADCON1bits.PCFG1=0;
	ADCON1bits.PCFG2=1;
	ADCON1bits.PCFG3=1;
    
    BZZ=0;
    LED_P=0;
    RED=0;
    GREEN=0;
    BLUE=0;
}

//TIMER2
void InitTimer2(void)
{
	// El timer2 provoca una interrupción cada 1 ms
	OpenTimer2( TIMER_INT_ON &
				T2_PS_1_4 &  
				T2_POST_1_5 );
	PR2 = 250;
		
	IPR1bits.TMR2IP = 1;	//Interrup de Timer2 en el vector alto
}

/*************************************************************************************************
*     Function Name:    initinterrupt		        		                  			 		 *
*     Return Value:     none				                        			 				 *
*     Parameters:       none									                 				 *
*     Description:      Configura las interrupciones 											 *												 *
*************************************************************************************************/
void InitInterrupt(void)
{	
  RCONbits.IPEN = 1;    // Habilita proridad de interrupciones
  INTCONbits.GIEH = 1;  // vector alto
  INTCONbits.GIEL = 1;  // vector bajo
}


void initUSART(void) {
    
    OpenUSART( USART_TX_INT_OFF &
               USART_RX_INT_ON &
               USART_ASYNCH_MODE & 
               USART_EIGHT_BIT &
               USART_CONT_RX &
               USART_BRGH_HIGH, 129);
    IPR1bits.RCIP = 1;
}  

void putch (char caracter) {
    
	while (!PIR1bits.TXIF) {
        continue;
	}
	
    TXREG = caracter;
}

