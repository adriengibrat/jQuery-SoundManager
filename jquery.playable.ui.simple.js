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
			progress : 'progress',
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
				$( this )
				.prepend( '<span class="' + $.playable.css.ui + ' ' + $.playable.css.timing + '"><span class="' + $.playable.css.elapsed + '"></span><span class="' + $.playable.css.total + '"></span></span>' )
				.append( '<span class="' + $.playable.css.ui + ' ' + $.playable.css.progress + '"><span class="' + $.playable.css.loading + '"></span><span class="' + $.playable.css.position + '"></span></span>' )
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
				} )
				.find( '.' + $.playable.css.ui )
				.bind( 'click.playable', function() { return false; } )
				.filter( '.' + $.playable.css.progress )
				.bind( 'mousedown.playable', function( event ) {
					var progress	= $( this ).addClass( $.playable.css.searching ),
						position	= progress.find( '.' + $.playable.css.position ),
						left		= progress.offset().left,
						width		= progress.width(),
						sound		= progress.parent().data( 'playable' );
					$.playable.searching = true;
					sound.pause();
					$( document )
					.bind( 'mousemove.playable', function( event ) {
						var x = Math.max( 0, Math.min( event.clientX - left, width ) );
						position.width( x );
						sound.setPosition( x / width * sound.durationEstimate );
						return false;
					} )
					.bind( 'mouseup.playable', function() {
						$.playable.searching = false;
						if ( progress.removeClass( $.playable.css.searching ).parent().hasClass( $.playable.css.playing ) )
							sound.resume();
						$( this ).unbind( 'mousemove.playable mouseup.playable' );
						return false;
					} )
					.trigger( { type: 'mousemove', clientX: event.clientX } );
					return false;
				} );
			}
		}
	});
})(jQuery);