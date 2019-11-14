import {
    COORDSCALE,
    GRIDCOLS,
    GRIDROWS,
    GRIDSIZE_W,
    GRIDSIZE_H,
    HEIGHT,
    GRIDPADDING_W,
    WIDTH,
    GRIDPADDING_H
} from "./Constants";
import QuantificationZone from "./QuantificationZone";

let dangerValues = [
    [0.08,0.08,0.08,0.10,0.20,0.35,0.65,0.65,0.70,0.75,0.80,0.85,0.90,1.00,1.00,1.00,1.00,1.00,1.00,0.90,0.85,0.80,0.75,0.70,0.65,0.65,0.35,0.20,0.10,0.08,0.08,0.08],
    [0.08,0.08,0.10,0.25,0.30,0.35,0.65,0.70,0.70,0.80,0.85,0.90,0.95,1.00,1.00,1.00,1.00,1.00,1.00,0.95,0.90,0.85,0.80,0.70,0.70,0.65,0.35,0.30,0.25,0.10,0.08,0.08],
    [0.08,0.10,0.15,0.30,0.35,0.40,0.70,0.70,0.75,0.85,0.90,0.95,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.95,0.90,0.85,0.75,0.70,0.70,0.40,0.35,0.30,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.30,0.35,0.40,0.70,0.80,0.85,0.85,0.90,0.95,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.95,0.90,0.85,0.85,0.80,0.70,0.40,0.35,0.30,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.30,0.35,0.45,0.75,0.80,0.85,0.85,0.90,0.95,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.95,0.90,0.85,0.85,0.80,0.75,0.45,0.35,0.30,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.25,0.30,0.45,0.75,0.80,0.80,0.85,0.90,0.90,0.95,0.95,0.95,0.95,0.95,0.95,0.95,0.95,0.90,0.90,0.85,0.80,0.80,0.75,0.45,0.30,0.25,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.25,0.25,0.45,0.75,0.75,0.80,0.80,0.85,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.85,0.80,0.80,0.75,0.75,0.45,0.25,0.25,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.20,0.25,0.45,0.70,0.75,0.80,0.80,0.85,0.85,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.90,0.85,0.85,0.80,0.80,0.75,0.70,0.45,0.25,0.20,0.15,0.10,0.08],
    [0.08,0.10,0.15,0.15,0.20,0.35,0.45,0.50,0.55,0.55,0.60,0.60,0.65,0.65,0.65,0.65,0.65,0.65,0.65,0.65,0.60,0.60,0.55,0.55,0.50,0.45,0.35,0.20,0.15,0.15,0.10,0.08],
    [0.08,0.08,0.10,0.15,0.15,0.20,0.35,0.35,0.40,0.40,0.45,0.45,0.55,0.55,0.55,0.55,0.55,0.55,0.55,0.55,0.45,0.45,0.40,0.40,0.35,0.35,0.20,0.15,0.15,0.10,0.08,0.08],
    [0.06,0.08,0.08,0.10,0.15,0.20,0.20,0.30,0.35,0.35,0.40,0.40,0.45,0.50,0.50,0.50,0.50,0.50,0.50,0.45,0.40,0.40,0.35,0.35,0.30,0.20,0.20,0.15,0.10,0.08,0.08,0.06],
    [0.06,0.08,0.08,0.08,0.10,0.15,0.20,0.20,0.20,0.20,0.20,0.25,0.35,0.40,0.40,0.40,0.40,0.40,0.40,0.35,0.25,0.20,0.20,0.20,0.20,0.20,0.15,0.10,0.08,0.08,0.08,0.06],
    [0.04,0.06,0.08,0.08,0.08,0.10,0.10,0.15,0.15,0.15,0.15,0.20,0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.20,0.15,0.15,0.15,0.15,0.10,0.10,0.08,0.08,0.08,0.06,0.04],
    [0.04,0.04,0.06,0.08,0.08,0.08,0.08,0.10,0.10,0.10,0.10,0.15,0.15,0.15,0.15,0.15,0.15,0.15,0.15,0.15,0.15,0.10,0.10,0.10,0.10,0.08,0.08,0.08,0.08,0.06,0.04,0.04],
    [0.04,0.04,0.04,0.06,0.06,0.06,0.06,0.08,0.08,0.08,0.08,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.08,0.08,0.08,0.08,0.06,0.06,0.06,0.06,0.04,0.04,0.04],
    [0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.06,0.06,0.06,0.06,0.08,0.08,0.08,0.08,0.08,0.08,0.08,0.08,0.08,0.08,0.06,0.06,0.06,0.06,0.04,0.04,0.04,0.04,0.04,0.04,0.04],
    [0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.06,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04]
];

