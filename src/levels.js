
angular.module('myApp').service('levelsService', ['$window', '$log', function($window, $log) {

    'use strict';

    function test() {
        $window.alert("test");
    }

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
                [-1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                []
            ]
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
            ]
        }
    ];


    function getLevel(level) {
        return levels[level];
    }

    return {
        test: test,
        getLevel: getLevel
    }

}]);