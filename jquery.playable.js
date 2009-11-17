/*!
 * jQuery Sound Manager Plugin
 * http://github.com/adriengibrat/jQuery-SoundManager
 *
 * Copyright (c) 2009 Adrien Gibrat
 * Dual licensed under the MIT and GPL licenses.
 * http://opensource.org/licenses/mit-license.php
 */
(function($){
	var sm = soundManager;
	$.playable = $.extend( function( url, settings ) {
		$.extend( sm, {
			url : url, // Set Flash url
			debugMode : window.location.hash.match(/^#debug/i), // Activate Debugging with hash (#debug)
			consoleOnly : window.location.hash.match(/console$/i), // Debug in console only (#debugconsole)
			defaultOptions : $.extend({ // Extends soundManager default options
				autoStart : false,
				pauseOnly : false,
				playNext : true,
				loopNext : true,
				playAlone : true,
				doUnload : false
			}, settings )
		});
		$.each( $.playable.events, function( i, event ) { // Set Events Handler as element custom Handler
			sm.defaultOptions[event] = function() {
				this.options.element.triggerHandler( event, this );
			};
		} );
	}, {
		count : 0,
		current : null,
		searching : null,
		css : {
			playable: 'playable',
			loading : 'loading',
			playing : 'playing',
			paused : 'paused'
		},
		methods : ['play','stop','pause','resume','togglePause','mute','unmute','unload','setPosition','setVolume','setPan'],
		events : ['onload', 'onplay', 'onpause', 'onresume', 'onstop', 'onfinish'],
		init : function( options ) {
			var options = $.extend( true, {}, sm.defaultOptions, options ),
				self = this
			.addClass( $.playable.css.playable )
			.data( 'playable', sm.createSound( $.extend( options, {
				id : 'playable' + $.playable.count++,
				url : this.attr( 'href' ),
				element : this
			} ) ) )
			.click( function( event ) {
				event.preventDefault();
				self.data( 'playable' ).togglePause();
				return false;
			} )
			.bind( 'onload.playable', function( event, sound ){
				if ( sound.readyState == 2 )
					$.playable.next();
			} )
			.bind( 'onplay.playable', function(){
				if ( options.playAlone && $.playable.current && $.playable.current != self )
					$.playable.current.data( 'playable' )[ options.pauseOnly ? 'pause' : 'stop' ]();
				$.playable.current = self.focus();
			} )
			.bind( 'onresume.playable', function( event, sound ){
				self.triggerHandler( 'onplay', sound );
			} )
			.bind( 'onstop.playable', function( event, sound ){
				if ( options.doUnload )
					sound.unload();
			} )
			.bind( 'onfinish.playable', function( event, sound ){
				self.triggerHandler( 'onstop', sound );
				if ( options.playNext )
					$.playable.next();
			} );
			$.each( $.playable.ui, function( i, ui ){ // Bind UIs
				ui.call( self, options );
			} );
		},
		ui : {
			basic : function() {
				var self = this
				.bind( 'onload.playable', function(){
					self.removeClass( $.playable.css.loading );
				} )
				.bind( 'onplay.playable', function(){
					self.removeClass( $.playable.css.paused ).addClass( $.playable.css.playing );
					if ( self.data( 'playable' ).readyState == 1 )
						self.addClass( $.playable.css.loading );
				} )
				.bind( 'onpause.playable', function(){
					if ( ! $.playable.searching )
						self.removeClass( $.playable.css.playing ).addClass( $.playable.css.paused );
				} )
				.bind( 'onstop.playable', function(){
					self.removeClass( [$.playable.css.playing, $.playable.css.loading, $.playable.css.paused].join(' ') );
				} );
			}
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
	$.fn.playable = function( options ) {
		var self = this.is( 'a[href]' ) ? this : this.find( 'a[href]' ),
			options = options || {};
		if ( typeof options == 'string' && $.inArray( options, $.playable.methods ) != -1 )
			self.each( function( args ){
				var sound = $( this ).data( 'playable' );
				sound && sound[options]( args );
			}, [arguments[1]] );
		else {
			options.selector = self.selector;
			sm.onready( function() {
				self.each( function(){
					var self = $( this );
					if ( sm.canPlayURL( self.attr( 'href' ) ) )
						$.playable.init.call( self, options );
				});
				if ( options && options.autoStart )
					self.filter( ':first' ).click();
			});
		}
		return this;
	};
})(jQuery);
