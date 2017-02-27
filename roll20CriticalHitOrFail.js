//Critical Sound Effects v1.2.0

on('ready',function(){
    'use strict';
    var excludeGM = true, // this to false if you wish to include GM rolls
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
        
        if (args[0] === '!jukebox' && playerIsGM(msg.playerid)) {
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
        
         if (!playerIsGM(msg.playerid) || !excludeGM && msg.type !== "gmrollresult") {
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
                    
                    if (roll.results[0].v === 20) {
                        play(criticalHit);
                    } else if (roll.results[0].v === 1) {
                        play(criticalFail);
                    }
                }
            });
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
//Critical Sound Effects v1.1.1

on('ready',function(){
    'use strict';
    var excludeGM = false, // this to false if you wish to include GM rolls
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

        if (!playerIsGM(msg.playerid) || !excludeGM && msg.type !== "gmrollresult") {
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
                if (roll.dice <= 2 && roll.sides === 20) {
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
                }

                if (roll.dice === 1 && roll.sides === 20) {
                    if (isCriticalHit(roll)) {
                        play(criticalHit);
                    } else if (roll.results[0].v === 1) {
                        play(criticalFail);
                    }
                }

                if (roll.dice === 2 && roll.sides === 20) {
                    if (keptResultIsCriticalHit(roll)) {
                        play(criticalHit);
                    }
                    else if (keptResultIsCriticalFailure(roll)) {
                        play(criticalFail);
                    }
                }

                function isCriticalHit(roll) {
                    return roll.results[0].v === 20 || roll.mods && roll.mods.customCrit && roll.results[0].v >= roll.mods.customCrit[0].point;
                }

                function keptResultIsCriticalHit(roll) {
                    var customCrit = roll.mods.customCrit[0].point;

                    return roll.mods && roll.mods.keep &&
                        roll.results.some(function(result) {
                            return result.d === undefined && result.v === 20 || 
                                result.d === undefined && result.v >= customCrit;
                        });
                }

                function keptResultIsCriticalFailure(roll) {
                    return roll.mods && roll.mods.keep &&
                        roll.results.some(function(result) {
                            return result.d === undefined && result.v === 1;
                        });
                }
            });

            content.rolls.forEach(function(roll) {
                if (roll.dice === 2 && roll.sides === 20) {
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

                    if (roll.results[0].v === 20 || roll.mods && roll.mods.customCrit && roll.results[0].v >= roll.mods.customCrit[0].point) {
                        play(criticalHit);
                    } else if (roll.results[0].v === 1) {
                        play(criticalFail);
                    }
                }
            });
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

    log('Script loaded: Critical Sound Effects');
});
