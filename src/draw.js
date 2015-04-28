/**
 * File: src/draw.js
 * ------------------------------------
 * @By: Jingxin Zhu
 * @On: 2015.04.13
 * ------------------------------------
 */

angular.module('myApp').service('drawService', ['$log', '$translate', 'config', function($log, $translate, config) {
    
    'use strict';

    /** ******** Game Constants ***********/
    // There are 1-8 players.
    // Colors:  black: canvas borders
    //          white: canvas background
    //          green: bomb
    var playerSnakeColor = [
        'blue', 'red',    'brown',  'purple',
        'pink', 'yellow', 'orange', 'silver'
    ];

    var CANVAS_WIDTH = config.CANVAS.WIDTH;
    var CANVAS_HEIGHT = config.CANVAS.HEIGHT;
    var CELL_WIDTH = config.CELL.WIDTH;
    var CELL_HEIGHT = config.CELL.HEIGHT;
    var WALL_WIDTH = 15;
    var WALL_HEIGHT = 15;
    var COUNT_DOWN_TO_START = config.COUNT_DOWN_TO_START;

    function draw_prompt(ctx, yourPlayerIndex, secondsToReallyStart, level) {
        var yourColor = playerSnakeColor[yourPlayerIndex];
        ctx.fillStyle = yourColor;
        ctx.font = '80px Open Sans';
        ctx.fillText("" + secondsToReallyStart, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = '15px Open Sans';
        var msg = $translate('MAP') + level + ": "  + $translate("YOUR_TANK_COLOR_IS",
            {color: $translate(yourColor.toUpperCase())});
        ctx.fillText(msg, CANVAS_WIDTH / 4 - 30, CANVAS_HEIGHT / 4 - 30);
    }

    function draw_tank(ctx, tank, playerIndex) {
        ctx.globalAlpha = 1;
        for(var i = 0; i < tank.length; i++) {
            var c = tank[i];
            var color = playerSnakeColor[playerIndex];
            var x = c.x;
            var y = c.y;
            ctx.globalAlpha = 1 - i / tank.length;
            ctx.fillStyle = color;
            if (i === 0) {
                ctx.fillRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
            } else {
                ctx.fillRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
            }
            ctx.strokeStyle = "white";
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.strokeRect(x*CELL_WIDTH, y*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
        }
        ctx.globalAlpha = 1;
    }

    function draw_wall(ctx, walls) {
        for (var i = 0; i < walls.length; i++) {
            var c = walls[i];
            var x = c.x;
            var y = c.y;
            ctx.fillStyle = "brown";
            ctx.fillRect(x * WALL_WIDTH, y * WALL_HEIGHT, WALL_WIDTH, WALL_HEIGHT);
            ctx.strokeStyle = "white";
            ctx.strokeRect(x * WALL_WIDTH, y* WALL_HEIGHT, WALL_WIDTH, WALL_HEIGHT);
        }
    }

    function draw_timer(ctx, startMatchTime) {
        var timer = new Date().getTime() - startMatchTime - COUNT_DOWN_TO_START * 1000;
        if (timer > 0) {
            var period = new Date().getTime() - startMatchTime - COUNT_DOWN_TO_START * 1000;
            var second = Math.floor(period / 1000);
            var milli = Math.floor((period - second * 1000) / 10);
            timer = second + ":" + milli ;
        } else {
            timer = "0:00";
        }
        // Let's paint the timer
        ctx.font = '12px Open Sans';
        ctx.fillStyle = "black";
        var msg = $translate("TIMER") + ": " + $translate("TIMER_IS", {timer: timer});
        ctx.fillText(msg, CANVAS_WIDTH / 4 - 30, CANVAS_HEIGHT - 5);
    }

    function draw_bomb(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x*CELL_WIDTH, y*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
        ctx.strokeStyle = "white";
        ctx.strokeRect(x*CELL_WIDTH, y*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }

    function draw_score (ctx, allScores, players) {
        //Lets paint the score
        for (var i = 0; i < allScores.length; i++) {
            ctx.font = '12px Open Sans';
            var color = playerSnakeColor[i];
            ctx.fillStyle = color;
            var msg = $translate("COLOR_SCORE_IS",
                {color: $translate(color.toUpperCase()), score: "" + allScores[i]});
            ctx.fillText(msg,
                5 + i * CANVAS_WIDTH / players, CANVAS_HEIGHT - 5);
        }
    }

    function show_dialogue (ctx, info) {
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.strokeStyle = "black";
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 15;
        ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 150, 300, 300);
        ctx.strokeRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 150, 300, 300);
        clearShadows(ctx);
        ctx.fillStyle = "black";
        ctx.font = "600 32px Open Sans";
        ctx.textAlign = "center";
        ctx.fillText(info, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.font = "20px Open Sans";
        ctx.fillText("Space to continue", CANVAS_WIDTH/2, CANVAS_HEIGHT/2+35);
    }

    var clearShadows = function(ctx) {
        ctx.shadowColor = 0;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    };

    function draw_canvas(ctx, allTanks, yourPlayerIndex, tank_array, walls, startMatchTime, bomb, allScores, players) {
        //To avoid the tank trail we need to paint the BG on every frame
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = "black";
        ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (var i = 0; i < allTanks.length; i++) {
            if (i !== yourPlayerIndex) {
                draw_tank(allTanks[i], i);
            }
        }

        // Your tank is always drawn last (so it will be completely visible).
        draw_tank(ctx, tank_array, yourPlayerIndex);

        // draw the walls
        draw_wall(ctx, walls);

        draw_timer(ctx, startMatchTime);

        //Lets paint the bomb
        draw_bomb(ctx, bomb.x, bomb.y, 'green');

        draw_score(ctx, allScores, players);
    }

    return {
        draw_canvas: draw_canvas,
        draw_prompt: draw_prompt,
        draw_tank: draw_tank,
        draw_wall: draw_wall,
        draw_bomb: draw_bomb,
        draw_score: draw_score,
        draw_timer: draw_timer,
        show_dialogue: show_dialogue
    };

}]);

