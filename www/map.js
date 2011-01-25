"use strict";

const BlockType =
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
const BlockTexCoords =
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
const Transparent =
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

function ChunkVB(p, 
	x_min, y_min, z_min,
	x_max, y_max, z_max)
{
	this.vb = null;
	this.ib = null;
	this.tb = null;
	this.num_elements = 0;
	this.p 		 = p;
	this.x_min   = x_min;
	this.y_min   = y_min;
	this.z_min   = z_min;
	this.x_max	 = x_max;
	this.y_max	 = y_max;
	this.z_max	 = z_max;
	this.dirty   = true;
}

//Sets the vb to dirty, will regenerate as needed
ChunkVB.prototype.set_dirty = function(gl)
{
	this.dirty = true;
}

//Construct vertex buffer for this chunk
ChunkVB.prototype.gen_vb = function(gl)
{
	var vertices = new Array();
	var indices  = new Array();
	var tindices = new Array();
	var tex_coords = new Array();
	var n_elements = 0;
	var nv = 0;
	var p = this.p;
	
	var appendv = function(v)
	{
		for(var i=0; i<v.length; i++)
		{
			vertices.push(v[i][0] - 0.5);
			vertices.push(v[i][1] - 0.5);
			vertices.push(v[i][2] - 0.5);
			
			++nv;
		}
	}
	
	var add_face = function(b)
	{
		if(Transparent[b])
		{
			tindices.push(nv);
			tindices.push(nv+1);
			tindices.push(nv+2);
			tindices.push(nv);
			tindices.push(nv+2);
			tindices.push(nv+3);
		}
		else
		{
			indices.push(nv);
			indices.push(nv+1);
			indices.push(nv+2);
			indices.push(nv);
			indices.push(nv+2);
			indices.push(nv+3);
		}
	}
	
	var add_tex_coord = function(block_t, dir)
	{
		tc = BlockTexCoords[block_t][dir];
		
		tx = tc[1] / 16.0;
		ty = tc[0] / 16.0;
		dt = 1.0 / 16.0 - 1.0/256.0;
		
		tex_coords.push(tx);
		tex_coords.push(ty+dt);

		tex_coords.push(tx);
		tex_coords.push(ty);

		tex_coords.push(tx+dt);
		tex_coords.push(ty);

		tex_coords.push(tx+dt);
		tex_coords.push(ty+dt);	
	}
	
	var data = p.data;
	
	var left	= Map.lookup_chunk(p.x-1, p.y, p.z),
		right	= Map.lookup_chunk(p.x+1, p.y, p.z),
		bottom	= Map.lookup_chunk(p.x, p.y-1, p.z),
		top 	= Map.lookup_chunk(p.x, p.y+1, p.z),
		front	= Map.lookup_chunk(p.x, p.y, p.z-1),
		back	= Map.lookup_chunk(p.x, p.y, p.z+1);
		
	var d_lx = null, d_ux = null,
		d_ly = null, d_uy = null,
		d_lz = null, d_uz = null;
		
	if(left)	d_lx = left.data;
	if(right)	d_ux = right.data;
	if(bottom)	d_ly = bottom.data;
	if(top)		d_uy = top.data;
	if(front)	d_lz = front.data;
	if(back)	d_uz = back.data;
	
	for(var x=this.x_min; x<this.x_max; ++x)
	for(var y=this.y_min; y<this.y_max; ++y)
	for(var z=this.z_min; z<this.z_max; ++z)
	{
		var idx = x + (y<<CHUNK_X_S) + (z<<(CHUNK_XY_S));
		var block_id = data[idx];
		var ob;
		
		if(block_id == 0)
			continue;
		
		
		//Add -x face
		if(x > 0)
		{
			ob = data[idx - CHUNK_X_STEP];
		}
		else if(x == 0 && d_lx != null)
		{
			ob = d_lx[CHUNK_X_MASK + (y<<CHUNK_X_S) + (z<<CHUNK_XY_S)];
		}
		else
		{
			ob = 0;
		}
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv( [
				[x,y  ,z  ],
				[x,y+1,z  ],
				[x,y+1,z+1],
				[x,y  ,z+1]				
				]);
				
			add_tex_coord(block_id, 1);
		}
		
		//Add +x face	
		if(x < CHUNK_X - 1)
		{
			ob = data[idx+CHUNK_X_STEP]; 
		}
		else if(x == CHUNK_X-1 && d_ux != null)
		{
			ob = d_ux[(y<<CHUNK_X_S) + (z<<CHUNK_XY_S)];
		}
		else
		{
			ob = 0;
		}
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv([
				[x+1,y,  z+1],
				[x+1,y+1,z+1],
				[x+1,y+1,z  ],
				[x+1,y,  z  ]
				]);
				
			add_tex_coord(block_id, 1);
		}
		
		//Add -y face
		if(y > 0)
		{
			ob = data[idx-CHUNK_Y_STEP]; 
		}
		else if(y == 0 && d_ly != null)
		{
			ob = d_ly[x + (CHUNK_Y_MASK << CHUNK_X_S) + (z << CHUNK_XY_S)];
		}
		else
		{
			ob = 0;
		}
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv([
				[x,  y,  z  ],
				[x,  y,  z+1],
				[x+1,y,  z+1],
				[x+1,y,  z  ]]);
				
			add_tex_coord(block_id, 2);
		}
		
		//Add +y face
		if(y < CHUNK_Y-1)
		{
			ob = data[idx+CHUNK_Y_STEP];
		}
		else if(y == CHUNK_Y-1 && d_uy != null)
		{
			ob = d_uy[x + (z << CHUNK_XY_S)];
		}
		else
		{
			ob = 0;
		}
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv([
				[x,  y+1,  z  ],
				[x+1,y+1,  z  ],
				[x+1,y+1,  z+1],
				[x,  y+1,  z+1]]);
				
			add_tex_coord(block_id, 0);
		}
		
		
		//Add -z face
		if(z > 0)
		{
			ob = data[idx-CHUNK_Z_STEP];
		}		
		else if(z == 0 && d_lz != null)
		{
			ob = d_lz[x + (y<<CHUNK_X_S) + (CHUNK_Z_MASK<<CHUNK_XY_S)];
		}
		else
		{
			ob = 0;
		}
		
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv([
				[x+1,y,  z],
				[x+1,y+1,z],				
				[x,  y+1,z],				
				[x,  y,  z]
			]);
				
			add_tex_coord(block_id, 1);
		}
		
		//Add +z face
		if(z < CHUNK_Z-1)
		{
			ob = data[idx+CHUNK_Z_STEP];
		}
		else if(z == CHUNK_Z-1 && d_uz != null)
		{
			ob = d_uz[x + (y<<CHUNK_X_S)];
		}
		else
		{
			ob = 0;
		}
		
		if(Transparent[ob] && ob != block_id)
		{
			add_face(block_id);
			
			appendv([
				[x,  y,  z+1],
				[x,  y+1,z+1],
				[x+1,y+1,z+1],
				[x+1,y,  z+1]]);
				
			add_tex_coord(block_id, 1);
		}
	}

	this.num_elements = indices.length;
	this.num_transparent_elements = tindices.length;
	
	if(this.vb == null)
		this.vb = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
	
	if(this.ib == null)
		this.ib = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
	
	if(this.tib == null)
		this.tib = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tib);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tindices), gl.DYNAMIC_DRAW);
	
	if(this.tb == null)
		this.tb = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tb);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex_coords), gl.DYNAMIC_DRAW);
	
	//Clean up temporary data
	delete vertices;
	delete indices;
	delete tindices;
	delete tex_coords;
	
	//No longer need to generate
	this.dirty = false;
}

