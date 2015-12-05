'use strict';
var util = require('./../common/util.js');
var geometry = require('./../common/geometry.js');
var Pathfinder = require('./../actors/pathfinder.js');
var Slab = require('./slab.js');
var Tile = require('./tile.js');
var TileSheet = require('./sheet2.js');

module.exports = World;

var Canvas = require('./../common/bettercanvas.js');
var testCanvas = new Canvas(200,100);
//document.body.appendChild(testCanvas.canvas);

function World(game,worldSize) {
    this.game = game;
    this.game.world = this;
    this.worldSize = Math.max(24,Math.floor(worldSize/2)*2); // Must be an even number >= 24
    //this.worldSize = Math.max(12,Math.floor(worldSize/2)*2); // Must be an even number >= 24
    this.worldRadius = Math.floor(this.worldSize/2);
    this.objects = {};
    this.map = {}; // Grid-based map to hold world tiles
    this.walkable = {}; // Grid-based map to hold walkable surfaces
    
    geometry.generateClosestGrids(this.worldSize);
    
    testCanvas.clear();
    
    var noiseBig = geometry.buildNoiseMap(this.worldRadius/3 + 1, this.worldRadius/3 + 1);
    var noiseSmall = geometry.buildNoiseMap(this.worldRadius/1.5 + 1,this.worldRadius/1.5 + 1);
    var bigBlur = (noiseBig.length - 1) / this.worldSize;
    var smallBlur = (noiseSmall.length - 1) / this.worldSize;
    this.mapBounds = { xl: 0, yl: 0, xh: 0, yh: 0 }; // TODO: Center canvas using this
    for(var tx = 0; tx < this.worldSize; tx++) for(var ty = 0; ty < this.worldSize; ty++) {
        var bigNoiseValue = geometry.getNoiseMapPoint(noiseBig, tx * bigBlur, ty * bigBlur);
        var smallNoiseValue = geometry.getNoiseMapPoint(noiseSmall, tx * smallBlur, ty * smallBlur);
        var noiseValue = (bigNoiseValue + smallNoiseValue*2) / 3;
        //var color = 'rgba(255,255,255,'+noiseValue+')'; // Draw debug noise map
        //testCanvas.fillRect(color, tx, ty, 1, 1);
        var grid;
        var x = (tx-this.worldRadius), y = (ty-this.worldRadius);
        var farness = (this.worldRadius - (Math.abs(x)+Math.abs(y))/2)/this.worldRadius;
        if(noiseValue/1.1 < farness) {
            this.mapBounds.xl = x < this.mapBounds.xl ? x : this.mapBounds.xl;
            this.mapBounds.yl = y < this.mapBounds.yl ? y : this.mapBounds.yl;
            this.mapBounds.xh = x > this.mapBounds.xh ? x : this.mapBounds.xh;
            this.mapBounds.yh = y > this.mapBounds.yh ? y : this.mapBounds.yh;
            var height = Math.round(noiseValue * (1/farness) * 6);
            grid = new Slab('grass', x, y, height/2);
            grid.grid = x+':'+y;
            this.map[x+':'+y] = grid;
            grid.addToGame(game);
        }
    }
    this.staticMap = [];
    this.crawlMap(); // Examine map to determine islands, border tiles, fix elevation, etc
    this.marchSquares(); // Examine neighbors to determine march bits
    
    var lowestScreenX = 0, lowestScreenY = 0, highestScreenX = 0, highestScreenY = 0;
    for(var i = 0; i < this.staticMap.length; i++) {
        var preTile = this.staticMap[i];
        if(!preTile.exists) { this.staticMap.splice(i,1); i--; continue; }
        var preSprite = preTile.getSprite();
        var preScreen = { x: preTile.screen.x, y: preTile.screen.y };
        preScreen.x += preSprite.metrics.ox || 0;
        preScreen.y += preSprite.metrics.oy || 0;
        lowestScreenX = lowestScreenX < preScreen.x ? lowestScreenX : preScreen.x;
        lowestScreenY = lowestScreenY < preScreen.y ? lowestScreenY : preScreen.y;
        highestScreenX = highestScreenX > preScreen.x ? highestScreenX : preScreen.x;
        highestScreenY = highestScreenY > preScreen.y ? highestScreenY : preScreen.y;
    }
    var bgCanvas = new Canvas(
        (highestScreenX - lowestScreenX) + 32 + 1,
        (highestScreenY - lowestScreenY) + 32 + 9
    );
    for(var j = 0; j < this.staticMap.length; j++) {
        var tile = this.staticMap[j];
        this.game.renderer.removeFromZBuffer(tile, tile.zDepth);
        var sprite = tile.getSprite();
        var screen = { x: tile.screen.x, y: tile.screen.y };
        screen.x += sprite.metrics.ox || 0;
        screen.y += sprite.metrics.oy || 0;
        screen.x -= lowestScreenX;
        screen.y -= lowestScreenY;
        //bgCanvas.drawImage(
        //    this.game.renderer.images[sprite.image], sprite.metrics.x, sprite.metrics.y,
        //    sprite.metrics.w, sprite.metrics.h,
        //    Math.round(screen.x), Math.round(screen.y), sprite.metrics.w, sprite.metrics.h
        //);
    }
    //bgCanvas.context.globalCompositeOperation = 'color';
    //bgCanvas.fill('#321118');
    this.game.renderer.bgCanvas = {
        x: lowestScreenX, y: lowestScreenY,
        image: bgCanvas.canvas
    };
    Pathfinder.loadMap(this.walkable);
    //for(var wx = this.mapBounds.xl; wx < this.mapBounds.xh + 1; wx++) {
    //    var row = '';
    //    for(var wy = this.mapBounds.yh; wy >= this.mapBounds.yl; wy--) {
    //        row += !this.walkable[wx+':'+wy] ? '   ' 
    //            : this.walkable[wx+':'+wy] < 1.5 ? ' . ' 
    //            : this.walkable[wx+':'+wy] < 2 ? ' : '
    //            : this.walkable[wx+':'+wy] < 2.5 ? ' + ' : ' # ';
    //    }
    //    console.log(row);
    //}
    console.log('Created world with',Object.keys(this.map).length,'tiles');
    // TODO: Retry if tile count is too high/low
}

