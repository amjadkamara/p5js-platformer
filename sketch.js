/*
The Game Project
*/

// Global Variables
let gameChar_x, gameChar_y, floorPos_y; // Character position
let isLeft = false, isRight = false, isFalling = false, isPlummeting = false; // Movement states

// Arrays to store in-game objects
let collectables = [], canyons = [], clouds = [], mountains = [], backgroundMountains = [], towers = [], lasers = [];

// Environmental variables
let numClouds, cloudMovement = 0, cloudDirection = 1, breathAmount = 0, breathDirection = 1, windSpeed_r, glowAlpha_t;
let maxHeight = 200, glowingParticle_x, glowingParticle_y, glowingParticle_s, glowingParticle_c;

// Game stats and controls
let cameraPosX = 0, game_score = 0, lives = 3, isGameOver = false;
let flagpole, state = "left", timer = 0, jumpSound, collectableSound, deathSound, backgroundSound, bulletSound, laserSound, hitSound, destroySound;

// UI elements and music
let livesIcon, showHelp = false, missionBrief, isMissionBriefActive = false, currentMissionLine = 0, splash = true, bgMusic;
let drones = [], platforms = [], livesPosition, spaceshipX, spaceshipY, smokeParticles = [];

// Preload assets
function preload() {
  livesIcon = loadImage('assets/images/power-energy-icon-13.png');
  soundFormats('mp3', 'wav');
  
  jumpSound = loadSound('assets/sounds/robo_jump.wav');
  jumpSound.setVolume(0.3);
  
  collectableSound = loadSound('assets/sounds/power_up_sparkle.wav');
  collectableSound.setVolume(0.4);
  
  deathSound = loadSound('assets/sounds/deathsound.wav');
  deathSound.setVolume(0.4);
  
  backgroundSound = loadSound('assets/sounds/game_level_music.mp3');
  backgroundSound.setVolume(0.5);
  
  bulletSound = loadSound('assets/sounds/bullet_sound.mp3');
  bulletSound.setVolume(0.3);
  
  laserSound = loadSound('assets/sounds/laserSound.mp3');
  laserSound.setVolume(0.3);
  
  hitSound = loadSound('assets/sounds/hitSound.mp3');
  hitSound.setVolume(0.3);
  
  destroySound = loadSound('assets/sounds/destroySound.mp3');
  destroySound.setVolume(0.3);
}

// Setup the game environment
function setup() {
  createCanvas(1024, 576);
  backgroundSound.loop();
  floorPos_y = (height * 3) / 4;
  startGame();
}

// Draw the game environment and character
function draw() {
  cameraPosX = gameChar_x - width / 2;
  drawGameEnv();

  push();
  translate(-cameraPosX, 0);
  
  checkPlayerDie();
  drawClouds();
  
  for (let mountainIndex = 0; mountainIndex < backgroundMountains.length; mountainIndex++) {
    backgroundMountains[mountainIndex].drawBackgroundMountain();
  }
  
  drawParticles();
  drawMountains();
  drawTrees();
  
  for (let towerIndex = 0; towerIndex < towers.length; towerIndex++) {
    towers[towerIndex].drawTower();
  }
  
  for (let i = 0; i < collectables.length; i++) {
    if (!collectables[i].isFound) {
      drawCollectable(collectables[i]);
      checkCollectable(collectables[i]);
    }
  }
  
  for (let j = 0; j < canyons.length; j++) {
    drawCanyon(canyons[j]);
    checkCanyon(canyons[j]);
  }
  
  for (let d = 0; d < drones.length; d++) {
    drones[d].move();
    drones[d].handleBullets();
    drones[d].draw();
  }

  updateLasers();
  checkLaserDroneCollisions();
  drawPlatforms();
  checkPlatformCollision();
  
  renderFlagpole(3800, floorPos_y - 18, state);
  drawGameChar();
  drawSpacecraft(spaceshipX, spaceshipY);
  drawFlame(spaceshipX - 60, spaceshipY);
  drawSmoke();
  
	// Generate smoke particles every few frames
  	if (frameCount % 5 === 0) {
    	generateSmoke(); // Generate smoke every few frames
  	}

  pop();

  // Display score
  fill(255, 215, 0);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text("score: " + game_score, 20, 20);
  
  drawLives();
  
  if (isGameOver) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(50);
    text("Game Over!", width / 2, height / 2 - 50);
    textSize(30);
    text("Press SPACE to restart", width / 2, height / 2);
    return;
  }
  
  if (flagpole.isReached) {
    fill(255, 215, 0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Beacon Activated! Level complete.", width / 2, height / 2);
    return;
  }

  if (showHelp) {
    drawHelpScreen();
  }
  
  fill(255, 255, 0);
  textSize(14);
  text("Press 'H' for help", 20, height - 30);
  
  if (isMissionBriefActive) {
    displayMissionBrief();
    return;
  }
  
  cloudMovement += cloudDirection * 0.05;
  if (cloudMovement > 1 || cloudMovement < -1) {
    cloudDirection *= -1;
  }

  timer++;
  if (timer % 60 === 0) {
    if (state === "left") state = "middle";
    else if (state === "middle") state = "right";
    else if (state === "right") state = "middleBack";
    else state = "left";
  }

  if (isPlummeting) {
    gameChar_y += 5;
  }

  if (isRight) {
    gameChar_x += 3;
  }

  if (isLeft) {
    gameChar_x -= 3;
  }

  if (gameChar_y < floorPos_y) {
    gameChar_y += 2;
    isFalling = true;
  } else {
    isFalling = false;
  }

  checkFlagpole();
}

// Key event functions
function keyPressed() {
  if (isMissionBriefActive) {
    if (keyCode === ENTER) {
      currentMissionLine++;
      if (currentMissionLine >= missionBrief.length) {
        isMissionBriefActive = false;
      }
    } else if (keyCode === ESCAPE) {
      isMissionBriefActive = false;
    }
    return;
  }

  if (keyCode === 72) {
    showHelp = !showHelp;
  }

  if (!isPlummeting && !isGameOver) {
    if (keyCode === 65) {
      isLeft = true;
    } else if (keyCode === 68) {
      isRight = true;
    } else if (keyCode === ENTER && !isMissionBriefActive) {
      fireLaser();
    } else if (keyCode === 87) {
      if (gameChar_y === floorPos_y || isOnPlatform()) {
        gameChar_y -= 100;
        jumpSound.play();
      }
    }
  }

  if (keyCode === 32 && isGameOver) {
    isGameOver = false;
    backgroundSound.loop();
    lives = 3;
    startGame();
  }
}

function keyReleased() {
  if (keyCode === 65) {
    isLeft = false;
  } else if (keyCode === 68) {
    isRight = false;
  }
}

