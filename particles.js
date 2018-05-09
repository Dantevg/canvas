var FPS = 60
var run = true
var mouseGravity = false
var label = false
var mode = "solarsystem"
var attractionPower = 0.001
var repulsionPower = 5000
var friction = 1
var r = 8

var dt = 1

var particles = []
var mouse = {x: 0, y: 0}
var selected = undefined
var runOnce = false

function log(){
	for(var i = 0; i < arguments.length; i++ ){
		if( typeof arguments[i] === "number" ){
			arguments[i] = Math.round(arguments[i]*1000) / 1000
		}
	}
	console.log(...arguments)
}

function attraction( angle, distance ){
	if( mode == "shapes" ){
		return new Vector( Math.cos(angle)*distance*attractionPower, Math.sin(angle)*distance*attractionPower )
	}else if( mode == "solarsystem" ){
		return new Vector( Math.cos(angle)*(1/(distance**2))*repulsionPower, Math.sin(angle)*(1/(distance**2))*repulsionPower )
	}
}

function repulsion( angle, distance ){
	if( mode == "shapes" ){
		return new Vector( Math.cos(angle)*(1/-distance)*repulsionPower, Math.sin(angle)*(1/-distance)*repulsionPower )
	}else if( mode == "solarsystem" ){
		return new Vector(0, 0)
	}
}

// Selects point id, otherwise selects closest point
function select(id){
	if( id || id == 0 ){
		selected = id
		return true
	}
	
	// Find closest point
	var closest = 0
	var minDist = 0
	for( var i = 0; i < particles.length; i++ ){
		var distance = dist( particles[i].pos.x, particles[i].pos.y, mouse.x, mouse.y )
		if( i == 0 || distance < minDist ){
			minDist = distance
			closest = i
		}
	}

	if( minDist < 20 && particles.length > 0 ){
		selected = closest
		return true
	}
}

function Vector(x, y){
	this.x = x || 0
	this.y = y || 0

	this.add = function(vector){
		this.x += vector.x
		this.y += vector.y
		return this
	}

	this.sub = function(vector){
		this.x -= vector.x
		this.y -= vector.y
		return this
	}

	this.mult = function(amount){
		this.x *= amount
		this.y *= amount
		return this
	}

	this.getAngle = function(vector){
		if( vector ){
			return Math.atan2( vector.y - this.y, vector.x - this.x )
		}else{
			return Math.atan2( this.y, this.x )
		}
	}
}

