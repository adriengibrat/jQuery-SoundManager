/*
 * jQuery Sound Manager Plugin
 * http://github.com/adriengibrat/jQuery-SoundManager
 *
 * Copyright (c) 2009 Adrien Gibrat
 * Dual licensed under the MIT and GPL licenses.
 * http://opensource.org/licenses/mit-license.php
 */
( function( $ ) {
	var sm = soundManager;
	$.playable = $.extend( function( url, settings ) {
		if ( typeof url == 'object' && url.url ) { // Allow to pass all settings including URL in one single object
			settings = url;
			url = url.url;
			delete settings.url;
		}
		$.each( settings || {}, function( key, value ) { // Parse settings to isolate SoundManager properties
			if ( $.inArray( key, $.playable.properties ) ) {
				sm[key] = ( key == 'flash9Options' || key == 'movieStarOptions' ) ? $.extend( sm[key], value ) : value;
				delete settings[key]; // Unset propeties from default options
			}
		} );
		$.extend( true, sm, {
			url : url, // Set Flash url
			debugMode : window.location.hash.match(/^#debug/i), // Activate Debugging with hash (#debug)
			consoleOnly : window.location.hash.match(/console$/i), // Debug in console only (#debugconsole)
			defaultOptions : $.extend( $.playable.settings, settings ) // Extends soundManager default options
		} );
		$.each( $.playable.events, function( i, event ) { // Set Events Handler as element custom Handler
			sm.defaultOptions[event] = function() {
				this.options.element.triggerHandler( event, this );
			};
		} );
	}, {
		settings : {
			autoStart : false,
			pauseOnly : false,
			playNext : true,
			loopNext : true,
			playAlone : true,
			doUnload : false
		},
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
		properties : ['altURL','allowPolling','allowScriptAccess','debugFlash','debugMode','useConsole','consoleOnly','flashLoadTimeout','flashVersion','nullURL','useFastPolling','useHighPerformance','wmode','waitForWindowLoad','flash9Options','movieStarOptions','allowFullScreen','useMovieStar'],
		init : function( options, playlist ) {
			var options = $.extend( true, {playlist: playlist}, sm.defaultOptions, options ),
				self = $( this );
			self.addClass( $.playable.css.playable )
			.data( 'playable', sm.createSound( $.extend( options, {
				id : 'playable' + $.playable.count++,
				url : this.href,
				element : self
			} ) ) )
			.click( function( event ) {
				event.preventDefault();
				self.data( 'playable' ).togglePause();
				return false;
			} )
			.bind( 'onload.playable', function( event, sound ) {
				if ( sound.readyState == 2 )
					$.playable.next();
			} )
			.bind( 'onplay.playable', function() {
				if ( options.playAlone && $.playable.current && $.playable.current != self )
					$.playable.current.data( 'playable' )[ options.pauseOnly ? 'pause' : 'stop' ]();
				$.playable.current = self.focus();
			} )
			.bind( 'onresume.playable', function( event, sound ) {
				self.triggerHandler( 'onplay', sound );
			} )
			.bind( 'onstop.playable', function( event, sound ) {
				if ( options.doUnload )
					sound.unload();
			} )
			.bind( 'onfinish.playable', function( event, sound ) {
				self.triggerHandler( 'onstop', sound );
				if ( options.playNext )
					$.playable.next();
			} );
			$.each( $.playable.ui, function( i, ui ) { // Bind UIs
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
		next : function( move ) {
			if ( ! this.current )
				return;
			var options  = this.current.data( 'playable' ).options,
				playlist = $( options.playlist ),
				songs    = playlist.is( 'a[href]' ) ? playlist : playlist.find( 'a[href]' ),
				move     = move || 1,
				next     = songs.eq( songs.index( options.element ) + move ).data( 'playable' );
			if ( ! next && options.loopNext )
				next = songs.eq( 0 ).data( 'playable' );
			if ( next && ! next.playState )
				next.play();
		}
	} );
	$.fn.playable = function( options ) {
		var playlist	= this.selector,
			songs		= this.is( 'a[href]' ) ? this : this.find( 'a[href]' ),
			options		= options || {};
		if ( typeof options == 'string' && $.inArray( options, $.playable.methods ) != -1 )
			songs.each( function( args ) {
				var sound = $( this ).data( 'playable' );
				sound && sound[options]( args );
			}, [arguments[1]] );
		else
			sm.onready( function() {
				songs.each( function() {
					if ( sm.canPlayURL( this.href ) )
						$.playable.init.call( this, options, playlist );
				});
				if ( options && options.autoStart )
					songs.filter( ':first' ).click();
			} );
		return this;
	};
} )( jQuery );