//Draws a chunk
ChunkVB.prototype.draw = function(gl, chunk_shader, transp)
{
	if(this.dirty)
		this.gen_vb(gl);
		
	if(transp && this.num_transparent_elements == 0)
		return;
	if(!transp && this.num_elements == 0)
		return;

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
	gl.vertexAttribPointer(chunk_shader.pos_attr, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tb);
	gl.vertexAttribPointer(chunk_shader.tc_attr, 2, gl.FLOAT, false, 0, 0);

	if(transp)
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tib);
		gl.drawElements(gl.TRIANGLES, this.num_transparent_elements, gl.UNSIGNED_SHORT, 0);
	}
	else
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
		gl.drawElements(gl.TRIANGLES, this.num_elements, gl.UNSIGNED_SHORT, 0);
	}
}

ChunkVB.prototype.draw_vis = function(gl, vis_shader)
{
	if(this.dirty)
		this.gen_vb(gl);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
	gl.vertexAttribPointer(vis_shader.pos_attr, 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
	gl.drawElements(gl.TRIANGLES, this.num_elements, gl.UNSIGNED_SHORT, 0);
}



//Releases the resources associated to a chunk
ChunkVB.prototype.release = function(gl)
{
	if(this.vb)
		gl.deleteBuffer(this.vb);
	if(this.ib)
		gl.deleteBuffer(this.ib);
	if(this.tib)
		gl.deleteBuffer(this.tib);
	if(this.tb)
		gl.deleteBuffer(this.tb);
		
	delete this.vb;
	delete this.ib;
	delete this.tib;
	delete this.tb;
}

//The chunk data type
function Chunk(x, y, z, data)
{
	//Set chunk data
	this.data = data;
	
	//Set position
	this.x = x;
	this.y = y;
	this.z = z;
	
	//Create vertex buffers for facets
	this.vb = new ChunkVB(this, 
		0, 0, 0,
		CHUNK_X, CHUNK_Y, CHUNK_Z);
}

//Returns true of the chunk is in the frustum
Chunk.prototype.in_frustum = function(m)
{
	var c = Player.chunk();
	var v = [(this.x-c[0])*CHUNK_X,    (this.y-c[1])*CHUNK_Y,    (this.z-c[2])*CHUNK_Z];
	var in_p = 0;
	
	
	for(var dx=-1; dx<=CHUNK_X; dx+=CHUNK_X+1)
	for(var dy=-1; dy<=CHUNK_Y; dy+=CHUNK_Y+1)
	for(var dz=-1; dz<=CHUNK_Z; dz+=CHUNK_Z+1)	
	{
		var q = [v[0] + dx, v[1] + dy, v[2] + dz];
		
		var w = q[0]*m[3] + q[1]*m[7] + q[2]*m[11] + m[15];
		var x = q[0]*m[0] + q[1]*m[4] + q[2]*m[8]  + m[12];
		
		if(x <=  w) in_p |= 1;
		if(x >= -w) in_p |= 2;
		if(in_p == 63)
			return true;
		
		var y = q[0]*m[1] + q[1]*m[5] + q[2]*m[9]  + m[13];
		if(y <=  w) in_p |= 4;
		if(y >= -w) in_p |= 8;
		if(in_p == 63)
			return true;
			
		var z = q[0]*m[2] + q[1]*m[6] + q[2]*m[10] + m[14];
		if(z <=  w) in_p |= 16;
		if(z >= -w) in_p |= 32;
		if(in_p == 63)
			return true;
	}

	return false;
}

//Sets the block type and updates vertex buffers as needed
Chunk.prototype.set_block = function(x, y, z, b)
{
	this.data[x + (y<<CHUNK_X_S) + (z<<CHUNK_XY_S)] = b;
	this.vb.set_dirty();

	var coord = [x,y,z];
	var delta = [[1,0,0],
				 [0,1,0],
				 [0,0,1]];
				 
	for(var i=0; i<3; i++)
	{
		var d = delta[i];
		if(coord[i] == 0)
		{
			var c = Map.lookup_chunk(
				this.x - d[0],
				this.y - d[1],
				this.z - d[2]);
			if(c)
				c.vb.set_dirty();
		}
		else if(coord[i] == CHUNK_DIMS[i] - 1)
		{
			var c = Map.lookup_chunk(
				this.x + d[0],
				this.y + d[1],
				this.z + d[2]);
			if(c)
				c.vb.set_dirty();
		}
	}
}

//Forces a chunk to regenerate its vbs
Chunk.prototype.force_regen = function(gl)
{
	this.vb.gen_vb(gl);
}

//Draws the chunk
Chunk.prototype.draw = function(gl, chunk_shader, cam, transp)
{
	if(!this.in_frustum(cam))
		return;
		
	var c = Player.chunk();

	var pos = new Float32Array([1, 0, 0, 0,
								0, 1, 0, 0,
								0, 0, 1, 0,
								(this.x-c[0])*CHUNK_X, 
								(this.y-c[1])*CHUNK_Y, 
								(this.z-c[2])*CHUNK_Z, 1]);
	
	gl.uniformMatrix4fv(chunk_shader.view_mat, false, pos);
	
	this.vb.draw(gl, chunk_shader, transp);
}

Chunk.prototype.draw_vis = function(gl, vis_shader, cam)
{
	if(!this.in_frustum(cam))
		return;

	var c = Map.last_chunk;
	var pos = new Float32Array([1, 0, 0, 0,
								0, 1, 0, 0,
								0, 0, 1, 0,
								(this.x-c[0])*CHUNK_X, 
								(this.y-c[1])*CHUNK_Y, 
								(this.z-c[2])*CHUNK_Z, 1]);
	
	gl.uniformMatrix4fv(vis_shader.view_mat, false, pos);
	gl.uniform4f(vis_shader.chunk_id, 1, 1, 1, 1);
	
	this.vb.draw_vis(gl, vis_shader);
}

//Releases a chunk and its associated resources
Chunk.prototype.release = function(gl)
{
	this.vb.release(gl);
	delete this.vb;
	delete this.data;
}

//The map
var Map =
{
	index			: {},	//The chunk index
	pending_chunks	: [],	//Chunks waiting to be fetched
	terrain_tex		: null,
	max_chunks		: 1024,
	chunk_count 	: 0,
	chunk_radius	: 2,
	vis_radius		: 16,
	vis_width		: 64,
	vis_height		: 64,
	last_chunk		: [0, 0, 0],
	found_chunks	: false
};

Map.init = function(gl)
{
	var res = getProgram(gl, "shaders/chunk.fs", "shaders/chunk.vs");
	if(res[0] != "Ok")
	{
		return res[1];
	}
	
	//Read in return variables
	Map.chunk_fs 	 = res[1];
	Map.chunk_vs 	 = res[2];
	Map.chunk_shader = res[3];
	
	//Get attributes
	Map.chunk_shader.pos_attr = gl.getAttribLocation(Map.chunk_shader, "pos");
	if(Map.chunk_shader.pos_attr == null)
		return "Could not locate position attribute";

	Map.chunk_shader.tc_attr = gl.getAttribLocation(Map.chunk_shader, "texCoord");
	if(Map.chunk_shader.tc_attr == null)
		return "Could not locate tex coord attribute";

	Map.chunk_shader.proj_mat = gl.getUniformLocation(Map.chunk_shader, "proj");
	if(Map.chunk_shader.proj_mat == null)
		return "Could not locate projection matrix uniform";
	
	Map.chunk_shader.view_mat = gl.getUniformLocation(Map.chunk_shader, "view");
	if(Map.chunk_shader.view_mat == null)
		return "Could not locate view matrix uniform";

	Map.chunk_shader.tex_samp = gl.getUniformLocation(Map.chunk_shader, "tex");
	if(Map.chunk_shader.tex_samp == null)
		return "Could not locate sampler uniform";
		
	//Create texture
	res = getTexture(gl, "img/terrain.png");
	if(res[0] != "Ok")
	{
		return res[1];
	}
	Map.terrain_tex = res[1];
	
	//Create visibility prog
	res = getProgram(gl, "shaders/vis.fs", "shaders/vis.vs");
	if(res[0] != "Ok")
	{
		return res[1];
	}
	
	Map.vis_fs = res[1];
	Map.vis_vs = res[2];
	Map.vis_shader = res[3];
	
	//Get attributes
	Map.vis_shader.pos_attr = gl.getAttribLocation(Map.vis_shader, "pos");
	if(Map.vis_shader.pos_attr == null)
		return "Could not locate position attribute";

	Map.vis_shader.proj_mat = gl.getUniformLocation(Map.vis_shader, "proj");
	if(Map.vis_shader.proj_mat == null)
		return "Could not locate projection matrix uniform";
	
	Map.vis_shader.view_mat = gl.getUniformLocation(Map.vis_shader, "view");
	if(Map.vis_shader.view_mat == null)
		return "Could not locate view matrix uniform";
		
	Map.vis_shader.chunk_id = gl.getUniformLocation(Map.vis_shader, "chunk_id");
	if(Map.vis_shader.chunk_id == null)
		return "Could not locate chunk_id uniform";
	
	
	//Create chunk visibility frame buffer
	Map.vis_tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, Map.vis_tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NONE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NONE);
	gl.texParameteri(gl.TEXTURE_2D,	gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Map.vis_width, Map.vis_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	var depth_rb = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, depth_rb);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, Map.vis_width, Map.vis_height);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	
	Map.vis_fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, Map.vis_fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, Map.vis_tex, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_rb);
	
	if(!gl.isFramebuffer(Map.vis_fbo))
	{
		return "Could not create visibility frame buffer";
	}
	
	//Clear out FBO
	gl.viewport(0, 0, Map.vis_width, Map.vis_height);
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//Initialize pixel array
	Map.vis_data = new Uint8Array(4 * Map.vis_width * Map.vis_height);
	
	//Create box array
    var vertices = new Float32Array( [
    	0,			CHUNK_Y,	0,
    	CHUNK_X,	CHUNK_Y,	0,
    	0,			0,			0,
    	CHUNK_X,	0,			0,
    	0,			CHUNK_Y,	CHUNK_Z,
    	CHUNK_X,	CHUNK_Y,	CHUNK_Z,
    	0,			0,			CHUNK_Z,
    	CHUNK_X,	0,			CHUNK_Z]);
    
    var indices = new Uint16Array( [
			0,4,2, 2,4,6,		//-x
			1,7,5, 1,3,7,		//+x
    
			2,6,3, 3,6,7,		//-y
			0,1,4, 1,5,4,		//+y

			0,3,1, 0,2,3,		//-z
			4,5,6, 5,7,6		//+z
			]);
    
    Map.box_vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Map.box_vb);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	Map.box_ib = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Map.box_ib);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    Map.box_elements = indices.length;
    
	
	return "Ok";
}

