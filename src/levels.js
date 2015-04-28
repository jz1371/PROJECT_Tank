
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