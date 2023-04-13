/*
controls:
wasd - movement and menu nav
enter - menu confirm
space - pause
space + backspace: back to menu
*/
//_____________________________________
//      G A M E  S E T T I N G S       |
//                                     |
let usePacmanSprites = false;//        |
let ghostsRamp = 4 //amount of ghosts  |
//needing to be eaten to speed ramp up |
let gameSpeed = 0.09//                 |
//speed at which the game runs         |
//(not framerate)                      |
let speedIncreaseAmount = 0.01//       |
//how fast it increases                |
let useExternalStorage={pacman: true,//|
  inky: true, blinky: true};//       |
//_____________________________________|

var dotMax = 0;
let loadingPacSprites = false;
var imgTestY = 0
var uselessImgs = [];
const imgBase = 'https://storage.getpacman.gq/';
//For some reason, replit return an error if all sprites are acessed from it.
//To fix this, many sprites are acessed from storage.getpacman.gq instead.
var pause_beat = "https://freepacman.org/app/style/audio/pause_beat.mp3"
var dieS = "https://freepacman.org/app/style/audio/death.mp3";
//var startSound = "https://freepacman.org/app/style/audio/game_start.mp3";
var dotSound1 = "https://freepacman.org/app/style/audio/dot_1.mp3";
var dotSound2 = "https://freepacman.org/app/style/audio/dot_2.mp3";
var fruitSound = "https://freepacman.org/app/style/audio/fruit.mp3";
//var extra_life = "https://freepacman.org/app/style/audio/extra_life.mp3";
var pauseSound = "https://freepacman.org/app/style/audio/pause.mp3";

let CELL = 32 //cell size defaults to 16
let anchor = 0 //anchor for top left of game board (used later)
let debug = false //show debug stuffs
let input = [] //list of keys pressed
let directions = { //controls
	"d":0, 
	"w":1, 
	"a":2, 
	"s":3
}
let frameCount = 0;
let startMillis = 0;
let arrowDirections = { //controls
	"ArrowRight":0, 
	"ArrowUp":1, 
	"ArrowLeft":2, 
	"ArrowDown":3
}
let directionVectors = [] //direction vectors (used in setup function)
let ticks = 0 //game ticks passed
var dotWave = false; //wavey dots can cause lag so its disabled by default
var dotWave2 = false
let lives = 3 //pacmans lives
let p //the player variable
let stopped = true //is the game stopped?
let paused = false //is the game paused? (by the player or an unfocus event)
let gateText = "" //text below the pen
let intro = true //am I in the intro sequence?
let introTicks = 0 //how long has the intro been happening?
let level = 1 //the current level
let font //font (used later)
let fright = 0 //how long a power pellet has left
let frightScore = 200 //score for eating a ghost
let texts = [] // list of display text instances
let score = 0 //score of the player
let gameState = "menu"
let livesEnabled = true
let dotRamp = true
let dotScore = 10
let dotsToRamp = 10
let startLevel = 1
let speedRamp = 0
let rampValues = ["off", "ghost", "level"] //off = no ramp, ghost = ramp up on ghost eaten, level = ramp up on level progression


let EI = useExternalStorage.inky;
// use external inky sprites
let EB = useExternalStorage.blinky;
// use external blinky sprites
let EP = useExternalStorage.pacman;
// use external pacman sprites

let sprites
let FPS = 60;
let useSprites = true
let loaded = true
let startSpeed = 0.1
let fruitSpawn = [0, 0]
let penLoc = [0, 0] //ghost pen location
let useModulo = true
let failLoad = false
let pTicks = 0;
let move = true
let dieEndImg;
function toBool(string){
  return string == "true" ? true : false
}

