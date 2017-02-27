//Critical Sound Effects v1.2.0

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

    log('Script loaded: Critical Sound Effects');
});
