(function($){
	var sm = soundManager;
	$.playable = function( url, settings ) {
		var playable = arguments.callee;
		sm.url = url;
		sm.consoleOnly = window.location.hash.match(/console$/i);
		sm.debugMode = window.location.hash.match(/^#debug/i);
		$.extend( sm.defaultOptions, {
			autoStart : false,
			playNext : true,
			loopNext : true,
			pauseOnly : false,
			playAlone : true,
			doUnload : false,
			useUi : false,
			css : {
				playable: 'playable',
				loading : 'loading',
				playing : 'playing',
				paused : 'paused'
			},
			whileloading : function() {
				if ( ! this.options.useUi )
					return;
				this.options.element.find('.loading').width( this.bytesLoaded / this.bytesTotal * 100 + '%' );
			},
			whileplaying : function() {
				if ( ! this.options.useUi )
					return;
				var element = this.options.element;
				element.find('.position').width( this.position / this.durationEstimate * 100 + '%' );
				element.find('.elapsed').html( $.playable._formatTime( this.position ) );
				element.find('.total').html( $.playable._formatTime( this.durationEstimate ) );
			},
			onload : function() {
				var options = this.options;
				options.element.removeClass( options.css.loading );
				if ( this.readyState == 2 )
					playable.next();
			},
			onplay : function() {
				var options = this.options,
				current = options.element.removeClass( options.css.paused ).addClass( options.css.playing ).focus();
				if ( this.readyState == 1 )
					current.addClass( options.css.loading );
				if ( options.playAlone && playable.current && playable.current != current )
					playable.current.data( 'playable' )[ options.pauseOnly ? 'pause' : 'stop' ]();
				playable.current = current;
			},
			onstop : function() {
				var options = this.options;
				options.element.removeClass( options.css.playing ).removeClass( options.css.loading ).removeClass( options.css.paused );
				if ( options.doUnload )
					this.unload();
			},
			onpause : function() {
				if ( $.playable.dragging )
					return;
				var options = this.options;
				options.element.removeClass( options.css.playing ).addClass( options.css.paused );
			},
			onresume : function() {
				if ( $.playable.dragging )
					return;
				this.options.onplay.call( this );
			},
			onfinish : function() {
				var options = this.options;
				if ( options.playNext )
					playable.next();
				options.onstop.call( this );
			}
		}, settings );
		$.extend( playable, {
			count : 0,
			current : null,
			dragging : null,
			methods : ['play','stop','pause','resume','togglePause','mute','unmute','unload','setPosition','setVolume','setPan'],
			_init : function( options ) {
				var self = this,
					options = $.extend( true, {}, sm.defaultOptions, options );
				this.addClass( options.css.playable )
				.click( function( event ) {
					event.preventDefault();
					$( this ).data( 'playable' ).togglePause();
				} )
				.each( function() {
					$( this ).data( 'playable', sm.createSound( $.extend( {
						id : 'playable' + playable.count++,
						url : this.href,
						element : $( this ),
						selector: self.selector
					}, options ) ) );
				} );
				if ( options.useUi )
					$.playable._addUi.call( self );
				if ( options.autoStart )
					self.filter( ':first' ).click();
			},
			_addUi : function() {
				$( '<span class="ui timing"><span class="elapsed">--:--</span> / <span class="total">--:--</span></span>' ).click( function( event ) {
					event.preventDefault();
					return false;
				})
				.prependTo( this );
				$( this ).append( '<span class="ui controls"><span class="loading"></span><span class="position"></span></span>' )
				.each( function() {
					var element		= $( this ),
						position	= element.find( '.position' ),
						sound		= element.data( 'playable' ),
						controls	= element.find( '.controls' )
							.click( function( event ) {
								event.preventDefault();
								return false;
							})
							.mousedown( function( event ) {
								event.preventDefault();
								var left = controls.offset().left,
									width = controls.width(),
									x = event.clientX - left;
								$.playable.dragging = $( this ).addClass( 'dragging' );
								position.width( x );
								sound.setPosition( x / width * sound.durationEstimate );
								sound.pause();
								$( document ).bind( 'mousemove.playable', function( event ) {
									var x = Math.max( 0, Math.min( event.clientX - left, width ) );
									position.width( x );
									sound.setPosition( x / width * sound.durationEstimate );
								} );
								return false;
							} );
				} );
				$( document ).mouseup( function( event ) {
					if ( ! $.playable.dragging )
						return;
					event.preventDefault();
					var element = $.playable.dragging.parent( '.playable' ),
						sound = element.data( 'playable' );
					$( document ).unbind( 'mousemove.playable' );
					if ( element.hasClass( sound.options.css.playing ) )
						sound.resume();
					$.playable.dragging.removeClass( 'dragging' );
					$.playable.dragging = null;
					return false;
				} );
			},
			_removeUi : function() {
				$( '.ui', this ).remove();
			},
			_formatTime : function( ms ) {
				var ns = Math.floor( ms / 1000 ),
					min = Math.floor( ns / 60 ),
					sec = ns - min * 60 ;
				return min + ':' + ( sec < 10 ? '0' + sec : sec );
			},
			next : function() {
				if ( ! this.current )
					return;
				var options = this.current.data( 'playable' ).options,
					playlist = $( options.selector ),
					move = arguments[0] || 1,
					next = playlist.eq( playlist.index( options.element ) + move ).data( 'playable' );
				if ( ! next && options.loopNext )
					next = playlist.eq( 0 ).data( 'playable' );
				if ( next && ! next.playState )
					next.play();
			}
		} );
	};

	$.fn.playable = function( options ) {
		var self = this.is( 'a[href]' ) ? this : this.find( 'a[href]' );
		if ( typeof options == 'string' && $.inArray( options, $.playable.methods ) != -1 )
			self.each( function(args){
				var sound = $(this).data('playable');
				sound && sound[options](args);
			}, [arguments[1]] );
		else
			sm.onload = function() {
				if ( sm.canPlayURL( self.attr( 'href' ) ) )
					$.playable._init.call( self, options );
			};
		return this;
	};
})(jQuery);
/*
$(function(){
// Simple usage
	$.playable('soundmanager/swf/');
	$('a').playable();

// Usage with options
	$.playable('soundmanager/swf/', { //options used here are stored as soundManager.defaultOptions
		// You can use all SM2 default options, plus the following:
		autoStart : false, // Start playing the first item
		playNext : false, // Play next item when previous ends
		loopNext : false, // Play first item when no more next item
		pauseOnly : false, // Just pause previous on skip
		playAlone : false, // Force stop/pause previous on skip
		doUnload : false // Unload sound on stop/finish
	});
	//Exemples configurations
	$('.playlist').playable({autoStart: true, playNext: true, playAlone: true, pauseOnly: false, doUnload: false});
	$('.sampler').playable({autoStart: false, playNext: false, playAlone: false, pauseOnly: false, doUnload: false});
	$('.listen').playable({autoStart: false, playNext: false, playAlone: true, pauseOnly: true, doUnload: true});

// Modify Sound Objects (you can use all SMSound methods)
	$('.playlist').playable('setSound', 50); // reduce sound to 50% for the whole playlist
	$('.sampler .playable:eq(1)').playable('pause'); // pause the second playable item of the sampler
	$('.listen .playable:last').playable('play'); // play the last playable item of the '.listen' list

});
*/
