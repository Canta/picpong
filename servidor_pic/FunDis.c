#include <xc.h>
#include "System.h"
#include "FunDis.h"


void PrintDisp (char numdisp,char digito)
{
    switch (digito)
    {
        case 0:
        LED_A=1;
        LED_B=1;
        LED_C=1;
        LED_D=1;
        LED_E=1;
        LED_F=1;
        LED_G=0;   
        break;
        
        case 1:
        LED_A=0;
        LED_B=1;
        LED_C=1;
        LED_D=0;
        LED_E=0;
        LED_F=0;
        LED_G=0;
        break;          
                
        case 2:
        LED_A=1;
        LED_B=1;
        LED_C=0;
        LED_D=1;
        LED_E=1;
        LED_F=0;
        LED_G=1;
        break;
        
        case 3:    
        LED_A=1;
        LED_B=1;
        LED_C=1;
        LED_D=1;
        LED_E=0;
        LED_F=0;
        LED_G=1;  
        break;          
      
        case 4:     
        LED_A=0;
        LED_B=1;
        LED_C=1;
        LED_D=0;
        LED_E=0;
        LED_F=1;
        LED_G=1;          
        break;
        
        case 5:
        LED_A=1;
        LED_B=0;
        LED_C=1;
        LED_D=1;
        LED_E=0;
        LED_F=1;
        LED_G=1;
        break;
    
        case 6:
        LED_A=1;
        LED_B=0;
        LED_C=1;
        LED_D=1;
        LED_E=1;
        LED_F=1;
        LED_G=1;         
        break;
    
        case 7:
        LED_A=1;
        LED_B=1;
        LED_C=1;
        LED_D=0;
        LED_E=0;
        LED_F=0;
        LED_G=0;         
        break;   
    
        case 8:
        LED_A=1;
        LED_B=1;
        LED_C=1;
        LED_D=1;
        LED_E=1;
        LED_F=1;
        LED_G=1;         
        break;   
        
        case 9:
        LED_A=1;
        LED_B=1;
        LED_C=1;
        LED_D=1;
        LED_E=0;
        LED_F=1;
        LED_G=1;         
        break;   
    }
    
    
    
   switch (numdisp) 
    {
       case 0:
       displayoff();
       TRANS_0=1;        
       break;
       
       case 1:
       displayoff();
       TRANS_1=1;
       break;
       
       case 2:
       displayoff();
       TRANS_2=1;
       break;
       
       case 3:
       displayoff();
       TRANS_3=1;
       break;
       
       case 4:
       displayoff();
       TRANS_4=1;
       break;
     }
} 
void displayoff (void)
{
    TRANS_0=0;
    TRANS_1=0;
    TRANS_2=0;
    TRANS_3=0;
    TRANS_4=0; 
}

char GetDigito(int valor, char digito)
{
    char uni;
    char buf1;
    char dec;
    char buf2;
    char cen;
    char val2ret;
    
    uni=valor%10;
    buf1=valor/10;
    dec=buf1%10;
    buf2=valor/100;
    cen=buf2%10;
    
    if(digito==0)
    {
        val2ret=uni;
    }
    else if(digito==1)
    {
        val2ret=dec;
    }
    else
    {
        val2ret=cen;
    } 
    return val2ret;
}