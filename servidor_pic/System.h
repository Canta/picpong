
void InitPorts(void);
void InitInterrupt(void);
void InitTimer2(void);


#define CANT_IN 4

#define LED_A PORTBbits.RB0
#define LED_B PORTBbits.RB1
#define LED_C PORTBbits.RB2
#define LED_D PORTBbits.RB3
#define LED_E PORTBbits.RB4
#define LED_F PORTBbits.RB5
#define LED_G PORTEbits.RE1
#define LED_P PORTEbits.RE2
#define TRANS_0 PORTCbits.RC0
#define TRANS_1 PORTDbits.RD7
#define TRANS_2 PORTDbits.RD6
#define TRANS_3 PORTDbits.RD5
#define TRANS_4 PORTDbits.RD4

#define GREEN PORTAbits.RA2
#define RED PORTAbits.RA3
#define BLUE PORTAbits.RA4

#define BZZ PORTAbits.RA5

#define IN00 PORTDbits.RD0
#define IN01 PORTDbits.RD1
#define IN02 PORTDbits.RD2
#define IN03 PORTDbits.RD3

