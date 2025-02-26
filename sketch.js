/******************
Code by Vamoss
Original code link:
https://www.openprocessing.org/sketch/873380

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

//Image from Caio Borges
//https://www1.folha.uol.com.br/serafina/2018/06/1969537-serafina-reproduz-com-marielle-capa-da-time-com-obama.shtml

var seeds = [];
var trees = [];
var leaves = [];

var ground, treeTop;
var firstClick = true;



function setup() {
	createCanvas(windowWidth, windowHeight);
	backgroundLayer = createGraphics(windowWidth, windowHeight);
	foregroundLayer = createGraphics(windowWidth, windowHeight);
	background(0);
	backgroundLayer.background(0);
	
	ground = height - 30;
	treeTop = height - 600;
	
	textAlign(CENTER, CENTER);
	textSize(40);
	fill(255);
	text("Click to drop seed", width/2, height/2);
}

function draw() {
  drawingContext.shadowBlur = 0;
  foregroundLayer.clear();

  if(firstClick) {
    foregroundLayer.textAlign(CENTER, CENTER);
    foregroundLayer.textSize(40);
    foregroundLayer.fill(255);
    foregroundLayer.text("Click to drop seed", width/2, height/2);
  }

  //SEEDS
  foregroundLayer.noStroke();
  foregroundLayer.fill(255);
  seeds.forEach((seed, index, arr) => {
    seed.y+=3;
    if (seed.y > ground) {
      //transform seed in tree
      arr.splice(index, 1);
      trees.push(createTree(seed.x, ground));
    }else{
      foregroundLayer.ellipse(seed.x, seed.y, 10, 10);
    }
  });
	
	//BRANCHS
	noStroke();
	trees.forEach((tree, index, arr) => {
		tree.dir += (noise(tree.phase + millis()/100) - 0.5) / 3;
		tree.dir += (PI - tree.dir) * 0.09 / (tree.generation + 1);//point north
		tree.pos.x += sin(tree.dir) * 2;
		tree.pos.y += cos(tree.dir) * 2;
		backgroundLayer.fill(255, 255, 255, 255);
		backgroundLayer.ellipse(tree.pos.x, tree.pos.y, tree.radius * 2, tree.radius * 2);
		
		//shadow the branch
		backgroundLayer.fill(0, 0, 0, 100);
		for(var i = 0; i < PI; i += PI/10){
			let x = cos(i) * tree.radius;
			let y = sin(i) * tree.radius;
			backgroundLayer.ellipse(tree.pos.x + x, tree.pos.y + y, i, i);
		}
		
		tree.radius *= 0.998 / (tree.generation/300 + 1);
		
		tree.life--;
		if(tree.life < 0){
			arr.splice(index, 1);
			if(tree.radius > 3){
				//transform root in branchs
				trees.push(createTree(tree.pos.x, tree.pos.y, tree));
				trees.push(createTree(tree.pos.x, tree.pos.y, tree));
			}else{
				//transform final branch in leaves
				leaves.push(createLeaf(tree.pos.x, tree.pos.y));
			}
		}
	});
	
	//LEAVES - 在背景层绘制
	backgroundLayer.noStroke();
	backgroundLayer.drawingContext.shadowColor = color(0,0,0,100);
	backgroundLayer.drawingContext.shadowBlur = 5;
	leaves.forEach((leaf, index, arr) => {
		var x = leaf.pos.x + random(-50, 50);
		var y = leaf.pos.y + random(-50, 50);
		backgroundLayer.fill(random(255), random(255), random(255));
		var size = random(3, 10);
		backgroundLayer.push();
			backgroundLayer.translate(x, y);
			backgroundLayer.rotate(random(TWO_PI));
			backgroundLayer.rect(0, 0, size, size, 0, size / 2, 0, size / 2);
		backgroundLayer.pop();
		
		leaf.life--;
		if(leaf.life < 0){
			arr.splice(index, 1);
		}
	});
	
	// 将背景层和前景层绘制到主画布
	image(backgroundLayer, 0, 0);
	image(foregroundLayer, 0, 0);
}

function mousePressed(){
	if(firstClick){
		firstClick = false;
		background(0);
	}
	seeds.push(createVector(mouseX, mouseY));
}

function mouseDragged(){
	seeds.push(createVector(mouseX, mouseY));
}

function createTree(x, y, root){
	if(!root) {
		root = {
			pos: createVector(x, y),
			dir: PI,
			radius: random(10, 30),
			generation: 0
		}
	}
	var tree = {
			pos: root.pos.copy(),
			phase: random(1000),
			dir: root.dir,
			radius: root.radius,
			life: random(30, 120) / (root.generation / 10 + 1),
			generation: root.generation + 1
	};
	return tree;
}

function createLeaf(x, y){
	return {
		pos: createVector(x, y),
		life: random(20, 60)
	}
}

function mod(m, n) {
    return ((m%n)+n)%n;
}