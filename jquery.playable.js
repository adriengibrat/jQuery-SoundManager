/*
 * jQuery Sound Manager Plugin
 * http://github.com/adriengibrat/jQuery-SoundManager
 *
 * Copyright (c) 2009 Adrien Gibrat
 * Dual licensed under the MIT and GPL licenses.
 * http://opensource.org/licenses/mit-license.php
 */
( function( $, sm ) {
	$.playable = $.extend( function( url, settings ) {
		if ( typeof url == 'object' && url.url ) { // Allow to pass all settings including URL in one single object
			settings = url;
			url = url.url;
			delete settings.url;
		}
		$.each( $.extend( true, $.playable.settings, settings || {}, {
			url : url, // Set Flash url
			debugMode : window.location.hash.match(/^#debug/i), // Activate Debugging with hash (#debug)
			consoleOnly : window.location.hash.match(/console$/i) // Debug in console only (#debugconsole)
		} ), function( key, value ) { // Parse settings to isolate SoundManager properties
			if ( $.inArray( key, $.playable.properties ) > 0 )
				sm[key] = ( key == 'flash9Options' || key == 'movieStarOptions' ) ? $.extend( sm[key], value ) : value;
			else 
				sm.defaultOptions[key] = value;
		} );
		$.each( $.playable.events, function( i, event ) { // Set Events Handler as element custom Handler
			sm.defaultOptions[event] = function() {
				$('#'+this.options.element).triggerHandler( event, this );
			};
		} );
	}, {
		settings : {
			autoStart : false,
			pauseOnly : false,
			playNext : true,
			loopNext : true,
			playAlone : true,
			doUnload : false,
			useFlashBlock : true
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
		properties :['allowPolling','allowScriptAccess','altURL','consoleOnly','debugFlash','debugMode','defaultOptions','flash9Options','features','flashLoadTimeout','flashVersion','movieStarOptions','nullURL','url','useConsole','useFastPolling','flashPollingInterval','useFlashBlock','useHighPerformance','useHTML5Audio','useMovieStar','wmode','waitForWindowLoad'],
		init : function( options, playlist ) {
			var options = $.extend( true, {playlist: playlist}, sm.defaultOptions, options ),
				self = $( this );
			if(self.data( 'playable')) // ensure to avoid multiple init
				return;
			self.addClass( $.playable.css.playable )
			.data( 'playable', sm.createSound( $.extend( options, {
				id : 'playable' + $.playable.count++,
				url : this.href,
				element : self.attr('id')
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
				if ( options.playAlone && $.playable.current && $.playable.current != self ) {
					current = $.playable.current.data( 'playable' );
					current && current[ options.pauseOnly ? 'pause' : 'stop' ]();
				}
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
				songs    = playlist.is( 'a.playable' ) ? playlist : playlist.find( 'a.playable' ),
				move     = move || 1,
				next     = songs.eq( songs.index( $('#'+options.element) ) + move ).data( 'playable' );
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
		if ( typeof options == 'string' && $.inArray( options, $.playable.methods ) != -1 ) {
			var args = $.makeArray( arguments ).slice( 1 );
			songs.filter('.playable').each( function() {
				var sound = $( this ).data( 'playable' );
				sound && sound[options].apply( sound, args );
			} );
		} else {
			init = function(){
				songs.each(function(){
					if (sm.canPlayURL(this.href)) 
						$.playable.init.call(this, options, playlist);
				});
				if (options && options.autoStart) 
					songs.filter(':first').click();
			};
			sm.enabled ? init() : sm.onready(init);
		}
		return this;
	};
} )( jQuery, soundManager );