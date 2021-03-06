"use strict";

var BlockType =
[
	"Air",
	"Stone",
	"Dirt",
	"Grass",
	"Cobblestone",
	"Wood",
	"Log",
	"Water",
	"Sand"
];

//Storage format:
// 0 = top
// 1 = side
// 2 = bottom
//Indices into tile map are of the form (row x column)
var BlockTexCoords =
[
	[ [0,0], [0,0], [0,0] ], //Air
	[ [0,1], [0,1], [0,1] ], //Stone
	[ [0,2], [0,2], [0,2] ], //Dirt
	[ [0,0], [0,3], [0,2] ], //Grass
	[ [1,0], [1,0], [1,0] ], //Cobble
	[ [0,4], [0,4], [0,4] ], //Wood
	[ [1,5], [1,4], [1,5] ],  //Log
	[ [12,15], [12,15], [12,15] ],  //Water	
	[ [1,2], [1,2], [1,2] ]  //Sand	
];

//If true, then block type is transparent
var Transparent =
[
	true,	//Air
	false,	//Stone
	false, 	//Dirt
	false,	//Grass
	false, 	//Cobble
	false,	//Wood
	false,	//Log
	true, 	//Water
	false,	//Sand
];

//A pending block write
function PendingWrite(t, x, y, z, b)
{
	this.t = t;
	this.x = x;
	this.y = y;
	this.z = z;
	this.b = b;
}

//The chunk data type
function Chunk(t, x, y, z)
{
	//Set chunk data
	this.data = [];
	this.pending_writes = [];
	
	//Set position
	this.t = t;
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.dirty = false;
	
	this.vb = null;
	this.ib = null;
	this.tib = null;
}

function frustum_test(m, cx, cy, cz)
{
	var vx = (cx)*CHUNK_X,
		vy = (cy)*CHUNK_Y,
		vz = (cz)*CHUNK_Z,
		qx, qy, qz,
		dx, dy, dz,
		in_p = 0, w, x, y, z;


	for(dx=-1; dx<=CHUNK_X; dx+=CHUNK_X+1)
	for(dy=-1; dy<=CHUNK_Y; dy+=CHUNK_Y+1)
	for(dz=-1; dz<=CHUNK_Z; dz+=CHUNK_Z+1)
	{
		qx = dx + vx;
		qy = dy + vy;
		qz = dz + vz;

		w = qx*m[3] + qy*m[7] + qz*m[11] + m[15];
		x = qx*m[0] + qy*m[4] + qz*m[8] + m[12];

		if(x <= w) in_p |= 1;
		if(in_p == 63) return true;
		if(x >= -w) in_p |= 2;
		if(in_p == 63) return true;

		y = qx*m[1] + qy*m[5] + qz*m[9] + m[13];
		if(y <= w) in_p |= 4;
		if(in_p == 63) return true;
		if(y >= -w) in_p |= 8;
		if(in_p == 63) return true;

		z = qx*m[2] + qy*m[6] + qz*m[10] + m[14];
		if(z <= w) in_p |= 16;
		if(in_p == 63) return true;
		if(z >= 0) in_p |= 32;
		if(in_p == 63) return true;
	}

	return false;
}

//The map data structure
var Map =
{
	index			: {},	//The chunk index
	
	max_chunks			: (1<<20),	//Maximum number of chunks to load (not used yet)
	chunk_count 		: 0,		//Number of loaded chunks	
	
	//If set, then we draw the debug info for the chunk
	show_debug		: false,
	
	//Chunks in the visible radius
	active_chunks : [],
	
	//Hash look up in map
	lookup_chunk : function(x, y, z)
	{
		return Map.index[x + ":" + y + ":" + z];
	},
	
	//Adds a new chunk
	add_chunk : function(t, x, y, z)
	{
		var str = x + ":" + y + ":" + z,
			chunk = Map.index[str];

		if(chunk)
		{
			return chunk;
		}
	
		++Map.chunk_count;
		chunk = new Chunk(t, x, y, z);
		Map.index[str] = chunk
		return chunk;
	},

	//Returns the block type for the give position
	get_block : function(x, y, z)
	{
		var cx = (x >> CHUNK_X_S), 
			cy = (y >> CHUNK_Y_S), 
			cz = (z >> CHUNK_Z_S);
		var c = Map.lookup_chunk(cx, cy, cz);		
		if(!c)
			return 1;
	
		var bx = (x & CHUNK_X_MASK), 
			by = (y & CHUNK_Y_MASK), 
			bz = (z & CHUNK_Z_MASK);
		return c.data[bx +  CHUNK_X * (bz + by * CHUNK_Z)];
	},

	//Traces a ray into the map, returns the index of the block hit, its type and the hit normal
	// Meant for UI actions, not particularly fast over long distances
	trace_ray : function(
		ox, oy, oz,
		dx, dy, dz,
		max_d)
	{
		//Normalize D
		var ds = Math.sqrt(dx*dx + dy*dy + dz*dz);
		dx /= ds;
		dy /= ds;
		dz /= ds;
	
		//Step block-by-bloc along raywc
		var t = 0.0;
	
		var norm = [0, 0, 0];
	
		while(t <= max_d)
		{
			var b = Map.get_block(Math.round(ox), Math.round(oy), Math.round(oz));
			if(b != 0)
				return [ox, oy, oz, b, norm[0], norm[1], norm[2]];
			
			var step = 0.5;
		
			var fx = ox - Math.floor(ox);
			var fy = oy - Math.floor(oy);
			var fz = oz - Math.floor(oz);
				
			if(dx < -0.0001)
			{
				if(fx < 0.0001)
					fx = 1.0;
		
				var s = -fx/dx;
			
				if(s < step)
				{
					norm = [1, 0, 0];
					step = s;
				}
			}
			if(dx > 0.0001)
			{
				var s = (1.0-fx)/dx;
				if(s < step)
				{
					norm = [-1, 0, 0];
					step = s;
				}
			}
		
			if(dy < -0.0001)
			{
				if(fy < 0.0001)
					fy = 1.0;

				var s = -fy/dy;
				if(s < step)
				{
					norm = [0, 1, 0];
					step = s;
				}
			}
			if(dy > 0.0001)
			{
				var s = (1.0-fy)/dy;
				if(s < step)
				{
					norm = [0, -1, 0];
					step = s;
				}
			}

			if(dz < -0.0001)
			{
				if(fz < 0.0001)
					fz = 1.0;
		
				var s = -fz/dz;
				if(s < step)
				{
					norm = [0, 0, 1];
					step = s;
				}
			}
			if(dz > 0.0001)
			{
				var s = (1.0-fz)/dz;
				if(s < step)
				{
					norm = [0, 0, -1];
					step = s;
				}
			}
		
			t += step;
			ox += dx * step;
			oy += dy * step;
			oz += dz * step;
		}
	
		return [];
	}
};