if (localStorage.getItem("settings") == null){
	localStorage.setItem("settings", true)
	localStorage.setItem("dotWave", String(dotWave))
	localStorage.setItem("livesEnabled", String(livesEnabled))
	localStorage.setItem("startLevel", startLevel)
	localStorage.setItem("speedRamp", speedRamp)
	localStorage.setItem("speedIncreaseAmount", speedIncreaseAmount)
  localStorage.setItem("useSprites", true)
  localStorage.setItem("useModulo", true)
}else{
  useModulo = toBool(localStorage.getItem("useModulo"))
	dotWave = toBool(localStorage.getItem("dotWave"))
	livesEnabled = toBool(localStorage.getItem("livesEnabled"))
	startLevel = Number(localStorage.getItem("startLevel"))
	speedRamp = Number(localStorage.getItem("speedRamp"))
	speedIncreaseAmount = Number(localStorage.getItem("speedIncreaseAmount"))
  useSprites = toBool(localStorage.getItem("useSprites"))
}

window.onkeydown = ({key}) => { //on key down
	if (!input.includes(key)){ //if key not already in list
		input.push(key) //add it to the list
	}
	if (key == " "){ //if key space: pause
		pause()
	}
}

function pause(value = null){ //set paused
	paused = value == null ? !paused : value
	gateText = paused ? "paused!" : ""
}

function play(sound) {
  let audio = new Audio(sound);
  audio.play();
}


window.onkeyup = ({key}) => {// on key up
	input.splice(input.indexOf(key), 1) //remove key from list
}

window.onresize = () => { //on resize
	resizeCanvas(window.innerWidth, window.innerHeight) //resize the canvas to window size
	CELL = window.innerHeight/23//adjust the cell size
  
  CELL = round(CELL/4)*4;
	anchor = ((window.innerWidth/CELL)/2) - (14) //re-anchor the game
	for (let i of dots){
		i.redoDisp()
	}
	for (let i of walls){
		i.redoDisp()
	}
}

window.onblur = () => { //when unfocused the game pauses forcably
	pause(true)
}

class dispText{ //display text
	constructor(t, x, y, time=500, size=1){
		this.text = t //text
		this.pos = dispCoords(createVector(x, y), true) //where is it?
		this.time = time //how long it should display?
		texts.push(this) //add it to the list
		this.size = size  
	}
	show(){ //display
		textSize(this.size*CELL)
		this.time -= deltaTime //reduce display time
		if (this.time <= 0){ //remove self from list when done displaying self
			texts.splice(texts.indexOf(this), 1)
		}
		fill(0xff) //fill white
		text(this.text, this.pos.x, this.pos.y) //display the text
	}
}

function dispCoords(v, center = false){ //get display coordinates
	vec = createVector(0, 0) //copy the vector so original isn't modified
	vec.set(v)
	vec.x = (anchor+vec.x+(0.5*center))*CELL
	vec.y = (vec.y+(0.5*center))*CELL
	return vec //return the new value
}

dots = [] //list of dots
class dot{ 
	constructor(x, y){
		this.pos = createVector(x, y)
		dots.push(this)
		this.disp = dispCoords(this.pos)
	}

	redoDisp(){
		this.disp = dispCoords(this.pos)
	}
	//delete
	show(){
    fill(0xff)
    noStroke()
    circle(this.disp.x, this.disp.y, CELL*0.3)
	}
}

class powerPellet extends dot{ //power pellets
	show(){
		let disp = dispCoords(this.pos)
		noStroke()
		fill(0xff, 0xff, 0xff, 255*(ticks % 60 < 30))
		circle(disp.x, disp.y, CELL*0.75)
	}
}