World.prototype.crawlMap = function() {
    this.islands = [];
    var crawled = {};
    var thisIsland = 0;
    for(var x = this.mapBounds.xl; x <= this.mapBounds.xh; x++) {
        for(var y = this.mapBounds.yl; y <= this.mapBounds.yh; y++) {
            var currentTile = this.map[x+':'+y]; if(!currentTile) continue;
            // First ensure this tile is equal or lower than the neighbors behind it
            var lowestZ = 100;
            var nw = [this.map[x+':'+(y-1)],this.map[(x-1)+':'+y]];
            var goBack = false;
            for(var n = 0; n < nw.length; n++) { if(!nw[n]) continue;
                var allowance = Math.random() > 0.8 ? 0.5 : 0; // Chance of allowing a higher tile
                lowestZ = nw[n].position.z + allowance < lowestZ ?
                    nw[n].position.z + allowance : lowestZ;
            }
            var zDelta = lowestZ - currentTile.position.z;
            if(zDelta < 0) currentTile.move(0, 0, zDelta);
            // Check if the neighbors behind are too high
            for(var n2 = 0; n2 < nw.length; n2++) { if(!nw[n2]) continue;
                if(nw[n2].position.z > currentTile.position.z + 0.5) {
                    zDelta = currentTile.position.z + 0.5 - nw[n2].position.z;
                    nw[n2].move(0, 0, zDelta);
                    goBack = { x: +(nw[n2].grid.split(':')[0]), y: +(nw[n2].grid.split(':')[1]) };
                }
            }
            // If we adjusted a previous tile's height, we need to go back to it
            if(goBack) { x = goBack.x; y = goBack.y - 1; continue; }
            if(crawled[currentTile.grid]) continue; // Skip already-crawled tiles
            var neighborsToCrawl = [];
            while(true) { // Keep crawling outward until no neighbors are left
                crawled[currentTile.grid] = currentTile;
                if(this.islands[thisIsland]) this.islands[thisIsland].push(currentTile);
                    else this.islands.push([currentTile]);
                var currentNeighbors = geometry.getNeighbors(currentTile.grid);
                currentNeighbors = geometry.getNeighbors(currentTile.grid);
                for(nKey in currentNeighbors) { if (!currentNeighbors.hasOwnProperty(nKey)) continue;
                    var neighbor = this.map[currentNeighbors[nKey]];
                    if(!neighbor) { currentTile.border = true; continue; }
                    if(!crawled[neighbor.grid]) neighborsToCrawl.push(neighbor);
                }
                //var color = currentTile.border ? 'white' : // Draw debug map
                //    ['red','blue','green','yellow','orange','purple','teal'][thisIsland];
                //testCanvas.fillRect(color, +currentTile.grid.split(':')[0]*2+this.worldSize*3+2,
                //    +currentTile.grid.split(':')[1]*2+this.worldSize+2, 2, 2);
                if(neighborsToCrawl.length > 0) {
                    currentTile = neighborsToCrawl.pop();
                } else { thisIsland++; break; } // No more neighbors, this island is done
            }
        }
    }
    
    this.mainIsland = 0;
    for(var i = 1; i < this.islands.length; i++) {
        this.mainIsland = this.islands[i].length > this.islands[this.mainIsland].length ? 
            i : this.mainIsland;
    }
    for(var i2 = 0; i2 < this.islands.length; i2++) { if(i2 == this.mainIsland) continue;
        for(var it = 0; it < this.islands[i2].length; it++) {
            delete this.map[this.islands[i2][it].grid];
            this.islands[i2][it].remove();
        }
    }
    // Iterate over finalized map
    for(var gKey in this.map) { if(!this.map.hasOwnProperty(gKey)) continue;
        var finalTile = this.map[gKey];
        
        // Set tile style based on neighbors
        if(finalTile.border) finalTile.setStyle('grass');
        var finalNeighbors = geometry.get8Neighbors(finalTile.grid);
        for(var nKey in finalNeighbors) { if (!finalNeighbors.hasOwnProperty(nKey)) continue;
            if(!this.map[finalNeighbors[nKey]]
                || this.map[finalNeighbors[nKey]].position.z < finalTile.position.z) {
                finalTile.setStyle('plain');
                break;
            }
        }
        if(finalTile.border) finalTile.setStyle('plain');
        
        // Determine if this tile can be put into the static map image
        finalTile.static = true;
        x = finalTile.position.x; y = finalTile.position.y;
        var nwTiles = [this.map[x+':'+(y-1)],this.map[(x-1)+':'+y],this.map[(x-1)+':'+(y-1)]];
        for(var s = 0; s < nwTiles.length; s++) { if(!nwTiles[s]) { finalTile.static = false; continue; }
            if(nwTiles[s].position.z < finalTile.position.z
                || nwTiles[s].border 
                || (nwTiles[s].style == 'plain' && finalTile.style == 'grass')) {
                finalTile.static = false;
            }
        }
        var staticMapIndex = this.staticMap.indexOf(finalTile);
        if(finalTile.static) {
            if(staticMapIndex < 0) this.staticMap.push(finalTile);
        } else if(staticMapIndex >= 0) {
            this.staticMap.splice(staticMapIndex,1);
        }
    }
};

