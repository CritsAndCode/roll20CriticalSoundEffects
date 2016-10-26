//Critical Sound Effects v1.1.0

on('ready',function(){
    'use strict';
    var excludeGM = true, // this to false if you wish to include GM rolls
    defaults = {
            css: {
                button: {
                    'border': '1px solid #cccccc',
                    'border-radius': '1em',
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
        if (msg.type === 'api'&& playerIsGM(msg.playerid)) {
            var args = msg.content.split(/\s+/);
            
            if (args[0] === '!jukebox') {
                var allsongs = findObjs({
                        _type: 'jukeboxtrack',
                    }),
                    criticalHit = null,
                    criticalFail = null;
        
                allsongs.forEach(function(song) {
                    if(song.get('title') === 'Critical Hit') {
                        criticalHit = song;
                    } else if (song.get('title') === 'Critical Fail') {
                        criticalFail = song;
                    }
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
                    
                    stopButton = makeButton(
                        '!jukebox stop ?{Select a song to stop|'+playingSongs+'}', 'Stop a song', '#CDAE88', 'black'
                    ),
                    
                    fadeButton = makeButton(
                        '!jukebox fade ?{Select a song to fade out|'+playingSongs+'}', 'Fade a song out', '#CDAE88', 'black'
                    ),
                    
                    stopAllButton = makeButton(
                        '!jukebox stopAll', 'Stop all songs', '#CDAE88', 'black'
                    ),
                    
                    fadeAllButton = makeButton(
                        '!jukebox fadeAll', 'Fade all songs out', '#CDAE88', 'black'
                    );
            
                    sendChat(msg.who, '/w gm ' + playButton + stopButton + fadeButton + stopAllButton + fadeAllButton);
                } else {
                    if (args[1] === 'play') {
                        var songTitle = args.splice(2).join(' ');
                        play(getSong(songTitle, allsongs));
                    }
                    
                    if (args[1] === 'stop') {
                        var songTitle = args.splice(2).join(' ');
                        stop(getSong(songTitle, allsongs));
                    }
                    
                    if (args[1] === 'stopAll') {
                        allsongs.forEach(function(song) {
                            stop(song);
                        });
                    }
                    
                    if (args[1] === 'fade') {
                        var songTitle = args.splice(2).join(' ');
                        fadeOut(getSong(songTitle, allsongs));
                    }
                    
                    if (args[1] === 'fadeAll') {
                        allsongs.forEach(function(song) {
                            fadeOut(song);
                        });
                    }
                }
            }
            
        } else {
            if (!playerIsGM(msg.playerid) || !excludeGM) {
                //for Shaped 5e Character Sheet
                if (msg.inlinerolls) {
                    msg.inlinerolls.forEach(function(inlineRoll) {
                        criticalHitOrFail(inlineRoll.results);
                    });
                } 
                
                //for roll chat command
                else if (msg && isJson(msg.content)) {
                    var content = JSON.parse(msg.content);
                    criticalHitOrFail(content);
                } 
            }
            
            function criticalHitOrFail(content) {
                content.rolls.forEach(function(roll) {
                    if (roll.dice === 1 && roll.sides === 20) {
                        if (roll.results[0].v === 20) {
                            play(criticalHit);
                        } else if (roll.results[0].v === 1) {
                            play(criticalFail);
                        }
                    }
                });
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
                // do your thing
            
                volume = volume - 10;
                song.set({'volume': volume});
                
                if(volume <= 0) {
                    song.set({'playing': false, 'softstop': false, 'volume': originalVolume});
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

    log('Script loaded: Critical Hit/Failure Sound Effects');
});
