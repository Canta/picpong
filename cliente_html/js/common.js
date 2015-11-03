
$(document).ready(
    function(){
        var base  = (app.path) ? app.path : "";
        
        $.address.state( location.protocol + "//" + location.host  );
        $.address.changes = 0;
        
        /* handler de pushstate */
        
        $.address.bind("change",function(event) { 
            $.address.changes++;
            
            if ($.address.changes == 1) {
                return;
            }
            //console.log("event.value", event.value);
            $.ajax(
                {
                    cache  : false,
                    url    : event.value,
                    method : "post",
                    data   : {
                        pushstate : "pushstate"
                    }
                }
            ).then(
                function ( response ) {
                    $("#content").html(response);
                } ,
                function ( response ) {
                    console.log(response);
                }
            );
            
        });
        
        /* Asigno eventos de pushstate */
        
        app.ui.setup_pushstate("nav a[href!=#][role!=logout]");
        
        var set_font_sizes = function () {
            var tmp = function() {
                $(".titulo > p").css( "font-size", ($(window).width()  / 6) + "px" );
                $(".menu > .opcion").css( "font-size",  $($(".menu > .opcion")[0]).height()  + "px" );
                $(".puntaje").css( "font-size",  Math.round(($("body").width() / 15))  + "px" );
            }
            setTimeout(tmp, 10);
        };
        
        $( window ).on( "resize" , set_font_sizes);
        set_font_sizes();
        
        app.ui.change_section("main");
        
        // Asignación de eventos del teclado.
        $(document).on(
            "keyup", 
            function ( evt ) {
                if ( pong.conexion.socket && app.current_section[0].id === "juego") {
                    //console.log("keyup", evt.key);
                    if ( evt.key === "ArrowUp" ) {
                        pong.clear_player_timers(pong.players[1]);
                    } else if ( evt.key === "ArrowDown" ) {
                        pong.clear_player_timers(pong.players[1]);
                    } else if ( evt.key === "s" || evt.key === "S" ) {
                        pong.clear_player_timers(pong.players[0]);
                    } else if ( evt.key === "w" || evt.key === "W" ) {
                        pong.clear_player_timers(pong.players[0]);
                    }
                }
            }
        );
        
        $(document).on(
            "keydown", 
            function ( evt ) {
                if ( pong.conexion.socket && app.current_section[0].id === "juego") {
                    //console.log("keydown", evt.key);
                    if ( evt.key === "ArrowUp" ) {
                        if (pong.players[1].timer_key === null) {
                            pong.send_player_cmd(pong.players[1], "<MOVEUP:2>");
                        }
                    } else if ( evt.key === "ArrowDown" ) {
                        if (pong.players[1].timer_key === null) {
                            pong.send_player_cmd(pong.players[1], "<MOVEDOWN:2>");
                        }
                    } else if ( evt.key === "s" || evt.key === "S" ) {
                        if (pong.players[0].timer_key === null) {
                            pong.send_player_cmd(pong.players[0], "<MOVEDOWN:1>");
                        }
                    } else if ( evt.key === "w" || evt.key === "W" ) {
                        if (pong.players[0].timer_key === null) {
                            pong.send_player_cmd(pong.players[0], "<MOVEUP:1>");
                        }
                    }
                }
            }
        );
        
    }
);