let zones = [];

function getValue(i, j){
    if(i < dangerValues.length && dangerValues[i] && dangerValues[i][j]){
        return dangerValues[i][j];
    } else if(i > 35){
        i = 17-(i-35);
        return dangerValues[i][j];
    }
    return 0;
}

export function setupGrid(p5){
    p5.translate(GRIDPADDING_W, GRIDPADDING_H);
    for (let i = 0; i < GRIDCOLS; i++) {
        zones[i] = [];
        for (let j = 0; j < GRIDROWS; j++) {
            let x = i*GRIDSIZE_W;
            let y = j*GRIDSIZE_H;
            if(x+GRIDSIZE_W > WIDTH-(GRIDPADDING_W+GRIDPADDING_W) || y+GRIDSIZE_H > HEIGHT-(GRIDPADDING_H+GRIDPADDING_H)){
                continue;
            }
            let value = getValue(i,j);
            zones[i][j] = new QuantificationZone(p5, x, y, value);
        }
    }
    p5.translate(0, 0);
    return zones;
}

export function drawGrid(p5, zones){
    p5.translate(GRIDPADDING_W, GRIDPADDING_H);
    for (let i = 0; i < zones.length; i++){
        for (let j = 0; j < zones[i].length; j++) {
            zones[i][j].display(p5);
        }
    }
    p5.translate(0, 0);
}

export function scaleCoords(x, y) {
    return [(WIDTH*0.5 + (parseInt(x)*COORDSCALE)), (HEIGHT*0.5 + (-parseInt(y)*COORDSCALE))]
}

export function displayGuardiolaZones(p5, active){
    if(!active){ return; }
    p5.strokeWeight(3);
    p5.stroke("rgba(171,255,243,0.49)");
    let padding = 45;
    p5.line(padding, 354, WIDTH-padding, 354);
    p5.line(padding, 574, WIDTH-padding, 574);
    p5.line(padding, 223, WIDTH-padding, 223);
    p5.line(padding, 705, WIDTH-padding, 705);
    p5.line(244, padding, 244, HEIGHT-padding);
    p5.line(1116, padding, 1116, HEIGHT-padding);
    p5.line(WIDTH/2-1, padding, WIDTH/2-1, HEIGHT-padding);
    p5.line(WIDTH/3-20, padding, WIDTH/3-20, padding+178);
    p5.line(WIDTH/3-20, HEIGHT-(164+padding), WIDTH/3-20, HEIGHT-padding);
    p5.line(WIDTH-(WIDTH/3)+20, padding, WIDTH-(WIDTH/3)+20, padding+178);
    p5.line(WIDTH+20-(WIDTH/3), HEIGHT-(164+padding), WIDTH+20-(WIDTH/3), HEIGHT-padding);
}


export function displayDist(p5, players ,active){
    if(!active || players.length < 2){ return; }

    for(let i = 0; i < players.length; i++){
        p5.strokeWeight(2);
        p5.fill("#00000033");
        p5.stroke(255);
        if(players[i] && players[i-1]){
            p5.line(players[i].x, players[i].y, players[i-1].x, players[i-1].y);
            let distance = p5.dist(players[i].x, players[i].y, players[i-1].x, players[i-1].y)/12;

            let midX=players[i].x+((players[i-1].x-players[i].x)/2.0);
            let midY=players[i].y+((players[i-1].y-players[i].y)/2.0);
            p5.fill("#000000");
            p5.noStroke();
            p5.text(distance.toFixed(2)+"m", midX, midY)
        }
    }
}

export function freeDraw(p5, active, mouseIsPressed){
    if(!active){return;}
    if(mouseIsPressed){
        p5.strokeWeight(3);
        p5.stroke('#c0dfff');
        p5.noFill()
        p5.smooth();
        p5.line(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY);
    }
}

