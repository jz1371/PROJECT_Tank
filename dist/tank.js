/**
 * File: src/index.js
 * ------------------------
 * @By: Jingxin Zhu
 * @On: 2014.04.10
 * ------------------------
 */
angular.module('myApp', ['ngTouch','ui.bootstrap']).run(['$rootScope', '$translate', '$log', 'realTimeService', 'randomService','levelsService', 'drawService', 'config',
    function ($rootScope, $translate, $log, realTimeService, randomService, levelsService, drawService, config) {

        'use strict';

        var canvasWidth  = config.CANVAS.WIDTH;
        var canvasHeight = config.CANVAS.HEIGHT;

        var cellWidth  = config.CELL.WIDTH;
        var cellHeight = config.CELL.HEIGHT;
        var rowsNum = canvasWidth  / cellWidth;
        var colsNum = canvasHeight / cellHeight;
        var drawEveryMilliseconds = 150;
        var SNAKE_LENGTH = 6;
        var COUNT_DOWN_TO_START = config.COUNT_DOWN_TO_START;

        $rootScope.isHelpModalShown = false;

        function createCanvasController(canvas) {

            //$log.info("createCanvasController for canvas.id=" + canvas.id);
            var isGameOngoing = false;
            var isSinglePlayer = false;
            var playersInfo = null;
            var yourPlayerIndex = null;
            var matchController = null;

            // Game state
            var allTanks;      // allTanks[playerIndex]  is the tank of playerIndex
            var tank_array;    // points to allTanks[yourPlayerIndex]
            var allScores;
            var bombCreatedNum; // Number of bomb pieces that were created (a bomb piece should be eaten by one player only).
            var d;              // Direction: "right", "left", "up", "down"
            var bomb;           // {x: ..., y: ...}
            var startMatchTime; // For displaying a countdown.

            var walls;
            var timer;

            var level;

            var gamePaused = false;

            var fpsmeter; //fps meter

            /**
             * @param params {matchController, playersInfo, yourPlayerIndex}
             */
            function gotStartMatch(params) {

                fpsmeter = new window.FPSMeter({graph: true, theme: 'light', left: '20px'});

                yourPlayerIndex = params.yourPlayerIndex;
                playersInfo = params.playersInfo;
                matchController = params.matchController;
                isGameOngoing = true;
                isSinglePlayer = playersInfo.length === 1;

                bombCreatedNum = 0;
                allTanks = [];
                allScores = [];
                for (var index = 0; index < playersInfo.length; index++) {
                    // initialize player's tank
                    allTanks[index] = create_tank(index);

                    // initialize game's walls
                    walls = create_walls();

                    // initialize player's score
                    allScores[index] = 0;
                }
                tank_array = allTanks[yourPlayerIndex];
                create_bomb();
                d = "right"; //default direction
                startMatchTime = new Date().getTime();

                timer = startMatchTime;

                setDrawInterval();
            }

            /**
             * @param params {fromPlayerIndex, message}
             */
            function gotMessage(params) {
                var fromPlayerIndex = params.fromPlayerIndex;
                var messageString = params.message;
                // The array representing the cells of a player's tank.
                var messageObject = angular.fromJson(messageString);
                allTanks[fromPlayerIndex] = messageObject.a;
                allScores[fromPlayerIndex] = messageObject.s;
                while (bombCreatedNum < messageObject.f) {
                    create_bomb();
                }
            }

            function gotEndMatch(endMatchScores) {
                // Note that endMatchScores can be null if the game was cancelled (e.g., someone disconnected).
                allScores = endMatchScores;
                isGameOngoing = false;
                stopDrawInterval();
            }

            function sendMessage(isReliable) {
                if (isSinglePlayer || !isGameOngoing) {
                    return; // No need to send messages if you're the only player or game is over.
                }
                var messageString = angular.toJson(
                    {f: bombCreatedNum, s: allScores[yourPlayerIndex], a: tank_array});
                if (isReliable) {
                    matchController.sendReliableMessage(messageString);
                } else {
                    matchController.sendUnreliableMessage(messageString);
                }
            }

            function lostMatch() {
                if (!isGameOngoing) {
                    return;
                }
                isGameOngoing = false;
                matchController.endMatch(allScores);
            }

            //Canvas stuff
            var ctx = canvas.getContext("2d");

            var drawInterval;

            function setDrawInterval() {
                stopDrawInterval();
                // Every 2 bomb pieces we increase the tank speed (to a max speed of 50ms interval).
                var intervalMillis = Math.max(50, drawEveryMilliseconds - 10 * Math.floor(bombCreatedNum / 2));
                drawInterval = setInterval(updateAndDraw, intervalMillis);
            }

            function stopDrawInterval() {
                clearInterval(drawInterval);
            }

            function create_tank(playerIndex) {
                var length = SNAKE_LENGTH;  // Initial length of the tank
                var arr = [];    //Empty array to start with
                for(var i = length - 1; i >= 0; i--) {
                    // create a tank at the bottom
                    arr.push({x: i, y: canvasWidth / cellHeight - 3 - playerIndex});
                }
                return arr;
            }

            function create_walls () {
                var walls = [];
                var levelNum = randomService.randomFromTo(0, 0, levelsService.getNumberOfLevels);
                level = levelsService.getLevel(levelNum);
                var map = level.map;
                for (var i = 0; i < map.length; i++) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (map[i][j] !== -1) {
                            walls.push({x: j, y: i});
                        }
                    }
                }
                return walls;
            }

            function create_bomb() {
                function generatePosForBomb(walls) {
                    var x = randomService.randomFromTo(bombCreatedNum * 2, 0, colsNum);
                    var y = randomService.randomFromTo(bombCreatedNum * 2 + 1, 0, rowsNum);
                    while (walls.length > x && walls[x].length > y && walls[x][y] === 1) {
                        x = randomService.randomFromTo(bombCreatedNum * 2, 0, colsNum);
                        y = randomService.randomFromTo(bombCreatedNum * 2 + 1, 0, rowsNum);
                    }
                    return {x: x, y: y};
                }
                var pos = generatePosForBomb(walls);
                bomb = {
                    x: pos.x,
                    y: pos.y
                };
                bombCreatedNum++;
                setDrawInterval();
            }

            function updateAndDraw() {
                if (!gamePaused && fpsmeter !== undefined) {
                    fpsmeter.tickStart();
                }
                if (gamePaused || !isGameOngoing) {
                    return;
                }
                var secondsFromStart =
                    Math.floor((new Date().getTime() - startMatchTime) / 1000);

                if (secondsFromStart < COUNT_DOWN_TO_START) {
                    //var info = "game is to start";
                    //drawService.show_dialogue(ctx, info);
                    // Countdown to really start
                    changeDirQueue = []; // Clear any direction changes in the queue
                    draw();
                    // Draw countdown
                    var secondsToReallyStart = COUNT_DOWN_TO_START - secondsFromStart;

                    drawService.draw_prompt(ctx, yourPlayerIndex, secondsToReallyStart, level.level);

                    fpsmeter.tick();
                    return;
                }

                timer = new Date().getTime() - startMatchTime;

                changeBombPosition(bomb, timer);

                changeDirection();

                //The movement code for the tank to come here.
                //The logic is simple
                //Pop out the tail cell and place it infront of the head cell
                var nx = tank_array[0].x;
                var ny = tank_array[0].y;
                //These were the position of the head cell.
                //We will increment it to get the new head position
                //Lets add proper direction based movement now
                if (d === "right") {
                    nx++;
                } else if (d === "left") {
                    nx--;
                } else if (d === "up") {
                    ny--;
                } else if (d === "down") {
                    ny++;
                }

                //Lets add the game over clauses now
                //This will restart the game if the tank hits the wall
                //Lets add the code for body collision
                //Now if the head of the tank bumps into its body, the game will restart
                if (nx === -1 || nx === colsNum || ny === -1 || ny === rowsNum ||
                    check_collision(nx, ny, tank_array)) {
                    lostMatch();
                    return;
                }

                //Lets write the code to make the tank eat the bomb
                //The logic is simple
                //If the new head position matches with that of the bomb,
                //Create a new head instead of moving the tail
                var isReliable = false; // Passing unreliable messages is faster
                var tail;
                if(nx === bomb.x && ny === bomb.y) {
                    lostMatch();
                    isReliable = true; // If creating bomb (and increasing score), I want to pass the message reliably.
                    tail = {x: nx, y: ny};
                    allScores[yourPlayerIndex]++;
                    //Create new bomb
                    create_bomb();
                    return;
                } else {
                    tail = tank_array.pop(); //pops out the last cell
                    tail.x = nx; tail.y = ny;
                }
                //The tank can now eat the bomb.

                tank_array.unshift(tail); //puts back the tail as the first cell

                sendMessage(isReliable);
                draw();
                fpsmeter.tick();
            }

            function pauseGame() {
                if (!gamePaused) {
                    //clearInterval(drawInterval);
                    gamePaused = true;
                } else if (gamePaused) {
                    //setDrawInterval();
                    gamePaused = false;
                }
            }

            document.getElementById('help').addEventListener('click', function() {
                pauseGame();
            }, false);

            document.getElementById('close').addEventListener('click', function() {
                pauseGame();
            }, false);

            document.getElementById('closeTimes').addEventListener('click', function() {
                pauseGame();
            }, false);

            function draw() {
                drawService.draw_canvas(ctx, allTanks, yourPlayerIndex, tank_array, walls, startMatchTime, bomb, allScores, playersInfo.length);
            }

            function check_collision(x, y, array) {
                //This function will check if the provided x/y coordinates exist
                //in an array of cells or not
                for(var ii = 0; ii < array.length; ii++) {
                    if(array[ii].x === x && array[ii].y === y) {
                        return true;
                    }
                }

                for (var i = 0; i < walls.length; i++) {
                    if (walls[i].x === x && walls[i].y === y) {
                        return true;
                    }
                }
                return false;
            }

            function changeDirection() {
                var key = changeDirQueue.shift();
                if (!key) {
                    return;
                }
                if(key === "left" && d !== "right") {
                    d = "left";
                } else if(key === "up" && d !== "down") {
                    d = "up";
                } else if(key === "right" && d !== "left") {
                    d = "right";
                } else if(key === "down" && d !== "up") {
                    d = "down";
                }
            }

            function changeBombPosition(bomb, timer) {
                //console.log('speed: ' + level.bomb_speed);
                if (timer / level.bomb_speed > bombCreatedNum) {
                    create_bomb();
                }
            }

            var changeDirQueue = [];
            function addChangeDir(dir) {
                if (changeDirQueue.length > 0 && changeDirQueue[changeDirQueue.length - 1] === dir) {
                    return;
                }
                changeDirQueue.push(dir);
            }

            //Lets add the keyboard controls now
            document.addEventListener("keydown", function(e){
                var key = e.which;
                var dir = key === 37 ? "left"
                    : key === 38 ? "up"
                    : key === 39 ? "right"
                    : key === 80 ? "paused"
                    : key === 40 ? "down" : null;
                if (dir === "paused") {
                    pauseGame();
                } else if (dir !== null) {
                    addChangeDir(dir);
                }
            }, false);

            var lastX = null, lastY = null;
            function processTouch(e) {
                e.preventDefault(); // prevent scrolling and dispatching mouse events.
                var touchobj = e.targetTouches[0]; // targetTouches includes only touch points in this canvas.
                if (!touchobj) {
                    return;
                }
                if (lastX === null) {
                    lastX = touchobj.pageX;
                    lastY = touchobj.pageY;
                    return;
                }
                var distX = touchobj.pageX - lastX; // get horizontal dist traveled by finger while in contact with surface
                var distY = touchobj.pageY - lastY; // get vertical dist traveled by finger while in contact with surface
                var swipedir = null;
                var absDistX = Math.abs(distX);
                var absDistY = Math.abs(distY);
                if (absDistX >= 20 || absDistY >= 20) {
                    lastX = touchobj.pageX;
                    lastY = touchobj.pageY;
                    if (absDistX > absDistY) {
                        swipedir = distX < 0 ? 'left' : 'right';
                    } else {
                        swipedir = distY < 0 ? 'up' : 'down';
                    }
                    addChangeDir(swipedir);
                }
            }
            canvas.addEventListener('touchstart', function(e) {
                lastX = null;
                lastY = null;
                processTouch(e);
            }, false);
            canvas.addEventListener('touchmove', function(e) {
                processTouch(e);
            }, false);
            canvas.addEventListener('touchend', function(e) {
                processTouch(e);
            }, false);

            return {
                gotStartMatch: gotStartMatch,
                gotMessage: gotMessage,
                gotEndMatch: gotEndMatch
            };
        } // end of createCanvasController

        realTimeService.init({
            createCanvasController: createCanvasController,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
        });


    }]);

