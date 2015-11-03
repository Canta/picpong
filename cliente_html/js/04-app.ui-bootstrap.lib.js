/*
 * librería que sobrecarga algunos métodos de UI de app.lib para 
 * replicar funcionalidades pero utilizando Twitter's Bootstrap
 */

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
		
		$("body").html( $("body").html() + app.ui.modals_html.replace("%NUMERO%", rand) );
		
		
		$(".modal:not(.espere)").on("shown.bs.modal", function() {
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
			
			$(this).find(".modal-body").html($data.html);
			
			def.resolve("modal listo");
			app.modal_ok = true;
		})
		.modal({
			show : true
		});
		
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
	
	$(".modal").on("hidden.bs.modal", function() {
		var t = $(this);
		if (t.attr("onhide") !== undefined && t.attr("onhide") !== ""){
			eval(t.attr("onhide"));
		}
		t.remove();
		
		def.resolve("hide_modal resuelto");
	})
	.modal("hide");
	
	return def;
}


app.ui.modals_html = '\
	<div class="modal fade" numero=\"%NUMERO%\" tabindex="-1" role="dialog" aria-hidden="true">\n\
		<div class="modal-dialog modal-sm">\n\
			<div class="modal-content">\n\
				<div class="modal-header"></div>\n\
				<div class="modal-body"></div>\n\
				<div class="modal-footer">\n\
					<button id=\"modal_button_aceptar\" class="btn btn-primary" >Aceptar</button>\n\
					<button id=\"modal_button_cancelar\" class="btn btn-primary" data-dismiss="modal">Cancelar</button>\n\
				</div>\n\
			</div>\n\
		</div>\n\
	</div>\n\
';