World.prototype.marchSquares = function() {
    
    // Bitwise doesn't seem like the best solution since not all possible tile combinations will exist
    
    // Possible tile types:
    //   Grass          G
    //   Slab           S
    //   LowerGrass     LG
    //   LowerSlab      LS
    //   Empty          E
    
    // Tile code constructed as NW-NE-SE-SW (eg. "S-LS-LS-LG")

    this.tileMap = {};
    var self = this;
    
    function tileType(grid) { return self.map[grid].style[0].replace(/p/,'s').toUpperCase(); }
    
    function getTileCode(oGrid, nGrid) {
        if(oGrid == nGrid) return tileType(oGrid);
        var neighbor = self.map[nGrid];
        if(!neighbor) return 'E';
        var originZ = self.map[oGrid].position.z;
        if(neighbor.position.z == originZ) return tileType(nGrid);
        if(neighbor.position.z > originZ) return 'S';
        return 'E';
    }
    
    function generateTile(oGrid, nGrids, position, grid, game) {
        var minZDepth = 9999, maxZDepth = -9999;
        var tileCode = getTileCode(oGrid,nGrids[0])+'-'+getTileCode(oGrid,nGrids[1])
            +'-'+getTileCode(oGrid,nGrids[2])+'-'+getTileCode(oGrid,nGrids[3]);
        for(var i = 0; i < nGrids.length; i++) {
            var nGrid = self.map[nGrids[i]];
            if(nGrid && nGrid.position.z >= position.z) {
                minZDepth = Math.min(minZDepth, nGrid.zDepth);
                maxZDepth = Math.max(maxZDepth, nGrid.zDepth);
            }
        }
        var tileZDepth = minZDepth;
        var tileSprite = (new TileSheet('tile')).map[tileCode];
        //tileSprite = tileSprite;
        if(tileSprite.length == 2) tileZDepth = [minZDepth,maxZDepth];
        return {
            tileCode: tileCode, position: position, grid: grid, game: game, zDepth: tileZDepth
        };
    }
    
    for(var key in this.map) { if(!this.map.hasOwnProperty(key)) continue;
        var x = +key.split(':')[0], y = +key.split(':')[1], z = this.map[key].position.z;
        var posNW = { x: x-0.5, y: y-0.5, z: z}, posNE = { x: x+0.5, y: y-0.5, z: z},
            posSE = { x: x+0.5, y: y+0.5, z: z}, posSW = { x: x-0.5, y: y+0.5, z: z};
        var tileNW = z+':'+posNW.x+':'+posNW.y, tileNE = z+':'+posNE.x+':'+posNE.y,
            tileSE = z+':'+posSE.x+':'+posSE.y, tileSW = z+':'+posSW.x+':'+posSW.y;
        var neighbors = geometry.get8Neighbors(key);
        if(!this.tileMap[tileNW]) this.tileMap[tileNW] = new Tile(generateTile(
            key, [neighbors.nw, neighbors.n, key, neighbors.w], posNW, tileNW, this.game
        ));
        if(!this.tileMap[tileNE]) this.tileMap[tileNE] = new Tile(generateTile(
            key, [neighbors.n, neighbors.ne, neighbors.e, key], posNE, tileNE, this.game
        ));
        if(!this.tileMap[tileSE]) this.tileMap[tileSE] = new Tile(generateTile(
            key, [key, neighbors.e, neighbors.se, neighbors.s], posSE, tileSE, this.game
        ));
        if(!this.tileMap[tileSW]) this.tileMap[tileSW] = new Tile(generateTile(
            key, [neighbors.w, key, neighbors.s, neighbors.sw], posSW, tileSW, this.game
        ));
    }
    
    //console.log(this.tileMap);
    
    for(var key in this.map) { if(!this.map.hasOwnProperty(key)) continue;
        var neighbors = geometry.getNeighbors(key);
        var wt = this.map[neighbors.w], nt = this.map[neighbors.n],
            et = this.map[neighbors.e], st = this.map[neighbors.s],
            w = 0, n = 0, e = 0, s = 0;
        w = 0;
        n = 0;
        
        if(this.map[key].style == 'grass') {
            if(wt) {
                if(wt.style != 'grass') w = 1;
            }
            if(nt) {
                if(nt.style != 'grass') n = 1;
            }
        }
        if(et) {
            if(this.map[key].position.z == et.position.z + 0.5) e = 1;
            else if(this.map[key].position.z != et.position.z
                && this.map[key].position.z != et.position.z - 0.5) e = 2;
        } else {
            e = 2;
        }
        if(st) {
            if(this.map[key].position.z == st.position.z + 0.5) s = 1;
            else if(this.map[key].position.z != st.position.z
                && this.map[key].position.z != st.position.z - 0.5) s = 2;
        } else {
            s = 2;
        }
        this.map[key].march = w | (n << 2) | (e << 4) | (s << 6);
    }
};

