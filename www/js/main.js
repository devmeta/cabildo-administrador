$(function(){

	var settings = {
		pagos : {
			dia_vencimiento : 20
		}
		, user : undefined
		, admin : { 
			paths : ['/admin.html']
			, uid : 'OnKAmfWuFCT4FN2hahBfkbqz34J2'
		}
	}
	, routes = {
		index : function(){
	    	helpers.render_tpl('.content','#index',{}, function(){
	    		$('body').addClass('login-body')
	    		$('input[name="email"]').focus()
	    		$('#loading').fadeOut(200)
	    	})
		}
		, estadisticas : function(){
			helpers.render_tpl('.content','#estadisticas',{}, function(){
				helpers.tpl.resetWebflow()
				$('#loading').fadeOut(200)
			})
		}
		, local : function(){
			var position = 0
			, key = helpers.getParameterByName('key')

			if(settings.user.uid==settings.admin.uid){
				key = key ? 'locales/' + key : null
			} else {
				key = 'locales/' + settings.user.displayName
			}

			helpers.firebase_once('categorias', function(categorias){ 
				helpers.render_row(key,'.content', '#local', {categorias: categorias, key : key}, function(res){
					$('.horarios--container').html($.templates('#horario').render(helpers.tpl.toArray(res.entry['horarios para filtro']))).promise().done(function(){
						$('.descuento--container').html($.templates('#descuento').render(res.entry.descuentos)).promise().done(function(){
							if($('.horarios--container').children().length > 6){
								$('.add-time').addClass('w-hidden')
							}
							$('#loading').fadeOut(200)
						})
					})			
				})
			})
		}
		, locales : function(){
			// modal action
			// bring all and sort.
			
			helpers.render_tpl('.content','#locales',{}, function(){
				helpers.render_tabs('locales','#listadolocales',{
					"todos":[]
					,"Premium":[]
					,"Básico":[]
					,"Avenida Cabildo":[]
				}, function(){
					helpers.tpl.resetWebflow()
					$('#loading').fadeOut(200)	
				})
			})
		}
	}
	, helpers = {
		updateHeader : function(){
			var route = location.hash.replace('#','')||''
			, route = route.indexOf('?') > -1 ? route.substring(0, route.indexOf('?')) : route

			$('.nav-item').removeClass('w--current')
			$('a[data-section="#' + route + '"]').addClass('w--current')
		}
		, views : {
			render : function(){

				$('#loading').fadeIn(300, function(){

					$('body').removeClass()
					
					var user = firebase.auth().currentUser;

					$('.footer--container').html($.templates('#footer').render({user:user}))

					if(user){
						$('.session-status').html(user.email + ' <a href="#" class="salir">Cerrar sesión</a>')
					}

					var route = location.hash.replace('#','')||'index'
					, route = route.indexOf('?') > -1 ? route.substring(0, route.indexOf('?')) : route

	    			if(route){
				    	if(typeof routes[route] == 'function'){
				    		routes[route].call(this)
				    		helpers.updateHeader()
				    	} else {
				    		$('.container').html("No existe la página")
				    	}
				    }
				})
			}
		}
		, tpl : {
			getProxVencimiento : function(format){
				var now = moment()
				, then = moment([now.format('YY'), now.format('MM')-1, settings.pagos.dia_vencimiento])
				, date = then

				if(now < then){
					console.log("2")
					date = moment([now.format('YY'), now.format('MM'), settings.pagos.dia_vencimiento])
				}

				return moment(date).format(format||'DD/MM')
			}
			, toDate : function(date,format){
				return moment(date).format(format||'DD/MM/YY')
			}
			, resetWebflow : function(){
				if(typeof Webflow == undefined) return false
				Webflow.require("tabs").ready()
				Webflow.require('ix').init([
				  {"slug":"close-viewlocal","name":"close-viewlocal","value":{"style":{},"triggers":[{"type":"click","selector":".viewlocal","stepsA":[{"display":"none","opacity":0,"transition":"opacity 200 ease 0"}],"stepsB":[]}]}},
				  {"slug":"open-viewlocal","name":"open-viewlocal","value":{"style":{},"triggers":[{"type":"click","selector":".viewlocal","stepsA":[{"display":"block"},{"opacity":1,"transition":"opacity 200 ease 0"}],"stepsB":[]}]}},
				  {"slug":"close-delete","name":"close-delete","value":{"style":{},"triggers":[{"type":"click","selector":".eliminarlocal","stepsA":[{"opacity":0.02,"transition":"opacity 200 ease 0"},{"display":"none"}],"stepsB":[]}]}},
				  {"slug":"eliminar-show","name":"eliminar-show","value":{"style":{},"triggers":[{"type":"click","selector":".eliminarlocal","stepsA":[{"display":"block"},{"opacity":1,"transition":"opacity 200 ease 0"}],"stepsB":[]}]}}
				])
			}
			, getHorario : function(index,entry){
				if(!entry || !entry.horarios) return ""

				var parts = []
				, str = ""

				if(entry.horarios.indexOf("\\n")>-1)
					parts = entry.horarios.split("\\n")
				else if(entry.horarios.indexOf("\n")>-1)
					parts = entry.horarios.split("\n")
				
				parts.forEach(function(ln){
					ln = ln.toLowerCase()
					if(ln.indexOf(index.toLowerCase())>-1){
						str = ln.replace(index.toLowerCase(),"")
					}
				})

				return $.trim(str)
			}
			, toHorarios : function(){

			}
			, toArray : function(object){
				if(!object) return false
				var items = []
				if(!$(object).length) return items;
				for(var i in object){
					var row = object[i]
					row.key = i
					items.push(row)
				}
				return items
			}
			, prop : function(a,b,c){
				var d = b
				if(typeof b=='string') d = c
				if(d && d[a]) return d[a]
				return typeof b=='string' ? b : ""
			}
		}
		, setParameterByName : function(name,value,url){
	        if(!url) url = window.location.hash.split('#').join('')
	        if(value == null) value = ''
	        var pattern = new RegExp('\\b('+name+'=).*?(&|$)')
	        if(url.search(pattern)>=0){
	            return url.replace(pattern,'$1' + value + '$2')
	        }
	        return url + '&' + name + '=' + value 
	    }
	    , getParameterByName : function(name, url) {
		    if (!url) {
		      url = window.location.href;
		    }
		    name = name.replace(/[\[\]]/g, "\\$&");
		    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		        results = regex.exec(url);
		    if (!results) return null;
		    if (!results[2]) return '';
		    return decodeURIComponent(results[2].replace(/\+/g, " "));
	    }  	
		, firebase_once : function(a, b){    
			firebase.database().ref(a).once('value').then(function(snapshot) {
				if(typeof b == 'function') b.call(this,snapshot)
			})
		}
		, render_tabs : function(a,b,c,d){
			helpers.firebase_once(a, function(snapshot){

				var tabs = c
				snapshot.forEach(function(childSnapshot) {
					var childKey = childSnapshot.key
					, childData = childSnapshot.val()
					, row = childData

					row.key = childKey
		    		tabs.todos.push(row)

		    		if(row.plan){
		    			tabs[row.plan].push(row)
		    		}				
				})

		    	for(var slug in c){
		    		helpers.render_tpl('div[data-w-tab="' + slug + '"] .' + a,b,tabs[slug])
		    	}

		    	setTimeout(function(){
		    		if(typeof d == 'function') d.call(this)
		    	},200)	    	
			})
		}
		, render_row : function(a,b,c,d,e){
			if(!a) return helpers.render_extra_tpl(b,c,{},d,e)
			helpers.firebase_once(a, function(snapshot){
				if($(d).length){
					helpers.render_extra_tpl(b,c,snapshot.val(),d,e)
				}else{
					helpers.render_tpl(b,c,snapshot.val(),e)				
				}
			})
		}
		, render_tpl : function(a,b,c,d) { // use to pass single object
	   		$(a).html($.templates(b).render(c, helpers.tpl)).promise().done(function(result){
	   			if(typeof d == 'function') d.call(this,result)
	   		})
		}
		, render_extra_tpl : function(a,b,c,d,e) { // use to parse multiple objects
	   		$(a).html($.templates(b).render({entry:c,extra:d}, helpers.tpl)).promise().done(function(){
	   			if(typeof e == 'function') e.call(this,{entry:c,extra:d})
	   		})
		}
	}

	$(document).on('click','.nav-item',function(e){
		e.preventDefault()
		var section = $(this).data('section')
		if(!section) return false
		$('.nav-item').removeClass('w--current')
		$(this).addClass('w--current')
		location.hash = section.replace('#','')
		return false
	})

	$(document).on('click','.salir',function(){
		firebase.auth().signOut().then(function() {
			location.hash = '';
		}).catch(function(error) {
		  	alert(err.message)
		})
	})

	$(document).on('click','.login',function(){
		var email = $.trim($('#email').val())
		, pass = $.trim($('#password').val())
		, that = this
		$(this).animate({opacity:0.7}).text("Por favor espere ... ")
		firebase.auth().signInWithEmailAndPassword(email, pass).catch(function(err) {
			alert(err.message)
			$(that).animate({opacity:1}).text("Continuar")
		})		
	})

	$(document).on('click','.createuser',function(){
		firebase.auth().createUserWithEmailAndPassword("telemagico@gmail.com", "telemagico").catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  console.log(error)
		  // ...
		})
	})

	// ~locales
	$(document).on('click','.edit.table-action',function(){
		location.hash = 'local?key=' + $(this).data('key')
	})

	$(document).on('click','.eliminar.table-action',function(){
		$('body').attr('data-key',$(this).data('key'))
	})	

	// ~local
	// pagos

	$(document).on('click','.save',function(){

		console.log("save")
		// uploads

		var key = $('input[name="key"]').val()?$('input[name=key]').val():'locales/'+$('input[name=nombre_simple]').val()
		, horarios = "Lunes a Viernes " + $('input[name=de-lunes-a-viernes]').val() + " \nSábados " + $('input[name=sabado]').val()  + " \nFeriados " + $('input[name=feriados]').val()
		, horarios_filtro = {}
		, descuentos = []


		$('.horarios_filtro').each(function() {
			var dia = $(this).find('.dia').val()
			, abre = $(this).find('.abre').val()
			, cierra = $(this).find('.cierra').val()

			if(dia!="" && abre!="" && cierra!=""){
				horarios_filtro[dia] = {
					abre: abre
					, cierra : cierra
				}
			}
		})

		$('.descuentos').each(function() {
			var porcentaje = $(this).find('.porcentaje').val()
			, entidad = $(this).find('.entidad').val()

			if(porcentaje!="" && entidad!=""){
				descuentos.push(porcentaje + ' con ' + entidad)
			}
		})


		$('#loading').fadeIn()
		firebase.database().ref(key).set({
			nombre_simple: $('input[name=nombre_simple]').val()||""
			, direccion : $('input[name=direccion]').val()||""
			, descripcion : $('textarea[name=descripcion]').val()||""
			, categoria : $('select[name=categoria]').val()||""
			, web : $('input[name=web]').val()||""
			, nombre_suscriptor : $('input[name=nombre_suscriptor]').val()||""
			, mail_suscriptor : $('input[name=mail_suscriptor]').val()||""
			, telefono : $('input[name=telefono]').val()||""
			, mail_suscriptor : $('input[name=mail_suscriptor]').val()||""
			, mail : $('input[name=mail]').val()||""
			, facebook : $('input[name=facebook]').val()||""
			, instagram : $('input[name=instagram]').val()||""
			, descuento_av : $('input[name=descuento_av]').val()||""
			, descuentos : descuentos
			, 'horarios' : horarios
			, 'horarios para filtro' : horarios_filtro
			, 'imagen logo' : $('.imagen_logo').attr('src')||""
			, 'imagen fondo' : $('.imagen_fondo').attr('src')||""
			, visibilidad : $('input[name=visibilidad]').val()||""
			, plan : $('input[name=plan]').val()||""
			, ubicacion : $('input[name=ubicacion]').val()||""
			, 'en promocion' : $('input[name=en_promocion]').val()||""
		})
		.then(function(a){
			$('#loading').fadeOut()
		})
		.catch(function(a){
			$('#loading').fadeOut()
		})

		// uploads


		$('.photo').each(function(){
			if($(this).get(0).files.length){
				var name = $(this).attr('name')
				, file = $(this).get(0).files[0]
				, metadata = {
					customMetadata : {
						'name' : name
						, 'key' : key
					}
				}

				$('#upload').fadeIn()
				firebase.storage().ref().child('images/' + file.name).put(file,metadata).then(function(snapshot){
					var i = snapshot.metadata.customMetadata.name.replace('_',' ')
					, value = snapshot.downloadURL

					firebase.database().ref(key + '/' + i).set(value)
					$('#upload').fadeOut()
				})
			}
		})		
	})

	$(document).on('click','.pago-btn.open',function(e) {
		$(this).toggle()
		$('.proximo-pago-input').slideToggle()
		e.preventDefault()
	})

	$(document).on('click','.pago-btn.do',function(e) {
		alert("pago")
		e.preventDefault()
	})

	// horarios

	$(document).on('click','.add-descuento',function(e) {
		if($('.descuento--container').children().length < 99){
			$('.descuento--container').append($.templates('#descuento').render())
		}
		e.preventDefault()
	})

	// descuentos
	$(document).on('click','.add-time',function(e) {
		if($('.horarios--container').children().length < 7){
			$('.horarios--container').append($.templates('#horario').render())
		}
		e.preventDefault()
	})

	// fotos
	$(document).on('click','.link-block',function(e) {
		var position =  $(this).parent().index()
		$('.photo:eq(' + position + ')').click()
		e.preventDefault()
	})

	$(document).on('click','.picture-button',function(e) {
		var position =  $(this).parent().parent().index()
		$('.photo:eq(' + position + ')').click()
		e.preventDefault()
	})

	$(document).on('change','.photo',function (e) {
		var that = this 
	    if (this.files && this.files[0]) {
	        var reader = new FileReader()
	        reader.onload = function (e) {
	        	$('.publish__uploadimages--preview > div:eq(' + $(that).index() + ')').find('.link-block img').attr('src',e.target.result)
	        }
	        reader.readAsDataURL(this.files[0])
	    }			
	})

	$(document).on('submit','.publish__uploadimages--form',function(e) {
	    var file = new FormData(this)
	    , upload_in_progress = 1 

	    $('.publish__uploadimages--info').text("Iniciando carga de fotos...");

	    // Upload file and metadata to the object 'images/mountains.jpg'
		var uploadTask = storageRef.child('images/' + file.name).put(file);

		// Listen for state changes, errors, and completion of the upload.
		uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
			function(snapshot) {
				// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
				var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				console.log('Upload is ' + progress + '% done');
				switch (snapshot.state) {
					case firebase.storage.TaskState.PAUSED: // or 'paused'
						console.log('Upload is paused');
						break;
					case firebase.storage.TaskState.RUNNING: // or 'running'
						console.log('Upload is running');
					break;
				}
			}, function(error) {
				switch (error.code) {
					case 'storage/unauthorized':
						// User doesn't have permission to access the object
						break;

					case 'storage/canceled':
						// User canceled the upload
						break;

					case 'storage/unknown':
						// Unknown error occurred, inspect error.serverResponse
						break;
				}
			}, function() {
				// Upload completed successfully, now we can get the download URL
				console.log("proceed to save " + uploadTask.snapshot)
				console.log("proceed to save " + uploadTask.snapshot.downloadURL)
				var downloadURL = uploadTask.snapshot.downloadURL;
			});

	    e.preventDefault()
	})	

	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			settings.user = user
			location.hash = (settings.user.uid == settings.admin.uid ? 'locales' : 'estadisticas')
		} else {
			$('.header').html('')
			$('.session-status').text("Sin inicio de sesión")
			location.hash = ''
		}

		if(location.hash!=''){
			$('.header').html($.templates('#header').render({user:user,uid:settings.admin.uid}))
		}

		helpers.updateHeader()
	})

    $(window).on('hashchange', function(){
    	if(!settings.user && location.hash != '') 
    		return location.hash = ''
   		helpers.views.render()
    }).trigger('hashchange')
})