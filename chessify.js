(function () {
    $.fn.chessify = function (settings) {
        var ob = {};
        ob.canvas = $(this).get(0);
        ob.moving = [];
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
            motionFrames: 50
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
                    this.list[i].draw();
                }
            }
            this.add = function(type,x,y,active,color) {
                this.list[this.list.length] = new pieceTypes[type](x,y,active,color);
                return this.get(x,y);
            }
        };
        var move = function(piece,coords,frames) {
            this.piece = piece;
            this.xstep = (coords.realX()-piece.realX)/frames;
            this.ystep = (coords.realY()-piece.realY)/frames;
            this.active = true;
            this.destination = coords;
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
                this.type = 'pawn';
                this.colorName = (color ? 'white' : 'black');
                this.image = new Image();
                this.image.onload = this.draw;
                this.image.src = ob.settings.images[this.colorName]['pawn'];
                this.active = (active ? active : 1);
                this.move = function (direction, amount, act) {
                    if (!this.color) amount *= -1;
                    var directions = direction.split(' '),
                        x = this.coords.getX(),
                        y = this.coords.getY();
                    for (i=0;i<directions.length;i++) {
                        switch (directions[i]) {
                            case 'up':
                                y+=amount;
                                break;
                            case 'down':
                                y-=amount;
                                break;
                            case 'left':
                                x-=amount;
                                break;
                            case 'right':
                                x+=amount;
                                break;
                            default:
                                break;
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
                    ob.moving[ob.moving.length] = new move(this,newCoordinates,75);
                };
                this.attack = function () {
                    var canAttack = [];
                    if (this.move('up left',1) instanceof coordinate) {
                        canAttack[canAttack.length] = this.move('up left',1);
                    }
                    if (this.move('up right',1) instanceof coordinate) {
                        canAttack[canAttack.length] = this.move('up right',1);
                    }
                    return canAttack;
                };
                this.draw = function() {
                    ob.context.drawImage(
                        this.image,
                        this.realX,
                        this.realY,
                        ob.settings.dimensions,
                        ob.settings.dimensions
                    );

                }
                this.coords.piece = this;
            }
        };
        var coordinate = function(x,y) {
            this.X = x;
            this.Y = y;
            this.piece = false;
            
            this.isValid = function() {
                return (this.X > 0 && this.Y > 0 && this.x < 9 && this.y < 9);
            }
            this.is = function(x,y) {
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
            }
        }
        var chessBoard = function() {
            this.draw = function() {
                ob.coordinates.draw();
                ob.pieces.draw();
            };
            this.setup = function() {
                for (x=1; x < 9; x++) {
                    for (y=1; y < 9; y++) {
                        var square = ob.coordinates.add(x,y);
                    }
                }
                for(x=1;x<9;x++) {
                    ob.pieces.add('pawn',x,'2',1,1);
                    ob.pieces.add('pawn',x,'7',1,0);
                }
            };
            this.step = function() {
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
        ob.coordinates = new coordinates();
        ob.pieces = new pieces();
        ob.chessBoard = new chessBoard();
        ob.chessBoard.setup();
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