function reset(full=false){ //reset the game
	walls = [] //clear walls
	inters = [] //clear intersections
	tunnels = [] //clear tunnel instances
	ghosts = [] //clear ghosts
  introTicks = 0 //reset intro time
  intro = true
	if (full){ //if full
		dots = [] //clear dots
    if (lives <= 0){
      dotScore = 10
		  level = startLevel //reset level
      gameSpeed = startSpeed
      lives = 3 //reset lives
      score = 0
    }
	}
	fright = 0 //reset fright ticks
	setupMap(full) //reset map
  if (full){
    play("https://freepacman.org/app/style/audio/game_start.mp3");
  }
}
function ILE(event){
  console.log("Could not load image!");
  if(loadingPacSprites){
    usePacmanSprites = false;
    EP = !EP;
    useExternalStorage.pacman = !useExternalStorage.pacman;
    dieEndImg = loadImage(`${EP ? imgBase : "/"}pacman/death/10.png`, ILS, ILE);
    
    
    game();
  }
}
function ILS(img){
  console.log("Image loaded sucessfully");
}
function preload(){ 
  //preload the custom pacman font :)
	font = loadFont("font.ttf")
  //images in order of RIGHT, UP, LEFT, DOWN
  
    
    sprites = {
      "blinky":[
        loadImage(`/ghost/blinky/right.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/right2.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/up.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/up2.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/left.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/left2.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/down.svg`, ILS, ILE), 
        loadImage(`/ghost/blinky/down2.svg`, ILS, ILE) 
      ], 
      "pinky":[
        loadImage(`${imgBase}ghost/pinky/right.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/pinky/right2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/pinky/up.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/pinky/up2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/pinky/left.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/pinky/left2.svg`, ILS, ILE),   
        loadImage(`${imgBase}ghost/pinky/down.svg`, ILS, ILE),     
        loadImage(`${imgBase}ghost/pinky/down2.svg`, ILS, ILE)
      ], 
      "inky":[
        loadImage(`${imgBase}ghost/inky/right.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/right2.svg`, ILS, ILE), 
        loadImage(`/ghost/inky/up.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/up2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/left.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/left2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/down.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/inky/down2.svg`, ILS, ILE), 
      ], 
      "clyde":[
        loadImage(`${imgBase}ghost/clyde/right.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/right2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/up.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/up2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/left.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/left2.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/down.svg`, ILS, ILE), 
        loadImage(`${imgBase}ghost/clyde/down2.svg`, ILS, ILE)
      ], 
      "fright":[
        loadImage("/ghost/fright/blue.svg", ILS, ILE), 
        loadImage("/ghost/fright/blue2.svg", ILS, ILE), 
        loadImage("/ghost/fright/white.svg", ILS, ILE), 
        loadImage("/ghost/fright/white2.svg", ILS, ILE)
      ], 
      "eyes":[
        loadImage(`/ghost/eyes/right.svg`, ILS, ILE), 
        loadImage(`/ghost/eyes/up.svg`, ILS, ILE), 
        loadImage(`/ghost/eyes/left.svg`, ILS, ILE), 
        loadImage(`/ghost/eyes/down.svg`, ILS, ILE) 
      ]
    }
    loadingPacSprites = true;
    dieEndImg = loadImage(`${EP ? imgBase : "/"}pacman/death/10.png`, ILS, ILE);
    if(usePacmanSprites){
      setTimeout(() => { //load seperately to avoid 429 too many requests
        sprites.pacwalk = [
          loadImage(`${imgBase}sprites/pacman/normal/0.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/00.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/01.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/10.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/11.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/20.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/21.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/30.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/normal/31.png`, ILS, ILE)
        ]
        sprites.pacdeath = [
          loadImage(`${EP ? imgBase : "/"}pacman/death/0.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/1.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/2.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/3.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/4.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/5.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/6.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/7.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/8.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/9.png`, ILS, ILE), 
          loadImage(`${EP ? imgBase : "/"}pacman/death/10.png`, ILS, ILE)
        ]
        loaded = true
      }, 1000)
    }else{
      loaded = true;
    }
  
  }


function setup(){ //setup the game
  background(255);
  fill(0);
  text("Loading...", 200, 200);
	resizeCanvas(window.innerWidth, window.innerHeight) //resize canvas to window size
	strokeWeight(1) //set line weight for text mainly
	window.onresize() //call window resize event to set up cell size and anchor
	directionVectors = [createVector(1, 0), createVector(0, -1), createVector(-1, 0), createVector(0, 1)] //set direction vectors
	reset(true) //reset the map for the first time
	angleMode(DEGREES) //set angle mode
	textFont(font) //use the pacman font
	textAlign(CENTER, CENTER) //align text centered
  noSmooth()
  imageMode(CENTER)
  startMillis = millis();
  noStroke();
  console.log(dots.length);
  dotMax = dots.length;
}

