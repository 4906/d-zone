'use strict';

var map = {
    actor: {
        online: {
            north: { x: 28, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            south: { x: 0, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            east: { x: 14, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            west: { x: 28, y: 0, w: 14, h: 14, ox: -7, oy: 5 }
        },
        idle: {
            north: { x: 56, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            south: { x: 42, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            east: { x: 56, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            west: { x: 42, y: 0, w: 14, h: 14, ox: -7, oy: 5 }
        },
        offline: {
            north: { x: 84, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            south: { x: 70, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            east: { x: 84, y: 0, w: 14, h: 14, ox: -7, oy: 5 },
            west: { x: 70, y: 0, w: 14, h: 14, ox: -7, oy: 5 }
        },
        hopping: {
            frames: 13,
            zStartFrame: 3,
            heights: [-1,-3,-4,-2,0,4,5,6,4,1,-2,-2,-1],
            north: { x: 0, y: 83, w: 35, h: 27, ox: -9, oy: -6 },
            south: { x: 0, y: 137, w: 35, h: 27, ox: -26, oy: 3 },
            east: { x: 0, y: 56, w: 35, h: 27, ox: -9, oy: 3 },
            west: { x: 0, y: 110, w: 35, h: 27, ox: -26, oy: -6 }
        }
    },
    bubble: {
        empty: { x: 98, y: 0, w: 6, h: 6, ox: -3, oy: 0 },
        actor: { x: 104, y: 0, w: 11, h: 11, ox: -5, oy: -2 }
    }
};

module.exports = Sheet;

function Sheet(spriteName) {
    this.map = JSON.parse(JSON.stringify(map[spriteName]));
}