// Function to draw game environment
function drawGameEnv() {
  background(10, 20, 30); // Night sky background
  noStroke();
  fill(25, 25, 25);
  rect(0, 432, 1024, 144); // Dark night ground

  stroke(30, 30, 30);
  strokeWeight(2);
  fill(15, 15, 15);
  rect(0, 520, 1024, 60); // Lower ground design
	
  noStroke(); // end stroke
}


// Function to draw the Game Character
function drawGameChar() {
  if (isLeft && isFalling) {
    drawJumpingLeft();
  } else if (isRight && isFalling) {
    drawJumpingRight();
  } else if (isLeft) {
    drawWalkingLeft();
  } else if (isRight) {
    drawWalkingRight();
  } else if (isFalling || isPlummeting) {
    drawJumpingFacingForward();
  } else {
    drawStandingFrontFacing();
  }
}

// Helper function for drawing jumping-left state
function drawJumpingLeft() {
  // Left lower leg
  fill(205, 133, 63);
  triangle(gameChar_x - 11, gameChar_y - 27, gameChar_x - 6, gameChar_y - 27, gameChar_x - 2, gameChar_y - 7);

  // Right lower leg
  triangle(gameChar_x + 3, gameChar_y - 28, gameChar_x + 9, gameChar_y - 29, gameChar_x + 12, gameChar_y - 6);

  // Knees
  fill(205, 133, 63);
  ellipse(gameChar_x - 9, gameChar_y - 30, 8, 8);
  ellipse(gameChar_x + 6, gameChar_y - 27, 8, 8);

  // Hips
  fill(160, 82, 45);
  ellipse(gameChar_x - 4, gameChar_y - 32, 10, 10);
  ellipse(gameChar_x + 5, gameChar_y - 32, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 36, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 48, 20, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x - 2, gameChar_y - 49, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x - 4, gameChar_y - 49, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x - 5, gameChar_y - 51, 3, 3);
}

// Helper function for drawing jumping-right state
function drawJumpingRight() {
  // Left lower leg
  fill(205, 133, 63);
  triangle(gameChar_x - 8, gameChar_y - 27, gameChar_x - 2, gameChar_y - 27, gameChar_x - 12, gameChar_y - 7);

  // Right lower leg
  triangle(gameChar_x + 7, gameChar_y - 28, gameChar_x + 13, gameChar_y - 29, gameChar_x + 4, gameChar_y - 5);

  // Knees
  fill(205, 133, 63);
  ellipse(gameChar_x - 5, gameChar_y - 27, 8, 8);
  ellipse(gameChar_x + 10, gameChar_y - 30, 8, 8);

  // Hips
  fill(160, 82, 45);
  ellipse(gameChar_x - 4, gameChar_y - 32, 10, 10);
  ellipse(gameChar_x + 5, gameChar_y - 32, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 36, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 48, 20, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x + 2, gameChar_y - 49, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x + 4, gameChar_y - 49, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x + 5, gameChar_y - 51, 3, 3);
}

// Helper function for drawing walking-left state
function drawWalkingLeft() {
  // Left ankle
  fill(205, 133, 63);
  triangle(gameChar_x - 11, gameChar_y - 18, gameChar_x - 5, gameChar_y - 18, gameChar_x - 4, gameChar_y + 3);

  // Right lower leg
  triangle(gameChar_x + 4, gameChar_y - 18, gameChar_x + 10, gameChar_y - 18, gameChar_x + 10, gameChar_y + 3);

  // Knees
  fill(205, 133, 63);
  ellipse(gameChar_x - 8, gameChar_y - 18, 8, 8);
  ellipse(gameChar_x + 7, gameChar_y - 18, 8, 8);

  // Hips
  fill(160, 82, 45);
  ellipse(gameChar_x - 6, gameChar_y - 24, 10, 10);
  ellipse(gameChar_x + 6, gameChar_y - 24, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 30, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 42, 20, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x - 2, gameChar_y - 42, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x - 4, gameChar_y - 42, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x - 5, gameChar_y - 43, 3, 3);
}

// Helper function for drawing walking-right state
function drawWalkingRight() {
  // Left ankle
  fill(205, 133, 63);
  triangle(gameChar_x - 10, gameChar_y - 18, gameChar_x - 4, gameChar_y - 18, gameChar_x - 10, gameChar_y + 3);

  // Right lower leg
  triangle(gameChar_x + 6, gameChar_y - 18, gameChar_x + 12, gameChar_y - 18, gameChar_x + 6, gameChar_y + 3);

  // Knees
  fill(205, 133, 63);
  ellipse(gameChar_x - 7, gameChar_y - 18, 8, 8);
  ellipse(gameChar_x + 9, gameChar_y - 18, 8, 8);

  // Hips
  fill(160, 82, 45);
  ellipse(gameChar_x - 6, gameChar_y - 24, 10, 10);
  ellipse(gameChar_x + 6, gameChar_y - 24, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 30, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 42, 20, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x + 2, gameChar_y - 42, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x + 4, gameChar_y - 42, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x + 5, gameChar_y - 43, 3, 3);
}

// Helper function for drawing jumping-facing-forward state
function drawJumpingFacingForward() {
  // Left ankle
  fill(205, 133, 63);
  triangle(gameChar_x - 12, gameChar_y - 27, gameChar_x - 6, gameChar_y - 27, gameChar_x - 20, gameChar_y - 5);

  // Right lower leg
  triangle(gameChar_x + 8, gameChar_y - 28, gameChar_x + 14, gameChar_y - 29, gameChar_x + 19, gameChar_y - 5);

  // Knees
  fill(205, 133, 63);
  ellipse(gameChar_x - 9, gameChar_y - 29, 8, 8);
  ellipse(gameChar_x + 10, gameChar_y - 29, 8, 8);

  // Hips
  fill(160, 82, 45);
  ellipse(gameChar_x - 4, gameChar_y - 32, 10, 10);
  ellipse(gameChar_x + 5, gameChar_y - 32, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 36, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 48, 18, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x, gameChar_y - 49, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x, gameChar_y - 49, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x, gameChar_y - 51, 3, 3);
}

