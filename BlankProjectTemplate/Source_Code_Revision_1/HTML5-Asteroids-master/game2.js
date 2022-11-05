/**
 * @file game2.js is the JavaScript file for two players mode functionality
 * @author Tianzheng Mai, Junhong Chen, Linqi Jiang, Eric Thai
 * @see <a href= "http://dougmcinnes.com/2010/05/12/html-5-asteroids"> Original Project </a>
 * @see <a href= "https://github.com/dmcinnes/HTML5-Asteroids"> Source code </a>
 */

/**
 * Specifies the keys that will be used in the game with the key ID numners.
 */
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  70: 'f',
  71: 'g',
  72: 'h',
  77: 'm',
  80: 'p',
  87: 'w',
  65: 'a',
  68: 'd',
  83: 's',
  16: 'shift',
  84: 't'
}
/**
 * Determines which keys are pressed down and which are not pressed down
 */
KEY_STATUS = { keyDown:false };
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 * Fetches input from the keyboard.
 */
$(window).keydown(function (e) {
  KEY_STATUS.keyDown = true;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
}).keyup(function (e) {
  KEY_STATUS.keyDown = false;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});

GRID_SIZE = 60;
/** Descrips the general game matrix
 * @param {Integer} rows The number of rows that the game matrix has
 * @param {Integer} columns The number of columns that the game matrix has
 * @constructor */
Matrix = function (rows, columns) {
  var i, j;
  this.data = new Array(rows);
  for (i = 0; i < rows; i++) {
    this.data[i] = new Array(columns);
  }
  /**
 * Sets up the rotational angle, size, x and y coordinate of the game matrix
 * @param {Float} rot Rotational angle of the matrix
 * @param {Float} scale Size of the matrix
 * @param {Float} transx x coordinate of the matrix
 * @param {Float} transy y coordinate of the matrix
 */
  this.configure = function (rot, scale, transx, transy) {
    var rad = (rot * Math.PI)/180;
    var sin = Math.sin(rad) * scale;
    var cos = Math.cos(rad) * scale;
    this.set(cos, -sin, transx,
             sin,  cos, transy);
  };
  /**
 * Sets up the game matrix 
 */
  this.set = function () {
    var k = 0;
    for (i = 0; i < rows; i++) {
      for (j = 0; j < columns; j++) {
        this.data[i][j] = arguments[k];
        k++;
      }
    }
  }
  /**
 * Duplicates a game matrix
 * @returns Returns a game matrix
 */
  this.multiply = function () {
    var vector = new Array(rows);
    for (i = 0; i < rows; i++) {
      vector[i] = 0;
      for (j = 0; j < columns; j++) {
        vector[i] += this.data[i][j] * arguments[j];
      }
    }
    return vector;
  };
};

/** The general game object which other game objects inherent from
 * @constructor */
