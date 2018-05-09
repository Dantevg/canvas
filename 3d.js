// Constants
var FPS = 60
var randomseed = 1234
var width = 10
var length = 10
var spd = 0.02
var rotSpd = 0.005





// Variables
var camera = {
	rx: -1,
	ry: 0,
	rxSpd: 0,
	rySpd: 0,
	
	x: 0,
	y: 0,
	z: 1,
	xSpd: 0,
	ySpd: 0,
	zSpd: 0,
	
	zoom: 300,
}

var mouse = {
	x: 0,
	y: 0,
	dx: 0,
	dy: 0,
	left: false,
	right: false,
}

var keys = {}

var selectedPoint;
var frame = 0

var points = []
var triangles = []





// Class functions
function Point(x, y, z){
	this.x = x
	this.y = y
	this.z = z
	
	this.reset = function(){
		this.rotationX = this.x
		this.rotationY = this.y
		
		this.translationX = this.x
		this.translationY = this.y
		this.translationZ = this.z
		
		this.projectedX = this.x
		this.projectedY = this.y
		this.projectedZ = this.z
	}
	
	this.rotateY = function(rotation){
		var x = this.projectedX
		var y = this.projectedY
		var z = this.projectedZ
		this.rotationY = rotation
		
		this.projectedX = x * Math.cos(rotation) - z * Math.sin(rotation)
		this.projectedY = y
		this.projectedZ = x * Math.sin(rotation) + z * Math.cos(rotation)
	}
	
	this.rotateX = function(rotation){
		var x = this.projectedX
		var y = this.projectedY
		var z = this.projectedZ
		this.rotationX = rotation
		
		this.projectedX = x
		this.projectedY = y * Math.cos(rotation) - z * Math.sin(rotation)
		this.projectedZ = y * Math.sin(rotation) + z * Math.cos(rotation)
	}
	
	this.translateX = function(translation){
		this.translationX = translation
		this.projectedX = this.projectedX + translation
	}
	
	this.translateY = function(translation){
		this.translationY = translation
		this.projectedY = this.projectedY + translation
	}
	
	this.translateZ = function(translation){
		this.translationZ = translation
		this.projectedZ = this.projectedZ + translation
	}
	
	this.project = function(){
		this.projectedX = this.projectedX / this.projectedZ * camera.zoom + canvas.width/2
		this.projectedY = this.projectedY / this.projectedZ * camera.zoom + canvas.height/2
	}
	
	this.move = function(x, y){
		var unprojected = unproject(mouse.x, mouse.y, this)
		this.x = unprojected.x
		this.y = unprojected.y
	}
}

function Triangle(a, b, c){
	this.a = a                // a---b
	this.b = b                // | /
	this.c = c                // c   d
}





// Helper functions
function random(){
	var x = Math.sin(randomseed++) * 10000
	return x - Math.floor(x)
}

function dist(x1, y1, x2, y2){ // Actually distSq
	return (x1 - x2)**2 + (y1 - y2)**2
}

function selectPoint(x, y){
	var nearest = 0
	var nearestDist = 0
	
	for( var i = 0; i < points.length; i++ ){
		var distance = dist( x, y, points[i].projectedX, points[i].projectedY )
		if( distance < nearestDist || i == 0 ){
			nearest = i
			nearestDist = distance
		}
	}
	
	if( nearestDist < 50 ){
		selectedPoint = nearest
	}else{
		selectedPoint = undefined
	}
}

function unproject(x, y, point){
	// Convert 2d mouse pos back into 3d pos
	x = (x - canvas.width/2) / camera.zoom
	y = (y - canvas.height/2) / camera.zoom
	
	x *= point.projectedZ
	y *= point.projectedZ
	
	x -= point.translationX
	y -= point.translationY
	
	x += point.z * Math.sin(point.rotationY)
	y += point.z * Math.sin(point.rotationX)
	
	x /= Math.cos(point.rotationY)
	y /= Math.cos(point.rotationX)
	
	return {x: x, y: y}
}





// Program functions
function initCube(){
	// Add vectors
	for( var x = -1; x <= 1; x+= 2 ){
		for( var y = -1; y <= 1; y+= 2 ){
			for( var z = -1; z <= 1; z+= 2 ){
				points.push( new Point( x, y, z ) )
			}
		}
	}
	
	for( var side = -1; side <= 1; side += 2 ){
		var sides = []
		sides[0] = points.filter( (point) => point.x == side )
		sides[1] = points.filter( (point) => point.y == side )
		sides[2] = points.filter( (point) => point.z == side )
		
		for( var dim = 0; dim < 3; dim++ ){
			triangles.push( new Triangle( sides[dim][0], sides[dim][1], sides[dim][2] ) )
			triangles.push( new Triangle( sides[dim][3], sides[dim][1], sides[dim][2] ) )
		}
	}
}