Map.draw_box = function(gl, cx, cy, cz)
{
	var pos = new Float32Array([1, 0, 0, 0,
								0, 1, 0, 0,
								0, 0, 1, 0,
								(cx+0.5)*CHUNK_X, 
								(cy+0.5)*CHUNK_Y, 
								(cz+0.5)*CHUNK_Z, 1]);
	
	//Set uniform
	gl.uniformMatrix4fv(Map.vis_shader.view_mat, false, pos);
	gl.uniform4f(Map.vis_shader.chunk_id, (cx&0xff)/255.0, (cy&0xff)/255.0, (cz&0xff)/255.0, 1.0);
	
	//Draw the cube
	if(!Map.just_drew_box)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, Map.box_vb);
		gl.vertexAttribPointer(Map.vis_shader.pos_attr, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Map.box_ib);
	}
	gl.drawElements(gl.TRIANGLES, Map.box_elements, gl.UNSIGNED_SHORT, 0);
}

Map.visibility_query = function(gl, camera)
{
	//Start by binding fbo
	gl.bindFramebuffer(gl.FRAMEBUFFER, Map.vis_fbo);
	gl.viewport(0, 0, Map.vis_width, Map.vis_height);
	
	
	//Initialize background
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
	
	//Get camera
	var camera = Game.camera_matrix(Map.vis_width, Map.vis_height);
	
	//Set up shader program
	gl.useProgram(Map.vis_shader);
	gl.enableVertexAttribArray(Map.vis_shader.pos_attr);
	gl.uniformMatrix4fv(Map.vis_shader.proj_mat, false, camera);
	
	//Set state flags
	gl.disable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ZERO);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CW);
	gl.enable(gl.CULL_FACE);

	//Save last chunk	
	Map.last_chunk = Player.chunk();
	Map.just_drew_box = false;
	
	var query_chunk = function(cx, cy, cz)
	{
		var c = Map.lookup_chunk(
			Map.last_chunk[0] + cx, 
			Map.last_chunk[1] + cy, 
			Map.last_chunk[2] + cz);
		
		if(!c)
		{
			Map.draw_box(gl, cx, cy, cz);
			Map.just_drew_box = true;
		}
		else
		{
			Map.just_drew_box = false;
			c.draw_vis(gl, Map.vis_shader, camera);
		}
	}
	
	//Render all chunks to front-to-back
	query_chunk(0, 0, 0);
	for(var r=1; r<=Map.vis_radius; ++r)
	{
		query_chunk(0, 0, r);
		query_chunk(0, 0, -r);
	
		for(var d=1; d<=r; ++d)
		{
			query_chunk(0,  d, r-d);
			query_chunk(0, -d, r-d);
			if(d != r)
			{
				query_chunk(0,  d, d-r);
				query_chunk(0, -d, d-r);
			}
		}
	
		for(var c=1; c<=r; ++c)
		{
			query_chunk( c, 0, r-c);
			query_chunk(-c, 0, r-c);
			if(c != r)
			{
				query_chunk( c, 0, c-r);
				query_chunk(-c, 0, c-r);
			}
		
			for(var d=1; d<=r-c; ++d)
			{
				var cx = c, cy = d, cz = r-c-d;
		
				query_chunk( cx, cy, cz);
				query_chunk(-cx, cy, cz);
				query_chunk( cx,-cy, cz);
				query_chunk(-cx,-cy, cz);
				
				if(c+d != r)
				{
					query_chunk( cx, cy,-cz);
					query_chunk(-cx, cy,-cz);
					query_chunk( cx,-cy,-cz);
					query_chunk(-cx,-cy,-cz);
				}
			}
		}
	}
	
	//Read pixels
	gl.readPixels(0, 0, Map.vis_width, Map.vis_height, gl.RGBA, gl.UNSIGNED_BYTE, Map.vis_data);
	
	//Process data to find visible chunks
	for(var i=0; i<Map.vis_data.length; i+=4)
	{
		if(i > 0 && 
			Map.vis_data[i]   == Map.vis_data[i-4] &&
			Map.vis_data[i+1] == Map.vis_data[i-3] &&
			Map.vis_data[i+2] == Map.vis_data[i-2] )
		{
			continue;
		}
				
	
		//Issue the fetch request
		Map.fetch_chunk(
			Map.last_chunk[0] + ((Map.vis_data[i]<<24)>>24), 
			Map.last_chunk[1] + ((Map.vis_data[i+1]<<24)>>24),
			Map.last_chunk[2] + ((Map.vis_data[i+2]<<24)>>24) );
	}
	
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