Sprite = function () {
  /**
   * Initilizaion of a game object
   * @param {String} name The type of the sprite
   * @param {Integer[]} points The points related the sprite which help draw the shape of the sprite.
   */
  this.init = function (name, points) {
    this.name     = name;
    this.points   = points;
    /**velocity of the sprite*/
    this.vel = {
      x:   0,
      y:   0,
      rot: 0
    };
    /**acceleration of the sprite*/
    this.acc = {
      x:   0,
      y:   0,
      rot: 0
    };
  };

  this.children = {};
  /** Visibility of the sprite
   * @type {boolean} */
  this.visible  = false;
  /** Flag for if the sprite is died.
   * @type {boolean} */
  this.reap = false;
  this.bridgesH = true;
  this.bridgesV = true;
  /**
   * An array that consists of sprites that will collide with this sprite.
   */  
  this.collidesWith = [];
  /** The x coordinate of the object
   * @type {Float} */
  this.x     = 0;
  /** The y coordinate of the object
   * @type {Float} */
  this.y     = 0;
  /** Rotational angle of the object
   * @type {Float} */
  this.rot   = 0;
  /** The size of the object
  * @type {Float} */
  this.scale = 1;

  this.currentNode = null;
  this.nextSprite  = null;

  this.preMove  = null;
  this.postMove = null;
  /**
   * Implements the sprite obejct and show the sprite on the screen each frame.
   * @param {Float} delta Time period of each frame
   */
  this.run = function(delta) {

    this.move(delta);
    this.updateGrid();

    this.context.save();
    this.configureTransform();
    this.draw();

    var canidates = this.findCollisionCanidates();

    this.matrix.configure(this.rot, this.scale, this.x, this.y);
    this.checkCollisionsAgainst(canidates);

    this.context.restore();

    if (this.bridgesH && this.currentNode && this.currentNode.dupe.horizontal) {
      this.x += this.currentNode.dupe.horizontal;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.x -= this.currentNode.dupe.horizontal;
      }
    }
    if (this.bridgesV && this.currentNode && this.currentNode.dupe.vertical) {
      this.y += this.currentNode.dupe.vertical;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.y -= this.currentNode.dupe.vertical;
      }
    }
    if (this.bridgesH && this.bridgesV &&
        this.currentNode &&
        this.currentNode.dupe.vertical &&
        this.currentNode.dupe.horizontal) {
      this.x += this.currentNode.dupe.horizontal;
      this.y += this.currentNode.dupe.vertical;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.x -= this.currentNode.dupe.horizontal;
        this.y -= this.currentNode.dupe.vertical;
      }
    }
  };
  /**
   * Describes the movement of the sprite each frame.
   * @param {Float} delta Time peroid of each frame
   */
  this.move = function (delta) {
    if (!this.visible) return;
    this.transPoints = null; // clear cached points

    if ($.isFunction(this.preMove)) {
      this.preMove(delta);
    }

    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;
    this.rot += this.vel.rot * delta;
    if (this.rot > 360) {
      this.rot -= 360;
    } else if (this.rot < 0) {
      this.rot += 360;
    }

    if ($.isFunction(this.postMove)) {
      this.postMove(delta);
    }
  };
  /**Updates the sprite's position according to the game intergace*/
  this.updateGrid = function () {
    if (!this.visible) return;
    var gridx = Math.floor(this.x / GRID_SIZE);
    var gridy = Math.floor(this.y / GRID_SIZE);
    gridx = (gridx >= this.grid.length) ? 0 : gridx;
    gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
    gridx = (gridx < 0) ? this.grid.length-1 : gridx;
    gridy = (gridy < 0) ? this.grid[0].length-1 : gridy;
    var newNode = this.grid[gridx][gridy];
    if (newNode != this.currentNode) {
      if (this.currentNode) {
        this.currentNode.leave(this);
      }
      newNode.enter(this);
      this.currentNode = newNode;
    }

    if (KEY_STATUS.g && this.currentNode) {
      this.context.lineWidth = 3.0;
      this.context.strokeStyle = 'green';
      this.context.strokeRect(gridx*GRID_SIZE+2, gridy*GRID_SIZE+2, GRID_SIZE-4, GRID_SIZE-4);
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 1.0;
    }
  };
  /**
   * Describes the sprite's transform.
   */
  this.configureTransform = function () {
    if (!this.visible) return;

    var rad = (this.rot * Math.PI)/180;

    this.context.translate(this.x, this.y);
    this.context.rotate(rad);
    this.context.scale(this.scale, this.scale);
  };
  /**
   * Draws the sprite onto the screen
   */
  this.draw = function () {
    if (!this.visible) return;

    this.context.lineWidth = 1.5 / this.scale;//change width from 1.0 to 1.5

    for (child in this.children) {
      this.children[child].draw();
    }
    this.context.strokeStyle='#F0FFFF'
    this.context.beginPath();

    this.context.moveTo(this.points[0], this.points[1]);
    for (var i = 1; i < this.points.length/2; i++) {
      var xi = i*2;
      var yi = xi + 1;
      this.context.lineTo(this.points[xi], this.points[yi]);
    }

    this.context.closePath();
    this.context.stroke();
  };
  /**
   * Finds the sprites which can lead to collisions
   * @returns Array of sprites that will lead to collisions
   */
  this.findCollisionCanidates = function () {
    if (!this.visible || !this.currentNode) return [];
    var cn = this.currentNode;
    var canidates = [];
    if (cn.nextSprite) canidates.push(cn.nextSprite);
    if (cn.north.nextSprite) canidates.push(cn.north.nextSprite);
    if (cn.south.nextSprite) canidates.push(cn.south.nextSprite);
    if (cn.east.nextSprite) canidates.push(cn.east.nextSprite);
    if (cn.west.nextSprite) canidates.push(cn.west.nextSprite);
    if (cn.north.east.nextSprite) canidates.push(cn.north.east.nextSprite);
    if (cn.north.west.nextSprite) canidates.push(cn.north.west.nextSprite);
    if (cn.south.east.nextSprite) canidates.push(cn.south.east.nextSprite);
    if (cn.south.west.nextSprite) canidates.push(cn.south.west.nextSprite);
    return canidates
  };
  /**
   * Check the collision between the sprite with the other sprite
   * @param {Sprite} canidates An array of sprites that may lead to collisions
   */
  this.checkCollisionsAgainst = function (canidates) {
    for (var i = 0; i < canidates.length; i++) {
      var ref = canidates[i];
      do {
        this.checkCollision(ref);
        ref = ref.nextSprite;
      } while (ref)
    }
  };
  /**
   * Calculates the location where the collision occurs.
   * @param {Sprite} other Game objects that may lead to collisions.
   */
  this.checkCollision = function (other) {
    if (!other.visible ||
         this == other ||
         this.collidesWith.indexOf(other.name) == -1) return;
    var trans = other.transformedPoints();
    var px, py;
    var count = trans.length/2;
    for (var i = 0; i < count; i++) {
      px = trans[i*2];
      py = trans[i*2 + 1];
      // mozilla doesn't take into account transforms with isPointInPath >:-P
      if (($.browser.mozilla) ? this.pointInPolygon(px, py) : this.context.isPointInPath(px, py)) {
        other.collision(this);
        this.collision(other);
        return;
      }
    }
  };
    /**
   * Checks whether the location(x, y) is in the path
   * @param {Float} x The x coordinate of the collision
   * @param {Float} y The y coordinnate fo the collision 
   * @returns True if the location(x, y) is in the path, false otherwise
   */
  this.pointInPolygon = function (x, y) {
    var points = this.transformedPoints();
    var j = 2;
    var y0, y1;
    var oddNodes = false;
    for (var i = 0; i < points.length; i += 2) {
      y0 = points[i + 1];
      y1 = points[j + 1];
      if ((y0 < y && y1 >= y) ||
          (y1 < y && y0 >= y)) {
        if (points[i]+(y-y0)/(y1-y0)*(points[j]-points[i]) < x) {
          oddNodes = !oddNodes;
        }
      }
      j += 2
      if (j == points.length) j = 0;
    }
    return oddNodes;
  };
  /**Determines what heppens when a collision occurs.*/
  this.collision = function () {
  };
  /**Describes the behavior of the sprite when it dies.*/
  this.die = function () {
    this.visible = false;
    this.reap = true;
    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }
  };
  /**
   * Get the position where the collision occurs.
   * @returns x and y coordinates where the collision occurs
   */
  this.transformedPoints = function () {
    if (this.transPoints) return this.transPoints;
    var trans = new Array(this.points.length);
    this.matrix.configure(this.rot, this.scale, this.x, this.y);
    for (var i = 0; i < this.points.length/2; i++) {
      var xi = i*2;
      var yi = xi + 1;
      var pts = this.matrix.multiply(this.points[xi], this.points[yi], 1);
      trans[xi] = pts[0];
      trans[yi] = pts[1];
    }
    this.transPoints = trans; // cache translated points
    return trans;
  };
  /**
   * Determines whether the collision is over.
   * @returns True if the collision is over, otherwise returns false
   */
  this.isClear = function () {
    if (this.collidesWith.length == 0) return true;
    var cn = this.currentNode;
    if (cn == null) {
      var gridx = Math.floor(this.x / GRID_SIZE);
      var gridy = Math.floor(this.y / GRID_SIZE);
      gridx = (gridx >= this.grid.length) ? 0 : gridx;
      gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
      cn = this.grid[gridx][gridy];
    }
    return (cn.isEmpty(this.collidesWith) &&
            cn.north.isEmpty(this.collidesWith) &&
            cn.south.isEmpty(this.collidesWith) &&
            cn.east.isEmpty(this.collidesWith) &&
            cn.west.isEmpty(this.collidesWith) &&
            cn.north.east.isEmpty(this.collidesWith) &&
            cn.north.west.isEmpty(this.collidesWith) &&
            cn.south.east.isEmpty(this.collidesWith) &&
            cn.south.west.isEmpty(this.collidesWith));
  };
  /**Describes the behavior of the sprite when it touches the boead*/
  this.wrapPostMove = function () {
    if (this.x > Game.canvasWidth) {
      this.x = 0;
    } else if (this.x < 0) {
      this.x = Game.canvasWidth;
    }
    if (this.y > Game.canvasHeight) {
      this.y = 0;
    } else if (this.y < 0) {
      this.y = Game.canvasHeight;
    }
  };

};