function pixelInPoly(verts, pos) {
    let i, j;
    let c=false;
    let sides = verts.length;
    for (i=0,j=sides-1;i<sides;j=i++) {
        if (( ((verts[i][1] <= pos.y) && (pos.y < verts[j][1])) || ((verts[j][1] <= pos.y) && (pos.y < verts[i][1]))) &&
            (pos.x < (verts[j][0] - verts[i][0]) * (pos.y - verts[i][1]) / (verts[j][1] - verts[i][1]) + verts[i][0])) {
            c = !c;
        }
    }
    return c;
}


function checkDangerZone(p5, cell){
    let avgDangerValue = 0;
    let count = 0;
    for(let i = 0; i < zones.length; i++){
        for(let j = 0; j < zones[i].length; j++){
            if(pixelInPoly(cell, zones[i][j].pixel)){
                count++;
                avgDangerValue += zones[i][j].value;
            }
        }
    }
    return avgDangerValue/count;
}


export function displayDangerZones(p5, voronoi, active){
    if(!active){return;}
    for (const cell of voronoi.cellPolygons()) {
        let danger = checkDangerZone(p5, cell);
        if(danger >= 0.5){
            p5.fill(p5.color(255*danger,0,0, 255*danger));
            p5.beginShape();
            for(let i = 0; i < cell.length; i++){
                p5.vertex(cell[i][0], cell[i][1]);
            }
            p5.endShape();
        }
    }
}


export function displayVoronoi(p5, context, voronoi, delaunay, active){
    if(active && delaunay != null){
        p5.strokeWeight(2);
        p5.fill("#00000033");
        p5.stroke("#000000");
        context.beginPath();
        voronoi.render(context);
        voronoi.renderBounds(context);
        context.stroke();
        context.beginPath();
        voronoi.delaunay.renderPoints(context, 4);
        context.fill();

    /*if(this.show_voronoi && delaunay != null){
            for (let i = 0; i < this.state.players.length; ++i) {
                //context.save();
                context.beginPath();
                voronoi.renderCell(i, context);
                //context.translate(this.state.points[i][0] - 90, this.state.points[i][1] - 115);
                if(this.state.players[i].team === HOME){
                    context.fillStyle = "#0000ff22";
                } else if(this.state.players[i].team === AWAY){
                    context.fillStyle = "#ff000022";
                } else {
                    context.fillStyle = "#00000066"
                }
                context.fill();
                //context.restore();
            }

            context.beginPath();
            voronoi.render(context);
            context.stroke();
        }*/


    }
}

export function displayPlayers(p5, players, trails, paused, edited, dist){
    if(players.length > 0 || typeof players[0] !== 'undefined'){
        for(let i = 0; i < players.length; i++){
            players[i].display(p5, trails, paused, edited, dist);
        }
    }
}



export function isInPolygon(p5, vertices, px, py){
    let collision = false;

    // go through each of the vertices, plus
    // the next vertex in the list
    let next = 0;
    for (let current=0; current<vertices.length; current++) {
        // get next vertex in list
        // if we've hit the end, wrap around to 0
        next = current+1;
        if (next === vertices.length) next = 0;
        // get the PVectors at our current position
        // this makes our if statement a little cleaner
        let vc = p5.createVector(vertices[current]);    // c for "current"
        let vn = p5.createVector(vertices[next]);       // n for "next"
        // compare position, flip 'collision' variable
        // back and forth
        if (((vc.y >= py && vn.y < py) || (vc.y < py && vn.y >= py)) &&
            (px < (vn.x-vc.x)*(py-vc.y) / (vn.y-vc.y)+vc.x)) {
            collision = !collision;
        }
    }
    return collision;
}


export function displayBall(p5, ball, trails, paused, edited){
    if(ball !== null){
        ball.display(p5, trails, paused, edited);
    }
}


export function checkPossession(ball, players, callback){
    if(ball !== null && players.length > 0){
        if(ball.z > 900){
            return;
        }
        let someone_has_ball = false;
        for(let i = 0; i < players.length; i++){
            players[i].check_possession(ball.x, ball.y, ball.z);
            if(players[i].has_ball){
                someone_has_ball = true;
                callback(players[i])
            }
        }
        if(!someone_has_ball){
            callback(null)
        }
    }
}


export function displayConvexHull(p5, context, voronoi, delaunay, active, fill){
    if(active && delaunay != null){
        context.fillStyle = fill;
        context.beginPath();
        voronoi.delaunay.renderHull(context);
        context.fill();
    }
}
