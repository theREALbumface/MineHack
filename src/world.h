#ifndef GAME_H
#define GAME_H

#include <pthread.h>

#include <utility>
#include <string>
#include <map>
#include <cstdint>
#include <cstdlib>

#include <tcutil.h>

#include "constants.h"
#include "chunk.h"
#include "entity.h"
#include "action.h"
#include "entity_db.h"
#include "mailbox.h"
#include "worldgen.h"
#include "map.h"
#include "config.h"

namespace Game
{

	//Client state packet
	struct PlayerEvent
	{
		uint64_t	tick;
		double 		x, y, z;
		double 		pitch, yaw, roll;
		int 		input_state;
	};

	class World
	{
	public:
		//World data
		bool		running;
		
		//The game's current tick count
		uint64_t		tick_count;
						
		//Ctor
		World();
		~World();
		
		//Player management functions
		bool player_create(std::string const& player_name, EntityID& player_id);
		bool get_player_entity(std::string const& player_name, EntityID& player_id);
		void player_delete(EntityID const& player_id);
		bool player_join(EntityID const& player_id);
		bool player_leave(EntityID const& player_id);
		
		//Input handlers
		bool valid_player(EntityID const& player_id);
		void handle_player_action(EntityID const& player_id, Action const& action);
		void handle_player_tick(EntityID const& player_id, PlayerEvent const& input, uint64_t& prev_tick);
		void handle_chat(EntityID const& player_id, std::string const& msg);
		void handle_forget(EntityID const& player_id, EntityID const& forget_id);
		void handle_action(EntityID const& player_id, Action const& action);
		
		//Retrieves a compressed chunk from the server
		int get_compressed_chunk(
			EntityID const&,
			ChunkID const&,
			uint8_t* buf,
			int buf_len);
		
		//Processes queued messages for a particular client, main network IO event
		bool heartbeat(
			EntityID const&,
			int socket);
		
		//Ticks the server
		void tick();
		
		//Misc. functions
		void set_block(int x, int y, int z, Block b);
		
	private:
	
		//Various systems
		WorldGen		*world_gen;		//World generator
		Map    			*game_map;		//The game map
		EntityDB		*entity_db;		//Entity database
		Mailbox			*mailbox;		//Mailbox for player updates
		Config			*config;		//Configuration stuff
		
		//Event handlers
		struct CreateHandler : EntityEventHandler
		{
			World *world;
			CreateHandler(World* w) : world(w) {}
			virtual void call(Entity const& ev);
		};

		struct UpdateHandler : EntityEventHandler
		{
			World *world;			
			UpdateHandler(World* w) : world(w) {}
			virtual void call(Entity const& ev);
		};

		struct DeleteHandler : EntityEventHandler
		{
			World *world;			
			DeleteHandler(World* w) : world(w) {}
			virtual void call(Entity const& ev);
		};
	
		CreateHandler	*create_handler;
		UpdateHandler	*update_handler;
		DeleteHandler	*delete_handler;
		
		//The update loops
		void tick_players();
		void tick_mobs();
	};
};

#endif