/** Game object that represents the spaceship1.
 * @constructor */
Ship = function () {
  /**
   * Initialization of the shape and name of the spaceship1
   */
  this.init("ship",
  [0, -20, -8, -10, -8, -8, -16, 3, -8, 0, -8, -8, -8, 5, 
    0, 7, 
    8, 5, 8, -8, 8, 0, 16, 3, 8, -8, 8, -10]);
  this.strokeStyle = 'green';
  /**
   * Initialization of the exhaust of spaceship1.
   */
  this.children.exhaust = new Sprite();
  /**
   * Initialization of the shape and name of the exhaust of spaceship1
   */ 
  this.children.exhaust.init("exhaust",
                             [-3,  6,
                               0, 11,
                               3,  6]);
  /** The maximum number of bullets shot from spaceship1 that can be displayed on the screnn at the same time.
   * @type {Integer} */  
  this.bulletCounter = 0;

  this.postMove = this.wrapPostMove;
  /**
   * An array that consists of sprites that will collide with the spaceship1.
   */ 
  this.collidesWith = ["asteroid", "bigalien", "alienbullet"];
  /**
   * Describes the behavior of the spaceship1 every frame and the interactions between the spacehsip1 and the input from keyboard
   * @param {Float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    if (KEY_STATUS.left) {
      this.vel.rot = -6;
    } else if (KEY_STATUS.right) {
      this.vel.rot = 6;
    } else {
      this.vel.rot = 0;
    }

    if (KEY_STATUS.up) {
      var rad = ((this.rot-90) * Math.PI)/180;
      this.acc.x = 0.5 * Math.cos(rad);
      this.acc.y = 0.5 * Math.sin(rad);
      this.children.exhaust.visible = Math.random() > 0.1;
    } else {
      this.acc.x = 0;
      this.acc.y = 0;
      this.children.exhaust.visible = false;
    }

    if (this.bulletCounter > 0) {
      this.bulletCounter -= delta;
    }
    if (KEY_STATUS.space) {
      if (this.bulletCounter <= 0) {
        this.bulletCounter = 10;
        for (var i = 0; i < this.bullets.length; i++) {
          if (!this.bullets[i].visible) {
            SFX.laser();
            var bullet = this.bullets[i];
            var rad = ((this.rot-90) * Math.PI)/180;
            var vectorx = Math.cos(rad);
            var vectory = Math.sin(rad);
            // move to the nose of the ship
            bullet.x = this.x + vectorx * 4;
            bullet.y = this.y + vectory * 4;
            bullet.vel.x = 6 * vectorx + this.vel.x;
            bullet.vel.y = 6 * vectory + this.vel.y;
            bullet.visible = true;
            break;
          }
        }
      }
    }

    // limit the ship's speed
    if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > 8) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }
  };

  /**
   * Describes the behaviour of the spacehsip1 when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the spaceship1.
   */  
  this.collision = function (other) {
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    Game.FSM.state = 'player_died';
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
    Game.lives--;
  };

};
/** Game object that represents the spaceship2.
 * @constructor */
Ship2 = function () {
  /**
   * Initialization of the shape and name of the spaceship2
   */
  this.init("ship2",
  [0, -20, -8, -10, -8, -8, -16, 3, -8, 0, -8, -8, -8, 5, 
    0, 7, 
    8, 5, 8, -8, 8, 0, 16, 3, 8, -8, 8, -10]);

  this.strokeStyle = "red"
  /**
   * Initialization of the exhaust of shapceship2.
   */
  this.children.exhaust = new Sprite();
  /**
   * Initialization of the shape and name of the exhaust of spaceship2
   */
  this.children.exhaust.init("exhaust",
                              [-3,  6,
                                0, 11,
                                3,  6]);
  /** The maximum number of bullets shot from spaceship2 that can be displayed on the screnn at the same time.
   * @type {Integer} */  
  this.bulletCounter = 0;

  this.postMove = this.wrapPostMove;
  /**
   * An array that consists of sprites that will collide with the spaceship2.
   */ 
  this.collidesWith = ["asteroid", "bigalien", "alienbullet"];
  /**
   * Describes the behavior of the spaceship2 every frame and the interactions between the spacehsip2 and the input from keyboard
   * @param {Float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    if (KEY_STATUS.a) {
      this.vel.rot = -6;
    } else if (KEY_STATUS.d) {
      this.vel.rot = 6;
    } else {
      this.vel.rot = 0;
    }

    if (KEY_STATUS.w) {
      var rad = ((this.rot-90) * Math.PI)/180;
      this.acc.x = 0.5 * Math.cos(rad);
      this.acc.y = 0.5 * Math.sin(rad);
      this.children.exhaust.visible = Math.random() > 0.1;
    } else {
      this.acc.x = 0;
      this.acc.y = 0;
      this.children.exhaust.visible = false;
    }

    if (this.bulletCounter > 0) {
      this.bulletCounter -= delta;
    }
    if (KEY_STATUS.shift) {
      if (this.bulletCounter <= 0) {
        this.bulletCounter = 10;
        for (var i = 0; i < this.bullets.length; i++) {
          if (!this.bullets[i].visible) {
            SFX.laser();
            var bullet = this.bullets[i];
            var rad = ((this.rot-90) * Math.PI)/180;
            var vectorx = Math.cos(rad);
            var vectory = Math.sin(rad);
            // move to the nose of the ship
            bullet.x = this.x + vectorx * 4;
            bullet.y = this.y + vectory * 4;
            bullet.vel.x = 6 * vectorx + this.vel.x;
            bullet.vel.y = 6 * vectory + this.vel.y;
            bullet.visible = true;
            break;
          }
        }
      }
    }

    // limit the ship's speed
    if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > 8) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }
  };
  /**
   * Describes the behaviour of the spacehsip2 when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the spaceship2.
   */ 
  this.collision = function (other) {
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    Game.FSM.state = 'player_died2';
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
    Game.lives2--;
  };
}

