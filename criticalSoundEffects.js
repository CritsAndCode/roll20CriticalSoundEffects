//Critical Sound Effects v1.00.02

on('ready',function(){
    'use strict';
    var excludeGM = true; // this to false if you wish to include GM rolls
    
    on("chat:message", function(msg) {
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
        if (song) {
            song.set({'playing': true, 'softstop': false});
        }
    }

    log('Script loaded: Critical Hit/Failure Sound Effects');
});