//Updates the cache of chunks
Map.update_cache = function()
{
	//Need to grab all the chunks in the viewable cube around the player
	var c = Player.chunk();
	
	for(var i=c[0] - Map.chunk_radius; i<=c[0] + Map.chunk_radius; i++)
	for(var j=c[1] - Map.chunk_radius; j<=c[1] + Map.chunk_radius; j++)
	for(var k=c[2] - Map.chunk_radius; k<=c[2] + Map.chunk_radius; k++)
	{
		Map.fetch_chunk(i, j, k);
	}
	
	if((Map.pending_chunks.length == 0) && (Map.found_chunks || (Game.local_ticks % 20 == 0)) )
	{
		Map.found_chunks = false;
		Map.visibility_query(Game.gl);
	}
	
	
	//If we are over the chunk count, remove old chunks
	if(Map.chunk_count > Map.max_chunks)
	{
		//TODO: Purge old chunks
	}

	//Grab all pending chunks
	Map.grab_chunks();	
}

//Draws the map
// Input:
//  gl - the open gl rendering context
//  camera - the current camera matrix
Map.draw = function(gl, camera)
{
	gl.useProgram(Map.chunk_shader);
		
	//Enable attributes
	gl.enableVertexAttribArray(Map.chunk_shader.pos_attr);
	gl.enableVertexAttribArray(Map.chunk_shader.tc_attr);
	
	//Load matrix uniforms
	gl.uniformMatrix4fv(Map.chunk_shader.proj_mat, false, camera);

	//Set texture index
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, Map.terrain_tex);
	gl.uniform1i(Map.chunk_shader.tex_samp, 0);
	
	//Draw all the chunks
	for(c in Map.index)
	{
		Map.index[c].draw(gl, Map.chunk_shader, camera, false);
	}

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthMask(0);
	for(c in Map.index)
	{
		Map.index[c].draw(gl, Map.chunk_shader, camera, true);
	}
	gl.depthMask(1);
}