Ship.prototype = new Sprite();
Ship2.prototype = new Sprite();

/** Game object that represents the alien's spaceship.
 * @constructor */
BigAlien = function () {
    /**
   * Initialization of the shape and name of the alien's spaceship.
   */
  this.init("bigalien",
            [-20,   0,
             -12,  -4,
              12,  -4,
              20,   0,
              12,   4,
             -12,   4,
             -20,   0,
              20,   0]);
  /**
   * Initialization of the top of alien's spaceship.
   */
  this.children.top = new Sprite();
  /**
   * Initialization of the shape and name of the top of the alien's spaceship.
   */
  this.children.top.init("bigalien_top",
                         [-8, -4,
                          -6, -6,
                           6, -6,
                           8, -4]);
   /**
   * Visibility of the top of the alien's spaceship.
   * @type {Boolean}
   */                           
  this.children.top.visible = true;
  /**
   * Initialization of the bottom of alien's spaceship.
   *  @type {Boolean}
   */
  this.children.bottom = new Sprite();
  /**
   * Initialization of the shape and name of the bottom of the alien's spaceship.
   */
  this.children.bottom.init("bigalien_top",
                            [ 8, 4,
                              6, 6,
                             -6, 6,
                             -8, 4]);
  /**
   * Visibility of the bottom of the alien's spaceship
   * @type {Boolean}
   */                             
  this.children.bottom.visible = true;
  /**
   * An array that consists of sprites that will collide with the alien's spaceship.
   */ 
  this.collidesWith = ["asteroid", "ship", "bullet"];

  this.bridgesH = false;

  this.bullets = [];
  this.bulletCounter = 0;
  /**
   * Determines the start position of the alien's spaceship
   */ 
  this.newPosition = function () {
    if (Math.random() < 0.5) {
      this.x = -20;
      this.vel.x = 1.5;
    } else {
      this.x = Game.canvasWidth + 20;
      this.vel.x = -1.5;
    }
    this.y = Math.random() * Game.canvasHeight;
  };
  /**
   * Describes the behaviour of the alien's spaceship when it shoots bullets.
   */
  this.setup = function () {
    this.newPosition();

    for (var i = 0; i < 3; i++) {
      var bull = new AlienBullet();
      this.bullets.push(bull);
      Game.sprites.push(bull);
    }
  };
  /**
   * Describes the movement of the alien's spaceship every frame
   * @param {float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    var cn = this.currentNode;
    if (cn == null) return;

    var topCount = 0;
    if (cn.north.nextSprite) topCount++;
    if (cn.north.east.nextSprite) topCount++;
    if (cn.north.west.nextSprite) topCount++;

    var bottomCount = 0;
    if (cn.south.nextSprite) bottomCount++;
    if (cn.south.east.nextSprite) bottomCount++;
    if (cn.south.west.nextSprite) bottomCount++;

    if (topCount > bottomCount) {
      this.vel.y = 1;
    } else if (topCount < bottomCount) {
      this.vel.y = -1;
    } else if (Math.random() < 0.01) {
      this.vel.y = -this.vel.y;
    }

    this.bulletCounter -= delta;
    if (this.bulletCounter <= 0) {
      this.bulletCounter = 22;
      for (var i = 0; i < this.bullets.length; i++) {
        if (!this.bullets[i].visible) {
          bullet = this.bullets[i];
          var rad = 2 * Math.PI * Math.random();
          var vectorx = Math.cos(rad);
          var vectory = Math.sin(rad);
          bullet.x = this.x;
          bullet.y = this.y;
          bullet.vel.x = 6 * vectorx;
          bullet.vel.y = 6 * vectory;
          bullet.visible = true;
          SFX.laser();
          break;
        }
      }
    }

  };
  /**
   * Describes the behaviour of the alien's spacehsip when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the alien's spacehsip.
   */
  BigAlien.prototype.collision = function (other) {
    if (other.name == "bullet") Game.score += 200;
    if (other.name == "bullet2") Game.score2 += 200;
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    this.visible = false;
    this.newPosition();
  };
  /**
   * Describes the movement of the alien's spaceship every frame when it crosses the border of the game interface.
   */
  this.postMove = function () {
    if (this.y > Game.canvasHeight) {
      this.y = 0;
    } else if (this.y < 0) {
      this.y = Game.canvasHeight;
    }

    if ((this.vel.x > 0 && this.x > Game.canvasWidth + 20) ||
        (this.vel.x < 0 && this.x < -20)) {
      // why did the alien cross the road?
      this.visible = false;
      this.newPosition();
    }
  }
};
BigAlien.prototype = new Sprite();
/** Game object that represents the bullet shot by spaceship1.
 * @constructor */
Bullet = function () {
  /**
  * Initialization of the shape and name of the bullet object shot from shaceship1.
  */
  this.init("bullet", [0, 0]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;
  /**
  * Displays the transform of the bullet object shot from shaceship1.
  */
  this.configureTransform = function () {};
  /**
   * Draws the bullet object shot from shaceship1 onto the screen
   */
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 15;
      this.context.beginPath();
      this.context.strokeStyle='#FF0000';
      this.context.moveTo(this.x-1, this.y-1);
      this.context.lineTo(this.x+1, this.y+1);
      this.context.moveTo(this.x+1, this.y-1);
      this.context.lineTo(this.x-1, this.y+1);
      this.context.stroke();
      this.context.restore();
    }
  };
  /**
   * Describes the movement of the bullet every frame
   * @param {float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > 50) {
      this.visible = false;
      this.time = 0;
    }
  };
  /**
   * Describes the behaviour of the bullet object when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the bullet object.
   */
  this.collision = function (other) {
    this.time = 0;
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
  };
  /**
   * Gets the x and y coordiantes where the collision occurs.
   * @param {Sprite} other Game objects that collides with the bullet. object.
   * @returns An array that consists of x and y coordiantes where the collision occurs
   */
  this.transformedPoints = function (other) {
    return [this.x, this.y];
  };

};
Bullet.prototype = new Sprite();

