app.ui = {
	wizards : []
};

app.ui.change_section = function( $val ) {
	var $sec = null;
	if (!isNaN($val)){
		// section index number from the app.sections array.
		if ($val >= app.sections.length || $val < 0){
			throw "app.ui.change_section: invalid section number.";
		}
		$sec = $(app.sections[$val]);
	} else if (typeof $val === "string"){
		// section DOM id
		$sec = $("#"+$val);
		if ($sec.length == 0){
			throw "app.ui.change_section: section id '"+$val+"' not found.";
		}
	} else if ($val instanceof jQuery) {
		// a jQuery selected object. 
		// index 0 is assumed to be the one selected
		if ($val.length == 0){
			throw "app.ui.change_section: invalid section selection.";
		}
		$sec = $($val[0]);
	} else if ($val instanceof HTMLElement){
		// an HTML DOM element.
		if ($val.tagName !== "SECTION"){
			throw "app.ui.change_section: element not a section.";
		}
		$sec = $($val);
	} else {
		throw "app.ui.change_section: invalid argument data type.";
	}
	
	/* pasadas las validaciones, trabajo con promesa */
	var deferred_change_section = new $.Deferred();
	
	if (app.current_section.attr("onclose") != undefined){
		try{
			eval(app.current_section.attr("onclose"));
		}catch(e){
			deferred_change_section.reject(e);
		}
	}
	
	app.sections.fadeOut(100).promise().then(
		function(){
			app.current_section = $sec;
			$sec.fadeIn(300).promise().then(
				function() {
					if ($sec.attr("onshow") != undefined){
						try {
							eval($sec.attr("onshow"));
						} catch( e ){
							deferred_change_section.reject(e);
						}
					}
					deferred_change_section.resolve($sec.attr("id") + " mostrada con éxito.");
				}
			);
		}
	);
	
	return deferred_change_section.promise();
}

app.ui.get_object = function( $str ) {
	if (typeof $str !== "string"){
		throw "app.ui.get_object: object id string expected.";
	}
	
	var found = false;
	var obj = {};
	
	if (!found) {
		for (var $i = 0; $i < app.ui.wizards.length; $i++){
			if (app.ui.wizards[$i].obj.attr("id") == $str){
				found = true;
				obj = app.ui.wizards[$i];
			}
		}
	}
	
	
	return obj;
};

app.ui.load_section_data = function ( seccion , direccion , parametros ) {
	
	if (seccion == undefined || typeof seccion !== "string" ) {
		throw "app.ui.load_section_data: se esperaba un string con el id de sección";
	}
	
	if (direccion == undefined || typeof direccion !== "string" ) {
		throw "app.ui.load_section_data: se esperaba un string con la dirección desde dónde obtener los datos";
	}
	
	if (parametros == undefined ) {
		parametros = {};
	}
	
	//flag para que el servidor sepa cómo comportarse.
	parametros.is_ajax = true;
	
	/*
	return app.api({
		accion : "load_section",
		data   : {
			direccion  : direccion,
			parametros : parametros
		}
	});
	*/
	
	return $.ajax(
		direccion,
		{
			cache    : false,
			data     : parametros,
			dataType : "html",
			success  : function () {
				var loaded_section = (app.current_sitio.sections) ? app.current_sitio.sections[seccion] : undefined;
				if ( loaded_section !== undefined && loaded_section.loaded !== undefined && loaded_section.loaded instanceof Function){
					setTimeout(loaded_section.loaded, 100);
				}
			}
		}
	);
	
};