World.prototype.addToWorld = function(obj) {
    if(this.objects[obj.position.x]) {
        if(this.objects[obj.position.x][obj.position.y]) {
            if(this.objects[obj.position.x][obj.position.y][obj.position.z]) {
                console.error('occupado!',obj.position.x,obj.position.y,obj.position.z,
                    obj,this.objects[obj.position.x][obj.position.y][obj.position.z]);
                return false;
            }
        } else {
            this.objects[obj.position.x][obj.position.y] = {}
        }
    } else {
        this.objects[obj.position.x] = {};
        this.objects[obj.position.x][obj.position.y] = {}
    }
    this.objects[obj.position.x][obj.position.y][obj.position.z] = obj;
    this.updateWalkable(obj.position.x, obj.position.y, this.objects[obj.position.x][obj.position.y]);
};

World.prototype.removeFromWorld = function(obj) {
    delete this.objects[obj.position.x][obj.position.y][obj.position.z];
    this.updateWalkable(obj.position.x, obj.position.y, this.objects[obj.position.x][obj.position.y]);
};

World.prototype.moveObject = function(obj,x,y,z) {
    this.removeFromWorld(obj);
    obj.position.x = x; obj.position.y = y; obj.position.z = z;
    this.addToWorld(obj)
};

World.prototype.updateWalkable = function(x, y, objects) {
    if(!objects || Object.keys(objects).length == 0) {
        delete this.walkable[x+':'+y];
        return;
    }
    var zKeys = Object.keys(objects).sort(function(a, b) { return a - b; });
    var topObject = objects[zKeys[zKeys.length-1]];
    if(topObject.unWalkable) delete this.walkable[x+':'+y];
    else this.walkable[x+':'+y] = topObject.position.z + topObject.height;
};

