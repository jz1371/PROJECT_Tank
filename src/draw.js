/**
 * File: src/draw.js
 * ------------------------------------
 * @By: Jingxin Zhu
 * @On: 2015.04.13
 * ------------------------------------
 */

angular.module('myApp').service('drawService', ['$log', '$translate', function($log, $translate) {
    'use strict';

    /** ******** Constants ***********/
    var canvasWidth = 300;
    var canvasHeight = 300;

    var playerSnakeColor = [
        'blue', 'red', 'brown', 'purple',
        'pink', 'yellow', 'orange', 'silver'
    ];

    //Lets save the cell width in a variable for easy control
    var cellWidth = 15;
    var cellHeight = 15;
    var WALL_WIDTH = 15;
    var WALL_HEIGHT = 15;
    var rowsNum = canvasWidth / cellWidth;
    var colsNum = canvasHeight / cellHeight;
    var drawEveryMilliseconds = 120;

    var COUNT_DOWN_TO_START = 1;
    var SNAKE_LENGTH = 6;

    function draw_tank(ctx, snake, playerIndex) {
        ctx.globalAlpha = 1;
        for(var i = 0; i < snake.length; i++) {
            var c = snake[i];

            //paint_snake(c.x, c.y, playerSnakeColor[playerIndex]);

            var color = playerSnakeColor[playerIndex];
            var x = c.x;
            var y = c.y;
            ctx.globalAlpha = 1 - i / snake.length;
            ctx.fillStyle = color;
            if (i == 0) {
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            } else {
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
            ctx.strokeStyle = "white";
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.strokeRect(x*cellWidth, y*cellHeight, cellWidth, cellHeight);
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
        var msg = $translate.instant("TIMER_IS",
            {timer: timer});
        ctx.fillText("time: " + msg, canvasWidth / 4 - 30, canvasHeight - 5);
    }

    function draw_bomb(ctx, x, y, color) {

        ctx.fillStyle = color;
        ctx.fillRect(x*cellWidth, y*cellHeight, cellWidth, cellHeight);
        ctx.strokeStyle = "white";
        ctx.strokeRect(x*cellWidth, y*cellHeight, cellWidth, cellHeight);

    }

    return {
        draw_tank: draw_tank,
        draw_wall: draw_wall,
        draw_bomb: draw_bomb,
        draw_timer: draw_timer
    }

}]);

