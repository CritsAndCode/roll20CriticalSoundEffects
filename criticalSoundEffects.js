on('ready',function(){
    'use strict';
    var excludeGM = true, // this to false if you wish to include GM rolls
        playerIds = [],
        players = findObjs({_type:'player'}) || [];


    _.each(players,function (obj){
        if(playerIsGM(obj.get('id')) && !excludeGM || !playerIsGM(obj.get('id'))) {
            playerIds.push(obj.get('id'));
        }
    });

    var allsongs = findObjs({
            _type: 'jukeboxtrack',
        }),
        criticalHit = {},
        criticalFail = {};

    allsongs.forEach(function(song) {
        if(song.get('title') === 'Critical Hit') {
            criticalHit = song;
        } else if (song.get('title') === 'Critical Fail') {
            criticalFail = song;
        }
    });

    on("chat:message", function(msg) {
        //for Shaped 5e Character Sheet
        if (msg.inlinerolls) {
            msg.inlinerolls.forEach(function(inlineRoll) {
                criticalHitOrFail(inlineRoll.results);
            });
        }
        //for roll chat command
        else if (isJson(msg.content)) {
            content = JSON.parse(msg.content);
            criticalHitOrFail(content);
        }
    });

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

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function play (song) {
        song.set({'playing': true, 'softstop': false});
    }

    log('Script loaded: Critical Hit/Failure Sound Effects');
});
