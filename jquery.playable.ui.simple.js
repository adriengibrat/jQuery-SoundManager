/*!
 * jQuery Sound Manager Simple UI
 * http://github.com/adriengibrat/jQuery-SoundManager
 *
 * Copyright (c) 2009 Adrien Gibrat
 * Dual licensed under the MIT and GPL licenses.
 * http://opensource.org/licenses/mit-license.php
 */
(function($){
	if ( ! $.playable )
		return;
	$.playable.events.push( 'whileloading', 'whileplaying' );
	$.extend( true, $.playable, {
		css : {
			ui : 'ui',
			timing : 'timing',
			elapsed : 'elapsed',
			total : 'total',
			controls : 'controls',
			loading : 'loading',
			position : 'position',
			searching : 'searching'
		},
		formatTime : function( ms ) {
			var ns = Math.floor( ms / 1000 ),
				m = Math.floor( ns / 60 ),
				s = ns - m * 60 ;
			return m + ':' + ( s < 10 ? '0' + s : s );
		},
		ui : {
			simple : function() {
				var doNothing = function() {
						return false;
					};
				$( '<span class="' + $.playable.css.ui + ' ' + $.playable.css.timing + '"><span class="' + $.playable.css.elapsed + '"></span><span class="' + $.playable.css.total + '"></span></span>' )
				.bind( 'click.playable', doNothing )
				.prependTo( this );
				$( '<span class="' + $.playable.css.ui + ' ' + $.playable.css.controls + '"><span class="' + $.playable.css.loading + '"></span><span class="' + $.playable.css.position + '"></span></span>' )
				.bind( 'click.playable', doNothing )
				.bind( 'mousedown.playable', function( event ) {
					var controls	= $( this ).addClass( $.playable.css.searching ),
						position	= controls.find( '.' + $.playable.css.position ),
						left		= controls.offset().left,
						width		= controls.width(),
						sound		= controls.parent().data( 'playable' );
						x			= event.clientX - left;
					$.playable.searching = controls;
					position.width( x );
					sound.setPosition( x / width * sound.durationEstimate );
					sound.pause();
					$( document ).bind( 'mousemove.playable', function( event ) {
						var x = Math.max( 0, Math.min( event.clientX - left, width ) );
						position.width( x );
						sound.setPosition( x / width * sound.durationEstimate );
						return false;
					} );
					return false;
				} )
				.appendTo( this );
				$( this )
				.bind( 'onstop.playable', function(){
					$( '.' + $.playable.css.elapsed + ', .' + $.playable.css.total, this ).empty();
				} )
				.bind( 'whileloading.playable', function( event, sound ){
					$( '.' + $.playable.css.loading, this ).width( sound.bytesLoaded / sound.bytesTotal * 100 + '%' );
				} )
				.bind( 'whileplaying.playable', function( event, sound ){
					$( '.' + $.playable.css.position, this ).width( sound.position / sound.durationEstimate * 100 + '%' );
					$( '.' + $.playable.css.elapsed, this ).html( $.playable.formatTime( sound.position ) );
					$( '.' + $.playable.css.total, this ).html( ' / ' + $.playable.formatTime( sound.durationEstimate ) );
				} );
				$( document ).bind( 'mouseup.playable', function( event ) {
					event.preventDefault();
					if ( ! $.playable.searching )
						return;
					var element	= $.playable.searching.removeClass( $.playable.css.searching ).parent(),
						sound	= element.data( 'playable' );
					$( document ).unbind( 'mousemove.playable' );
					if ( element.hasClass( $.playable.css.playing ) )
						sound.resume();
					$.playable.searching = null;
					return false;
				} );
			}
		}
	});
})(jQuery);