/** Game object that represents the bullet shot by spaceship2.
 * @constructor */
Bullet2 = function () {
  /**
  * Initialization of the shape and name of the bullet object shot from shaceship2.
  */
  this.init("bullet2", [0, 0]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;
  /**
  * Displays the transform of the bullet object shot from shaceship2.
  */
  this.configureTransform = function () {};
  /**
   * Draws the bullet object shot from shaceship2 onto the screen
   */
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 15;
      this.context.beginPath();
      this.context.strokeStyle='#FF0000';
      this.context.moveTo(this.x-1, this.y-1);
      this.context.lineTo(this.x+1, this.y+1);
      this.context.moveTo(this.x+1, this.y-1);
      this.context.lineTo(this.x-1, this.y+1);
      this.context.stroke();
      this.context.restore();
    }
  };
  /**
   * Describes the movement of the bullet every frame
   * @param {float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > 50) {
      this.visible = false;
      this.time = 0;
    }
  };
  /**
   * Describes the behaviour of the bullet object when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the bullet object.
   */
  this.collision = function (other) {
    this.time = 0;
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
  };
  /**
   * Gets the x and y coordiantes where the collision occurs.
   * @param {Sprite} other Game objects that collides with the bullet. object.
   * @returns An array that consists of x and y coordiantes where the collision occurs
   */
  this.transformedPoints = function (other) {
    return [this.x, this.y];
  };

};
Bullet2.prototype = new Sprite();

/** Game object that represents the alien's bullet.
 * @constructor */
AlienBullet = function () {
  /**
  * Initialization of the name of the alien's bullet.
  */
  this.init("alienbullet");
  /**
   * Draws the alien's bullet object onto the screen
   */
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.strokeStyle='#00FFFF';
      this.context.moveTo(this.x, this.y);
      this.context.lineTo(this.x-this.vel.x, this.y-this.vel.y);
      this.context.stroke();
      this.context.restore();
    }
  };
};
AlienBullet.prototype = new Bullet();

/** 
 * Game object that represents the asteroid object.
 * @constructor */
Asteroid = function () {
  /**
  * Initialization of the shape and name of the asteroid object.
  */
  this.init("asteroid",
            [-10,   0,
              -5,   7,
              -3,   4,
               1,  10,
               5,   4,
              10,   0,
               5,  -6,
               2, -10,
              -4, -10,
              -4,  -5]);

  /**
   * Visibility of the top of the asteroid object.
   * @type {Boolean}
   */ 
  this.visible = true;
    /**
   * Size of the asteroid object.
   * @type {Integer}
   */ 
  this.scale = 6;
  this.postMove = this.wrapPostMove;
  /**
   * An array that consists of sprites that will collide with the asteroid object.
   */ 
  this.collidesWith = ["ship", "bullet", "bullet2", "bigalien", "alienbullet"];
  /**
   * Describes the behaviour of the asteroid object when it collides with other game obejcts.
   * @param {Sprite} other Game objects that can collide with the asteroid object.
   */
  this.collision = function (other) {
    SFX.explosion();
    if (other.name == "bullet") Game.score += 120 / this.scale;
    if (other.name == "bullet2") Game.score2 += 120 / this.scale;
    this.scale /= 3;
    if (this.scale > 0.5) {
      // break into fragments
      for (var i = 0; i < 3; i++) {
        var roid = $.extend(true, {}, this);
        roid.vel.x = Math.random() * 6 - 3;
        roid.vel.y = Math.random() * 6 - 3;
        if (Math.random() > 0.5) {
          roid.points.reverse();
        }
        roid.vel.rot = Math.random() * 2 - 1;
        roid.move(roid.scale * 3); // give them a little push
        Game.sprites.push(roid);
      }
    }
    Game.explosionAt(other.x, other.y);
    this.die();
  };
};
Asteroid.prototype = new Sprite();

/** 
 * Game object that represents the explosion.
 * @constructor */
Explosion = function () {
  this.init("explosion");

  this.bridgesH = false;
  this.bridgesV = false;

  this.lines = [];
  for (var i = 0; i < 5; i++) {
    var rad = 2 * Math.PI * Math.random();
    var x = Math.cos(rad);
    var y = Math.sin(rad);
    this.lines.push([x, y, x*2, y*2]);
  }
  /**
   * Draws the explosion onto the screen
   */
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 1.0 / this.scale;
      this.context.beginPath();
      this.context.strokeStyle='#B22222';
      for (var i = 0; i < 5; i++) {
        var line = this.lines[i];
        this.context.moveTo(line[0], line[1]);
        this.context.lineTo(line[2], line[3]);
      }
      this.context.stroke();
      this.context.restore();
    }
  };
  /**
   * Describes the behavior of the explosion every frame
   * @param {float} delta Time peroid of each frame
   */
  this.preMove = function (delta) {
    if (this.visible) {
      this.scale += delta;
    }
    if (this.scale > 8) {
      this.die();
    }
  };
};
Explosion.prototype = new Sprite();

/** 
 * Game object that represents the grid node that stores the sprites one by one.
 * @constructor */
