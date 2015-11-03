/**
 * App class.
 * It's used as a global namespace for common operations.
 * 
 * @author Daniel Cantarín <canta@canta.com.ar>
 */
var App = (function() {
    var app = function(){};
    app.version          = "1.1";
    //app.path = ".";
    app.path             = location.protocol + "//" + location.hostname + (location.port ? ':'+location.port: '');
    app.idioma           = "es"; 
    app.esperando        = [];
    app.cubrecuerpo      = [];
    app.current_section  = $();
    app.timers           = {};

    app.timers.drag = [];

    app.show_modal = function($data){
        
        var def = new $.Deferred();
        if ($data === undefined){
            $data = {};
        }
        if ($data.html === undefined){
            $data.html = "";
        }
        if ($data.ok === undefined){
            $data.ok = [];
        }
        if ($data.cancel === undefined){
            $data.cancel = [];
        }
        
        
        var $tmp_done = function(){
            var rand = Math.floor(Math.random() * 9999999);
            var $tmp_html = "";
            $tmp_html  = "<div class=\"modal\" numero=\""+rand+"\">";
            $tmp_html += "<div class=\"modal-html\" >"+$data.html+"</div>";
            $tmp_html += "<div class=\"botonera\">";
            
            if ( $data.mostrar_cancel === undefined || $data.mostrar_cancel !== false ) {
                $tmp_html += "<button id=\"modal_button_cancelar\"> Cancelar </button> ";
            }
            
            if ( $data.mostrar_ok === undefined || $data.mostrar_ok !== false ) {
                $tmp_html += "<button id=\"modal_button_aceptar\" onclick=\"$(this).attr('disabled','disabled')\"> Aceptar </button>";
            }
            
            $tmp_html += "</div>";
            $tmp_html += "</div>";
            
            
            $tmp_html = (app.cubrecuerpo.length > 0) ? $tmp_html : "<div class=\"cubre-cuerpo\"></div>" + $tmp_html;
            
            $("body").append($tmp_html);
            $(".modal[numero='"+rand+"']").append("<div class=\"cubre-modal\" >&nbsp;</div>");
            
            if (app.cubrecuerpo.length <= 0){
                $(".cubre-cuerpo").fadeIn(250);
            }
            app.cubrecuerpo.push(rand);
            $(".modal:not(.espere)").fadeIn(500).promise().then(
                function(){
                    $(".modal:not(.espere) > .botonera").fadeIn(100).promise().then(
                        function(){
                        
                            if ($data.ok instanceof Array){
                                for (var $i = 0; $i < $data.ok.length; $i++){
                                    $("#modal_button_aceptar:visible").on("click",$data.ok[$i]);
                                }
                            } else if ($data.success instanceof Function) {
                                $("#modal_button_aceptar:visible").on("click",$data.ok);
                            }
                            
                            if ($data.cancel instanceof Array){
                                for (var $i = 0; $i < $data.cancel.length; $i++){
                                    $("#modal_button_aceptar:visible").on("click",$data.cancel[$i]);
                                }
                            } else if ($data.cancel instanceof Function) {
                                $("#modal_button_aceptar:visible").on("click",$data.cancel);
                            }
                            
                            $("#modal_button_cancelar:visible").on("click",app.hide_modal);
                            
                            $("#modal_button_aceptar:visible").on("click",function(){
                                if (app.modal_ok){
                                    app.hide_modal();
                                }
                            });
                            def.resolve("modal listo");
                            app.modal_ok = true;
                            $(".modal:not(.espere) > .cubre-modal").fadeOut(200);
                        }
                    );
                }
            );
            
            
        };
        
        if ($(".modal:not(.espere)").length > 0 ){
            app.hide_modal().then($tmp_done);
        } else {
            $tmp_done();
        }
        
        return def;
    }

    app.hide_modal = function(){
        var def = new $.Deferred();
        if ($(this).attr("id") == "modal_button_aceptar" && app.modal_ok != true){
            def.fail("Error al intentar cerrar un modal");
        }
        rand = parseInt($(".modal").attr("numero"));
        var found = false;
        for (var i in app.cubrecuerpo){
            if (app.cubrecuerpo[i] == rand){
                app.cubrecuerpo.splice(i,1);
                found = true;
                break;
            }
        }
        //Fix: a veces obtengo NaN, no encuentra el número del modal, y
        //falla la gestión de cubrecuerpo. En ese caso, quito un item de
        //una manera u otra.
        if (!found && app.cubrecuerpo.length > 0){
            app.cubrecuerpo.splice(0,1);
        }
        
        if (app.cubrecuerpo.length <= 0){
            $(".cubre-cuerpo").fadeOut(300, function(){
                $(this).remove();
            });
        }
        $(".modal").fadeOut(250).promise().then(function(){
            var t = $(this);
            if (t.attr("onhide") !== undefined && t.attr("onhide") !== ""){
                eval(t.attr("onhide"));
            }
            t.remove();
            
            def.resolve("hide_modal resuelto");
        });
        return def;
    }


    app.espere = function($desc, $fin, $html){
        
        var d = new $.Deferred();
        
        if ($html === undefined){
            $html = "";
        }
        
        //creo los componentes visuales de espera
        if ($("body > .cubre-cuerpo").length == 0){
            $("body").append("<div class=\"cubre-cuerpo\" tyle=\"display:none\"></div>");
        }
        if ($("body > .modal-custom").length == 0){
            $("body").append("<div class=\"modal-custom espere\" tyle=\"display:none\"><div class=\"descripciones\"></div></div>");
        }
        
        if (app.esperando.length == 0 || $("body > .cubre-cuerpo").css("display") == "none"){
            $("body > .cubre-cuerpo").fadeIn(250).promise().then( function(){
                $("body > .espere").fadeIn(250).promise().then(
                    function() { d.resolve("espere resuelto"); }
                );
            });
        } else {
            setTimeout( function() { d.resolve("espere resuelto"); }, 250 );
        }
        
        
        app.esperando.push([$desc,$fin]);
        app.cubrecuerpo.push($desc);
        var $id = "espere-" + app._str_to_id($desc);
        $("body > .espere .descripciones").append("<p class=\"waiting-text\" id=\""+$id+"\">" + $desc + $html + "</p>");
        
        return d;
    }

    app.desespere = function($desc, $ok){
        
        var found = false;
        var clase = ($ok !== false) ? "success-text" : "error-text";
        
        if ($desc === undefined){
            if (app.esperando.length > 0){
                $desc = app.esperando[0][0];
                var $id = "espere-" + app._str_to_id($desc);
                $("body > .espere .descripciones #"+$id).removeClass("waiting-text").addClass(clase).append("<span>..." + app.esperando[0][1] + "</span>");
                app.esperando.splice(0,1);
                for ($i in app.cubrecuerpo){
                    if (app.cubrecuerpo[$i] == $desc){
                        app.cubrecuerpo.splice($i,1);
                        found = true;
                        break;
                    }
                }
            }
        } else {
            for ($i in app.esperando){
                if (app.esperando[$i][0] == $desc){
                    var $id = "espere-" + app._str_to_id($desc);
                    $("body > .espere .descripciones #"+$id).removeClass("waiting-text").addClass(clase).append("<span>..." + app.esperando[$i][1] + "</span>");
                    app.esperando.splice($i,1);
                    break;
                }
            }
            for ($i in app.cubrecuerpo){
                if (app.cubrecuerpo[$i] == $desc){
                    app.cubrecuerpo.splice($i,1);
                    found = true;
                    break;
                }
            }
        }
        
        if (!found && app.cubrecuerpo.length > 0 ){
            app.cubrecuerpo.splice(0,1);
        }
        if (app.cubrecuerpo.length == 0){
            $(".cubre-cuerpo").fadeOut(500, function(){
                $(this).remove();
            });
        }
        if (app.esperando.length == 0){
            $("body > .espere").fadeOut(500, function(){
                $(this).remove();
            });
        }
       
    }

    app._str_to_id = function($str){
        var $tmp = $str.toLowerCase().replace(/\ /gi,"-").replace(/\"/gi,"");
        return $tmp;
    }

    app.mostrar_error = function($msg){
        alert("Error:\n"+$msg);
    }

    app.mostrar_mensaje = function($msg){
        alert($msg);
    }

    app.confirmar = function(msg){
        return window.confirm(msg);
    }

    app.start_drag = function($e){
        $random = Math.round(Math.random() * 999999);
        if ($e[0].className.indexOf("draggable") <= -1){
            $e = $e.parent(".draggable");
            if ($e.length == 0){
                return false;
            }
        }
        $id = $e.attr("id");
        if ($id == undefined){
            $id = "draggable" + $random;
            $e.attr("id",$id);
        }
        if ($e.css("left") == null || $e.css("left") == undefined){
            $e.css("left",$e[0].offsetLeft+"px");
        }
        if ($e.css("top") == null || $e.css("top") == undefined){
            $e.css("top",$e[0].offsetLeft+"px");
        }

        $deltax = app.mouseX - parseInt($e.css("left").replace("px","").replace("auto","10"));
        $deltay = app.mouseY - parseInt($e.css("top").replace("px","").replace("auto","10"));

        $id_timer = window.setInterval(
            "$(\"#"+$id+"\").css('left',(app.mouseX - "+$deltax+") + \"px\").css('top',(app.mouseY - "+$deltay+") + \"px\");",
            10
        );
        app.timers.drag.push($id_timer);
        $e.attr("id_timer_drag",$id_timer);
    }

    app.stop_drag = function($e){
        if ($e[0].className.indexOf("draggable") <= -1){
            $e = $e.parent(".draggable");
            if ($e.length == 0){
                return false;
            }
        }
        $id_timer = $e.attr("id_timer_drag");
        window.clearInterval($id_timer);
    }

    app.api = function(parms){
        var deferred_api_ajax = {};
        var deferred_api = new $.Deferred();
        
        if (parms === undefined || typeof parms !== "object"){
            throw "app.api: object expected.";
        }
        if (typeof parms.data !== "object"){
            throw "app.api: data object expected.";
        }
        /*
        if (typeof parms.sitio !== "string"){
            throw "app.api: se esperaba el un string con el nombre del sitio.";
        }
        */
        if (typeof parms.accion !== "string"){
            throw "app.api: se esperaba el un string con el nombre de la accion.";
        }
        
        /* 
         * on_success y on_error quedan por compatibilidad. 
         * Los handlers actuales son "success", "error", y "fail".
         */
        if (parms.on_success !== undefined && !(parms.on_success instanceof Function)){
            throw "app.api: success handler must be a function.";
        }
        
        if (parms.on_error !== undefined && typeof parms.on_error !== "function"){
            throw "app.api: error handler must be a function.";
        }
        
        if (parms.success !== undefined && !(parms.success instanceof Function)){
            throw "app.api: success handler must be a function.";
        }
        
        if (parms.error !== undefined && typeof parms.error !== "function"){
            throw "app.api: error handler must be a function.";
        }
        
        if (parms.fail !== undefined && typeof parms.fail !== "function"){
            throw "app.api: fail handler must be a function.";
        }
        
        
        /* compatibilidad con v1 */
        if (parms.on_success !== undefined){
            parms.on_success = function(){};
        }
        
        if (parms.on_error === undefined){
            parms.on_error = function(){};
        }
        
        if (parms.success === undefined){
            parms.success = (parms.on_success instanceof Array) 
                            ? parms.on_success
                            : [ parms.on_success ];
        }
        
        if (parms.error === undefined){
            parms.error = (parms.on_error instanceof Array) 
                            ? parms.on_error
                            : [ parms.on_error ];
        }
        
        if (parms.fail === undefined){
            parms.fail = (parms.on_fail instanceof Array) 
                            ? parms.on_fail
                            : [ parms.on_fail ];
        }
        
        deferred_api_ajax = $.ajax({
            url: app.path + ( app.path.endsWith("/") ? "" : "/" ) + "api/" + parms.accion,
            type:"POST",
            dataType:"JSON",
            data: parms.data,
            cache: (parms.cache === undefined) ? false : parms.cache,
            async: (parms.async === undefined) ? true : parms.async
        }).done(
            function(resp, status, xhr){
                deferred_api_ajax.xhr = xhr;
                if (resp.status === "success"){
                    deferred_api.resolve(resp.data);
                } else {
                    deferred_api.reject(resp.data)
                }
            }
        ).fail(
            function(xhr, status, error){
                deferred_api_ajax.xhr = xhr;
                deferred_api.reject({message:error});
            }
        );
        
        deferred_api.done(parms.on_success).fail(parms.on_error);
        var p = deferred_api;
        
        if (parms.async === false){
            p.response = JSON.parse(deferred_api_ajax.responseText);
        }
        
        return p;
    }

    //parse_section
    //Helper function for pushtate url handling
    app.parse_section = function ( url , with_parameters ) {
        with_parameters = ( with_parameters === undefined ) ? true : with_parameters;
        var ret = "";
        
        if (typeof url === "string") {
            var tmp = url.split("/");
            ret = tmp.splice(6,100);
            ret = (with_parameters === true) ? ret.join("/") : ret[0] ;
            ret = (ret === undefined) ? "" : ret;
        }
        
        return ret;
    }

    if (window !== undefined){
        // check for web workers
        window.app = app;
    }
    return app;
})();

$(document).ready(
    function(){
        $(".draggable").mousedown(function(e){
            app.start_drag($(e.target));
        });

        $(".draggable").mouseup(function(e){
            app.stop_drag($(e.target));
        });

        $(document).bind("keyup",function($e){
            if ($e.keyCode == 27){
                for ($i in app.timers.drag){
                    try{
                        window.clearInterval(app.timers.drag[$i]);
                    } catch($e){
                        //nada
                    }
                }
            }
        });
        
        $(document).mousemove(function(e){
            app.mouseX = e.pageX;
            app.mouseY = e.pageY;
        });
        
        app.sections =  ( $("body > .main-container").length > 0 ) 
                        ? $("body > .main-container > section, body > .main-container .section, body > .main-container .seccion")
                        : $("body > section, body > .section, body > .seccion");
        app.current_section = $(app.sections[0]);
        
        window.onbeforeunload = function() { 
            if (app.current_section.attr("onclose") != undefined){
                try{
                    eval(app.current_section.attr("onclose"));
                }catch(e){
                    app.mostrar_error(e);
                    return false;
                }
            }
        }
        
    }
);

String.prototype.decodeHTML = function(){
    var txt = document.createElement("textarea");
    txt.innerHTML = this;
    return txt.value;
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
       return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}


jQuery.unserialize = function(str){
    var items = str.split('&');
    var ret = "{";
    var arrays = [];
    var index = "";
    for (var i = 0; i < items.length; i++) {
        var parts = items[i].split(/=/);
        //console.log(parts[0], parts[0].indexOf("%5B"),  parts[0].indexOf("["));
        if (parts[0].indexOf("%5B") > -1 || parts[0].indexOf("[") > -1){
            //Array serializado
            index = (parts[0].indexOf("%5B") > -1) ? parts[0].replace("%5B","").replace("%5D","") : parts[0].replace("[","").replace("]","");
            //console.log("array detectado:", index);
            //console.log(arrays[index] === undefined);
            if (arrays[index] === undefined){
                arrays[index] = [];
            }
            arrays[index].push( decodeURIComponent(parts[1].replace(/\+/g," ")));
            //console.log("arrays:", arrays);
        } else {
            //console.log("common item (not array)");
            if (parts.length > 1){
                ret += "\""+parts[0] + "\": \"" + decodeURIComponent(parts[1].replace(/\+/g," ")).replace(/\n/g,"\\n").replace(/\r/g,"\\r") + "\", ";
            }
        }
        
    };
    
    ret = (ret != "{") ? ret.substr(0,ret.length-2) + "}" : ret + "}";
    //console.log(ret, arrays);
    var ret2 = JSON.parse(ret);
    //proceso los arrays
    for (arr in arrays){
        ret2[arr] = arrays[arr];
    }
    return ret2;
}

jQuery.fn.unserialize = function(parm){
    //If not string, JSON is assumed.
    var items = (typeof parm == "string") ? parm.split('&') : parm;
    if (typeof items !== "object"){
        throw new Error("unserialize: string or JSON object expected.");
    }
    //Check for the need of building an array from some item.
    //May return a false positive, but it's still better than looping twice.
    //TODO: confirm if it's ok to simplify this method by always calling
    //$.unserialize(parm) without any extra checking. 
    var need_to_build = ((typeof parm == "string") && decodeURIComponent(parm).indexOf("[]=") > -1);
    items = (need_to_build) ? $.unserialize(parm) : items;
    
    
    for (var i in items){
        var parts = (items instanceof Array) ? items[i].split(/=/) : [i, (items[i] instanceof Array) ? items[i] : "" + items[i]];
        parts[0] = decodeURIComponent(parts[0]);
        if (parts[0].indexOf("[]") == -1 && parts[1] instanceof Array){
            parts[0] += "[]";
        }
        obj = this.find('[name=\''+ parts[0] +'\']');
        if (obj.length == 0){
            try{
                obj = this.parent().find('[name=\''+ parts[0] +'\']');
            } catch(e){}
        }
        if (typeof obj.attr("type") == "string" && ( obj.attr("type").toLowerCase() == "radio" || obj.attr("type").toLowerCase() == "checkbox")){
             obj.each(function(index, coso) {
                coso = $(coso);
                //if the value is an array, i gotta search the item with that value.
                if (parts[1] instanceof Array){
                    for (var i2 in parts[1]){
                        var val = ""+parts[1][i2];
                        if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
                            coso.prop("checked",true);
                        } else {
                            if (!$.inArray(coso.val(),parts[1])){
                                coso.prop("checked",false);
                            }
                        }
                    }
                } else {
                    val = "" + parts[1];
                    if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
                        coso.prop("checked",true);
                    } else {
                        coso.prop("checked",false);
                    }
                }
             });
        } else if (obj.length > 0 && obj[0].tagName == "SELECT" && parts[1] instanceof Array && obj.prop("multiple")){
            //Here, i have an array for a multi-select.
            obj.val(parts[1]);
        } else {
            //When the value is an array, we join without delimiter
            var val = (parts[1] instanceof Array) ? parts[1].join("") : parts[1];
            //when the value is an object, we set the value to ""
            val = ((typeof val == "object") || (typeof val == "undefined")) ? "" : val;
            
            obj.val(decodeURIComponent(val.replace(/\+/g," ")));
        }
    };
    return this;
}
