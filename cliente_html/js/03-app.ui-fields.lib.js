
if (app.ui.fields === undefined){
	app.ui.fields = {};
}

app.ui.fields.change_select = function ( obj ) {
	var i   = obj.selectedIndex;
	var url = $(obj.options[i]).attr("data-url");
	var con = $(obj.options[i]).attr("data-confirm");
	
	if (url == undefined) {
		return false;
	}
	
	if (con !== undefined && con != "") {
		if (!app.confirmar(con)) {
			obj.selectedIndex = 0;
			return false;
		}
	}
	
	//trabajo la url
	var current = location.href;
	var id = $($(obj).parents("tr")[0]).find("[is_id]").text();
	
	url = url.replace("%ID%",id);
	
	var base  = (app.path) ? app.path : "";
	//console.log(base,url);
	direccion = ( url.indexOf("://") < 0 ) ? location.protocol + "//" + base + "/" + url : url;
	var igual = direccion.toLowerCase() == location.href.toLowerCase();
	
	console.log(base, url, current, igual);
	
	
	if (!igual) {
		$.address.value(url.replace(location.protocol + "//" + location.host,""));
	} else {
		//nada
	}
	
}


app.ui.fields.setup = function ( selector ) {
	if ( selector === undefined ) {
		selector = "body > section:visible, body > .section:visible" ;
	}
	
	obj = $(selector);
	
	/* funcionalidades para las tablas */
	obj.find("table[data-table-type=HTMLTableBuilder][multiple] tbody > tr").on( "click", function (evt) {
		var obj = $(evt.target);
		var state = obj.parent().attr("selected");
		
		if ( state === undefined ) {
			obj.parent().attr("selected","selected");
		} else {
			obj.parent().removeAttr("selected");
		}
	});
	
	obj.find("table[data-table-type=HTMLTableBuilder]:not([multiple]) tbody > tr").on( "click", function (evt) {
		var obj = $(evt.target);
		var state = obj.parent().attr("selected");
		obj.parent().parent().find("tr").removeAttr("selected");
		
		if ( state === undefined ) {
			obj.parent().attr("selected","selected");
		}
	});
	
	/* Lógica para los campos de tipo tree */
	
	$trees = $(".tree");
	if ($trees.length > 0){
		$trees.collapsibleCheckboxTree();
		
		$trees.find("input[type='checkbox']").bind("change",function(evt){
			$checked = !($(this).attr("checked") == undefined);
			if ($checked){
				$(this).parent().find("ul input[type='checkbox']").attr("checked","checked");
			} else {
				$(this).parent().find("ul input[type='checkbox']").removeAttr("checked");
			}
		});
		
	}
	
	/* Lógica de los campos tipo select */
	
	$("select.field").on("change", function(evt) { 
		var select = $(evt.target);
		var titulo = select.find( "option[value='"+select.val()+"']" ).attr("title");
		
		select.popover('destroy');
		
		if (titulo !== undefined && titulo !== null && $.trim(titulo) !== "") {
			//select.attr("data-original-title", titulo );
			select.popover({
				trigger: 'auto',
				placement: 'right',
				//title : "&nbsp;",
				content: titulo
			}).popover('show');
		}
	});
	
}