// Helper function for drawing standing-front-facing state with breathing animation
function drawStandingFrontFacing() {
  breathAmount += breathDirection * 0.05;
  if (breathAmount > 1 || breathAmount < -1) {
    breathDirection *= -1;
  }

  // Left ankle
  fill(205, 133, 63);
  triangle(gameChar_x - 9, gameChar_y - 18, gameChar_x - 3, gameChar_y - 18, gameChar_x - 6, gameChar_y + 3);

  // Right lower leg
  triangle(gameChar_x + 4, gameChar_y - 18, gameChar_x + 10, gameChar_y - 18, gameChar_x + 7, gameChar_y + 3);

  // Knees with breathing animation
  fill(205, 133, 63);
  ellipse(gameChar_x - 6, gameChar_y - 18 + breathAmount, 8, 8);
  ellipse(gameChar_x + 7, gameChar_y - 18 + breathAmount, 8, 8);

  // Hips with breathing animation
  fill(160, 82, 45);
  ellipse(gameChar_x - 6, gameChar_y - 24 + breathAmount, 10, 10);
  ellipse(gameChar_x + 6, gameChar_y - 24 + breathAmount, 10, 10);

  // Body and head
  fill(205, 133, 63);
  ellipse(gameChar_x, gameChar_y - 30, 12, 12);
  fill(210, 180, 140);
  ellipse(gameChar_x, gameChar_y - 42 + breathAmount, 20, 20);

  // Face and eyes
  fill(255, 160, 122);
  ellipse(gameChar_x, gameChar_y - 40 + breathAmount, 14, 16);
  fill(178, 34, 34);
  ellipse(gameChar_x, gameChar_y - 40 + breathAmount, 8, 10);
  fill(255, 255, 255, 230);
  ellipse(gameChar_x, gameChar_y - 42 + breathAmount, 3, 3);
}

// Function to draw the clouds
function drawClouds() {
	for (let c = 0; c < clouds.length; c++) {
		console.log("clouds loop " + c);

		// Draw the clouds body
		fill(255); // White for the main clouds body
		drawCloudBody(clouds[c]);

		// Draw cloud shadows for depth effect
		fill(150, 150, 150, 100); // Darker gray with transparency for shadows
		drawCloudShadows(clouds[c]);
	}
}

// Helper function to draw cloud body
function drawCloudBody(cloud) {
	ellipse(cloud.x_pos + 154, cloud.y_pos + 107 + cloudMovement * 2, 50 * cloud.size, 40 * cloud.size);
	ellipse(cloud.x_pos + 175, cloud.y_pos + 101 + cloudMovement * 2, 60 * cloud.size, 60 * cloud.size);
	ellipse(cloud.x_pos + 213, cloud.y_pos + 101 + cloudMovement * 2, 60 * cloud.size, 60 * cloud.size);
	ellipse(cloud.x_pos + 243, cloud.y_pos + 107 + cloudMovement * 2, 50 * cloud.size, 40 * cloud.size);
}

// Helper function to draw cloud shadows
function drawCloudShadows(cloud) {
	ellipse(cloud.x_pos + 159, cloud.y_pos + 109.5 + cloudMovement * 2, 50 * cloud.size, 40 * cloud.size);
	ellipse(cloud.x_pos + 180, cloud.y_pos + 103.5 + cloudMovement * 2, 60 * cloud.size, 60 * cloud.size);
	ellipse(cloud.x_pos + 218, cloud.y_pos + 103.5 + cloudMovement * 2, 60 * cloud.size, 60 * cloud.size);
	ellipse(cloud.x_pos + 248, cloud.y_pos + 109.5 + cloudMovement * 2, 50 * cloud.size, 40 * cloud.size);
}

// Function to draw the mountains
function drawMountains() {
	for (let m = 0; m < mountains.length; m++) {
		console.log("mountains loop " + m);

		// Draw mountain base
		fill(30, 30, 30); // Dark grey for the mountain base
		drawMountainBase(mountains[m]);

		// Draw mountain effects for extra details
		fill(40, 40, 40); // Darker shade of grey for effects
		drawMountainEffects(mountains[m]);
	}
}

// Helper function to draw mountain base
function drawMountainBase(mountain) {
	beginShape();
	curveVertex(mountain.x_pos + 369 * mountain.size, mountain.y_pos + 432 * mountain.size);
	curveVertex(mountain.x_pos + 369 * mountain.size, mountain.y_pos + 432 * mountain.size);
	curveVertex(mountain.x_pos + 418 * mountain.size, mountain.y_pos + 407 * mountain.size);
	curveVertex(mountain.x_pos + 472 * mountain.size, mountain.y_pos + 411 * mountain.size);
	curveVertex(mountain.x_pos + 524 * mountain.size, mountain.y_pos + 367 * mountain.size);
	curveVertex(mountain.x_pos + 551 * mountain.size, mountain.y_pos + 383 * mountain.size);
	curveVertex(mountain.x_pos + 602 * mountain.size, mountain.y_pos + 270 * mountain.size);
	curveVertex(mountain.x_pos + 687 * mountain.size, mountain.y_pos + 354 * mountain.size);
	curveVertex(mountain.x_pos + 714 * mountain.size, mountain.y_pos + 323 * mountain.size);
	curveVertex(mountain.x_pos + 788 * mountain.size, mountain.y_pos + 400 * mountain.size);
	curveVertex(mountain.x_pos + 823 * mountain.size, mountain.y_pos + 432 * mountain.size);
	endShape(CLOSE);
}

// Helper function to draw mountain effects
function drawMountainEffects(mountain) {
	beginShape();
	curveVertex(mountain.x_pos + 560 * mountain.size, mountain.y_pos + 379 * mountain.size);
	curveVertex(mountain.x_pos + 602 * mountain.size, mountain.y_pos + 312 * mountain.size);
	curveVertex(mountain.x_pos + 572 * mountain.size, mountain.y_pos + 377 * mountain.size);
	curveVertex(mountain.x_pos + 589 * mountain.size, mountain.y_pos + 301 * mountain.size);
	endShape(CLOSE);

	// Additional mountain effect shapes
	drawAdditionalMountainEffects(mountain);
}

// Additional shapes for mountain effects
function drawAdditionalMountainEffects(mountain) {
	beginShape();
	fill(25, 25, 25); // Dark grey for more mountain effects
	curveVertex(mountain.x_pos + 740 * mountain.size, mountain.y_pos + 416 * mountain.size);
	curveVertex(mountain.x_pos + 707 * mountain.size, mountain.y_pos + 366 * mountain.size);
	curveVertex(mountain.x_pos + 735 * mountain.size, mountain.y_pos + 350 * mountain.size);
	curveVertex(mountain.x_pos + 774 * mountain.size, mountain.y_pos + 402 * mountain.size);
	endShape(CLOSE);
}

// Function to draw the trees
function drawTrees() {
	for (let t = 0; t < treePos_x.length; t++) {
		console.log("tree loop " + t);
		// Draw tree trunk and leaves
		drawTree(treePos_x[t], treePos_y);
	}
}

