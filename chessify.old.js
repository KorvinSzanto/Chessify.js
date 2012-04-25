(function () {
    $.fn.chessify = function (settings) {
        var ob = {};
        var piece = function (type,coords,active) {
            this.type = type;
            this.coords = coords;
            this.active = active;
            this.move = function (dir, amnt, move) {
                piece = this;
                if (typeof piece.coords == 'object') {
                    if (piece.type == 'knight') {
                        return ob.methods.moveKnight(piece,dir,move);
                    }
                    var coords = piece.coords;
                    if (piece.color == 'black') {
                        amnt *= -1;
                        dir.replace('right','~').replace('left','right').replace('~','left');
                    }
                } else {
                    var coords = piece;
                    move = false;
                }
                var out = coords;
                switch (dir) {
                    case 'up':
                        out = [coords[0] + amnt,coords[1]];
                        break;
                    case 'down':
                        out = [coords[0] - amnt,coords[1]];
                        break;
                    case 'right':
                        out = [coords[0],coords[1] + amnt];
                        break;
                    case 'left':
                        out = [coords[0],coords[1] - amnt];
                        break;
                    case 'up left':
                        out = [coords[0] + amnt,coords[1] - amnt];
                        break;
                    case 'up right':
                        out = [coords[0] + amnt,coords[1] + amnt];
                        break;
                    case 'down left':
                        out = [coords[0] - amnt,coords[1] - amnt];
                        break;
                    case 'down right':
                        out = [coords[0] - amnt,coords[1] + amnt];
                        break;
                }
                if (move === true) {
                    ob.methods.movePiece(piece,out);
                }
                return out;
            };
        }
        ob.testPiece = new piece('pawn',[]);
        
        ob.pieces = {
            white: [
                new piece('queen',[4, 1],1),
                new piece('king',[5, 1],1),
                new piece('queen',[5, 5],1),
                new piece('bishop',[6, 1],1),
                new piece('bishop',[3, 1],1),
                new piece('knight',[7, 1],1),
                new piece('knight',[2, 1],1),
                new piece('rook',[8, 1],1),
                new piece('rook',[1, 1],1),
                new piece('pawn',[1, 2],1),
                new piece('pawn',[2, 2],1),
                new piece('pawn',[3, 2],1),
                new piece('pawn',[4, 2],1),
                new piece('pawn',[5, 2],1),
                new piece('pawn',[6, 2],1),
                new piece('pawn',[7, 2],1),
                new piece('pawn',[8, 2],1)
            ],
            black: [
                new piece('queen',[4, 8],1),
                new piece('king',[5, 8],1),
                new piece('bishop',[6, 8],1),
                new piece('bishop',[3, 8],1),
                new piece('knight',[7, 8],1),
                new piece('knight',[2, 8],1),
                new piece('rook',[8, 8],1),
                new piece('rook',[1, 8],1),
                new piece('pawn',[1, 7],1),
                new piece('pawn',[2, 7],1),
                new piece('pawn',[3, 7],1),
                new piece('pawn',[4, 7],1),
                new piece('pawn',[5, 7],1),
                new piece('pawn',[6, 7],1),
                new piece('pawn',[7, 7],1),
                new piece('pawn',[7, 5],1)
            ]
        };
        ob.dangerZone = [];
        ob.positions = {};
        ob.highlights = [
            {
                color: [255,255,255],
                alpha: 0.5,
                coords: [5,5]
            }
        ];
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

        ob.movingPiece = false;
        ob.board = $(this).get(0);
        ob.context = ob.board.getContext('2d');
        ob.methods = {
            init: function () {
                ob.board.width = ob.board.width;
                ob.methods.drawBoard();
                ob.methods.drawPieces();
                ob.methods.drawHighlights();
                if (ob.movingPiece !== false) {
                    ob.methods.pieceMotion();
                }
            },
            squareStart: function (coords) {
                return [
                    (coords[0]-1)*ob.settings.dimensions + 1,
                    Math.abs((coords[1]-1)*ob.settings.dimensions - (ob.settings.view?ob.settings.dimensions*7:0)) + 1
                ]
            },
            drawBoard: function () {
                ob.context.fillStyle = ob.settings.colorBlack;
                ob.context.fillRect(0,0,ob.settings.dimensions * 8+2, ob.settings.dimensions * 8+2);
                for (x = 1; x < 9; x++) {
                    for (y = 1; y < 9; y++) {
                        var white = (!ob.settings.view?'colorWhite':'colorBlack'),
                            black = (ob.settings.view?'colorWhite':'colorBlack'),
                            coords = ob.methods.squareStart([x,y]);

                        ob.context.fillStyle = (x % 2 ? ob.settings[(y % 2 ? white : black)] : ob.settings[(y % 2 ? black : white)]);
                        ob.context.fillRect(coords[0], coords[1], ob.settings.dimensions, ob.settings.dimensions);
                    }
                }
            },
            drawHighlights: function () {
                $.each(ob.highlights, function(id,highlight) {
                    coords = ob.methods.squareStart(highlight.coords);
                    c = highlight.color;
                    ob.context.fillStyle = "rgba("+c[0]+','+c[1]+','+c[2]+','+highlight.alpha+')';
                    ob.context.fillRect(coords[0], coords[1], ob.settings.dimensions, ob.settings.dimensions);
                });
            },
            highlightDanger: function() {
                ob.highlights = [];
                var danger;
                $.each(ob.dangerZone, function(id,coords) {
                    if (ob.methods.isRealCoords(coords)) {
                        danger = {
                            color: [0,255,255],
                            alpha: 0.7,
                            coords: coords
                        };
                        console.log(danger);
                        ob.highlights.push(danger);
                    }
                });
            },
            highlightMoves: function() {
                
            },
            drawPieces: function () {
                ob.positions = {};
                $.each(ob.pieces, function (tid, type) {
                    $.each(type, function (id, piece) {
                        piece.color = tid;
                        if (piece.img === undefined) {
                            piece.img = ob.settings.images[tid][piece.type];
                        }
                        if (piece.active) {
                            if (!piece.image) {
                                piece.image = new Image();
                                piece.image.src = piece.img;
                            }
                            ob.positions[ob.methods.chessCoords(piece.coords)] = [tid,piece];
                            if (!piece.realCoords) {
                                piece.realCoords = ob.methods.realCoords(piece.coords);
                            }
                            ob.context.drawImage(piece.image,piece.realCoords[0],piece.realCoords[1],ob.settings.dimensions,ob.settings.dimensions);
                        }
                    });
                });
                ob.methods.parseDanger();
                ob.methods.parseMoves();
            },
            parseDanger: function () {
                ob.dangerZone = [];
                $.each(ob.pieces, function (color,array) {
                    $.each(array, function (id,piece) {
                        switch (piece.type) {
                            case 'pawn':
                                attackPoints = [
                                    ob.methods.move(piece,'up left',1),
                                    ob.methods.move(piece,'up right',1)
                                ];
                                break;
                            case 'knight':
                                attackPoints = ob.methods.allKnightMoves(piece);
                                break;
                            case 'bishop':
                                attackPoints = ob.methods.allDiagonalMoves(piece);
                                break;
                            case 'rook':
                                attackPoints = ob.methods.allStraightMoves(piece);
                                break;
                            case 'queen':
                                attackPoints = ob.methods.allDiagonalMoves(piece).concat(
                                               ob.methods.allStraightMoves(piece));
                                break;
                            case 'king':
                                attackPoints = [
                                    ob.methods.move(piece,'up',1),
                                    ob.methods.move(piece,'down',1),
                                    ob.methods.move(piece,'left',1),
                                    ob.methods.move(piece,'right',1),
                                    ob.methods.move(piece,'up left',1),
                                    ob.methods.move(piece,'down right',1),
                                    ob.methods.move(piece,'down left',1),
                                    ob.methods.move(piece,'up right',1),
                                ];
                                break;
                            default:
                                alert("what the fuck?");
                                break;
                        }
                        $.each(attackPoints, function(id,coords) {
                            if (ob.methods.isRealCoords(coords)) {
                                ob.dangerZone.push(coords);
                            }
                        });
                    });
                });
            },
            changeView: function () {
                ob.settings.view = (!ob.settings.view);
            },
            parseMoves: function () {
                $.each(ob.pieces, function (color,array) {
                    $.each(array, function (id,piece) {
                        piece.moves = [];
                        if (piece.type == 'pawn') {
                            // Double jump
                            ycheck = (color == 'white' ? 2 : 7);
                            if (piece.coords[0] == ycheck) {
                                fsCoords = ob.methods.move(piece,'up',1);
                                ssCoords = ob.methods.move(piece,'up',2);
                                firstSquare = ob.methods.chessCoords(fsCoords);
                                secondSquare = ob.methods.chessCoords(ssCoords);
                                if (typeof ob.positions[firstSquare]  == 'undefined' &&
                                    typeof ob.positions[secondSquare] == 'undefined') {
                                    piece.moves.push(ssCoords);
                                    piece.moves.push(fsCoords);
                                }
                            }
                        }
                    });
                });
            },
            allDiagonalMoves: function (piece) {
                if (typeof piece.coords == 'object') {
                    var coords = piece.coords;
                } else {
                    var coords = piece;
                }
                var x = coords[0], y = coords[1], out = [];
                
                var i = 0;
                while (++i < 8) {
                    coords = [x+i,y+i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x+i,y-i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x-i,y-i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x-i,y+i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                return out;
            },
            isOccupied: function (coords) {
                return (typeof ob.positions[ob.methods.chessCoords(coords) != 'undefined']);
            },
            allStraightMoves: function (piece) {
                if (typeof piece.coords == 'object') {
                    var coords = piece.coords;
                } else {
                    var coords = piece;
                }
                var x = coords[0], y = coords[1], out = [];
                
                var i = 0;
                while (++i < 8) {
                    coords = [x,y-i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x,y+i];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x+1,y];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                i = 0;
                while (++i < 8) {
                    coords = [x+i,y];
                    out.push(coords);
                    if (ob.methods.isOccupied(coords))
                        break;
                }
                return out;
            },
            allKnightMoves: function (piece) {
                if (typeof piece.coords == 'object') {
                    var coords = piece.coords;
                } else {
                    var coords = piece;
                }
                var out = [],
                    vert = ['up','down'],
                    hori = ['left','right'];
                    
                $.each(vert,function(id,vdir){
                    $.each(hori,function(id,hdir){
                        out.push(ob.methods.moveKnight(coords,vdir+' '+hdir));
                        out.push(ob.methods.moveKnight(coords,hdir+' '+vdir));
                    });
                });
                return out;
            },
            moveKnight: function (piece, dir, move) {
                if (typeof piece.coords == 'object') {
                    var coords = piece.coords;
                    if (piece.color == 'black') {
                        dir.replace('up','~').replace('down','up').replace('~','down');
                    }
                } else {
                    var coords = piece;
                    move = false;
                }
                switch (dir) {
                    case 'left up':
                        out = [coords[0] - 2,coords[1] + 1];
                        break;
                    case 'left down':
                        out = [coords[0] - 2,coords[1] - 1];
                        break;
                    case 'right up':
                        out = [coords[0] + 2,coords[1] + 1];
                        break;
                    case 'right down':
                        out = [coords[0] + 2,coords[1] - 1];
                        break;
                    case 'up left':
                        out = [coords[0] - 1,coords[1] + 2];
                        break;
                    case 'down left':
                        out = [coords[0] - 1,coords[1] - 2];
                        break;
                    case 'up right':
                        out = [coords[0] + 1,coords[1] + 2];
                        break;
                    case 'down right':
                        out = [coords[0] + 1,coords[1] - 2];
                        break;
                    default:
                        out = [coords[0] , coords[1]]
                }
                if (move === true) {
                    ob.methods.movePiece(piece,out);
                }
                return out;
            },
            move: function (piece, dir, amnt, move) {
                if (typeof piece.coords == 'object') {
                    if (piece.type == 'knight') {
                        return ob.methods.moveKnight(piece,dir,move);
                    }
                    var coords = piece.coords;
                    if (piece.color == 'black') {
                        amnt *= -1;
                        dir.replace('right','~').replace('left','right').replace('~','left');
                    }
                } else {
                    var coords = piece;
                    move = false;
                }
                var out = coords;
                switch (dir) {
                    case 'up':
                        out = [coords[0] + amnt,coords[1]];
                        break;
                    case 'down':
                        out = [coords[0] - amnt,coords[1]];
                        break;
                    case 'right':
                        out = [coords[0],coords[1] + amnt];
                        break;
                    case 'left':
                        out = [coords[0],coords[1] - amnt];
                        break;
                    case 'up left':
                        out = [coords[0] + amnt,coords[1] - amnt];
                        break;
                    case 'up right':
                        out = [coords[0] + amnt,coords[1] + amnt];
                        break;
                    case 'down left':
                        out = [coords[0] - amnt,coords[1] - amnt];
                        break;
                    case 'down right':
                        out = [coords[0] - amnt,coords[1] + amnt];
                        break;
                }
                if (move === true) {
                    ob.methods.movePiece(piece,out);
                }
                return out;
            },
            chessCoords: function (coords) {
                return 'abcdefgh'[coords[0]-1]+','+coords[1];
            },
            isRealCoords: function (coords) {
                return (ob.methods.isRealCoord(coords[0]) && ob.methods.isRealCoord(coords[1]));
            },
            isRealCoord: function (coord) {
                return (!(coord > 8 || coord < 1));
            },
            realCoords: function (coords) {
                var alphaMap = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8};
                return (typeof coords == 'object') ? [
                    (coords[0]-1)*ob.settings.dimensions + 1,
                    Math.abs((coords[1]-1)*ob.settings.dimensions - (ob.settings.view?ob.settings.dimensions*7:0)) + 1
                ] : alphaMap[coords.split(',')[0]]+','+coords.split(',')[1];
            },
            movePiece: function (piece,newCoords) {
                if (!ob.methods.isRealCoords(newCoords)) {
                    return false;
                }
                realCoords = ob.methods.realCoords(newCoords);
                ob.movingPiece = [
                    [
                        (realCoords[0] - piece.realCoords[0]) / ob.settings.motionFrames,
                        (realCoords[1] - piece.realCoords[1]) / ob.settings.motionFrames
                    ],
                    realCoords,
                    piece,
                    newCoords
                ];
            },
            pieceMotion: function () {
                if (ob.movingPiece == false) { 
                    return;
                }
                speed = ob.movingPiece[0];
                piece = ob.movingPiece[2];
                coords = ob.movingPiece[1];
                if (Math.round(piece.realCoords[0]) == Math.round(coords[0]) &&
                    Math.round(piece.realCoords[1]) == Math.round(coords[1])) {
                    piece.coords = ob.movingPiece[3];
                    ob.movingPiece = false;
                    return;
                }
                piece.realCoords[0] += speed[0];
                piece.realCoords[1] += speed[1];
                
            }
        };
        ob.methods.init();
        ob.timer = setInterval(ob.methods.init,1000/60);
        console.log(ob);
        return ob;
    };
})(jQuery);
$(function(){
    chessBoard = $('canvas').chessify({
        colorWhite: '#cccccc',
        dimensions: 75,
        player: 1
    });
});