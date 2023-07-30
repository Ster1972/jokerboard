"use strict"
// h1 is the gray hole
// h2 is the black hole

export default function boardHole(scene){
    
    const gameBoard = scene.physics.add.group({ immovable: true }) //Creat group for gameBoard

    gameBoard.create(50, 90, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 72
    gameBoard.create(50, 130, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 170, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 210, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 250, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 290, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 330, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 370, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 410, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 450, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 490, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 62 - LEFT Exit
    gameBoard.create(50, 530, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 570, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 610, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    // ----
    let LeftHome = gameBoard.create(50, 650, 'sphere', 'h1').refreshBody().setCircle(12, 4, 4) // Hole 58 - LEFT Home Area
    // // ----
    gameBoard.create(50, 690, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 730, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4) //Hole 55 - Bottom left corner
    gameBoard.create(90, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(130, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(170, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(210, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(250, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(290, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(330, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(370, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(410, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(450, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(490, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 44 - BOTTOM Exit
    gameBoard.create(530, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(570, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(610, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    // ----
    let BottomHome = gameBoard.create(650, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 40 - BOTTOM Home Area
    // ----
    gameBoard.create(690, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(730, 770, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 770, 'sphere', 'h2').refreshBody().setCircle(12,4,4) // Hole 37 - Bottom right cornet
    gameBoard.create(770, 730, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 690, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 650, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 610, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 570, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 530, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 490, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 450, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 410, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 370, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 330, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 26 - RIGHT Exit 
    gameBoard.create(770, 290, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 250, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 210, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    // ----
    let RightHome = gameBoard.create(770, 170, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 22 - RIGHT Home Area
    // ----
    gameBoard.create(770, 130, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 90, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(770, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4) // Hole 19 - Top right corner
    gameBoard.create(730, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(690, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(650, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(610, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(570, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(530, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(490, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(450, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(410, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(370, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(330, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4) //Hole 8 - Top Exit
    gameBoard.create(290, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(250, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(210, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    // ----
    let TopHome = gameBoard.create(170, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4) // Hole 4 - Top Home Area
    // ----
    gameBoard.create(130, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4)
    gameBoard.create(90, 50, 'sphere', 'h1').refreshBody().setCircle(12,4,4)
    gameBoard.create(50, 50, 'sphere', 'h2').refreshBody().setCircle(12,4,4) //Hole 1 - Top Left corner

//-------------------Game Board PLayers Home Areas -------------------------
    // Top Area
    gameBoard.create(370, 100, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(370, 140, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(370, 180, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(330, 140, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(410, 140, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    // Right Area
    gameBoard.create(710, 370, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(670, 370, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(630, 370, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(670, 330, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(670, 410, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    // Bottom Area
    gameBoard.create(450, 720, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(450, 680, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(450, 640, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(490, 680, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(410, 680, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    // Left Area
    gameBoard.create(100, 450, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(140, 450, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(180, 450, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(140, 490, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    gameBoard.create(140, 410, 'sphere', 'home').refreshBody().setCircle(12,4,4)


//-------------------Game Board Home Areas -------------------------
    //---Top Area
    const topHome = scene.physics.add.group()
    topHome.create(170, 100, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    topHome.create(170, 140, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    topHome.create(170, 180, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    topHome.create(210, 180, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    topHome.create(250, 180, 'sphere', 'home').refreshBody().setCircle(12,4,4)

    // Right Area
    const rightHome = scene.physics.add.group()
    rightHome.create(720, 170, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    rightHome.create(680, 170, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    rightHome.create(640, 170, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    rightHome.create(640, 210, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    rightHome.create(640, 250, 'sphere', 'home').refreshBody().setCircle(12,4,4)

    // Bottom Area
    const bottomHome = scene.physics.add.group()
    bottomHome.create(650, 720, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    bottomHome.create(650, 680, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    bottomHome.create(650, 640, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    bottomHome.create(610, 640, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    bottomHome.create(570, 640, 'sphere', 'home').refreshBody().setCircle(12,4,4)

    // Left Area
    const leftHome = scene.physics.add.group()
    leftHome.create(100, 650, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    leftHome.create(140, 650, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    leftHome.create(180, 650, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    leftHome.create(180, 610, 'sphere', 'home').refreshBody().setCircle(12,4,4)
    leftHome.create(180, 570, 'sphere', 'home').refreshBody().setCircle(12,4,4)

    return {gameBoard, TopHome,RightHome,LeftHome,BottomHome, topHome, rightHome, leftHome, bottomHome}
}