// Helper function to draw individual trees
function drawTree(x, y) {
	fill(46, 46, 46); // Charcoal gray for the trunk
	rect(x - 7.5, y + 44, 15, 100); // Tree trunk

	fill(0, 255, 0, 150); // Green leaves with alien glow effect
	ellipse(x, y - 16, 60, 60);
	ellipse(x, y + 1, 80, 80);
	ellipse(x, y + 19, 100, 100);
}

// Function to draw particles
function drawParticles() {
	for (let i = 0; i < particles.length; i++) {
		let p = particles[i];

		// Move particles randomly and handle boundaries
		moveParticle(p);

		// Draw glowing particle
		fill(p.color);
		ellipse(p.glowingParticle_x, p.glowingParticle_y, p.glowingParticle_s, p.glowingParticle_s);
	}
}

// Helper function to move particles and handle bounds
function moveParticle(p) {
	p.glowingParticle_x += p.speedPos_x;
	p.glowingParticle_y += p.speedPos_y;

	// Wrap around the canvas
	p.glowingParticle_x = (p.glowingParticle_x + width) % width;
	p.glowingParticle_y = (p.glowingParticle_y + height) % height;

	// Keep particles within vertical bounds of floorPos_y
	if (p.glowingParticle_y >= floorPos_y) {
		p.glowingParticle_y = maxHeight;
		p.speedPos_y *= -1;
	}
}

// Function to draw collectable items
function drawCollectable(t_collectable) {
	if (!t_collectable.isFound) {
		stroke(1);
		fill(30, 144, 255); // Snow color central orb
		drawCollectableOrb(t_collectable);
	}
}

// Helper function to draw the collectable orb
function drawCollectableOrb(t_collectable) {
	ellipse(t_collectable.x_pos + 316, t_collectable.y_pos + 287, 8, 8); // Orb

	// Draw lines extending from orb
	stroke(0, 255, 255, 80);
	line(t_collectable.x_pos + 316, t_collectable.y_pos + 285, t_collectable.x_pos + 316, t_collectable.y_pos + 280); // Upper line
	line(t_collectable.x_pos + 316, t_collectable.y_pos + 285, t_collectable.x_pos + 316, t_collectable.y_pos + 294); // Bottom line
	line(t_collectable.x_pos + 316, t_collectable.y_pos + 287, t_collectable.x_pos + 307, t_collectable.y_pos + 282); // Left line
	line(t_collectable.x_pos + 316, t_collectable.y_pos + 287, t_collectable.x_pos + 325, t_collectable.y_pos + 282); // Right line

	// Glow effect
	drawCollectableGlow(t_collectable);
}

// Helper function for collectable glow effects
function drawCollectableGlow(t_collectable) {
	fill(240, 255, 255, 90); // White central orb glow
	ellipse(t_collectable.x_pos + 316, t_collectable.y_pos + 287, 7, 7);

	// Outer glow hub
	noFill();
	stroke(20, 144, 255, 20);
	strokeWeight(1);
	ellipse(t_collectable.x_pos + 316, t_collectable.y_pos + 286, 25, 25);
	fill(250, 255, 245, 30);
	ellipse(t_collectable.x_pos + 316, t_collectable.y_pos + 286, 15, 15);

	// Additional glow particle
	fill(0, 255, 255, 40);
	ellipse(t_collectable.x_pos + 321, t_collectable.y_pos + 274, 5, 5);
}

// Function to check if the character has picked an item
function checkCollectable(t_collectable) {
	// Check if the character intersects with the collectable
	let d = dist(gameChar_x, gameChar_y, t_collectable.x_pos + 316, t_collectable.y_pos + 287);
	if (d < 20) {
		t_collectable.isFound = true; // Set collectable as found
		game_score += 1;
		collectableSound.play(); // Play sound effect
	}
}
//--------------------------------------
// Canyon render and check functions
//--------------------------------------

// Function to draw canyon objects
function drawCanyon(t_canyon) {
	noStroke();

	// Colors for gradient
	const gradientStart = color(10, 20, 31); // Dark blue
	const gradientEnd = color(0, 0, 0); // Black
	const depth = 200; // Depth of the canyon
	const steps = 20; // Number of gradient steps

	// Draw the canyon with gradient effect
	drawCanyonGradient(t_canyon, gradientStart, gradientEnd, depth, steps);

	// Draw the top of the canyon to cover rough edges
	drawCanyonTop(t_canyon);

	// Draw spikes inside the canyon
	drawCanyonSpikes(t_canyon);
}

// Helper function to draw canyon gradient
function drawCanyonGradient(t_canyon, gradientStart, gradientEnd, depth, steps) {
	for (let i = 0; i <= steps; i++) {
		let inter = map(i, 0, steps, 0, 1);
		let c = lerpColor(gradientStart, gradientEnd, inter);
		fill(c);

		let y = floorPos_y + (i * (height - floorPos_y) / steps);
		let x1 = t_canyon.x_pos - (i * 10 / steps);
		let x2 = t_canyon.x_pos + t_canyon.width + (i * 10 / steps);

		beginShape();
		curveVertex(t_canyon.x_pos, floorPos_y);
		curveVertex(t_canyon.x_pos, floorPos_y);
		curveVertex(x1, y);
		curveVertex(x2, y);
		curveVertex(t_canyon.x_pos + t_canyon.width, floorPos_y);
		curveVertex(t_canyon.x_pos + t_canyon.width, floorPos_y);
		endShape(CLOSE);
	}
}

// Helper function to draw the top of the canyon
function drawCanyonTop(t_canyon) {
	fill(10, 20, 31); // Dark blue for the top edge
	rect(t_canyon.x_pos, floorPos_y, t_canyon.width, 20);
}

// Helper function to draw spikes inside the canyon
function drawCanyonSpikes(t_canyon) {
	const spikeColor = color(50); // Dark grey for spikes
	const spikeHeight = 20;
	const spikeWidth = 10;

	for (let i = 0; i < t_canyon.width; i += 15) {
		let spikeX = t_canyon.x_pos + i;
		let spikeY = floorPos_y + (height - floorPos_y) / 2 + random(-10, 10);
		fill(spikeColor);
		triangle(
			spikeX, spikeY,
			spikeX + spikeWidth / 2, spikeY - spikeHeight,
			spikeX + spikeWidth, spikeY
		);
	}
}

// Function to check if the character is over the canyon
function checkCanyon(t_canyon) {
	if (
		gameChar_x > t_canyon.x_pos &&
		gameChar_x < t_canyon.x_pos + t_canyon.width &&
		gameChar_y >= floorPos_y
	) {
		isPlummeting = true;
	}
}

//--------------------------------------
// Flagpole render and check functions
//--------------------------------------

