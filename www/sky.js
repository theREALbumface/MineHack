"use strict";

var Sky = 
{
}

Sky.time_of_day = function()
{
	return (Game.game_ticks % 8000) / 4000.0;
	//return 0.5;
}

Sky.get_shadow_fudge = function()
{
	return 0.01;
}

//Retrieves the light direction
Sky.get_sun_dir = function()
{
	var 
		angle = Sky.time_of_day() * Math.PI;
	
	return [Math.cos(angle), Math.sin(angle), 0];
}

Sky.get_basis = function()
{
	var n = Sky.get_sun_dir(),
		u = [0, 0, 1],
		v = cross(n, u),
		l = Math.sqrt(dot(v,v)),
		i;
		
	for(i=0; i<3; ++i)	
		v[i] /= l;
		
	return [n, u, v];
}


//Returns the color of the sunlight
Sky.get_sun_color = function()
{
	return [0.79, 0.81,  0.85];
}

//Draws the sky background
Sky.draw_bg = function()
{
	var gl = Game.gl;

	gl.clearColor(0.4, 0.64, 0.9, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
}