function initCubes(){
	var dx = 1 / width
	var dy = 1 / length
	
	for( var y = 0; y < length; y++ ){
		for( var x = 0; x < width; x++ ){
			var xPos = x / width - 0.5
			var yPos = y / length - 0.5
			
			var topLeftFront = new Point(xPos, yPos, 1)
			var topRightFront = new Point(xPos+dx, yPos+dy, 1)
			var topLeftBack = new Point(xPos, yPos+dy, 1)
			var topRightBack = new Point(xPos+dx, yPos+dy, 1)
			
			var bottomLeftFront = new Point(xPos, yPos, -1)
			var bottomRightFront = new Point(xPos+dx, yPos, -1)
			var bottomLeftBack = new Point(xPos, yPos+dy, -1)
			var bottomRightBack = new Point(xPos+dx, yPos+dy, -1)
			
			triangles.push( new Triangle( topLeftFront, topRightFront, topLeftBack ) )
			triangles.push( new Triangle( topRightBack, topRightFront, topLeftBack ) )
			
			triangles.push( new Triangle( bottomLeftFront, bottomRightFront, bottomLeftBack ) )
			triangles.push( new Triangle( bottomRightBack, bottomRightFront, bottomLeftBack ) )
		}
	}
}

function initLandscape(){
	// Add vectors
	for( var y = 0; y <= length; y++ ){
		points.push([])
		for( var x = 0; x <= width; x++ ){
			points[y].push( new Point( x - width/2, y - length/2, random() ) )
		}
	}
	
	for( var x = 0; x < points.length-1; x++ ){
		for( var y = 0; y < points[x].length-1; y++ ){
			var pos = {}
			pos.a = points[x][y]
			pos.b = points[x+1][y]
			pos.c = points[x][y+1]
			pos.d = points[x+1][y+1]
			
			triangles.push( new Triangle( pos.a, pos.b, pos.c ) )
			triangles.push( new Triangle( pos.d, pos.b, pos.c ) )
		}
	}
}

function addLandscape(){
	points.splice(points.length-1, 1)
	points.splice(0, 0, [])
	for( var x = 0; x <= width; x++ ){
		points[0].push( new Point( x - width/2, points[1][0].y - 1, random() ) )
	}
	
	// Update triangles
	triangles = []
	for( var x = 0; x < points.length-1; x++ ){
		for( var y = 0; y < points[x].length-1; y++ ){
			var pos = {}
			pos.a = points[x][y]
			pos.b = points[x+1][y]
			pos.c = points[x][y+1]
			pos.d = points[x+1][y+1]
			
			triangles.push( new Triangle( pos.a, pos.b, pos.c ) )
			triangles.push( new Triangle( pos.d, pos.b, pos.c ) )
		}
	}
}

function moveCubes(){
	frame += 0.05
	var spacing = 0
	for( var i = 0; i < triangles.length; i += 4 ){
		var dz = Math.sin(frame) * 0.2 * triangles[i].a.x * triangles[i].a.y
		triangles[i].a.z = dz + spacing
		triangles[i].b.z = dz + spacing
		triangles[i].c.z = dz + spacing
		
		triangles[i+1].a.z = dz + spacing
		triangles[i+1].b.z = dz + spacing
		triangles[i+1].c.z = dz + spacing
		
		triangles[i+2].a.z = -dz - spacing
		triangles[i+2].b.z = -dz - spacing
		triangles[i+2].c.z = -dz - spacing
		
		triangles[i+3].a.z = -dz - spacing
		triangles[i+3].b.z = -dz - spacing
		triangles[i+3].c.z = -dz - spacing
	}
}

function renderPoints(){
	for( var i = 0; i < points.length; i++ ){
		var point = points[i]
		point = point.rotateY(camera.ry)
		point = point.rotateX(camera.rx)
		point = point.project()
		c.fillRect( (canvas.width/2) + point.x * 300, (canvas.height/2) + point.y * 300, 2, 2 )
	}
}

