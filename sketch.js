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
var uploadedImage = null;
var imageColors = [];
var imagePixels = [];
var imageWidth = 0;
var imageHeight = 0;
var imageScale = 1;
var imageOffsetX = 0;
var imageOffsetY = 0;

// 监听图片上传
document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const imageUploadContainer = document.getElementById('imageUploadContainer');
    const leafColorSelect = document.getElementById('leafColor');

    leafColorSelect.addEventListener('change', function() {
        imageUploadContainer.style.display = this.value === 'image' ? 'block' : 'none';
    });

    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    uploadedImage = img;
                    imagePreview.style.backgroundImage = `url(${e.target.result})`;
                    imagePreview.style.display = 'block';
                    
                    // 计算图片缩放比例和偏移量
                    const maxWidth = windowWidth * 0.8;
                    const maxHeight = windowHeight * 0.8;
                    const scaleX = maxWidth / img.width;
                    const scaleY = maxHeight / img.height;
                    imageScale = Math.min(scaleX, scaleY);
                    imageWidth = img.width * imageScale;
                    imageHeight = img.height * imageScale;
                    imageOffsetX = (windowWidth - imageWidth) / 2;
                    imageOffsetY = (windowHeight - imageHeight) / 2;
                    
                    // 预采样图片像素
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    tempCtx.drawImage(img, 0, 0);
                    
                    // 存储图片像素信息
                    imagePixels = [];
                    imageColors = [];
                    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
                    for(let y = 0; y < img.height; y++) {
                        for(let x = 0; x < img.width; x++) {
                            const i = (y * img.width + x) * 4;
                            const r = imageData.data[i];
                            const g = imageData.data[i + 1];
                            const b = imageData.data[i + 2];
                            const a = imageData.data[i + 3];
                            // 只保存不透明的像素点
                            if(a > 128) {
                                imagePixels.push({x, y});
                                imageColors.push([r, g, b]);
                            }
                        }
                    }
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
});



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
    let x = leaf.pos.x;
    let y = leaf.pos.y;
    let leafColorSelect = document.getElementById('leafColor');
    let selectedColor = leafColorSelect.value;
    
    if (selectedColor === 'image' && imagePixels.length > 0) {
        // 将叶子位置映射到图片坐标系
        const imgX = (x - imageOffsetX) / imageScale;
        const imgY = (y - imageOffsetY) / imageScale;
        
        // 找到最近的图片像素点
        let minDist = Infinity;
        let nearestPixel = null;
        let nearestColor = null;
        
        for(let i = 0; i < imagePixels.length; i++) {
            const pixel = imagePixels[i];
            const dist = Math.sqrt(Math.pow(imgX - pixel.x, 2) + Math.pow(imgY - pixel.y, 2));
            if(dist < minDist) {
                minDist = dist;
                nearestPixel = pixel;
                nearestColor = imageColors[i];
            }
        }
        
        if(nearestPixel && minDist < 50) {
            // 使用最近像素点的颜色
            backgroundLayer.fill(nearestColor[0], nearestColor[1], nearestColor[2]);
            // 减小随机偏移范围，使叶子更贴近图片轮廓
            x = nearestPixel.x * imageScale + imageOffsetX + random(-2, 2);
            y = nearestPixel.y * imageScale + imageOffsetY + random(-2, 2);
            // 根据距离调整叶子大小，越近越小以呈现细节
            size = map(minDist, 0, 50, 2, 5);
        } else {
            // 如果离图片太远，让叶子消失
            arr.splice(index, 1);
            return;
        }
    } else if (selectedColor === 'green') {
        backgroundLayer.fill(random(50, 150), random(150, 255), random(50, 150));
        x += random(-50, 50);
        y += random(-50, 50);
    } else if (selectedColor === 'yellow') {
        backgroundLayer.fill(random(200, 255), random(200, 255), random(50, 150));
        x += random(-50, 50);
        y += random(-50, 50);
    } else if (selectedColor === 'red') {
        backgroundLayer.fill(random(200, 255), random(50, 100), random(50, 100));
        x += random(-50, 50);
        y += random(-50, 50);
    } else if (selectedColor === 'brown') {
        backgroundLayer.fill(random(139, 165), random(69, 95), random(19, 45));
        x += random(-50, 50);
        y += random(-50, 50);
    } else {
        backgroundLayer.fill(random(255), random(255), random(255));
        x += random(-50, 50);
        y += random(-50, 50);
    }
    
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
        // 增加叶子的持续时间，使其能更好地填充图片轮廓
        life: random(40, 100)
    }
}

function mod(m, n) {
    return ((m%n)+n)%n;
}