;/**
 * File: src/draw.js
 * ------------------------------------
 * @By: Jingxin Zhu
 * @On: 2015.04.13
 * ------------------------------------
 */
angular.module('myApp').constant("config", {
    CANVAS: {
        WIDTH : 300,
        HEIGHT: 300
    },
    CELL: {
        WIDTH : 15,
        HEIGHT: 15
    },
    COUNT_DOWN_TO_START: 1

});;/**
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

;
angular.module('myApp').service('levelsService', [ function() {

    'use strict';

    var levels = [
        {
            level: 1,
            map: [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [1, 1, 1, 1, 1, 1, 1,-1,-1,-1,-1,-1,-1, 1, 1, 1, 1, 1, 1, 1],
                []
            ],
            bomb_speed: 100000
        },
        {
            level: 2,
            map: [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,-1,-1],
                []
            ],
            bomb_speed: 5000
        },
        {
            level: 3,
            map: [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [1,1],
                [-1,-1,-1,1],
                [-1,-1,-1, 1, 1, 1, 1,-1, 1],
                [],
                [-1, 1,-1,-1,-1],
                [-1, 1,-1,-1,-1],
                [],
                [],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,-1,-1],
                []
            ],
            bomb_speed: 3000
        }
    ];

    function getLevel(level) {
        return levels[level];
    }

    return {
        getNumberOfLevels: levels.length,
        getLevel: getLevel
    };

}]);