function renderTriangles(renderPoints){
	// for( var y = 0; y < points.length; y++ ){
	// 	for( var x = 0; x < points[y].length; x++ ){
	// 		points[y][x].y += spd
	// 	}
	// }
	
	// if( points[points.length-1][0].y > 5 ){
	// 	addLandscape()
	// }
	// moveCubes()
	
	for( var i = 0; i < triangles.length; i++ ){
		var triangle = []
		triangle[0] = triangles[i].a
		triangle[1] = triangles[i].b
		triangle[2] = triangles[i].c
		
		for( var dim = 0; dim < 3; dim++ ){
			triangle[dim].reset()
			triangle[dim].rotateY(camera.ry)
			triangle[dim].rotateX(camera.rx)
			triangle[dim].translateX(camera.x)
			triangle[dim].translateY(camera.y)
			triangle[dim].translateZ(camera.z)
			triangle[dim].project()
			
			if( renderPoints && triangle[dim] == points[selectedPoint] ){
				c.fillRect( triangle[dim].projectedX - 4, triangle[dim].projectedY - 4, 8, 8 )
			}else if( renderPoints ){
				c.fillRect( triangle[dim].projectedX - 2, triangle[dim].projectedY - 2, 4, 4 )
			}
		}
		
		var aX = triangle[0].projectedX
		var aY = triangle[0].projectedY
		
		var bX = triangle[1].projectedX
		var bY = triangle[1].projectedY
		
		var cX = triangle[2].projectedX
		var cY = triangle[2].projectedY
		
		c.strokeStyle = "hsl(" + (i/triangles.length * 360) + ", 50%, 50%)"
		
		c.beginPath()
		c.moveTo( aX, aY )
		c.lineTo( bX, bY )
		c.lineTo( cX, cY )
		c.lineTo( aX, aY )
		// c.fill()
		c.stroke()
		c.closePath()
	}
}





// Event functions
function keydown(e){
	keys[e.key] = true
}

function keyup(e){
	keys[e.key] = false
}

function mousewheel(e){
	camera.zSpd += constrain( e.wheelDelta, -0.2, 0.2) // From essentials.js
}

function mousemove(e){
	// Update position
	mouse.dx = e.offsetX - mouse.x
	mouse.dy = e.offsetY - mouse.y
	mouse.x = e.offsetX
	mouse.y = e.offsetY
	
	if( mouse.right ){ // Right mouse button, move camera
		camera.rxSpd += (mouse.dy * rotSpd)
		camera.rySpd += (mouse.dx * rotSpd)
	}
	if( mouse.left && selectedPoint ){ // Left mouse button, move point
		points[selectedPoint].move(mouse.x, mouse.y)
	}
}

function mousedown(e){
	mouse.left = (e.buttons == 1 || e.buttons == 3)
	mouse.right = (e.buttons == 2 || e.buttons == 3)
	
	if( mouse.left ){
		selectPoint(mouse.x, mouse.y)
	}
}

function mouseup(e){
	mouse.left = (e.buttons == 1 || e.buttons == 3)
	mouse.right = (e.buttons == 2 || e.buttons == 3)
}

function rightclick(e){
	e.preventDefault()
}





// App functions
function draw(){
	if( selectedPoint ){
		if( keys.w ) points[selectedPoint].move(0,-0.03);
		if( keys.s ) points[selectedPoint].move(0,0.03);
		
		if( keys.a ) points[selectedPoint].move(-0.03,0);
		if( keys.d ) points[selectedPoint].move(0.03,0);
	}else{
		if( keys.w ) camera.ySpd -= spd;
		if( keys.s ) camera.ySpd += spd;
		
		if( keys.a ) camera.xSpd -= spd;
		if( keys.d ) camera.xSpd += spd;
	}
	
	camera.x += camera.xSpd
	camera.y += camera.ySpd
	camera.z += camera.zSpd
	
	camera.xSpd *= 0.8
	camera.ySpd *= 0.8
	camera.zSpd *= 0.8
	
	camera.rx += camera.rxSpd
	camera.ry += camera.rySpd
	camera.rxSpd *= 0.9
	camera.rySpd *= 0.9
	
	camera.rx %= Math.PI*2
	camera.ry %= Math.PI*2
	
	// Background
	c.fillStyle = "#000"
	c.fillRect(0,0,canvas.width, canvas.height)
	
	// Render
	c.fillStyle = "#FFF"
	c.strokeStyle = "#FFF"
	
	renderTriangles()
}





$(function(){
	canvas = document.getElementById("canvas")
	c = canvas.getContext("2d")
	canvas.width = 500
	canvas.height = 500
	
	$("body").keydown(keydown)
	$("body").keyup(keyup)
	$("body")[0].addEventListener("mousewheel", mousewheel, {passive: true})
	$("body").mousedown(mousedown)
	$("body").mouseup(mouseup)
	$("canvas").mousemove(mousemove)
	$("canvas").contextmenu(rightclick)
	
	draw()
	setInterval( draw, 1/FPS*1000 )
})
