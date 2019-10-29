import {HEIGHT, WIDTH} from "./Constants";

export function displayGuardiolaZones(p5, active){
    if(!active){ return; }
    p5.strokeWeight(3);
    p5.stroke("#00009933");
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
        p5.stroke('#ffff00');
        p5.smooth();
        p5.line(p5.mouseX, p5.mouseY, p5.pmouseX, p5.pmouseY);
    }
}


export function displayVoronoi(p5, context, voronoi, delaunay, active){
    if(active && delaunay != null){
        p5.strokeWeight(2);
        p5.fill("#00000033");
        p5.stroke("#00000055");
        context.beginPath();
        voronoi.render(context);
        voronoi.renderBounds(context);
        context.stroke();
        context.beginPath();
        voronoi.delaunay.renderPoints(context, 4);
        context.fill();
    }

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

export function displayPlayers(p5, players, trails, paused, edited){
    if(players.length > 0 || typeof players[0] !== 'undefined'){
        for(let i = 0; i < players.length; i++){
            players[i].display(p5, trails, paused, edited);
        }
    }
}


export function displayBall(p5, ball, trails, paused, edited){
    if(ball !== null){
        ball.display(p5, trails, paused, edited);
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
