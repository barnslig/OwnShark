var WebPlayer = (function() {

	function audioPlayer() {
		var t = this;

		this.p = new Audio("");
		$('body').append(this.p);

		for(var i=0; i<localStorage.length; i++) {
			var key = localStorage.key(i);
			var ls = JSON.parse(localStorage.getItem(key));
			t.add(ls[0], ls[1], key);
		}

		this.posInterval = setInterval(function() {
			$('#player input[type="range"]').val(t.p.currentTime);
			$('#player small').html(
				Math.floor(t.p.currentTime/60) + ':' + Math.round(t.p.currentTime-Math.floor(t.p.currentTime/60)*60)
				+ ' / ' +
				Math.floor(t.p.duration/60) + ':' + Math.round(t.p.duration-Math.floor(t.p.duration/60)*60)
			);
		}, 1000);

		$(this.player).on('loadedmetadata', function(e) {
			$('#player input[type="range"]').attr('max', t.p.duration);
		});
		$(this.player).on('ended', function(e) {
			t.next();
		});
		$('#player input[type="range"]').on('change', function(e) {
			t.p.currentTime = $(this).val();
		});
		$(document).keyup(function(e) {
			if(e.keyCode == 32) {
				t.toggle();
				e.preventDefault();
			}
		});
	}
	(function(fn) {
		fn.add = function(artist, title, path) {
			$('#player #player-playlist').append('<li data-src="%%path%%">\
				%%artist%% - %%title%%\
			</li>'.replace(/%%path%%/g, path).replace(/%%artist%%/g, artist).replace(/%%title%%/g, title));

			localStorage.setItem(path, JSON.stringify([artist, title]));

			if(!$('#player').hasClass('player-open'))
				this.togglePlaylist();
		};
		fn.prev = function() {
			$('#player-playing').attr('id', '').prev().attr('id', 'player-playing');
			this.p.pause();
			this.p.src = $('#player-playing').data('src');
			$('#player-player h1').text($('#player-playing').text());
			this.toggle();
		};
		fn.toggle = function() {
			if(this.p.paused) {
				/*if(this.p.currentSrc.length < 1)
					this.next();
					return;*/

				this.p.play();
				$('#player #player-toggle i').attr('class', 'icon-pause');
			} else {
				this.p.pause();
				$('#player #player-toggle i').attr('class', 'icon-play');
			}
		};
		fn.next = function() {
			if($('#player-playing').length < 1)
				$('#player-playlist li:first').attr('id', 'player-playing');
			else
				$('#player-playing').attr('id', '').next().attr('id', 'player-playing');
			
			this.p.pause();
			this.p.src = $('#player-playing').data('src');
			$('#player-player h1').text($('#player-playing').text());
			this.toggle();
		};
		fn.togglePlaylist = function() {
			$('#player').toggleClass('player-open');
		};
	}(audioPlayer.prototype));

	function player() {
		var t = this;
		this.p = new audioPlayer();
		this.parseURL();

		$(window).on('hashchange', function(e) {
			$('#loading').addClass('loaded');
			t.parseURL();
		});
	}
	(function(fn) {
		fn.getArtists = function() {
			console.log('getArtists');

			$.getJSON('/artist', function(data) {
				$('#content').append($('<ul><h1>Artists</h1>').addClass('gen-list').addClass('overview-list').attr('id', 'artist'));
				$('#artist').wrap('<div class="wrapper" id="wrapper-artist">');

				data.forEach(function(k) {
					$('#artist').append("<li style=\"background-image:url('/artistArt?n=%%name%%');\"><a href=\"#n/%%name%%\">\
						<h2><span>%%name%%</span></h2>\
					</a></li>".replace(/%%name%%/g, k));
				});

				$(window).scrollTop(0);
				$('#loading').removeClass('loaded');
			});
		};
		fn.getAlbums = function(artist) {
			console.log('getAlbums', artist);

			$.getJSON('/albums?n='+artist, function(data) {
				$('#content').append("<div id=\"albums-artist\" style=\"background-image:url('/artistArt?n=%%name%%');\">\
					<h1><span>%%name%%</span></h1>\
				</div>".replace(/%%name%%/g, artist));

				$('#albums-artist').append($('<ul>').addClass('gen-list').attr('id', 'albums'));
				$('#albums').wrap('<div class="wrapper">');

				data.forEach(function(k) {
					$('#albums').append("<li style=\"background-image:url('/albumArt?n=%%name%%&a=%%album%%');\"><a href=\"#n/%%name%%/%%album%%\">\
						<h2><span>%%album%%</span></h2>\
					</a></li>".replace(/%%name%%/g, artist).replace(/%%album%%/g, k));
				});

				$(window).scrollTop(0);
				$('#loading').removeClass('loaded');
			});
		};
		fn.getTitles = function(artist, album) {
			var t = this;

			if($('#content:has(#albums)').length < 1)
				this.getAlbums(artist);

			$.getJSON('/albums/title?n='+artist+'&a='+album, function(data) {
				$('#albums li:has(h2:not(:contains("'+album+'")))').remove();
				$('#albums').addClass('single');
				$('#albums-artist').append($('<ol>').attr('id', 'album-titles'));
				$('#album-titles').wrap('<div class="wrapper" id="wrapper-album-titles">');

				data.forEach(function(k) {
					$('#album-titles').append('<li data-src="/music/%%path%%" data-artist="%%artist%%"><a href="javascript:;">\
						<span id="name">%%name%%</span>\
						<span id="time">%%length%%</span>\
					</a></li>'.replace(/%%path%%/g, k['file']).replace(/%%artist%%/g, artist).replace(/%%name%%/g, k['title']).replace(/%%length%%/g, k['time']));
				});

				$('#album-titles li').on('click', function(e) {
					t.p.add($(this).data('artist'), $(this).find('#name').text(), $(this).data('src'));
				});

				$(window).scrollTop(0);
				$('#loading').removeClass('loaded');
			});
		};
		fn.getPlaylists = function(playlist) {
			$.getJSON('/playlist', function(data) {
				$('#content').append($('<ul><h1>Playlists</h1>').addClass('gen-list').addClass('overview-list').attr('id', 'playlists'));
				$('#playlists').wrap('<div class="wrapper" id="wrapper-playlists">');

				data.forEach(function(k) {
					$('#playlists').append('<li><a href="#p/%%name%%">\
						<h2><span>%%name%%</span></h2>\
					</a></li>'.replace(/%%name%%/g, k['playlist']));
				});

				$(window).scrollTop(0);
				$('#loading').removeClass('loaded');
			});
		};
		fn.getPlaylist = function() {};

		fn.parseURL = function() {
			var t = this,
				args = window.location.hash.substr(1).split("/");

			switch(args.length) {
				case 2:
					$('#content').html('');
					if(args[0] == 'p')
						this.getPlaylist(args[1]);
					else
						this.getAlbums(args[1]);
					break;
				case 3:
					$('#content').html('');
					this.getTitles(args[1], args[2]);
					break;
				default:
					$('#content').html('');
					this.getPlaylists();
					this.getArtists();
			}
		};
	}(player.prototype));

	return player;
}());