function Particle(x, y, options){
	this.pos = new Vector(x, y)
	this.vel = new Vector(0, 0)
	this.acc = new Vector(0, 0)

	this.path = []

	options = options || {}

	this.fixed = (options.fixed != undefined) ? options.fixed : false
	this.attract = (options.attract != undefined) ? options.attract : true
	this.repel = (options.repel != undefined) ? options.repel : true
	this.color = Math.random()*360
	this.id = particles.length

	if( !this.fixed ){ // Random start speed
		// this.vel.x = Math.random()*10 - 5
		// this.vel.y = Math.random()*10 - 5
		this.vel.x = 5
	}

	this.applyForces = function(){
		if( this.fixed ){ return true };
		
		this.acc.x = 0
		this.acc.y = 0

		// Particle gravity
		for( var i = 0; i < particles.length; i++ ){
			if( particles[i] !== this ){
				var that = particles[i]
				var r = dist( this.pos.x, this.pos.y, that.pos.x, that.pos.y )
				if( r != 0 ){
					var angle = this.pos.getAngle(that.pos)
					if( that.attract ){
						this.acc.add( attraction(angle, r) )
					}
					if( that.repel ){
						this.acc.add( repulsion(angle, r) )
					}
				}

				// c.strokeStyle = "rgba(255,255,255," + (1/r)*50 + ")"
				// c.beginPath()
				// c.moveTo(this.pos.x, this.pos.y)
				// c.lineTo(that.pos.x, that.pos.y)
				// c.stroke()
				// c.closePath()
			}
		}

		// Mouse gravity
		if( mouseGravity ){
			var r = dist( this.pos.x, this.pos.y, mouse.x, mouse.y )
			if( r != 0 ){
				var angle = this.pos.getAngle(mouse)
				this.acc.add( new Vector(Math.cos(angle)*r*attractionPower, Math.sin(angle)*r*attractionPower) )
				
				c.strokeStyle = "rgba(255,255,255," + (1/r)*50 + ")"
				c.beginPath()
				c.moveTo(this.pos.x, this.pos.y)
				c.lineTo(mouse.x, mouse.y)
				c.stroke()
				c.closePath()
			}
		}
		
		// Gravity
		// this.acc.add( new Vector(0,0.5) )
		
		// Constrain
		var r = constrain( dist( 0, 0, this.acc.x, this.acc.y ), -3, 3 )
		var angle = this.acc.getAngle()
		this.acc.x = Math.cos(angle)*r
		this.acc.y =  Math.sin(angle)*r
		
		// Friction
		this.vel.x *= friction
		this.vel.y *= friction
	}

	this.update = function(){
		// Path
		if( !this.fixed && (run || runOnce) ){
			this.path.push( new Vector(this.pos.x, this.pos.y) )
			if( this.path.length > 1000 ){
				this.path.splice(0,1)
			}
		}
		
		// Update
		if( !this.fixed && (run || runOnce) ){
			this.vel.x += this.acc.x * dt
			this.vel.y += this.acc.y * dt
			
			this.pos.x += this.vel.x * dt
			this.pos.y += this.vel.y * dt
		}
		
		// Walls
		if( this.pos.y <= r ){
			this.pos.y = r
			this.vel.y = -this.vel.y*0.2
		}else if( this.pos.y >= canvas.height-r ){
			this.pos.y = canvas.height-r
			this.vel.y = -this.vel.y*0.2
		}
		if( this.pos.x <= r ){
			this.pos.x = r
			this.vel.x = -this.vel.x*0.2
		}else if( this.pos.x >= canvas.width-r ){
			this.pos.x = canvas.width-r
			this.vel.x = -this.vel.x*0.2
		}
	}

	this.draw = function(){
		// Dot
		c.fillStyle = "hsl(" + this.color + ", 50%, 50%)"
		c.beginPath()
		c.arc( this.pos.x, this.pos.y, r, 0, Math.PI*2 )
		c.fill()
		c.closePath()

		if( this.fixed ){
			c.fillStyle = "#000"
			c.beginPath()
			c.arc( this.pos.x, this.pos.y, 3, 0, Math.PI*2 )
			c.fill()
			c.closePath()
		}else{
			// Acc direction
			var angle = this.acc.getAngle()
			var force = new Vector( Math.cos(angle)*100, Math.sin(angle)*100 )
			c.strokeStyle = "#FFF"
			c.beginPath()
			c.moveTo( this.pos.x, this.pos.y )
			c.lineTo( this.pos.x + force.x, this.pos.y + force.y )
			c.closePath()
			c.stroke()
		}

		// Path
		for( var i = 0; i < this.path.length-1; i++ ){
			c.beginPath()
			c.moveTo( this.path[i].x, this.path[i].y )
			c.lineTo( this.path[i+1].x, this.path[i+1].y )
			c.strokeStyle = "hsla(" + this.color + ", 50%, 50%, " + (i / this.path.length) + ")"
			c.stroke()
			c.closePath()
		}

		// Label
		if( label ){
			c.fillStyle = "hsl(" + this.color + ", 50%, 50%)"
			if( this == particles[selected] ){
				c.fillRect( this.pos.x + 10, this.pos.y - 30, 110, 20 )
				c.font = "bold 16px monospace"
				c.fillStyle = "#000"
				c.fillText( this.id, this.pos.x + 15, this.pos.y - 15 )
				c.fillText( "(" + Math.round(this.pos.x) + ", " + Math.round(this.pos.y) + ")", this.pos.x + 30, this.pos.y - 15 )
			}else{
				c.fillRect( this.pos.x + 10, this.pos.y - 30, 20, 20 )
				c.font = "bold 16px monospace"
				c.fillStyle = "#000"
				c.fillText( this.id, this.pos.x + 15, this.pos.y - 15 )
			}
		}
	}
}

function draw(){
	c.fillStyle = "#000"
	c.fillRect(0,0,canvas.width, canvas.height)
	
	for( var i = 0; i < particles.length; i++ ){
		particles[i].applyForces()
	}
	
	for( var i = 0; i < particles.length; i++ ){
		particles[i].update()
		particles[i].draw()
	}
	
	runOnce = false
}

// Run
$(function(){
	canvas = document.getElementById("canvas")
	c = canvas.getContext("2d")
	canvas.width = $(window).width()
	canvas.height = $(window).height()

	$("canvas").click(function(){
		if( !select() ){
			particles.push( new Particle(mouse.x, mouse.y, {attract: false}) )
		}
	})
	$("canvas").contextmenu(function(){
		particles.push( new Particle(mouse.x, mouse.y, {fixed: true}) )
		return false
	})

	$("canvas").mousemove(function(e){
		var rect = canvas.getBoundingClientRect();
		mouse.x = e.clientX - rect.left;
		mouse.y = e.clientY - rect.top;
	})
	
	$("body")[0].addEventListener("mousewheel", function(e){
		dt += constrain( e.wheelDelta, -0.1, 0.1) // From essentials.js
	}, {passive: true})

	$("body").keyup(function(e){
		if( e.key == " " ){ // Spcebar, play/pause
			run = !run
		}
	})

	draw()
	setInterval( draw, 1/FPS*1000 )
})