World.prototype.randomEmptyGrid = function() {
    var safety = 0;
    do {
        var grid = this.map[util.pickInObject(this.map)];
        var unoccupied = !this.objectAtXYZ(grid.position.x,grid.position.y,grid.position.z+grid.height);
        safety++;
    }
    while(safety < 1000 && !unoccupied);
    return grid;
};

World.prototype.objectAtXYZ = function(x,y,z) {
    if(!this.objects[x]) return false;
    if(!this.objects[x][y]) return false;
    return this.objects[x][y][z];
};

World.prototype.objectUnderXYZ = function(x,y,z) {
    if(!this.objects[x]) return false;
    if(!this.objects[x][y]) return false;
    var highest = -1000;
    for(var zKey in this.objects[x][y]) { if(!this.objects[x][y].hasOwnProperty(zKey)) continue;
        if(+zKey > z) continue;
        highest = +zKey > highest ? +zKey : highest;
    }
    return this.objects[x][y][highest];
};

World.prototype.findObject = function(obj) { // For debugging
    for(var xKey in this.objects) { if (!this.objects.hasOwnProperty(xKey)) continue;
        var xObjects = this.objects[xKey];
        for(var yKey in xObjects) { if (!xObjects.hasOwnProperty(yKey)) continue;
            var yObjects = xObjects[yKey];
            for(var zKey in yObjects) { if (!yObjects.hasOwnProperty(zKey)) continue;
                if(obj === yObjects[zKey]) return [xKey,yKey,zKey];
            }
        }
    }
};