//Decodes a run-length encoded chunk
Map.decompress_chunk = function(arr, data)
{
	if(arr.length == 0)
		return -1;

	var i = 0, k=0;
	while(k<arr.length)
	{
		var n = arr[k];
		++k;

		if(n == 0xff)
		{
			var n = arr[k] + (arr[k+1] << 8);
			k += 2;
		}
		else
		{
			n++;
		}
		
		var c = arr[k++];
		
		if(i + n > CHUNK_SIZE)
			return -1;
		
		for(var j=0; j<n; ++j)
		{
			data[i++] = c;
		}
		
		if(i == CHUNK_SIZE)
			return k;
	}
}

//Downloads a chunk from the server
Map.fetch_chunk = function(x, y, z)
{
	//If chunk is already stored, don't get it
	if(Map.lookup_chunk(x,y,z))
		return;

	//Add new chunk, though leave it empty
	var chunk = new Chunk(x, y, z, new Uint8Array(CHUNK_SIZE));
	Map.add_chunk(chunk);
	Map.pending_chunks.push(chunk);
}

Map.grab_chunks = function()
{
	if(Map.pending_chunks.length == 0)
		return;

	var chunks = Map.pending_chunks;
	Map.pending_chunks = [];
	
	var bb = new BlobBuilder();
	bb.append(Session.get_session_id_arr().buffer);
	
	Map.found_chunks = true;
	
	for(var i=0; i<chunks.length; i++)
	{
		var arr = new Uint8Array(12);
		var k = 0;
		
		arr[k++] = (chunks[i].x)		& 0xff;
		arr[k++] = (chunks[i].x >> 8)	& 0xff;
		arr[k++] = (chunks[i].x >> 16)	& 0xff;
		arr[k++] = (chunks[i].x >> 24)	& 0xff;
		
		arr[k++] = (chunks[i].y)		& 0xff;
		arr[k++] = (chunks[i].y >> 8)	& 0xff;
		arr[k++] = (chunks[i].y >> 16)	& 0xff;
		arr[k++] = (chunks[i].y >> 24)	& 0xff;

		arr[k++] = (chunks[i].z)		& 0xff;
		arr[k++] = (chunks[i].z >> 8)	& 0xff;
		arr[k++] = (chunks[i].z >> 16)	& 0xff;
		arr[k++] = (chunks[i].z >> 24)	& 0xff;
		
		bb.append(arr.buffer);
	}

	asyncGetBinary("g", 
	function(arr)
	{	
		for(var i=0; i<chunks.length; i++)
		{
			var chunk = chunks[i];
		
			var res = Map.decompress_chunk(arr, chunk.data);
			
			//EOF, clear out remaining chunks
			if(res < 0)
			{
				for(var j=i; j<chunks.length; j++)
				{
					Map.remove_chunk(chunks[j]);
				}
				return;
			}

			//Resize array
			arr = arr.slice(res, arr.length);
			
			chunk.vb.set_dirty();
			
			//Regenerate vertex buffers for neighboring chunks
			var c = Map.lookup_chunk(chunk.x-1, chunk.y, chunk.z);
			if(c)	c.vb.set_dirty();
			
			c = Map.lookup_chunk(chunk.x+1, chunk.y, chunk.z);
			if(c)	c.vb.set_dirty();
			
			c = Map.lookup_chunk(chunk.x, chunk.y-1, chunk.z);
			if(c)	c.vb.set_dirty();
			
			c = Map.lookup_chunk(chunk.x, chunk.y+1, chunk.z);
			if(c)	c.vb.set_dirty();
			
			c = Map.lookup_chunk(chunk.x, chunk.y, chunk.z-1);
			if(c)	c.vb.set_dirty();

			c = Map.lookup_chunk(chunk.x, chunk.y, chunk.z+1);
			if(c)	c.vb.set_dirty();
		}
	}, 
	function()
	{
		for(var j=0; j<chunks.length; j++)
		{
			Map.remove_chunk(chunks[j]);
		}
	},
	bb.getBlob("application/octet-stream"));
}

