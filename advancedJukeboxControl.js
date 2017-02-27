//Advanced Jukebox Control v1.0.0

on('ready',function(){
    'use strict';
    var allowPlayers = false, // this to true if you wish to allow players control over jukebox
    defaults = {
            css: {
                button: {
                    'border': '1px solid #cccccc',
                    'border-radius': '2px',
                    'background-color': '#006dcc',
                    'margin': '0 .1em',
                    'font-weight': 'bold',
                    'padding': '.1em 1em',
                    'color': 'white'
                }
            }
        },
    templates = {};
    
    buildTemplates();
    
    on("chat:message", function(msg) {
        var args = msg.content.split(/\s+/);
        
        if (args[0] === '!jukebox' && (playerIsGM(msg.playerid) || allowPlayers)) {
            var allsongs = findObjs({
                    _type: 'jukeboxtrack',
                });
                
            if (args.length === 1) {
                
                        
                var songs = allsongs
                    .map(function (song) {
                        return song.get('title');
                    })
                    .sort()
                    .join('|'),
                    
                playingSongs = allsongs
                    .filter(function (song) {
                        return song.get('playing');
                    })
                    .map(function (song) {
                        return song.get('title');
                    })
                    .sort()
                    .join('|'),
                
                playButton = makeButton(
                    '!jukebox play ?{Select a song to play|'+songs+'}', 'Play a song', '#CDAE88', 'black'
                ),
                
                crossfadeButton = makeButton(
                    '!jukebox crossfade ?{Select a song to crossfade to|'+songs+'}', 'Crossfade to a song', '#CDAE88', 'black'
                ),
                
                stopButton = makeButton(
                    '!jukebox stop ?{Select a song to stop|'+playingSongs+'}', 'Stop a song', '#CDAE88', 'black'
                ),
                
                fadeInButton = makeButton(
                    '!jukebox fadein ?{Select a song to fade in|'+songs+'}', 'Fade a song in', '#CDAE88', 'black'
                ),
                
                fadeOutButton = makeButton(
                    '!jukebox fadeout ?{Select a song to fade out|'+playingSongs+'}', 'Fade a song out', '#CDAE88', 'black'
                ),
                
                stopAllButton = makeButton(
                    '!jukebox stopall', 'Stop all songs', '#CDAE88', 'black'
                ),
                
                fadeAllButton = makeButton(
                    '!jukebox fadeallout', 'Fade all songs out', '#CDAE88', 'black'
                );
        
                sendChat(msg.who, '/w gm ' + playButton + stopButton + crossfadeButton + fadeInButton + fadeOutButton + stopAllButton + fadeAllButton);
            } else {
                if (args[1] === 'play') {
                    var songTitle = args.splice(2).join(' ');
                    play(getSong(songTitle, allsongs));
                }
                
                if (args[1] === 'stop') {
                    var songTitle = args.splice(2).join(' ');
                    stop(getSong(songTitle, allsongs));
                }
                
                if (args[1] === 'crossfade') {
                    var songTitle = args.splice(2).join(' ');
                    allsongs.forEach(function(song) {
                        if (song.get('playing') && song.get('title') !== songTitle) {
                            fadeOut(song);
                        }
                    });
                    fadeIn(getSong(songTitle, allsongs));
                }
                
                if (args[1] === 'fadein') {
                    var songTitle = args.splice(2).join(' ');
                    fadeIn(getSong(songTitle, allsongs));
                }
                
                if (args[1] === 'fadeout') {
                    var songTitle = args.splice(2).join(' ');
                    fadeOut(getSong(songTitle, allsongs));
                }
                
                if (args[1] === 'stopall') {
                    allsongs.forEach(function(song) {
                        if (song.get('playing')) {
                            stop(song);
                        }
                    });
                }
                
                if (args[1] === 'fadeallout') {
                    allsongs.forEach(function(song) {
                        if (song.get('playing')) {
                            fadeOut(song);
                        }
                    });
                }
            }
        }
    });
    
    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    
    function getSong(songTitle, songs) {
        var selectedSong;
        songs.forEach(function(song) {
            if(song.get('title') === songTitle) {
                selectedSong = song;
            }
        });
        return selectedSong;
    }
    
    function play (song) {
        if (song) {
            song.set({'playing': true, 'softstop': false});
        }
    }
    
    function stop (song) {
        if (song) {
            song.set({'playing': false, 'softstop': false});
        }
    }
    
    function fadeOut(song) {
        if (song) {
            var volume = song.get('volume') || 0;
            var originalVolume = song.get('volume') || 0;
            
            var i = setInterval(function(){

                volume = volume - 7.5;
                song.set({'volume': volume});
                
                if(volume <= 0) {
                    song.set({'playing': false, 'softstop': false, 'volume': originalVolume});
                    clearInterval(i);
                }
            }, 1000);
        
        }
    }
    
    function fadeIn(song) {
        if (song) {
            var volume = 0;
            var originalVolume = song.get('volume') || 0;
            
            song.set({'playing': true, 'softstop': false, 'volume': 0});
            
            var i = setInterval(function(){

                volume = volume + 7.5;
                song.set({'volume': volume});
                
                if(volume >= originalVolume) {
                    song.set({'volume': originalVolume});
                    clearInterval(i);
                }
            }, 1000);
        } 
    }
    
    function buildTemplates() {
        templates.cssProperty =_.template(
            '<%=name %>: <%=value %>;'
        );

        templates.style = _.template(
            'style="<%='+
                '_.map(css,function(v,k) {'+
                    'return templates.cssProperty({'+
                        'defaults: defaults,'+
                        'templates: templates,'+
                        'name:k,'+
                        'value:v'+
                    '});'+
                '}).join("")'+
            ' %>"'
        );
        
        templates.button = _.template(
            '<a <%= templates.style({'+
                'defaults: defaults,'+
                'templates: templates,'+
                'css: _.defaults(css,defaults.css.button)'+
                '}) %> href="<%= command %>"><%= label||"Button" %></a>'
        );
    }
    
    function makeButton (command, label, backgroundColor, color){
        return templates.button({
            command: command,
            label: label,
            templates: templates,
            defaults: defaults,
            css: {
                color: color,
                'background-color': backgroundColor
            }
        });
    }

    log('Script loaded: Jukebox Controls');
});