GridNode = function () {
  this.north = null;
  this.south = null;
  this.east  = null;
  this.west  = null;

  this.nextSprite = null;

  this.dupe = {
    horizontal: null,
    vertical:   null
  };
  /**
   * Adds a sprite into the grid node.
   * @param {Sprite} sprite 
   */
  this.enter = function (sprite) {
    sprite.nextSprite = this.nextSprite;
    this.nextSprite = sprite;
  };
  /**
   * Deletes a sprite from the grid node.
   * @param {Sprite} sprite 
   */
  this.leave = function (sprite) {
    var ref = this;
    while (ref && (ref.nextSprite != sprite)) {
      ref = ref.nextSprite;
    }
    if (ref) {
      ref.nextSprite = sprite.nextSprite;
      sprite.nextSprite = null;
    }
  };
/**
 * Calls each sprites from the grid nodes.
 * @param {Sprite} sprite game object that is called
 * @param {Sprite} callback Gameobject
 */
  this.eachSprite = function(sprite, callback) {
    var ref = this;
    while (ref.nextSprite) {
      ref = ref.nextSprite;
      callback.call(sprite, ref);
    }
  };
  /**
   * Determines whether there is an sprite that can lead to collisions in the grid node.
   * @param {Sprite[]} collidables 
   * @returns False if there is an sprite that can lead to collisions in the grid node, return true otherwise.
   */
  this.isEmpty = function (collidables) {
    var empty = true;
    var ref = this;
    while (ref.nextSprite) {
      ref = ref.nextSprite;
      empty = !ref.visible || collidables.indexOf(ref.name) == -1
      if (!empty) break;
    }
    return empty;
  };
};

// borrowed from typeface-0.14.js
// http://typeface.neocracy.org

/** 
 * The text displayed on the screen.
 * @constructor */
Text = {
  /**
   * Modifys the font of the text 
   * @param {String} ctx The content of the text that needs to be rendered.
   * @param {js file} face The font type of the text.
   * @param {Char} char The spesific word in the text.
   */
  renderGlyph: function (ctx, face, char) {

    var glyph = face.glyphs[char];

    if (glyph.o) {

      var outline;
      if (glyph.cached_outline) {
        outline = glyph.cached_outline;
      } else {
        outline = glyph.o.split(' ');
        glyph.cached_outline = outline;
      }

      var outlineLength = outline.length;
      for (var i = 0; i < outlineLength; ) {

        var action = outline[i++];

        switch(action) {
          case 'm':
            ctx.moveTo(outline[i++], outline[i++]);
            break;
          case 'l':
            ctx.lineTo(outline[i++], outline[i++]);
            break;

          case 'q':
            var cpx = outline[i++];
            var cpy = outline[i++];
            ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
            break;

          case 'b':
            var x = outline[i++];
            var y = outline[i++];
            ctx.bezierCurveTo(outline[i++], outline[i++], outline[i++], outline[i++], x, y);
            break;
        }
      }
    }
    if (glyph.ha) {
      ctx.translate(glyph.ha, 0);
    }
  },

  /**
   * Displays the text on the screen at a spesified position in a spesified size.
   * @param {String} text The content of the text
   * @param {Integer} size The size of the text
   * @param {Float} x The x coordinate of the text
   * @param {Float} y The y coordinate of the text
   */
  renderText: function(text, size, x, y) {
    this.context.save();

    this.context.translate(x, y);

    var pixels = size * 72 / (this.face.resolution * 100);
    this.context.scale(pixels, -1 * pixels);
    this.context.beginPath();
    var chars = text.split('');
    var charsLength = chars.length;
    for (var i = 0; i < charsLength; i++) {
      this.renderGlyph(this.context, this.face, chars[i]);
    }
    this.context.fillStyle = "white";//change the color(defualt:black)
    this.context.fill();

    this.context.restore();
  },

  context: null,
  face: null
};
/**
 * Sound effects used in the game.
 */
SFX = {
  laser:     new Audio('39459__THE_bizniss__laser.wav'),
  explosion: new Audio('51467__smcameron__missile_explosion.wav')
};

// preload audio
for (var sfx in SFX) {
  (function () {
    var audio = SFX[sfx];
    audio.muted = true;
    audio.play();

    SFX[sfx] = function () {
      if (!this.muted) {
        if (audio.duration == 0) {
          // somehow dropped out
          audio.load();
          audio.play();
        } else {
          audio.muted = false;
          audio.currentTime = 0;
        }
      }
      return audio;
    }
  })();
}
// pre-mute audio
SFX.muted = true;
/** 
 * The class represents the entire game.
 * @constructor */