function draw(){
  frameCount++;
  if (!loaded && !failLoad){ 
    background(255);
    text("Load sucess!", width/2, height/2);
    return
  }else if (failLoad){
    useSprites = false
    console.log("Failed to load sprites.")
  }
	if (gameState == "game"){
		game();
    
	}
	if (gameState == "menu"){
		gameState = "game";
	}
}
function showAll(){
  
  background(0)
  if (debug){ //if in debug mode draw intersections and tunnels 
		for (let i of inters){
			i.show();
		}
		for (let i of tunnels){
			i.show();
		}
	}
	fill(0x0, 0x0, 0xff) //fill with blue
	noStroke();//blue lines
	for (let i of walls){ //draw walls
		if (dots.length == 0 && ticks % 60 < 30){ //flash while if no dots
			fill(0xff, 0xff, 0xff);
			noStroke();
		}
		i.show(); //show the wall
	}
	for (let i of dots){ //show dots
		i.show();
	}
  noStroke();
	for (i of texts){ //show display texts
		i.show();
	}
  for (let i of ghosts){ //show ghosts
    i.show()
	}
  p.show();
}
function game(){ //mainloop
  background(0);
	ticks++ //count up ticks
 //make bg black
  if(paused){
    fill(255);
    background(16);
    textAlign(CENTER);
    text("Game Paused\nClick space to resume",width/2,height/2);
  }
  if(true){
  	if (intro){// if im in the intro
  		if (!paused){ //if im not paused
  			stopped = true //stop game
  			introTicks++//count up intro ticks
  			gateText = introTicks > 150 ? "Go!" : "Ready?" //set gate text
  		}
  		
  		if (introTicks > 180){ //end of intro
  			intro = false //not in intro anymore
  			introTicks = 0 //intro ticks reset
  			gateText = "" //gate text reset
  			stopped = false //not stopped anymore
  		}
  	}
  
  	if (paused && input.includes("Backspace")){
  		paused = false
      gateText = ""
  		gameState = "menu"
  	}
  	
  	if (!stopped && !paused){ //if not stopped or paused fright -= 1
  		fright -= 1
  	}
  	
    
  	for (let i of ghosts){ //update and show ghosts
  		if (!stopped && !paused){
  			i.update()
  		}
  	}
    
  	if (!stopped && !paused){ //update and show pacman
  		p.update()
  	}else if(p.dead){ //if pacman is dead run dead pacman code
  		p.die()
  	}
    if(!paused){
      showAll();
    }
  
    
  	if (!stopped && !paused){ //detect if no dots exist
  		if (dots.length == 0){
  			stopped = true //stop game
  			level++ //increase level
  			setTimeout(() => { // reset after a bit
  				stopped = false
  				reset(true)
  				intro = true
  				introTicks = 0
  				if (speedRamp == 2){
  					gameSpeed = min(gameSpeed + speedIncreaseAmount, 0.2)
  				}
  			}, 3000)
  		}
  	}
  	
  	noStroke() //no line full white
  	fill(0xff)
  	
  	textSize(CELL/2) //set text size
  	text(gateText, (anchor+13+0.5)*CELL, 16.5*CELL) //draw gate text
  
  	text(`level: ${level}`, ((anchor + textMap[0].length + 0.5) *CELL)-font.textBounds(`level: ${level}`, 0, 0, CELL/2).w, (textMap.length+ 0.5)*CELL)
  	text (`{${score}}`, window.innerWidth/2, (textMap.length+ 0.5)*CELL)
  
  
    FPS = frameCount/((millis()-startMillis)/1000);
  	fill(0xff)
  	if (FPS < 30){
  		fill(0xff, 0, 0)
  	}
  	//show framerate
    FPS = round(frameCount/((millis()-startMillis)/1000));
    text('FPS: '+ FPS, CELL*2, CELL)
    
  	noStroke();
  	textSize(CELL) //reset text size
  }
}