app.ui.setup_pushstate = function ( selector ) {
	
	return $(selector).on("click", function(evt){
		var elemento          = $(evt.target);
		var elemento_original = $(evt.target);
		
		evt.preventDefault();
        //fix: a veces se hace click sobre el contenido del tag A, no el tag A en sí.
        while ( elemento.length > 0 && elemento[0].tagName != "A" ) {
            elemento = elemento.parent();
        }
        
		var direccion = elemento.attr("href");
		
		//console.log("app.ui.pushtate;", {selector:selector, seccion: seccion, direccion: direccion, elemento: elemento});
		
		//app.espere("Cargando..." , "...listo.");
        app.ui.custom_cubre_cuerpo_setup();
		
        var base  = (app.path) ? app.path : "";
        direccion2 = ( direccion.indexOf("://") < 0 ) ? location.protocol + "//" + location.host + direccion.replace(location.protocol + "//" + location.host,"") : direccion;
        var igual = direccion2.toLowerCase() == location.href.toLowerCase();
        
        $.address.value(direccion.replace(location.protocol + "//" + location.host,""));
        
	});
};

app.ui.custom_cubre_cuerpo_setup = function () {
	//placeholder for overloading
};



/**
 * Wizard class
 * Handles UI wizards
 */
var Wizard = function( $obj ) {
	var self = {
		obj : ($obj instanceof jQuery) ? $($obj[0]) : $($obj)
	}
	
	self.pages = self.obj.find(".wizard-page");
	self.current_page = -1; //at startup, it's -1. Then, uses the "next()" method.
	self.back_button = self.obj.find(".wizard-back-button");
	self.next_button = self.obj.find(".wizard-next-button");
	
	self.next = function(){
		
		$valid = (self.current_page > -1) ? eval($(self.pages[self.current_page]).attr("validation")) : true;
		
		if ($valid === undefined){
			$valid = true;
		}
		
		if ($valid === true){
			if (self.current_page >= 0){
				self.hide_page(self.current_page);
				self.back_button.removeAttr("disabled");
			} else {
				self.back_button.attr("disabled","disabled");
			}
			
			self.current_page = (self.current_page < self.pages.length -1) ? self.current_page + 1 : self.current_page;
			self.show_page(self.current_page);
			
			if (self.current_page < self.pages.length - 1) {
				self.next_button.removeAttr("disabled");
			} else {
				self.next_button.attr("disabled", "");
			}
			
			self.obj.find(".wizard-title").html("<h1>"+$(self.pages[self.current_page]).attr("wizardtitle")+"</h1>");
		} else {
			app.mostrar_error("Hay datos inválidos.\nPor favor, revise los datos y vuelva a intentar.");
		}
	}
	
	self.back = function(){
		if (self.current_page < self.pages.length) {
			self.hide_page(self.current_page, "left");
			self.next_button.removeAttr("disabled");
		} else {
			self.next_button.attr("disabled", "");
		}
		
		self.current_page = (self.current_page > 0) ? self.current_page - 1 : self.current_page;
		self.show_page(self.current_page, "right");
		
		if (self.current_page > 0){
			self.back_button.removeAttr("disabled");
		} else {
			self.back_button.attr("disabled","disabled");
		}
		
		self.obj.find(".wizard-title").html("<h1>"+$(self.pages[self.current_page]).attr("wizardtitle")+"</h1>");
	}
	
	self.show_page = function($number){
		if (isNaN($number)){
			throw "Wizard.show_page: page number expected.";
		}
		
		$(self.pages[$number]).removeClass("wizard-page-out");
		$(self.pages[$number]).fadeIn(150);
		
	}
	
	self.hide_page = function($number){
		if (isNaN($number)){
			throw "Wizard.hide_page: page number expected.";
		}
		
		$(self.pages[$number]).addClass("wizard-page-out");
	}
	
	self.__init__ = function (){
		
		for (var $i = self.pages.length -1; $i > -1; $i--){
			$(self.pages[$i]).css("z-index", (self.pages.length - $i) + 1);
		}
		self.current_page = -1;
		self.back_button.bind("click",self.back);
		self.next_button.bind("click",self.next);
		self.next();
	};
	
	self.reset = function (){
		self.current_page = -1;
		self.next();
	};
	
	self.__init__();
	
	return self;
};


$(document).ready( function () {
	$(".wizard").each(function($i, $e){
		app.ui.wizards.push(new Wizard($e));
	});
});