Game = {
  /**
   * Player1's scores in the game
   * @type {Integer}
   */ 
  score: 0,
  /**
   * Player2's scores in the game
   * @type {Integer}
   */ 
  score2: 0,
  /**
   * The maximum number of asteroids displayed on the screen at the same time.
   * @type {Integer}
   */
  totalAsteroids: 5,
  /**
   * The maximum number of lives that spacehsip1 have during the game
   * @type {Integer}
   */ 
  lives: 0,
  /**
   * The maximum number of lives that spacehsip2 have during the game
   * @type {Integer}
   */ 
  lives2: 0,
  /**
   * Winner of the game
   * @type {String}
   */
  winner: " ",

  canvasWidth: 800,
  canvasHeight: 600,

  sprites: [],
  ship: null,
  bigAlien: null,

  nextBigAlienTime: null,

  /**
   * Spawns asteroids on the screen.
   * @param {Integer} count The maximum number of asteroids displayed on the screen at the same time.
   */
  spawnAsteroids: function (count) {
    if (!count) count = this.totalAsteroids;
    for (var i = 0; i < count; i++) {
      var roid = new Asteroid();
      roid.x = Math.random() * this.canvasWidth;
      roid.y = Math.random() * this.canvasHeight;
      while (!roid.isClear()) {
        roid.x = Math.random() * this.canvasWidth;
        roid.y = Math.random() * this.canvasHeight;
      }
      roid.vel.x = Math.random() * 4 - 2;
      roid.vel.y = Math.random() * 4 - 2;
      if (Math.random() > 0.5) {
        roid.points.reverse();
      }
      roid.vel.rot = Math.random() * 2 - 1;
      Game.sprites.push(roid);
    }
  },
  /**
   * Locates the explosion on the screen.
   * @param {Integer} x The x coordinate where the explosion takes place.
   * @param {Integer} y The y coordinate where the explosion takes place.
   */
  explosionAt: function (x, y) {
    var splosion = new Explosion();
    splosion.x = x;
    splosion.y = y;
    splosion.visible = true;
    Game.sprites.push(splosion);
  },
/**
 * Game states
 */
  FSM: {
    /**
     * Game state where the game lauches
     */
    boot: function () {
      Game.spawnAsteroids(5);
      this.state = 'waiting';
    },
    /**
     * Game state where the game waits for player to press space to start to run.
     */
    waiting: function () {
      Text.renderText(window.ipad ? 'Touch Screen to Start' : 'Press Space to Start', 40, Game.canvasWidth/2 - 200, Game.canvasHeight/2+20);
      if (KEY_STATUS.space || window.gameStart) {
        KEY_STATUS.space = false; // hack so we don't shoot right away
        window.gameStart = false;
        this.state = 'start';
      }
    },
    /**
     * Game state where the game starts to run.
     */
    start: function () {
      for (var i = 0; i < Game.sprites.length; i++) {
        if (Game.sprites[i].name == 'asteroid') {
          Game.sprites[i].die();
        } else if (Game.sprites[i].name == 'bullet' ||
                   Game.sprites[i].name == 'bigalien') {
          Game.sprites[i].visible = false;
        }
      }

      Game.score = 0;
      Game.score2 = 0;
      Game.lives = 3;
      Game.lives2 = 3;
      Game.totalAsteroids = 2;
      Game.spawnAsteroids();

      Game.nextBigAlienTime = Date.now() + 30000 + (30000 * Math.random());

      this.state = 'spawn_both_ships';

    },
     /**
     * Game state where the both spaceship1 and spaceship2 are spwaned
     */
    spawn_both_ships: function () {
      Game.ship.x = 50 + (Game.canvasWidth / 2);
      Game.ship.y = Game.canvasHeight / 2;
      Game.ship2.x = (Game.canvasWidth / 2) - 50;
      Game.ship2.y = Game.canvasHeight / 2;
      if (Game.ship.isClear() && Game.ship2.isClear()) {
        Game.ship.rot = 0;
        Game.ship.vel.x = 0;
        Game.ship.vel.y = 0;
        Game.ship.visible = true;
        Game.ship2.rot = 0;
        Game.ship2.vel.x = 0;
        Game.ship2.vel.y = 0;
        Game.ship2.visible = true;
        this.state = 'run';
      }
    },
     /**
     * Game state where the spaceship1 is spwaned
     */
    spawn_ship: function () {
      Game.ship.x = 50 + (Game.canvasWidth / 2);
      Game.ship.y = Game.canvasHeight / 2;
      if (Game.ship.isClear() && Game.lives >= 0) {
        Game.ship.rot = 0;
        Game.ship.vel.x = 0;
        Game.ship.vel.y = 0;
        Game.ship.visible = true;
        this.state = 'run';
      }
    },
     /**
     * Game state where the spaceship2 is spwaned
     */
    spawn_ship2: function () {

      Game.ship2.x = (Game.canvasWidth / 2) - 50;
      Game.ship2.y = Game.canvasHeight / 2;
      if (Game.ship2.isClear() && Game.lives2 >= 0) {
        Game.ship2.rot = 0;
        Game.ship2.vel.x = 0;
        Game.ship2.vel.y = 0;
        Game.ship2.visible = true;
        this.state = 'run';
      }
    },
    /**
     * Game state where the game is running.
     */
    run: function () {
      for (var i = 0; i < Game.sprites.length; i++) {
        if (Game.sprites[i].name == 'asteroid') {
          break;
        }
      }
      if (i == Game.sprites.length) {
        this.state = 'new_level';
      }
      if (!Game.bigAlien.visible &&
          Date.now() > Game.nextBigAlienTime) {
        Game.bigAlien.visible = true;
        Game.nextBigAlienTime = Date.now() + 30000+ (30000 * Math.random());
      }
    },
    /**
     * Game state where the new level starts
     */
    new_level: function () {
      if (this.timer == null) {
        this.timer = Date.now();
      }
      // wait a second before spawning more asteroids
      if (Date.now() - this.timer > 1000) {
        this.timer = null;
        Game.totalAsteroids++;
        if (Game.totalAsteroids > 12) Game.totalAsteroids = 12;
        Game.spawnAsteroids();
        this.state = 'run';
      }
    },
     /**
     * Game state where the health of the spaceship1 is 0
     */
    player_died: function () {
      if (Game.lives == 0 && Game.lives2 == 0) {
        this.state = 'end_game';
      } 
      if (Game.lives > 0) {
        this.state = 'spawn_ship';
      }
    },
     /**
     * Game state where the health of the spaceship2 is 0
     */
    player_died2: function () {
      if (Game.lives == 0 && Game.lives2 == 0) {
        this.state = 'end_game';
      } 
      if (Game.lives2 > 0) {
        this.state = 'spawn_ship2';
      }
    },
    /**
     * Game state where the game ends.
     */
    end_game: function () {
      Game.score > Game.score2 ? Game.winner = 'Player 1' : Game.winner = 'Player 2';
      var final_winner = 'The Winner of the game is '+ Game.winner;
      Text.renderText(final_winner, 30, 370, 250);

      var final_score = 'Game Over ' + 'Player 1 Score is ' + Game.score;
      Text.renderText(final_score, 30, 370, 300);

      var final_score2 = 'Game Over ' + 'Player 2 Score is ' + Game.score2;
      Text.renderText(final_score2, 30, 370, 350);


      if (this.timer == null) {
        this.timer = Date.now();
      }
      // wait 20 seconds then go back to waiting state
      if (Date.now() - this.timer > 10000) {
        this.timer = null;
        this.state = 'waiting';
      }

      window.gameStart = false;
    },
    /**
     * Execution of the game states
     */
    execute: function () {
      this[this.state]();
    },
    state: 'boot'
  }

};