// Function to render the flagpole
function renderFlagpole(x_loc, y_loc, state) {
	push();
	// Base of the spacecraft
	fill(100);
	noStroke();
	rect(x_loc - 25, y_loc, 50, 20, 5);

	// Rotating platform of the spacecraft
	fill(120);
	ellipse(x_loc, y_loc, 60, 20);

	// Pole body
	fill(150);
	rect(x_loc - 15, y_loc - 20, 30, 20, 5);

	// Pole position based on state (left or right)
	let barrelOffsetX = state === "left" ? -30 : state === "right" ? 30 : 0;

	// Pole of the spacecraft
	fill(200);
	rect(x_loc - 5 + barrelOffsetX, y_loc - 35, 10, 30, 3);

	// Pole details
	drawFlagpoleDetails(x_loc, y_loc, barrelOffsetX);

	// Flagpole state (green light if reached, red otherwise)
	drawFlagpoleLight(x_loc, y_loc);

	pop();
}

// Helper function to draw flagpole details (bolts, scope, and cockpit reflection)
function drawFlagpoleDetails(x_loc, y_loc, barrelOffsetX) {
	// Bolts on the pole
	fill(80);
	ellipse(x_loc - 10, y_loc - 10, 5, 5);
	ellipse(x_loc + 10, y_loc - 10, 5, 5);

	// Sight (red dot scope)
	fill(255, 0, 0);
	ellipse(x_loc - 5 + barrelOffsetX + 5, y_loc - 35, 5, 5);

	// Cockpit reflection
	fill(255, 255, 255, 150);
	ellipse(x_loc + 5, y_loc - 15, 10, 5);
}

// Helper function to draw flagpole light (red or green based on state)
function drawFlagpoleLight(x_loc, y_loc) {
	if (flagpole.isReached) {
		fill(0, 255, 0); // Green light when flagpole is reached
	} else {
		fill(255, 0, 0); // Red light if flagpole isn't reached
	}
	ellipse(x_loc, y_loc - 10, 15, 15);
}

// Function to check if the character reaches the flagpole
function checkFlagpole() {
	let distanceToFlagpole = abs(gameChar_x - flagpole.x_pos);
	if (distanceToFlagpole < 2) {
		flagpole.isReached = true;
	}
}

function startGame() {
    // Initialize character position
    gameChar_x = width / 2;
    gameChar_y = floorPos_y;

    // Initialize mission briefing
   missionBrief = [
    "Surviving the crash on Earth... I'm lucky to be alive.",
    "My priority now is to find and activate the beacon to call the mothership.",
    "Wait, something's wrong.. my laser eye is malfunctioning. It can't shoot far enough!",
    "This means I'll have to get dangerously close to eliminate any threats.",
    "No time to waste, I better move quickly..."
];

    currentMissionLine = 0;
    isMissionBriefActive = lives >= 3;

    // Initialize spaceship properties
    smokeParticles = [];
    spaceshipX = 400;
    spaceshipY = floorPos_y;

    // Initialize movement and game state variables
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;

    // Initialize glowing particle effects
    particles = [];
    glowAlpha_t = 250;
    maxHeight = 200;
    lasers = [];  // Store lasers
    showHelp = false;
    windSpeed_r = 0.5;  // Wind speed for particle effects

    // Create glowing particles
    for (let i = 0; i < 30; i++) {
        let glowingParticle_x = random(width);
        let glowingParticle_y = random(height);
        let glowingParticle_s = random(2, 6);
        let glowingParticle_c = color(random(200, 255), random(100, 200), 0, glowAlpha_t);
        let speedPos_x = random(-windSpeed_r, windSpeed_r);
        let speedPos_y = random(-windSpeed_r, windSpeed_r);
        particles.push({
            glowingParticle_x, glowingParticle_y, glowingParticle_s, color: glowingParticle_c, speedPos_x, speedPos_y
        });
    }

    // Initialize collectables
    collectables = [
        { x_pos: -430, y_pos: floorPos_y - 380, size: 50, isFound: false },
        { x_pos: -410, y_pos: floorPos_y - 380, size: 50, isFound: false },
        { x_pos: -390, y_pos: floorPos_y - 380, size: 50, isFound: false },
        { x_pos: -370, y_pos: floorPos_y - 380, size: 50, isFound: false },
        { x_pos: 280, y_pos: floorPos_y - 450, size: 50, isFound: false },
        { x_pos: 360, y_pos: floorPos_y - 300, size: 50, isFound: false },
        { x_pos: 900, y_pos: floorPos_y - 300, size: 50, isFound: false },
        { x_pos: 1047, y_pos: floorPos_y - 300, size: 50, isFound: false },
        { x_pos: 2050, y_pos: floorPos_y - 300, size: 50, isFound: false },
        { x_pos: 2675, y_pos: floorPos_y - 300, size: 50, isFound: false },
        { x_pos: 3000, y_pos: floorPos_y - 300, size: 50, isFound: false }
    ];

    // Initialize canyons
    canyons = [
        { x_pos: -400, width: 390 },
        { x_pos: 80, width: 70 },
        { x_pos: 1280, width: 70 },
        { x_pos: 1380, width: 50 },
        { x_pos: 2540, width: 50 },
        { x_pos: 2840, width: 40 },
        { x_pos: 2940, width: 40 },
        { x_pos: 3000, width: 40 },
        { x_pos: 3100, width: 60 }
    ];

    // Initialize tree positions with random X-coordinates
    treePos_x = [
        random(200, 250), random(270, 300), random(340, 410),
        1180, 1220, 1460, 1500, 1530, 1800, 1850, 3200, 3270, 3300, 3370, 3430
    ];
    treePos_y = height / 2;  // Trees' vertical position

    // Initialize clouds with random positions and sizes
    clouds = [];
    let numClouds = 8;
    let startX = -400;
    for (let cloudIndex = 0; cloudIndex < numClouds; cloudIndex++) {
        let cloudY = random(-4, 10);
        let cloudSize = random(0.8, 1);
        clouds.push({ x_pos: startX, y_pos: cloudY, size: cloudSize });
        startX += random(60, 1000);
    }
    cloudMovement = 0;  // Cloud movement control

    // Initialize mountains
    mountains = [
        { x_pos: 310, y_pos: 0, size: 1 },
        { x_pos: 1370, y_pos: 0, size: 1 },
        { x_pos: 1570, y_pos: 0, size: 1 }
    ];

    // Initialize background mountains
    backgroundMountains = [];
    backgroundMountains.push(new BackgroundMountain(280, floorPos_y, [
        { x: 253, y: 92 }, { x: 387, y: 43 }, { x: 568, y: 143 },
        { x: 679, y: 71 }, { x: 796, y: 102 }, { x: 887, y: 40 }
    ]));
    backgroundMountains.push(new BackgroundMountain(1580, floorPos_y, [
        { x: 253, y: 92 }, { x: 387, y: 43 }, { x: 568, y: 143 },
        { x: 679, y: 71 }, { x: 796, y: 102 }, { x: 887, y: 40 }
    ]));
    backgroundMountains.push(new BackgroundMountain(3300, floorPos_y, [
        { x: 253, y: 92 }, { x: 387, y: 43 }, { x: 568, y: 143 },
        { x: 679, y: 71 }, { x: 796, y: 102 }, { x: 887, y: 40 }
    ]));

    // Initialize towers
    towers = [];
    towers.push(new Tower(1650, floorPos_y - 70));

    // Initialize drones
    drones = [];
    drones.push(new Drone(2100, floorPos_y - 45, 2.3));
    drones.push(new Drone(2560, floorPos_y - 40, 2.5));
    drones.push(new Drone(3075, floorPos_y - 50, 3));

    // Initialize platforms
    platforms = [];
    platforms.push(new Platform(-130, floorPos_y - 80, 130, 15));
    platforms.push(new Platform(650, floorPos_y - 80, 130, 15));
    platforms.push(new Platform(520, floorPos_y - 150, 130, 15));

    // Initialize breathing effect variables for game character
    breathAmount = 0;
    breathDirection = 1;

    // Initialize camera position
    cameraPosX = 0;

    // Initialize game score and flagpole state
    game_score = 0;
    flagpole = { isReached: false, x_pos: 3700 };

    // Initialize character state and timer
    state = "left";
    timer = 0;

    // Initialize lives display position
    livesPosition = { x_pos: 20, y_pos: 50 };
}