//Converts a block index into an indexable string
Map.index2str = function(x, y, z)
{
	return x + ":" + y + ":" + z;
}

//Adds a chunk to the list
Map.add_chunk = function(chunk)
{
	var str = Map.index2str(chunk.x, chunk.y, chunk.z);
	Map.index[str] = chunk;
	++Map.chunk_count;
}

//Hash look up in map
Map.lookup_chunk = function(x, y, z)
{
	var str = Map.index2str(x, y, z);
	return Map.index[str];
}

//Just removes the chunk from the list
Map.remove_chunk = function(chunk)
{
	if(Map.lookup_chunk(chunk.x, chunk.y, chunk.z))
	{
		--Map.chunk_count;
		chunk.release(Game.gl);
		var str = Map.index2str(chunk.x, chunk.y, chunk.z);
		delete Map.index[str];
	}
}

//Returns the block type for the give position
Map.get_block = function(x, y, z)
{
	var cx = (x >> CHUNK_X_S), 
		cy = (y >> CHUNK_Y_S), 
		cz = (z >> CHUNK_Z_S);
	var c = Map.lookup_chunk(cx, cy, cz);		
	if(!c)
		return -1;
	
	var bx = (x & CHUNK_X_MASK), 
		by = (y & CHUNK_Y_MASK), 
		bz = (z & CHUNK_Z_MASK);
	return c.data[bx + (by << CHUNK_X_S) + (bz << CHUNK_XY_S)];
}

