function constrain(val, min, max){
	return Math.max( min, Math.min(max, val) )
}

function dist( x1, y1, x2, y2 ){
	return Math.sqrt( (x1-x2)**2 + (y1-y2)**2 )
}

function distSq( x1, y1, x2, y2 ){
	return (x1-x2)**2 + (y1-y2)**2
}