function checkPlayerDie() {
    // Check if the character has fallen below the bottom of the canvas or hit by a bullet
    if (gameChar_y > height || isPlayerHitByBullet()) {
        lives--; // Decrement lives

        // Stop background sound when player dies
        backgroundSound.stop();

        // Check if there are lives remaining
        if (lives > 0) {
            startGame(); // Restart the game
            deathSound.play(); // Play death sound
            backgroundSound.loop(); // Restart background sound
        } else {
            // Handle game over scenario
            isGameOver = true;
            console.log("Game Over!");
        }
    }
}

// Function to check if the player is hit by a bullet
function isPlayerHitByBullet() {
    // Iterate through all drones and their bullets
    for (let i = 0; i < drones.length; i++) {
        let drone = drones[i];
        for (let j = 0; j < drone.bullets.length; j++) {
            let bullet = drone.bullets[j];

            // Check if bullet is close enough to the player
            if (dist(bullet.x, bullet.y, gameChar_x, gameChar_y) < 20) {
                return true; // Player is hit
            }
        }
    }
    return false; // No bullet hit detected
}

// Function to draw the remaining lives on the screen
function drawLives() {
    for (let i = 0; i < lives; i++) {
        // Draw each life icon in a row
        image(livesIcon, livesPosition.x_pos + i * 30, livesPosition.y_pos, 20, 20);
    }
}


// Constructor function to create a new Drone object
function Drone(x, y, speed) {
  // Initialize properties for each drone instance
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.bullets = [];
  this.fireTimer = 0;
  this.lives = 5; // Set the number of lives for the drone

  // Method to draw the drone
  this.draw = function() {
    // Draw flame under the drone
    this.drawFlame();

    // Body
    fill(180); // Light metallic grey
    stroke(100); // Darker edges
    strokeWeight(2.5); // Half of the original stroke weight
    beginShape(); // Custom shape for the body
    vertex(this.x - 25, this.y); // Half of the original width
    vertex(this.x - 10, this.y - 15); // Half of the original height
    vertex(this.x + 10, this.y - 15);
    vertex(this.x + 25, this.y);
    vertex(this.x + 15, this.y + 15);
    vertex(this.x - 15, this.y + 15);
    endShape(CLOSE);

    // Shadow
    fill(120);
    noStroke();
    beginShape();
    vertex(this.x - 22.5, this.y + 2.5);
    vertex(this.x - 7.5, this.y - 12.5);
    vertex(this.x + 7.5, this.y - 12.5);
    vertex(this.x + 22.5, this.y + 2.5);
    vertex(this.x + 15, this.y + 17.5);
    vertex(this.x - 15, this.y + 17.5);
    endShape(CLOSE);

    // Cockpit
    fill(20); // Darker cockpit
    noStroke();
    ellipse(this.x, this.y - 5, 20, 10); // Half of the original cockpit size

    // Cockpit Reflection
    fill(255, 255, 255, 120); // Transparent white
    ellipse(this.x + 5, this.y - 6, 7.5, 4); // Reflection, scaled down

    // Side Guns
    fill(80);
    stroke(50);
    strokeWeight(1.5);
    rect(this.x - 30, this.y + 2.5, 10, 5, 2.5); // Left gun base
    rect(this.x + 20, this.y + 2.5, 10, 5, 2.5); // Right gun base

    // Gun Barrels
    fill(60);
    rect(this.x - 35, this.y + 3.5, 5, 3); // Left barrel
    rect(this.x + 30, this.y + 3.5, 5, 3); // Right barrel

    // Antennas
    stroke(150);
    strokeWeight(1);
    line(this.x - 5, this.y - 15, this.x - 12.5, this.y - 25); // Left antenna
    line(this.x + 5, this.y - 15, this.x + 12.5, this.y - 25); // Right antenna

    // Antenna tips
    fill(255, 0, 0); // Red for visibility
    noStroke();
    ellipse(this.x - 12.5, this.y - 25, 2.5, 2.5); // Left tip
    ellipse(this.x + 12.5, this.y - 25, 2.5, 2.5); // Right tip

    // Sensor at the bottom
    fill(100);
    stroke(70);
    ellipse(this.x, this.y + 17.5, 7.5, 5); // Rounded sensor, scaled down
    
    // Bottom Shadow
    fill(90);
    noStroke();
    ellipse(this.x, this.y + 19, 6, 3.5); // Shadow under the sensor, scaled down
  };

  // Method to draw the flame
  this.drawFlame = function() {
    // Draw flame effect under the drone
    fill(255, 100, 0, 150); // Orange flame
    noStroke();
    beginShape();
    vertex(this.x, this.y + 15);
    vertex(this.x - 5, this.y + 25);
    vertex(this.x, this.y + 32.5);
    vertex(this.x + 5, this.y + 25);
    endShape(CLOSE);

    fill(255, 255, 0, 150); // Yellow flame
    beginShape();
    vertex(this.x, this.y + 17.5);
    vertex(this.x - 2.5, this.y + 25);
    vertex(this.x, this.y + 30);
    vertex(this.x + 2.5, this.y + 25);
    endShape(CLOSE);
  };

  // Method to move the drone
  this.move = function() {
    this.y += this.speed;

    // Reverse direction when the drone goes out of bounds
    if (this.y > floorPos_y + 25 || this.y < floorPos_y - 50) {
        this.speed *= -1;
    }

    // Calculate the distance between the drone and the game character
    let distanceToCharacter = dist(this.x, this.y, gameChar_x, gameChar_y);

    // Fire a bullet only if the game character is within a certain distance
    if (distanceToCharacter < 400 && this.y > floorPos_y - 16 && this.speed > 0 && frameCount - this.fireTimer > 30) {
        this.fireBullets();
        this.fireTimer = frameCount;
    }
};

  // Method to fire bullets
  this.fireBullets = function() {
    // Create bullets moving left and right
    this.bullets.push({ x: this.x - 35, y: this.y + 3.5, dir: -1 });
    this.bullets.push({ x: this.x + 35, y: this.y + 3.5, dir: 1 });
	  
	// Play bullet sound
    bulletSound.play();
  };

  // Method to handle bullets
  this.handleBullets = function() {
    // Draw and move bullets
    fill(255, 50, 50); // Red bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let b = this.bullets[i];
      rect(b.x, b.y, 5, 2.5); // Scale down bullets
      b.x += b.dir * 5;
      
      // Remove bullets that go off screen or move far from the drone
      if (b.x < this.x - width || b.x > this.x + width) {
        this.bullets.splice(i, 1);
      }
    }
  };
	// To be revised - drone should blink when hit and shrink when destroyed -
	
	Drone.prototype.blink = function() {
  this.isBlinking = true;
  setTimeout(() => this.isBlinking = false, 200); // Blink for 200 ms
};