//Sets a block in the map to the given type
Map.set_block = function(x, y, z, b)
{
	var cx = (x >> CHUNK_X_S), 
		cy = (y >> CHUNK_Y_S), 
		cz = (z >> CHUNK_Z_S);
	var c = Map.lookup_chunk(cx, cy, cz);		
	if(!c)
		return;
	
	var bx = (x & CHUNK_X_MASK), 
		by = (y & CHUNK_Y_MASK), 
		bz = (z & CHUNK_Z_MASK);
	return c.set_block(bx, by, bz, b);
}

//Traces a ray into the map, returns the index of the block hit, its type and the hit normal
// Meant for UI actions, not particularly fast over long distances
Map.trace_ray = function(
	ox, oy, oz,
	dx, dy, dz,
	max_d)
{
	//Normalize D
	var ds = Math.sqrt(dx*dx + dy*dy + dz*dz);
	dx /= ds;
	dy /= ds;
	dz /= ds;
	
	//Step block-by-bloc along ray
	var t = 0.0;
	
	var norm = [0, 0, 0];
	
	while(t <= max_d)
	{
		var b = Map.get_block(Math.floor(ox), Math.floor(oy), Math.floor(oz));
		if(b != 0)
			return [ox, oy, oz, b, norm[0], norm[1], norm[2]];
			
		var step = 1.0;
		
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

