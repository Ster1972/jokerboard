"use strict"

export default function playerMarble(obj,x,y,texture,frame,data){
    
    
    //console.log('success',obj)
    let balldata = {'t1': { ballname: 'top1', X: 370, Y: 100, homeX: 170, homeY: 50 },
                    't2': { ballname: 'top2', X: 370, Y: 140, homeX: 170, homeY: 50 },
                    't3': { ballname: 'top3', X: 370, Y: 180, homeX: 170, homeY: 50 },
                    't4': { ballname: 'top4', X: 330, Y: 140, homeX: 170, homeY: 50 },
                    't5': { ballname: 'top5', X: 410, Y: 140, homeX: 170, homeY: 50 },
                    'r1': { ballname: 'right1', X: 710, Y: 370, homeX: 770, homeY: 170 },
                    'r2': { ballname: 'right2', X: 670, Y: 370, homeX: 770, homeY: 170 },
                    'r3': { ballname: 'right3', X: 630, Y: 370, homeX: 770, homeY: 170 },
                    'r4': { ballname: 'right4', X: 670, Y: 330, homeX: 770, homeY: 170 },
                    'r5': { ballname: 'right5', X: 670, Y: 410, homeX: 770, homeY: 170 },
                    'b1': { ballname: 'bottom1', X: 450, Y: 720, homeX: 650, homeY: 770 },
                    'b2': { ballname: 'bottom2', X: 450, Y: 680, homeX: 650, homeY: 770 },
                    'b3': { ballname: 'bottom3', X: 450, Y: 640, homeX: 650, homeY: 770 },
                    'b4': { ballname: 'bottom4', X: 490, Y: 680, homeX: 650, homeY: 770 },
                    'b5': { ballname: 'bottom5', X: 410, Y: 680, homeX: 650, homeY: 770 },
                    'l1': { ballname: 'left1', X: 100, Y: 450, homeX: 50, homeY: 650 },
                    'l2': { ballname: 'left2', X: 140, Y: 450, homeX: 50, homeY: 650 },
                    'l3': { ballname: 'left3', X: 180, Y: 450, homeX: 50, homeY: 650 },
                    'l4': { ballname: 'left4', X: 140, Y: 490, homeX: 50, homeY: 650 },
                    'l5': { ballname: 'left5', X: 140, Y: 410, homeX: 50, homeY: 650 }
                }

    let ball = obj.physics.add.image(x,y,texture,frame)
        .setInteractive({ useHandCursor: true, draggable: true})
        .setCircle(14,2,2)
        .setData(balldata[data])
        .setCollideWorldBounds(true)

    ball.name = balldata[data]['ballname']
    return(ball)
}

    
    
     
       

        
