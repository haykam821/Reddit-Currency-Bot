const fs = require("fs-extra");

const snoowrap = require("snoowrap");
const snoostorm = require("snoostorm");

const { version } = require("../package.json");

const regex = /!bronze \/?(u\/?)([\w-]+)/i;

const DAY = 2629800000;

function save(data) {
	return fs.writeJSON("./../data.json", data);
}

function commentText(msg) {
	return msg + "\n\n---\n\n*I am a bot. | [Contact](https://www.reddit.com/message/compose?to=u/haykam821&subject=Reddit%20Currency%20Bot)*";
}

(async () => {
	// Get config
	const userConfig = await fs.readJSON("./../config.json");
	const config = {
		credentials: {},
		...userConfig,
	};

	// Load data
	const data = await fs.readJSON("./../data.json");

	// Set up reddit client
	const reddit = new snoowrap(Object.assign({
		...config.credentials,
		userAgent: `Reddit Currency Bot v${version}`,
	}));
	const storm = new snoostorm(reddit);

	const stream = storm.CommentStream({
		results: 30,
		subreddit: "all"
	});
	stream.on("comment", comment => {
		const match = comment.body.match(regex);

		if (match) {
			reddit.getUser(match[2]).fetch().then(user => {
				if (user.name === comment.author.name) {
					return comment.reply(commentText("You may not give Reddit Bronze™ to yourself."));
				} else if (user.name === reddit.username) {
					return comment.reply(commentText("That is a kind gesture, but no."));
				}

				if (!data[user.name]) {
					data[user.name] = {};
				}
				data[user.name].bronze = (data[user.name].bronze + 1) || 1;

				save(data);

				comment.reply(commentText(`You have given Reddit Bronze™ to **${user.name}**. They now have **${data[user.name].bronze}x Bronze**.`));
			}).catch(error => {
				if (error.message.includes("404")) {
					comment.reply(commentText("Unfortunately, I do not know anyone by that name."));
				}
			});
		}
	});
})();