Drone.prototype.destroy = function() {
  // Play destroy sound
  destroySound.play();

  // Shrink and then remove the drone
  this.isShrinking = true;
  setTimeout(() => {
    // Remove drone after shrinking
    drones.splice(drones.indexOf(this), 1);
    this.isShrinking = false;
  }, 500); // Shrink duration
};

Drone.prototype.draw = function() {
  if (this.isBlinking) {
    fill(255, 0, 0); // Blink color
    ellipse(this.x, this.y, 20, 20);
  } else if (this.isShrinking) {
    fill(180, 180, 180); // Shrink color
    ellipse(this.x, this.y, 15, 15);
  } else {
    // Regular drawing code for drone
    fill(180);
    stroke(100);
    strokeWeight(2.5);
    ellipse(this.x, this.y, 30, 30); // Example drone shape
  }
};
		
}

//background mountain
function BackgroundMountain(startX, floorPos_y, peaks) {
    this.startX = startX;
    this.floorPos_y = floorPos_y;
    this.peaks = peaks;

    this.drawBackgroundMountain = function() {
        beginShape();
        fill(15, 15, 15);
        curveVertex(this.startX, this.floorPos_y);  // start point

        // Draw the mountain peaks and dips
        for (let peakIndex = 0; peakIndex < this.peaks.length; peakIndex++) {
            let peak = this.peaks[peakIndex];
            curveVertex(this.startX + peak.x, this.floorPos_y - peak.y);
        }

        curveVertex(this.startX + this.peaks[this.peaks.length - 1].x, this.floorPos_y);  // end point
        curveVertex(this.startX + this.peaks[this.peaks.length - 1].x, this.floorPos_y);  // end point
        endShape(CLOSE);
    };
}

function Tower(baseX, baseY) {
    this.baseX = baseX;
    this.baseY = baseY;

    this.drawTower = function() {
        // Tower base
        fill(40, 40, 40); // bottom base earthly brown
        rect(this.baseX, this.baseY, 40, 12, 3, 3, 3, 3);

        // Tower body
        fill(10, 20, 30); // top central - inside tower
        stroke(40, 40, 40);
        strokeWeight(3);
        rect(this.baseX + 5, this.baseY - 18, 30, 18);

        // Roof
        fill(40, 40, 40); // roof
        triangle(this.baseX - 9, this.baseY - 18, 
                 this.baseX + 20, this.baseY - 45, 
                 this.baseX + 49, this.baseY - 18);

        // Tower stands
        strokeWeight(4);
        line(this.baseX + 13, this.baseY + 12, this.baseX, this.baseY + 66); // left stand
        line(this.baseX + 27, this.baseY + 12, this.baseX + 40, this.baseY + 66); // right stand

        // Tower basement
        rect(this.baseX - 22, this.baseY + 67, 84, 3);
        rect(this.baseX - 3, this.baseY + 60, 7, 5); // left basement block
        rect(this.baseX + 35, this.baseY + 60, 7, 5); // right basement block

        // Leader
        strokeWeight(2);
        line(this.baseX + 12, this.baseY + 12, this.baseX + 12, this.baseY + 67); // left leg
        line(this.baseX + 27, this.baseY + 12, this.baseX + 27, this.baseY + 67); // right leg
        line(this.baseX + 12, this.baseY + 24, this.baseX + 27, this.baseY + 24); // top step
        line(this.baseX + 12, this.baseY + 35, this.baseX + 27, this.baseY + 35); // steps
        line(this.baseX + 12, this.baseY + 46, this.baseX + 27, this.baseY + 46); // steps
        line(this.baseX + 12, this.baseY + 57, this.baseX + 27, this.baseY + 57); // bottom step

        // Tower shade
        fill(10, 10, 10, 50);
        noStroke();
        triangle(this.baseX - 3, this.baseY + 68, 
                 this.baseX + 42, this.baseY + 71, 
                 this.baseX + 27, this.baseY + 78);
    };
}

//Laser attributes -  properties and behaviors of the lasers
function Laser(x, y, direction) {
  this.x = x;
  this.y = y;
	this.startX = x; 
  this.direction = direction; 
  this.width = 10;
  this.height = 3;
  this.maxRange = 420; 

  // Method to draw the laser
  this.draw = function() {
    fill(0, 255, 0); 
    noStroke();
    rect(this.x, this.y, this.width, this.height);
  };

  // Method to move the laser
  this.move = function() {
    this.x += this.direction * 10; 
  };
	
	// Method to check if the laser has traveled too far (based on its starting point)
  this.isOffScreen = function() {
    let distanceTraveled = abs(this.x - this.startX);
	  console.log('Laser distance traveled:', distanceTraveled); 
    return distanceTraveled > this.maxRange; 
	  
  };
}

