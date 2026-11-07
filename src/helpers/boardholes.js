"use strict"
// h1 is the gray hole
// h2 is the black hole

export function getNearestBoardHole(gameBoard, x, y, maxDistance = 25) {
    if (!gameBoard?.getChildren) return null;

    let nearestHole = null;
    let nearestDistance = Infinity;

    for (const hole of gameBoard.getChildren()) {
        const distance = Math.hypot(hole.x - x, hole.y - y);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestHole = hole;
        }
    }

    if (!nearestHole || nearestDistance > maxDistance) return null;
    return { x: nearestHole.x, y: nearestHole.y };
}

function createHole(group, x, y, texture, frame) {
    const hole = group.create(x, y, texture, frame);
    hole.body.setCircle(12, 4, 4);
    hole.body.reset();
    return hole;
}

export default function boardHole(scene){
    
    const gameBoard = scene.physics.add.staticGroup() //Creat group for gameBoard

    // Helper to tag holes with metadata for collision detection and game logic
    function tag(hole, side, type) {
        hole.side = side; // "top", "right", "bottom", "left"
        hole.type = type; // "home", "exit", "corner", "normal"
        return hole;
    }

    createHole(gameBoard, 50, 90, 'sphere', 'h1') // Hole 72
    createHole(gameBoard, 50, 130, 'sphere', 'h2')
    createHole(gameBoard, 50, 170, 'sphere', 'h1')
    createHole(gameBoard, 50, 210, 'sphere', 'h2')
    createHole(gameBoard, 50, 250, 'sphere', 'h1')
    createHole(gameBoard, 50, 290, 'sphere', 'h2')
    createHole(gameBoard, 50, 330, 'sphere', 'h1')
    createHole(gameBoard, 50, 370, 'sphere', 'h2')
    createHole(gameBoard, 50, 410, 'sphere', 'h1')
    createHole(gameBoard, 50, 450, 'sphere', 'h2')
    createHole(gameBoard, 50, 490, 'sphere', 'h1') // Hole 62 - LEFT Exit
    createHole(gameBoard, 50, 530, 'sphere', 'h2')
    createHole(gameBoard, 50, 570, 'sphere', 'h1')
    createHole(gameBoard, 50, 610, 'sphere', 'h2')
    // ----
    let LeftHome = createHole(gameBoard, 50, 650, 'sphere', 'h1') // Hole 58 - LEFT Home Area
    // // ----
    createHole(gameBoard, 50, 690, 'sphere', 'h2')
    createHole(gameBoard, 50, 730, 'sphere', 'h1')
    createHole(gameBoard, 50, 770, 'sphere', 'h2') //Hole 55 - Bottom left corner
    createHole(gameBoard, 90, 770, 'sphere', 'h1')
    createHole(gameBoard, 130, 770, 'sphere', 'h2')
    createHole(gameBoard, 170, 770, 'sphere', 'h1')
    createHole(gameBoard, 210, 770, 'sphere', 'h2')
    createHole(gameBoard, 250, 770, 'sphere', 'h1')
    createHole(gameBoard, 290, 770, 'sphere', 'h2')
    createHole(gameBoard, 330, 770, 'sphere', 'h1')
    createHole(gameBoard, 370, 770, 'sphere', 'h2')
    createHole(gameBoard, 410, 770, 'sphere', 'h1')
    createHole(gameBoard, 450, 770, 'sphere', 'h2')
    createHole(gameBoard, 490, 770, 'sphere', 'h1') // Hole 44 - BOTTOM Exit
    createHole(gameBoard, 530, 770, 'sphere', 'h2')
    createHole(gameBoard, 570, 770, 'sphere', 'h1')
    createHole(gameBoard, 610, 770, 'sphere', 'h2')
    // ----
    let BottomHome = createHole(gameBoard, 650, 770, 'sphere', 'h1') // Hole 40 - BOTTOM Home Area
    // ----
    createHole(gameBoard, 690, 770, 'sphere', 'h2')
    createHole(gameBoard, 730, 770, 'sphere', 'h1')
    createHole(gameBoard, 770, 770, 'sphere', 'h2') // Hole 37 - Bottom right cornet
    createHole(gameBoard, 770, 730, 'sphere', 'h1')
    createHole(gameBoard, 770, 690, 'sphere', 'h2')
    createHole(gameBoard, 770, 650, 'sphere', 'h1')
    createHole(gameBoard, 770, 610, 'sphere', 'h2')
    createHole(gameBoard, 770, 570, 'sphere', 'h1')
    createHole(gameBoard, 770, 530, 'sphere', 'h2')
    createHole(gameBoard, 770, 490, 'sphere', 'h1')
    createHole(gameBoard, 770, 450, 'sphere', 'h2')
    createHole(gameBoard, 770, 410, 'sphere', 'h1')
    createHole(gameBoard, 770, 370, 'sphere', 'h2')
    createHole(gameBoard, 770, 330, 'sphere', 'h1') // Hole 26 - RIGHT Exit
    createHole(gameBoard, 770, 290, 'sphere', 'h2')
    createHole(gameBoard, 770, 250, 'sphere', 'h1')
    createHole(gameBoard, 770, 210, 'sphere', 'h2')
    // ----
    let RightHome = createHole(gameBoard, 770, 170, 'sphere', 'h1') // Hole 22 - RIGHT Home Area
    // ----
    createHole(gameBoard, 770, 130, 'sphere', 'h2')
    createHole(gameBoard, 770, 90, 'sphere', 'h1')
    createHole(gameBoard, 770, 50, 'sphere', 'h2') // Hole 19 - Top right corner
    createHole(gameBoard, 730, 50, 'sphere', 'h1')
    createHole(gameBoard, 690, 50, 'sphere', 'h2')
    createHole(gameBoard, 650, 50, 'sphere', 'h1')
    createHole(gameBoard, 610, 50, 'sphere', 'h2')
    createHole(gameBoard, 570, 50, 'sphere', 'h1')
    createHole(gameBoard, 530, 50, 'sphere', 'h2')
    createHole(gameBoard, 490, 50, 'sphere', 'h1')
    createHole(gameBoard, 450, 50, 'sphere', 'h2')
    createHole(gameBoard, 410, 50, 'sphere', 'h1')
    createHole(gameBoard, 370, 50, 'sphere', 'h2')
    createHole(gameBoard, 330, 50, 'sphere', 'h1') //Hole 8 - Top Exit
    createHole(gameBoard, 290, 50, 'sphere', 'h2')
    createHole(gameBoard, 250, 50, 'sphere', 'h1')
    createHole(gameBoard, 210, 50, 'sphere', 'h2')
    // ----
    let TopHome = createHole(gameBoard, 170, 50, 'sphere', 'h1') // Hole 4 - Top Home Area
    // ----
    createHole(gameBoard, 130, 50, 'sphere', 'h2')
    createHole(gameBoard, 90, 50, 'sphere', 'h1')
    createHole(gameBoard, 50, 50, 'sphere', 'h2') //Hole 1 - Top Left corner

//-------------------Game Board PLayers Home Areas -------------------------
    // Top Area
    createHole(gameBoard, 370, 100, 'sphere', 'home')
    createHole(gameBoard, 370, 140, 'sphere', 'home')
    createHole(gameBoard, 370, 180, 'sphere', 'home')
    createHole(gameBoard, 330, 140, 'sphere', 'home')
    createHole(gameBoard, 410, 140, 'sphere', 'home')
    // Right Area
    createHole(gameBoard, 710, 370, 'sphere', 'home')
    createHole(gameBoard, 670, 370, 'sphere', 'home')
    createHole(gameBoard, 630, 370, 'sphere', 'home')
    createHole(gameBoard, 670, 330, 'sphere', 'home')
    createHole(gameBoard, 670, 410, 'sphere', 'home')
    // Bottom Area
    createHole(gameBoard, 450, 720, 'sphere', 'home')
    createHole(gameBoard, 450, 680, 'sphere', 'home')
    createHole(gameBoard, 450, 640, 'sphere', 'home')
    createHole(gameBoard, 490, 680, 'sphere', 'home')
    createHole(gameBoard, 410, 680, 'sphere', 'home')
    // Left Area
    createHole(gameBoard, 100, 450, 'sphere', 'home')
    createHole(gameBoard, 140, 450, 'sphere', 'home')
    createHole(gameBoard, 180, 450, 'sphere', 'home')
    createHole(gameBoard, 140, 490, 'sphere', 'home')
    createHole(gameBoard, 140, 410, 'sphere', 'home')


//-------------------Game Board Home Areas -------------------------
    //---Top Area
    const topHome = scene.physics.add.staticGroup()
    createHole(topHome, 170, 100, 'sphere', 'home')
    createHole(topHome, 170, 140, 'sphere', 'home')
    createHole(topHome, 170, 180, 'sphere', 'home')
    createHole(topHome, 210, 180, 'sphere', 'home')
    createHole(topHome, 250, 180, 'sphere', 'home')

    // Right Area
    const rightHome = scene.physics.add.staticGroup()
    createHole(rightHome, 720, 170, 'sphere', 'home')
    createHole(rightHome, 680, 170, 'sphere', 'home')
    createHole(rightHome, 640, 170, 'sphere', 'home')
    createHole(rightHome, 640, 210, 'sphere', 'home')
    createHole(rightHome, 640, 250, 'sphere', 'home')

    // Bottom Area
    const bottomHome = scene.physics.add.staticGroup()
    createHole(bottomHome, 650, 720, 'sphere', 'home')
    createHole(bottomHome, 650, 680, 'sphere', 'home')
    createHole(bottomHome, 650, 640, 'sphere', 'home')
    createHole(bottomHome, 610, 640, 'sphere', 'home')
    createHole(bottomHome, 570, 640, 'sphere', 'home')

    // Left Area
    const leftHome = scene.physics.add.staticGroup()
    createHole(leftHome, 100, 650, 'sphere', 'home')
    createHole(leftHome, 140, 650, 'sphere', 'home')
    createHole(leftHome, 180, 650, 'sphere', 'home')
    createHole(leftHome, 180, 610, 'sphere', 'home')
    createHole(leftHome, 180, 570, 'sphere', 'home')

    // --------- ADD METADATA TO KEY HOLES FOR GAME LOGIC ---------
    // Tag the four main entry holes on the track
    tag(TopHome, "top", "home");
    tag(RightHome, "right", "home");
    tag(LeftHome, "left", "home");
    tag(BottomHome, "bottom", "home");

    // Tag the 5-hole home areas for each player
    topHome.getChildren().forEach(h => tag(h, "top", "home"));
    rightHome.getChildren().forEach(h => tag(h, "right", "home"));
    bottomHome.getChildren().forEach(h => tag(h, "bottom", "home"));
    leftHome.getChildren().forEach(h => tag(h, "left", "home"));  

    return {gameBoard, TopHome,RightHome,LeftHome,BottomHome, topHome, rightHome, leftHome, bottomHome}
}