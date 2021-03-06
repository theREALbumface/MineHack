#ifndef CONSTNATS_H
#define CONSTANTS_H

//Application wide constants go here

//Server stuff
#define NUM_HTTP_WORKERS		4
#define MAX_EPOLL_EVENTS		10
#define MAX_CONNECTIONS			10000
#define LISTEN_BACKLOG			3
#define RECV_BUFFER_SIZE		0x10000
#define SEND_BUFFER_SIZE		0x100000
#define EPOLL_TIMEOUT			400


//Chunk dimensions
#define CHUNK_X_S				4
#define CHUNK_Y_S				4
#define CHUNK_Z_S				4

#define CHUNK_X					(1<<CHUNK_X_S)
#define CHUNK_Y					(1<<CHUNK_Y_S)
#define CHUNK_Z					(1<<CHUNK_Z_S)

#define CHUNK_SIZE				(CHUNK_X*CHUNK_Y*CHUNK_Z)


//Coordinate origin
#define ORIGIN_X				(1<<19)
#define ORIGIN_Y				(1<<19)
#define ORIGIN_Z				(1<<19)







//Number of bits for a chunk index
#define CHUNK_IDX_S				19ULL

//Size of max chunk index
#define CHUNK_IDX_MAX			(1ULL<<CHUNK_IDX_S)

#define CHUNK_IDX_MASK			(CHUNK_IDX_MAX - 1)

//Coordinate indexing stuff
#define COORD_MIN_X				0
#define COORD_MIN_Y				0
#define COORD_MIN_Z				0

#define COORD_MAX_X				(CHUNK_IDX_MAX<<CHUNK_X_S)
#define COORD_MAX_Y				(CHUNK_IDX_MAX<<CHUNK_Y_S)
#define COORD_MAX_Z				(CHUNK_IDX_MAX<<CHUNK_Z_S)

#define COORD_BITS				(CHUNK_X_S + CHUNK_IDX_S)

//Map parameters
#define MAX_MAP_X	(1<<27)
#define MAX_MAP_Y	(1<<27)
#define MAX_MAP_Z	(1<<27)

//Converts a coordinate into a chunk index
#define COORD2CHUNKID(X,Y,Z)	(Game::ChunkID( ((X)>>(CHUNK_X_S)) & CHUNK_IDX_MASK, \
												((Y)>>(CHUNK_Y_S)) & CHUNK_IDX_MASK, \
												((Z)>>(CHUNK_Z_S)) & CHUNK_IDX_MASK ) )

//Precision for network coordinates
#define COORD_NET_PRECISION_S	6
#define COORD_NET_PRECISION		(1ULL<<COORD_NET_PRECISION_S)

//Radius for chat events
#define CHAT_RADIUS				128

//Radius of one network update region (for a player)
#define UPDATE_RADIUS			256

#define CHUNK_RADIUS			(1024)

//Bounds on chat line
#define CHAT_LINE_MAX_LEN		128

//Radius beyond which the client needs to be resynchronized
#define POSITION_RESYNC_RADIUS	10

//In ticks, time before player updates are discarded
#define MAX_PING				200

//Radius around which one can dig
#define DIG_RADIUS				5

//Player start coordinates
#define PLAYER_START_X			(1 << 19)
#define PLAYER_START_Y			((1 << 19)+32)
#define PLAYER_START_Z			(1 << 19)

//Player time out (in ticks) default is approx. 2 minutes
#define PLAYER_TIMEOUT			3000

//Sleep time for the main loop
#define SLEEP_TIME				40

//Size of an integer query variable
#define INT_QUERY_LEN			32

//Length of the console command buffer
#define COMMAND_BUFFER_LEN		256

//Maximum size for an event packet
#define EVENT_PACKET_SIZE		(1<<16)

//Grid bucket sizes for range searching in mailbox
#define BUCKET_SHIFT_X			7ULL
#define BUCKET_SHIFT_Y			6ULL
#define BUCKET_SHIFT_Z			7ULL

#define BUCKET_X				(1ULL<<BUCKET_SHIFT_X)
#define BUCKET_Y				(1ULL<<BUCKET_SHIFT_Y)
#define BUCKET_Z				(1ULL<<BUCKET_SHIFT_Z)

//Bucket string stuff
#define BUCKET_STR_BITS			6ULL
#define BUCKET_STR_MASK			((1ULL<<BUCKET_STR_BITS)-1ULL)
#define BUCKET_STR_LEN			5ULL

//Converts a triples into a bucket index
#define BUCKET_BITS_X			(32ULL - BUCKET_SHIFT_X)
#define BUCKET_BITS_Y			(32ULL - BUCKET_SHIFT_Y)
#define BUCKET_BITS_Z			(32ULL - BUCKET_SHIFT_Z)

#define BUCKET_MASK_X			((1ULL<<BUCKET_BITS_X) - 1)
#define BUCKET_MASK_Y			((1ULL<<BUCKET_BITS_Y) - 1)
#define BUCKET_MASK_Z			((1ULL<<BUCKET_BITS_Z) - 1)

#define TO_BUCKET(X,Y,Z) \
	((((uint64_t)(X)>>BUCKET_SHIFT_X) & BUCKET_MASK_X) | \
	((((uint64_t)(Y)>>BUCKET_SHIFT_Y) & BUCKET_MASK_Y)<<BUCKET_BITS_X) | \
	((((uint64_t)(Z)>>BUCKET_SHIFT_Z) & BUCKET_MASK_Z)<<(BUCKET_BITS_X+BUCKET_BITS_Y)))


#define BUCKET_IDX(X,Y,Z) \
	((uint64_t)(X) | \
	((uint64_t)(Y) << BUCKET_BITS_X) | \
	((uint64_t)(Z) << (BUCKET_BITS_X+BUCKET_BITS_Y)))

//Dimensions of a visibility buffer (in chunks)
#define VIS_BUFFER_X		8
#define VIS_BUFFER_Y		4
#define VIS_BUFFER_Z		8

//Visibility radii
#define VIS_RAD_X			4
#define VIS_RAD_Y			5
#define VIS_RAD_Z			4

#endif


