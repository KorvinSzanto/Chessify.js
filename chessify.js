(function () {
    $.fn.chessify = function (settings) {
        var ob = {};
        ob.canvas = $(this).get(0);
        ob.moving = [];
        ob.turn = 1;
        ob.context = ob.canvas.getContext('2d');
        ob.settings = {
            dimensions: 50,
            colorBlack: "#333333",
            colorWhite: "#cccccc",
            images: {
                black: {
                    pawn: 'images/bpawn.svg',
                    knight: 'images/bknight.svg',
                    bishop: 'images/bbishop.svg',
                    rook: 'images/brook.svg',
                    queen: 'images/bqueen.svg',
                    king: 'images/bking.svg'
                },
                white: {
                    pawn: 'images/wpawn.svg',
                    knight: 'images/wknight.svg',
                    bishop: 'images/wbishop.svg',
                    rook: 'images/wrook.svg',
                    queen: 'images/wqueen.svg',
                    king: 'images/wking.svg'
                }
            },
            player: 1,
            view: 1,
            motionFrames: 10
        };
        if (settings === undefined) {
            settings = {};
        }
        $.each(settings, function (setting, value) {
            ob.settings[setting] = value;
        });
        var coordinates = function() {
            this.list = [];
            this.get = function(x,y) {
                for (i=0;i<this.list.length;i++) {
                    if (this.list[i].is(x,y)) {
                        return this.list[i];
                    }
                }
                return false;
            }
            this.draw = function() {
                for(i=0;i<this.list.length;i++) {
                    this.list[i].draw();
                }
            }
            this.add = function(x,y) {
                this.list[this.list.length] = new coordinate(x,y);
                return this.get(x,y);
            }
            this.within = function(x,y) {
                for (i=0;i<this.list.length;i++) {
                    if (this.list[i].isIn(x,y)) {
                        return this.list[i];
                    }
                }
                return false;
            }
        };
        var pieces = function() {
            this.list = [];
            this.get = function(x,y) {
                for (i=0;i<this.list.length;i++) {
                    if (this.list[i].coords.is(x,y)) {
                        return this.list[i];
                    }
                }
                return false;
            };
            this.draw = function() {
                for(i=0;i<this.list.length;i++) {
                    if (this.list[i].display) {
                        this.list[i].draw();
                    }
                }
            }
            this.add = function(type,x,y,active,color) {
                this.list[this.list.length] = new pieceTypes[type](x,y,active,color);
                return this.get(x,y);
            }
        };
        var move = function(piece,coords,frames) {
            if (typeof frames == 'undefined') var frames = ob.settings.motionFrames;
            this.piece = piece;
            this.xstep = (coords.realX()-piece.realX)/frames;
            this.ystep = (coords.realY()-piece.realY)/frames;
            this.active = true;
            this.destination = coords;
            ob.turn = (!ob.turn);
            this.step = function() {
                if (Math.round(coords.realX()-piece.realX) == 0 &&
                    Math.round(coords.realY() - this.piece.realY) == 0) {
                    this.active = false;
                } else {
                    this.piece.realX+=this.xstep;
                    this.piece.realY+=this.ystep;
                }
            }
        };
        var pieceTypes = {
            pawn : function(x,y, active, color) {
                this.coords = ob.coordinates.get(x,y);
                this.color = (color);
                this.realX = this.coords.realX();
                this.realY = this.coords.realY();
                this.hasMoved = false;
                this.display = true;
                this.type = 'pawn';
                this.colorName = (color ? 'white' : 'black');
                this.image = new Image();
                this.image.onload = this.draw;
                this.enPassant = false;
                this.image.src = ob.settings.images[this.colorName]['pawn'];
                this.active = (active ? active : 1);
                this.move = function (direction, amount, act) {
                    if (!this.color) amount *= -1;
                    var directions = direction.split(' '),
                        x = this.coords.getX(),
                        y = this.coords.getY();
                    for (i=0;i<directions.length;i++) {
                        switch (directions[i]) {
                            case 'up':y+=amount;break;
                            case 'down':y-=amount;break;
                            case 'left':x-=amount;break;
                            case 'right':x+=amount;break;
                            default:break;
                        }
                    }
                    var coordinate = ob.coordinates.get(x,y);
                    if (act === true) {
                        this.doMove(coordinate);
                    }
                    return coordinate;
                };
                this.doMove = function (newCoordinates) {
                    if (newCoordinates.is(this.move('up',2))) {
                        this.enPassant = true;
                    }
                    var y = newCoordinates.getY() + 1;
                    this.coords.piece = false;
                    this.coords = newCoordinates;
                    this.coords.piece = this;
                    this.hasMoved = true;
                    ob.moving[ob.moving.length] = new move(this,newCoordinates);
                    if (!ob.coordinates.get(newCoordinates.getX(),y)) {
                        this.promote('bishop');
                    }
                };
                this.is = function(x,y) {
                    if (x === false) {
                        return x;
                    }
                    if (x instanceof pieceTypes.pawn) {
                        return (this.coords.getX() == x.coords.getX() && this.coords.getY() == x.coords.getY());
                    }
                }
                this.attacks = function () {
                    var canAttack = [];
                    if (this.move('up left',1) instanceof coordinate) {
                        if (this.move('up left',1).piece && this.move('up left',1).piece.color != this.color) {
                            canAttack[canAttack.length] = this.move('up left',1);
                        }
                    }
                    if (this.move('up right',1) instanceof coordinate) {
                        if (this.move('up right',1).piece && this.move('up right',1).piece.color != this.color) {
                            canAttack[canAttack.length] = this.move('up right',1);
                        }
                    }
                    // en passant
                    var coord = this.move('right',1);
                    if (coord instanceof coordinate) {
                        if (coord.piece instanceof pieceTypes.pawn) {
                            if (coord.piece.enPassant) {
                                canAttack[canAttack.length] = this.move('up right',1);
                            }
                        }
                    }
                    coord = this.move('left',1);
                    if (coord instanceof coordinate) {
                        if (coord.piece instanceof pieceTypes.pawn) {
                            if (coord.piece.enPassant) {
                                canAttack[canAttack.length] = this.move('up left',1);
                            }
                        }
                    }
                    return canAttack;
                };
                this.moves = function() {
                    var canMove = [], square;
                    square = this.move('up',1);
                    if (!square.piece) {
                        canMove[0] = square;
                    }
                    if (typeof canMove[0] != 'undefined' && !this.hasMoved) {
                        square = this.move('up',2);
                        if (!square.piece) {
                            canMove[1] = square;
                        }
                    }
                    return canMove;
                };
                this.promote = function(type) {
                    ob.pieces.add(type,this.coords.getX(),this.coords.getY(),1,this.color);
                    this.display = false;
                };
                this.draw = function(reals) {
                    if (typeof reals == 'undefined' && this.active == false) {
                        return;
                    }
                    ob.context.drawImage(
                        this.image,
                        this.realX,
                        this.realY,
                        ob.settings.dimensions,
                        ob.settings.dimensions
                    );
                    if (this.is(ob.mouse.selected) && ob.mouse.hovering) {
                        ob.context.drawImage(
                            this.image,
                            ob.mouse.hovering.realX(),
                            ob.mouse.hovering.realY(),
                            ob.settings.dimensions,
                            ob.settings.dimensions
                        );
                    }
                }
                this.coords.piece = this;
            },
            bishop : function(x,y, active, color) {
                this.coords = ob.coordinates.get(x,y);
                this.color = (color);
                this.realX = this.coords.realX();
                this.realY = this.coords.realY();
                this.hasMoved = false;
                this.display = true;
                this.type = 'bishop';
                this.colorName = (color ? 'white' : 'black');
                this.image = new Image();
                this.image.onload = this.draw;
                this.image.src = ob.settings.images[this.colorName]['bishop'];
                this.active = (active ? active : 1);
                this.move = function (direction, amount, act) {
                    if (!this.color) amount *= -1;
                    var directions = direction.split(' '),
                        x = this.coords.getX(),
                        y = this.coords.getY();
                    for (i=0;i<directions.length;i++) {
                        switch (directions[i]) {
                            case 'up':y+=amount;break;
                            case 'down':y-=amount;break;
                            case 'left':x-=amount;break;
                            case 'right':x+=amount;break;
                            default:break;
                        }
                    }
                    var coordinate = ob.coordinates.get(x,y);
                    if (act === true) {
                        this.doMove(coordinate);
                    }
                    return coordinate;
                };
                this.doMove = function (newCoordinates) {
                    this.coords.piece = false;
                    this.coords = newCoordinates;
                    this.coords.piece = this;
                    this.hasMoved = true;
                    ob.moving[ob.moving.length] = new move(this,newCoordinates);
                };
                this.is = function(x,y) {
                    if (x === false) {
                        return x;
                    }
                    if (x instanceof pieceTypes.bishop) {
                        return (this.coords.getX() == x.coords.getX() && this.coords.getY() == x.coords.getY());
                    }
                };
                this.attacks = function () {
                    var canAttack = [];
                    var ul = 0; ur = 0; dr = 0; dl = 0;
                    while (1) {
                        ul++
                        coord = this.move('up left',ul);
                        if (!coord || coord.piece) {
                            if (coord && coord.piece.color != this.color) {
                                canAttack[canAttack.length] = coord;
                            }
                            break;
                        }
                    }
                    while (1) {
                        ur++;
                        coord = this.move('up right',ur);
                        if (!coord || coord.piece) {
                            if (coord && coord.piece.color != this.color) {
                                canAttack[canAttack.length] = coord;
                            }
                            break;
                        }
                    }
                    while (1) {
                        dr++;
                        coord = this.move('down right',dr);
                        if (!coord || coord.piece) {
                            if (coord.piece && coord.piece.color != this.color) {
                                canAttack[canAttack.length] = coord;
                            }
                            break;
                        }
                    }
                    while (1) {
                        dl++;
                        coord = this.move('down left',dl);
                        if (!coord || coord.piece) {
                            if (coord && coord.piece.color != this.color) {
                                canAttack[canAttack.length] = coord;
                            }
                            break;
                        }
                    }
                    return canAttack;
                };
                this.moves = function() {
                    var canMove = [], coord;
                    var ul = 0; ur = 0; dr = 0; dl = 0;
                    while (1) {
                        ul++
                        coord = this.move('up left',ul);
                        if (!coord || coord.piece) {
                            break;
                        }
                        canMove[canMove.length] = coord;
                    }
                    while (1) {
                        ur++;
                        coord = this.move('up right',ur);
                        if (!coord || coord.piece) {
                            break;
                        }
                        canMove[canMove.length] = coord;
                    }
                    while (1) {
                        dr++;
                        coord = this.move('down right',dr);
                        if (!coord || coord.piece) {
                            break;
                        }
                        canMove[canMove.length] = coord;
                    }
                    while (1) {
                        dl++;
                        coord = this.move('down left',dl);
                        if (!coord || coord.piece) {
                            break;
                        }
                        canMove[canMove.length] = coord;
                    }
                    return canMove;
                };
                this.draw = function(reals) {
                    if (typeof reals == 'undefined' && this.active == false) {
                        return;
                    }
                    ob.context.drawImage(
                        this.image,
                        this.realX,
                        this.realY,
                        ob.settings.dimensions,
                        ob.settings.dimensions
                    );
                    if (this.is(ob.mouse.selected) && ob.mouse.hovering) {
                        ob.context.drawImage(
                            this.image,
                            ob.mouse.hovering.realX(),
                            ob.mouse.hovering.realY(),
                            ob.settings.dimensions,
                            ob.settings.dimensions
                        );
                    }
                }
                this.coords.piece = this;
            }
        };
        var fps = function() {
            this.frameRate = 0
            this.timer = setInterval(function() {
                ob.fps.frameRate = ob.frames;
                ob.frames = 0;
            },1000);
        }
        var coordinate = function(x,y) {
            this.X = x;
            this.Y = y;
            this.piece = false;
            this.highlight = false;
            
            this.isValid = function() {
                return (this.X > 0 && this.Y > 0 && this.x < 9 && this.y < 9);
            }
            this.is = function(x,y) {
                if (x instanceof coordinate) {
                    return (x.getX() == this.X && x.getY() == this.Y);
                }
                return (this.X == x && this.Y == y);
            }
            this.getY = function() {
                return this.Y;
            }
            this.getX = function() {
                return this.X;
            }
            this.getChessX = function() {
                return 'abcdefgh'[this.X];
            }
            this.color = function() {
                return this.X % 2 ? (this.Y % 2 ? 0 : 1) : (this.Y % 2 ? 1 : 0);
            }
            this.realX = function() {
                return (this.X-1) * ob.settings.dimensions;
            }
            this.realY = function() {
                return ob.settings.dimensions * 7 - ((this.Y-1) * ob.settings.dimensions);
            }
            this.isOccupied = function() {
                return this.piece;
            }
            this.draw = function() {
                ob.context.fillStyle = ob.settings['color'+(this.color() ? 'White' : 'Black')];
                ob.context.fillRect(this.realX(), this.realY(), ob.settings.dimensions, ob.settings.dimensions);
                if (this.highlight) {
                    ob.context.fillStyle = this.highlight;
                    ob.context.fillRect(this.realX(), this.realY(), ob.settings.dimensions, ob.settings.dimensions);
                }
            }
            this.isIn = function(x,y) {
                return (x>=this.realX() && y>=this.realY() && x<=this.realX()+ob.settings.dimensions && y<=this.realY()+ob.settings.dimensions);
            }
        }
        var takenQueue = function() {
            this.list = {};
            this.list.white = [];
            this.list.black = [];
            this.add = function(piece) {
                if (!piece) return;
                piece.active = false;
                piece.coords.piece = false;
                this.list[piece.colorName][this.list[piece.colorName].length] = piece;
                this.draw();
            }
            this.draw = function(piece) {
                var division = ob.settings.dimensions * 3.5 / this.list.white.length;
                for (i=0;i<this.list.white.length;i++) {
                    this.list.white[i].realX = ob.settings.dimensions * 8;
                    this.list.white[i].realY = division * i;
                    this.list.white[i].draw(1);
                }
                division = ob.settings.dimensions * 3.5 / this.list.black.length;
                for (i=0;i<this.list.black.length;i++) {
                    this.list.black[i].realX = ob.settings.dimensions * 8;
                    this.list.black[i].realY = ob.settings.dimensions * 7 - division * i;
                    this.list.black[i].draw(1);
                }
            }
        }
        var chessBoard = function() {
            this.draw = function() {
                ob.canvas.width = ob.canvas.width;
                ob.coordinates.draw();
                ob.pieces.draw();
                ob.takenQueue.draw();
            };
            this.setup = function() {
                for (x=1; x < 9; x++) {
                    for (y=1; y < 9; y++) {
                        var square = ob.coordinates.add(x,y);
                    }
                }
                // Pawns
                for(x=1;x<9;x++) {
                    ob.pieces.add('pawn',x,'2',1,1);
                    ob.pieces.add('pawn',x,'7',1,0);
                }
                // Bishops
                ob.pieces.add('bishop',3,8,1,0);
                ob.pieces.add('bishop',6,8,1,0);
                ob.pieces.add('bishop',3,1,1,1);
                ob.pieces.add('bishop',6,1,1,1);
            };
            this.step = function() {
                ob.frames++;
                ob.chessBoard.draw();
                var newlist = [];
                for(i=0;i<ob.moving.length;i++) {
                    ob.moving[i].step();
                    if (ob.moving[i].active) {
                        newlist[newlist.length] = ob.moving[i];
                    }
                }
                ob.moving = newlist;
            }
        }
        ob.fps = new fps();
        ob.coordinates = new coordinates();
        ob.pieces = new pieces();
        ob.takenQueue = new takenQueue();
        ob.chessBoard = new chessBoard();
        ob.chessBoard.setup();
        ob.mouse = {x:0,y:0,hovering:false,selected:false};
        $(ob.canvas).mousemove(function(e){
            for (i=0;i<ob.coordinates.list.length;i++) {
                ob.coordinates.list[i].highlight = false;
            }
            var square = ob.coordinates.within(e.clientX,e.clientY);
            
            ob.mouse.x = e.clientX;
            ob.mouse.y = e.clientY;
            ob.mouse.hovering = square;
            if (ob.mouse.hovering.piece && ob.mouse.hovering.piece.color != ob.turn) {
                return;
            }
            square = ob.coordinates.within(e.clientX,e.clientY);
            if (square.piece || ob.mouse.selected) {
                var attacking = ob.mouse.selected ? ob.mouse.selected.attacks() : square.piece.attacks();
                var moves = ob.mouse.selected ? ob.mouse.selected.moves() : square.piece.moves();
                for (i=0;i<attacking.length;i++) {
                    attacking[i].highlight = 'rgba(255,0,0,.2)';
                }
                for (i=0;i<moves.length;i++) {
                    moves[i].highlight = 'rgba(0,0,255,.2)';
                }
            }
            square.highlight = "rgba(255,0,0,.5)";
        }).click(function(e) {
            for (i=0;i<ob.pieces.list.length;i++) {
                ob.pieces.list[i].selected = false;
            }
            var square = ob.coordinates.within(e.clientX,e.clientY);
            if (square.piece && !ob.mouse.selected) {
                if (ob.mouse.hovering.piece.color != ob.turn) {
                    return;
                }
                ob.mouse.selected = square.piece;
                square.piece.selected = true;
            } else if (ob.mouse.selected) {
                var canMove = ob.mouse.selected.moves();
                var canAttack = ob.mouse.selected.attacks();
                var doMove = false;
                for (i=0;i<canMove.length;i++) {
                    if (canMove[i] && canMove[i].is(ob.mouse.hovering)) {
                        doMove = true;
                    } else {
                        if (canMove[i].is(ob.mouse.selected.coords)) {
                            ob.mouse.selected.selected = false;
                            ob.mouse.selected = false;
                        }
                    }
                }
                for (i=0;i<canAttack.length;i++) {
                    if (canAttack[i].is(ob.mouse.hovering)) {
                        // en passant
                        ob.takenQueue.add(canAttack[i].piece);
                        doMove = true;
                    }
                }
                if (doMove) {
                    for (i=0;i<ob.pieces.list.length;i++) {
                        if (ob.pieces.list[i].color == ob.mouse.selected.color) {
                            ob.pieces.list[i].enPassant = false;
                        }
                    }
                    ob.mouse.selected.doMove(ob.mouse.hovering);
                    ob.mouse.hovering.piece = ob.mouse.selected;
                    ob.mouse.selected.selected = false;
                    ob.mouse.selected = false;
                } else {
                    ob.mouse.selected.selected = false;
                    ob.mouse.selected = false;
                }
            }
        });
        this.frames = setInterval(ob.chessBoard.step, (1000 / 60));
        return ob;
    }
})(jQuery);
$(function(){
    chessBoard = $('canvas').chessify({
        colorWhite: '#cccccc',
        dimensions: 75,
        player: 1
    });
});
