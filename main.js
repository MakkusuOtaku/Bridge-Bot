const mineflayer = require('mineflayer');
const vec3 = require('vec3');
const {pathfinder, Movements, goals} = require('mineflayer-pathfinder');

var bossName = "Makkusu_Otaku";
var boss;

var followID;
var bridge = [];
var lastBlock;

var i = 0;

var mcData;

const bot = mineflayer.createBot({
	host: "localhost",
	username: "BridgeMachine",
});

bot.loadPlugin(pathfinder);

bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn));
bot.on('error', err => console.log(err));

bot.once('spawn', ()=>{
	mcData = require('minecraft-data')(bot.version);
	boss = bot.players[bossName];

	movement = new Movements(bot, mcData);
	movement.scafoldingBlocks = [];
	bot.pathfinder.setMovements(movement);
});

bot.on('entitySpawn', (entity)=>{
	if (entity.mobType != 'Arrow') return;
	if (!boss || entity.position.distanceTo(boss.entity.position) > 2) return;

	followID = entity.uuid;

	bridge = [boss.entity.position.offset(0, 0, 0)];
	i = 0;
	bridge.push(entity.position.offset(0, 0, 0));
});

bot.on('entityMoved', (entity)=>{
	if (entity.uuid != followID) return;

	let pos = entity.position;

	let space = pos.distanceTo(bridge[bridge.length-1]);

	if (space >= 1) bridge.push(pos.offset(0, 0, 0));
	else if (space < 1 && bridge.length > 2) {
		followID = null;
		startBridge();
	}
});

bot.on('goal_reached', ()=>{
	continueBridge();
});

var start, end, target, unit;

function startBridge() {
	start = bridge[0];
	end = bridge[bridge.length-1];
	target = interVec(start, end, i);
	unit = 1/start.distanceTo(end);

	bot.pathfinder.setGoal(new goals.GoalNear(start.x, start.y, start.z, 4));
}

async function continueBridge() {
	if (i > 1) return;

	try {
		target = interVec(start, end, i);
		let referenceBlock = bot.blockAt(target);
		await bot.placeBlock(referenceBlock, vec3( 0, 1, 0));
	} catch(err) {
		console.log(err);
	}

	bot.pathfinder.setGoal(new goals.GoalBlock(target.x, target.y+1, target.z));

	let fX = Math.floor(target.x);
	let fZ = Math.floor(target.z);

	i += unit;

	console.log(target.distanceTo(interVec(start, end, i)));
}

function interVec(a, b, p) {
	return(vec3(interVal(a.x, b.x, p), interVal(a.y, b.y, p), interVal(a.z, b.z, p)));
}

function interVal(y1, y2, p) {
	return(((y2-y1)*p)+y1);
}
