;(function() {
  // Some constants for getting around
  
  var BLOBS = 1000;
  var NORTH =  0;
  var EAST  =  1;
  var SOUTH =  2;
  var WEST =   3;
  var NODIR = -1;
  var ENDOFGEN=-2;

  var UNTROD = 0;

  var OFFSETS = [ { x: 0, y: 1}, 
                  { x: 1, y: 0}, 
                  { x: 0, y: -1}, 
                  { x: -1, y: 0} ];

  var OPPOSITES = [ SOUTH, WEST, NORTH, EAST ];

  var BITS = [ 1, 2, 4, 8 ];

  var TILESIZE = 8;

  var COLOURS = [ '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff' ];
  var LEFTY=-1;
  var RIGHTY=1;
  var MOVING=0;
  var DYING=1;
  var SPAWNING=2;
  var DEAD=3;

  var creating;

  var Maze = function() {
    var screenCanvas = document.getElementById("screen");
    var screen = screenCanvas.getContext('2d');
    var mazeCanvas = document.getElementById("maze");
    var mazeCtx = mazeCanvas.getContext('2d');
    this.screen = screen;
    this.mazeCtx = mazeCtx;
    this.screen.globalAlpha = 1;
    this.canvas_size = { x: screen.canvas.width-1, y: screen.canvas.height-1 };
    this.size = { x: Math.floor(this.canvas_size.x / TILESIZE), y: Math.floor(this.canvas_size.y / TILESIZE) }
    this.created = false;
    this.initialiseBoard();
    this.makeStartPassage();

    var creator = new Creator( this );
    this.creator = creator
    creator.placeRandom();
    creator.moveStack.push(ENDOFGEN);

    var self = this;
    var tick = function() {
      self.plotBlobs();
      requestAnimationFrame(tick);
    };
    this.tick = tick;

  };

  Maze.prototype = {
    go: function() {
      this.blobs = this.createBlobs(BLOBS);
      this.tick();
    },
    createBlobs: function(qty) {
      var blobs = [];
      for (var n=0; n<qty; n++) {
        blobs.push( new Blob(this) );
      }
      blobs[0].colour = '#000000';
      blobs[0].speed = 1;
      this.killer = blobs[0];
      return( blobs );
    },
    plotBlobs: function() {
      for (n=0;n<this.blobs.length;n++) {
        this.blobs[n].erase();
        this.blobs[n].action();
        this.blobs[n].plot();
      }
    },
    create: function() {
      if (!this.created) {
        if (this.creator.tryToMove()==NODIR ) {
          var lastDir = this.creator.moveStack.pop();
          if (lastDir == ENDOFGEN) this.created = true;
          else {
            var newpos = this.creator.move( OPPOSITES[ lastDir ] );
            this.creator.setPosition( newpos.x, newpos.y );
          }
        }
      }
      return( this.created );
    },
    initialiseBoard: function() {
      this.board = new Array( this.size.x );

      for (var x=0; x<this.size.x; x++) {
        this.board[x] = new Array( this.size.y );
        for (var y=0;y<this.size.y; y++) {
          this.board[x][y] = UNTROD;
        }
      }
      this.screen.fillRect(0,0, this.size.x * TILESIZE+1, this.size.y * TILESIZE+1);
      this.screen.clearRect(1,1, this.size.x * TILESIZE-1, this.size.y * TILESIZE-1);
    },
    makeStartPassage: function() {
      this.board[0][0]=BITS[NORTH];
      this.drawTile(0,0);
      this.board[0][this.size.y - 1]=BITS[SOUTH] + BITS[EAST];
      this.drawTile(0,this.size.y-1);
      for (var y=1; y<this.size.y-1; y++) {
        this.board[0][y]=BITS[NORTH]+BITS[SOUTH];
        this.drawTile(0,y);
      }
    },
    drawTile: function(x,y) {
      var tile = this.board[x][y];
      var xpos = x * TILESIZE;
      var ypos = (this.size.y - y -1) * TILESIZE;
      this.mazeCtx.clearRect(xpos+1, ypos, TILESIZE-1, TILESIZE);
      this.mazeCtx.clearRect(xpos, ypos+1, TILESIZE, TILESIZE-1);
      this.drawWall( xpos, ypos, TILESIZE, 1, tile & BITS[NORTH] );
      this.drawWall( xpos + TILESIZE, ypos, 1, TILESIZE, tile & BITS[EAST] );
      this.drawWall( xpos + TILESIZE, ypos + TILESIZE, -TILESIZE, 1, tile & BITS[SOUTH] );
      this.drawWall( xpos, ypos + TILESIZE, 1, -TILESIZE, tile & BITS[WEST] );
    },
    drawWall: function(fx, fy, tx, ty, pres) {
      this.mazeCtx.beginPath();
      this.mazeCtx.lineWidth = 1;
 //     this.screen.moveTo(fx, fy);
//      this.screen.lineTo(fx+tx,fy+ty);
      if (!pres )
        this.mazeCtx.fillRect(fx,fy, tx, ty);
  //    this.screen.stroke();
    }

  }

  var Blob = function(maze) {
    this.maze = maze;
    this.position = { x:0, y:0 };
    this.spawn();
  }

  Blob.prototype= {
    spawn: function() {
      this.mode = MOVING;
      this.position.x = Math.floor( Math.random() * this.maze.size.x ) * TILESIZE;
      this.position.y = Math.floor( Math.random() * this.maze.size.y ) * TILESIZE;
      this.colour = COLOURS[ Math.floor( Math.random() * COLOURS.length )];
      this.speed = Math.floor( Math.random() * 10 ) + 1;
      this.direction = EAST;
      this.counter = 1;
      if (Math.random()>0.5) this.type = LEFTY;
      else this.type = RIGHTY;
    },
    plot: function() {
      this.maze.screen.fillStyle = this.colour;
      this.maze.screen.fillRect(this.position.x + 1, (this.maze.size.y * TILESIZE) - this.position.y - TILESIZE + 1, TILESIZE-1, TILESIZE-1);
    },
    erase: function() {
      this.maze.screen.clearRect(this.position.x + 1, (this.maze.size.y * TILESIZE) - this.position.y - TILESIZE + 1, TILESIZE-1, TILESIZE-1);
    },
    action: function() {
      if (this.mode == MOVING) {
        var killer = this.maze.killer;
        if ( killer == this || this.position.x + TILESIZE -1  < killer.position.x || this.position.x > killer.position.x + TILESIZE -1  
          || this.position.y + TILESIZE -1  < killer.position.y || this.position.y > killer.position.y + TILESIZE -1  ) {
          if (!this.timeToMove() ) return;
          if (this.atJunction()) {
            var board = this.getBoardCoords( this.position.x, this.position.y );
            if (!this.shouldTurn( board.x, board.y )) this.direction = this.aboutTurn( board.x, board.y, this.direction, this.type);
          }
          this.move();
        } else {
          this.mode = DEAD;
        }
      }
    },
    move: function() {
      this.position.x += OFFSETS[this.direction].x;
      this.position.y += OFFSETS[this.direction].y;
    },
    aboutTurn: function( x, y, dir, type) {
      while ( (this.maze.board[x][y] & BITS[dir]) == 0) {
        dir = this.rotate(dir, -type);
      }
      return(dir);
    },
    getBoardCoords: function( x, y)  {
      var nx = Math.floor( x / TILESIZE );
      var ny = Math.floor( y / TILESIZE );
      return( { x: nx, y: ny } );
    },
    shouldTurn: function( x, y) {
      var newdir = this.rotate(this.direction, this.type);
      if ( ( this.maze.board[x][y] & BITS[newdir]) != 0) {
            this.direction = newdir;
            return(true);
      } else return(false);
    },
    atJunction: function() {
        return(this.position.x % TILESIZE + this.position.y % TILESIZE == 0 );
    },
    timeToMove: function() {
      this.counter--;
      if (this.counter--) {
        this.counter = this.speed;
        return(true);
      }
      return(false);
    },
    rotate: function(d, a) {
      d = d + a;
      if (d==-1) return(3);
      if (d==4) return(0);
      return(d);
    }

  }

  var Creator = function(maze) {
    this.position = { x: 0, y: 0 };
    this.maze = maze;
    this.board = maze.board;
    this.pathSelector = new PathSelector;
    this.pathSelector.randomise();
    this.moveStack = new Array;
  }

  Creator.prototype = {
    placeRandom: function() {
      do {
        this.position.x = Math.floor( Math.random() * this.maze.size.x );
        this.position.y = Math.floor( Math.random() * this.maze.size.y );
      } while (this.board[this.position.x][this.position.y] != UNTROD);
    },

    logPosition: function() {
      console.log( "x: " + this.position.x + " y: " + this.position.y + " Dirs: " + this.pathSelector.directions );
    },

    tryToMove: function() {
      this.pathSelector.reset();
      do {
        var dir = this.pathSelector.getDirection();
        if (dir==NODIR) break;

        var newPosition = this.move( dir );
        if ( this.inBounds(newPosition.x, newPosition.y) && this.board[newPosition.x][newPosition.y] == UNTROD ) {
          this.moveStack.push(dir);
          this.walk(dir, newPosition);
          break;
        }
      } while (dir != NODIR );
      return( dir );
    },
    move: function(direction) {
      var x = this.position.x + OFFSETS[direction].x;
      var y = this.position.y + OFFSETS[direction].y;
      return( { x: x, y: y } );
    },
    inBounds: function(x, y) {
      return(x>=0 && x<this.maze.size.x && y>=0 && y<this.maze.size.y);
    },
    setPosition: function(x,y) {
      this.position.x = x;
      this.position.y = y;
    },
    walk: function( dir, to ) {
      this.carveFrom( dir );
      this.setPosition( to.x, to.y);
      this.carveTo( dir );
    },
    carveFrom: function(dir) {
      this.board[this.position.x][this.position.y] |= BITS[dir];
      this.maze.drawTile(this.position.x, this.position.y);
    },
    carveTo: function(dir) {
      this.board[this.position.x][this.position.y] |= BITS[OPPOSITES[dir]];
      this.maze.drawTile(this.position.x, this.position.y);
    }
  };

  var PathSelector = function() {
    this.directions = [ NORTH, EAST, SOUTH, WEST ];
    this.tries = 0;
  };

  PathSelector.prototype = {
    reset: function() {
      this.tries = 0;
      this.randomise();
    },

    randomise: function() {
      var tmp, swap;
      for(var n=0; n<=3; n++) {
        tmp = this.directions[n];
        swap = Math.floor( Math.random() * 4);
        this.directions[n] = this.directions[ swap ];
        this.directions[swap] = tmp;
      }
    },

    getDirection: function() {
      if (this.tries == 4) return( NODIR );
      return( this.directions[ this.tries++ ]);
    },

  };

  window.addEventListener('load', function() {
    maze = new Maze();
    creating = setInterval(function() {
      for (var n=0;n<10;n++) {
        if (maze.create()) {
          clearInterval(creating);
          maze.go();
          break;
        }
      };
    }, 1);

  });
})();