$(function () {
  /**
   * Sets up the convas
   */
  var canvas = $("#canvas");
  Game.canvasWidth  = canvas.width();
  Game.canvasHeight = canvas.height();

  var context = canvas[0].getContext("2d");

  Text.context = context;
  Text.face = vector_battle;

  var gridWidth = Math.round(Game.canvasWidth / GRID_SIZE);
  var gridHeight = Math.round(Game.canvasHeight / GRID_SIZE);
  var grid = new Array(gridWidth);
  for (var i = 0; i < gridWidth; i++) {
    grid[i] = new Array(gridHeight);
    for (var j = 0; j < gridHeight; j++) {
      grid[i][j] = new GridNode();
    }
  }

  /** 
   * set up the positional references
   * */ 
  for (var i = 0; i < gridWidth; i++) {
    for (var j = 0; j < gridHeight; j++) {
      var node   = grid[i][j];
      node.north = grid[i][(j == 0) ? gridHeight-1 : j-1];
      node.south = grid[i][(j == gridHeight-1) ? 0 : j+1];
      node.west  = grid[(i == 0) ? gridWidth-1 : i-1][j];
      node.east  = grid[(i == gridWidth-1) ? 0 : i+1][j];
    }
  }

  /** 
   * set up the border of the game
   * */
  for (var i = 0; i < gridWidth; i++) {
    grid[i][0].dupe.vertical            =  Game.canvasHeight;
    grid[i][gridHeight-1].dupe.vertical = -Game.canvasHeight;
  }

  for (var j = 0; j < gridHeight; j++) {
    grid[0][j].dupe.horizontal           =  Game.canvasWidth;
    grid[gridWidth-1][j].dupe.horizontal = -Game.canvasWidth;
  }
  /**
   * Creates the initial game onjects
   */
  var sprites = [];
  Game.sprites = sprites;

  // so all the sprites can use it
  Sprite.prototype.context = context;
  Sprite.prototype.grid    = grid;
  Sprite.prototype.matrix  = new Matrix(2, 3);
  /**
   * Creates the spaceship object
   */
  var ship = new Ship();
  var ship2 = new Ship2();

  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;
  ship2.x = Game.canvasWidth / 3;
  ship2.y = Game.canvasHeight / 3;
  sprites.push(ship);
  sprites.push(ship2);

  /**
   * Creates the bullet objects
   */
  ship.bullets = [];
  ship2.bullets = [];
  for (var i = 0; i < 10; i++) {
    var bull = new Bullet();
    var bull2 = new Bullet2();
    ship.bullets.push(bull);
    ship2.bullets.push(bull2);

    sprites.push(bull);
    sprites.push(bull2);

  }
  Game.ship = ship;
  Game.ship2 = ship2;
  /**
   * Creates the alien's spaceship object
   */
  var bigAlien = new BigAlien();
  bigAlien.setup();
  sprites.push(bigAlien);
  Game.bigAlien = bigAlien;
  /**
   * Creates the icons that represents the number lives the spaceship1 has.
   */
  var extraDude = new Ship();
  extraDude.scale = 0.6;
  extraDude.visible = true;
  extraDude.preMove = null;
  extraDude.children = [];
  /**
   * Creates the icons that represents the number lives the spaceship2 has.
   */
  var extraDude2 = new Ship();
  extraDude2.scale = 0.6;
  extraDude2.visible = true;
  extraDude2.preMove = null;
  extraDude2.children = [];



  var i, j = 0;

  var paused = false;
  var showFramerate = false;
  var avgFramerate = 0;
  var frameCount = 0;
  var elapsedCounter = 0;

  var lastFrame = Date.now();
  var thisFrame;
  var elapsed;
  var delta;

  var canvasNode = canvas[0];

  // shim layer with setTimeout fallback
  // from here:
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (/* function */ callback, /* DOMElement */ element) {
              window.setTimeout(callback, 1000 / 60);
            };
  })();
/**
 * Main game loop
 */
  var mainLoop = function () {
    context.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);

    Game.FSM.execute();

    if (KEY_STATUS.g) {
      context.beginPath();
      for (var i = 0; i < gridWidth; i++) {
        context.moveTo(i * GRID_SIZE, 0);
        context.lineTo(i * GRID_SIZE, Game.canvasHeight);
      }
      for (var j = 0; j < gridHeight; j++) {
        context.moveTo(0, j * GRID_SIZE);
        context.lineTo(Game.canvasWidth, j * GRID_SIZE);
      }
      context.closePath();
      context.stroke();
    }

    thisFrame = Date.now();
    elapsed = thisFrame - lastFrame;
    lastFrame = thisFrame;
    delta = elapsed / 30;

    for (i = 0; i < sprites.length; i++) {

      sprites[i].run(delta);

      if (sprites[i].reap) {
        sprites[i].reap = false;
        sprites.splice(i, 1);
        i--;
      }
    }

    // score
    var score_text = 'Player One '+Game.score;
    Text.renderText(score_text, 18, Game.canvasWidth -12 * score_text.length, 20);

    var score_text2 = 'Player Two '+Game.score2;
    Text.renderText(score_text2, 18, Game.canvasWidth - 12 * score_text.length, 40);



    // extra dudes
    for (i = 0; i < Game.lives; i++) {
      context.save();
      extraDude.x = Game.canvasWidth - (20 * (i + 1));
      extraDude.y = 55;
      extraDude.configureTransform();
      extraDude.draw();
      context.restore();
    }

    for (i = 0; i < Game.lives2; i++) {
      context.save();
      extraDude2.x = Game.canvasWidth - (20 * (i + 1));
      extraDude2.y = 75;
      extraDude2.configureTransform();
      extraDude2.draw();
      context.restore();
    }
    


    if (showFramerate) {
      Text.renderText(''+avgFramerate, 24, Game.canvasWidth - 38, Game.canvasHeight - 2);
    }

    frameCount++;
    elapsedCounter += elapsed;
    if (elapsedCounter > 1000) {
      elapsedCounter -= 1000;
      avgFramerate = frameCount;
      frameCount = 0;
    }

    if (paused) {
      Text.renderText('PAUSED', 72, Game.canvasWidth/2 - 160, 120);
    } else {
      requestAnimFrame(mainLoop, canvasNode);
    }
  };

  mainLoop();
/**
 * Determines the interaction between game the player.
 */
  $(window).keydown(function (e) {
    switch (KEY_CODES[e.keyCode]) {
      case 'f': // show framerate
        showFramerate = !showFramerate;
        break;
      case 'p': // pause
        paused = !paused;
        if (!paused) {
          // start up again
          lastFrame = Date.now();
          mainLoop();
        }
        break;
      case 'm': // mute
        SFX.muted = !SFX.muted;
        break;
      case 't':
        var url = 'user_manual1.html';
        var myWindow = window.open(url, "", "width=1200,height=600");
        paused = !paused;
    }
  });
});