// update the laser position and remove them if they go out of bounds:
function updateLasers() {
  // Loop through all lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].move(); 
    lasers[i].draw(); 

    // Check if the laser has traveled beyond its maximum range
    if (lasers[i].isOffScreen()) {
      lasers.splice(i, 1); 
    }
  }
}

//fire lasers when the Enter key is pressed
function fireLaser() {
  // Only fire the laser if the character is moving left or right
  if (isRight || isLeft) {
    let laserDirection = isRight ? 1 : -1; 
    let laserX = gameChar_x + (laserDirection * 10); 
    let laserY = gameChar_y - 45; 
    lasers.push(new Laser(laserX, laserY, laserDirection)); 

    // Play laser firing sound
    laserSound.play();
  }
}

// Detect collisions between lasers and drones
function checkLaserDroneCollisions() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    for (let j = 0; j < drones.length; j++) {
      let drone = drones[j];

      // Check collision with drone
      if (lasers[i].x + lasers[i].width > drone.x - 15 &&
          lasers[i].x < drone.x + 15 &&
          lasers[i].y + lasers[i].height > drone.y - 15 &&
          lasers[i].y < drone.y + 15) {

        lasers[i].isHit = true;
        handleDroneHit(drone);
        lasers.splice(i, 1);
        break;
      }
    }
  }
}

// function to handle the drone’s response to being hit and manage its health

function handleDroneHit(drone) {
  drone.lives--; // Reduce drone's lives

  // Play hit sound and make drone blink
  hitSound.play();
  drone.blink();

  if (drone.lives <= 0) {
    // Drone is destroyed
    drone.destroy();
  }
}

// Define a constructor for platforms
function Platform(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Method to draw the platform
    this.draw = function() {
    // Darker metallic base
  fill(70, 70, 70); 
  rect(x, y, width, height);

  // Rust patches
  noStroke();
  fill(100, 55, 40); 
  ellipse(x + 50, y + 8, 10, 5); 
  ellipse(x + 100, y + 8, 18, 5); 
  
  fill(80); 
  let rivetSize = 10;
  for (let i = x + 20; i < x + width; i += 50) {
    ellipse(i, y + 10, rivetSize, rivetSize); 
    ellipse(i, y + height - 10, rivetSize, rivetSize); 
  }
  
  stroke(40); 
  strokeWeight(2);
  for (let i = x + 20; i < x + width- 20; i += 40) {
    line(i, y + 10, i, y + height - 10); // Vertical lines along the platform
  }

  noStroke();
  fill(255, 255, 255, 50); 
  quad(x, y, x + width, y, x + width - 30, y + 10, x + 30, y + 10);
    };
}

// draw platform function, render the platforms
function drawPlatforms() {
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].draw();
    }
}

//function to check pltform collision
function checkPlatformCollision() {
    for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];

        // Check if the character is within the platform's width and near its height
        if (
            gameChar_x > platform.x && gameChar_x < platform.x + platform.width &&
            gameChar_y >= platform.y && gameChar_y <= platform.y + 10
        ) {
            gameChar_y = platform.y; 
            isFalling = false;       
        }
    }
}

// Function to check if the character is standing on a platform
function isOnPlatform() {
    for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];
        
        // Check if character is within platform bounds and near its top surface
        if (gameChar_x > platform.x && gameChar_x < platform.x + platform.width &&
            gameChar_y >= platform.y && gameChar_y <= platform.y + 10) {
            return true;
        }
    }
    return false;
}

// function for help screen
function drawHelpScreen() {
    // Draw help box
    fill(0, 0, 0, 200); // Semi-transparent black background for the help box
    rect(50, 50, 400, 200); // Help box

    // Draw help text
    fill(255); 
    textSize(18);
    textAlign(LEFT, TOP);
    text("Instructions:", 70, 70);
    text("A: Move Left", 70, 100);
    text("D: Move Right", 70, 130);
    text("W: Jump", 70, 160);
    text("Enter Key While Moving: Fire Laser", 70, 190);
    text("Press 'H' to hide this screen.", 70, 220);
}


// Function to display the mission briefing
function displayMissionBrief() {
    fill(255); 
    textSize(24);
    textAlign(CENTER, CENTER);

    // Display the current line of the mission briefing
    text(missionBrief[currentMissionLine], width / 2, height / 2);

    // Display instructions for the player
    textSize(16);
    text("Press Enter for the next line or ESC to skip.", width / 2, height / 2 + 50);
}

// Function to draw the spacecraft
function drawSpacecraft(x, y) {
  noStroke();

  // Main metallic body
  fill(170, 170, 170); 
  ellipse(x, y, 120, 60);

  // Add depth to the main body (shadow effect on the bottom half)
  fill(100, 100, 100, 180); 
  ellipse(x, y + 10, 120, 50); 

  // Dome of the spacecraft (with a metallic shine)
  fill(120, 255, 120); 
  ellipse(x, y - 20, 60, 40);

  // Dome highlight for added depth
  fill(255, 255, 255, 50); 
  ellipse(x + 10, y - 25, 30, 15); 

  // Windows with a tinted glass effect
  fill(50, 50, 150, 180); 
  ellipse(x - 30, y, 15, 15); 
  ellipse(x, y, 15, 15); 
  ellipse(x + 30, y, 15, 15); 

  // Adding depth to windows with highlights
  fill(255, 255, 255, 80); 
  ellipse(x - 32, y - 2, 5, 5); 
  ellipse(x - 2, y - 2, 5, 5);  
  ellipse(x + 28, y - 2, 5, 5); 

  // Reflection on the main body (for metallic look)
  fill(255, 255, 255, 50); 
  quad(x - 40, y - 5, x + 40, y - 5, x + 30, y, x - 30, y); 
}

// Function to draw the flame behind the spacecraft
function drawFlame(x, y) {
  noStroke();
  fill(255, 150, 0); 
  ellipse(x, y + 10, 30, 20); 

  fill(255, 100, 0, 180); 
  ellipse(x - 10, y + 10, 25, 15);

  fill(255, 50, 0, 120); 
  ellipse(x - 20, y + 10, 20, 10); 
}

// Function to generate new smoke particles
function generateSmoke() {
  let smoke = {
    x: spaceshipX - 60, 
    y: spaceshipY + 10,
    size: random(10, 30),
    speedY: random(-1, -3), 
    alpha: 255, 
  };
  smokeParticles.push(smoke); 
}

// Function to draw the smoke particles
function drawSmoke() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    let smoke = smokeParticles[i];

    noStroke();
    fill(100, 100, 100, smoke.alpha); 
    ellipse(smoke.x, smoke.y, smoke.size);

    smoke.y += smoke.speedY; 
    smoke.alpha -= 2; 

    if (smoke.alpha <= 0) {
      smokeParticles.splice(i, 1);
    }
  }
}
