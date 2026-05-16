import fs from "node:fs";

const commitMsgPath = process.argv[2];
const raw = fs.readFileSync(commitMsgPath, "utf8").trim();
const header = raw.split("\n")[0]?.trim() || "";

const validTypes = new Set([
	"feat",
	"fix",
	"docs",
	"test",
	"build",
	"perf",
	"style",
	"refactor",
	"chore",
	"ci",
	"raw",
	"cleanup",
	"remove",
	"init",
]);

const emojiPrefix = /^:\w+:\s*/;
const unicodeEmojiPrefix = /^[\p{Extended_Pictographic}]\s*/u;

let withoutEmoji = header;
if (emojiPrefix.test(withoutEmoji)) {
	withoutEmoji = withoutEmoji.replace(emojiPrefix, "");
} else if (unicodeEmojiPrefix.test(withoutEmoji)) {
	withoutEmoji = withoutEmoji.replace(unicodeEmojiPrefix, "");
} else {
	console.error("❌ O commit precisa começar com um emoji.");
	process.exit(1);
}

const conventional = /^(\w+)(\([\w\-./]+\))?:\s.+$/;
const match = withoutEmoji.match(conventional);

if (!match) {
	console.error("❌ Mensagem inválida. Use o padrão: :emoji: type: descrição");
	process.exit(1);
}

const type = match[1];
if (!validTypes.has(type)) {
	console.error(
		`❌ Tipo inválido "${type}". Tipos aceitos: ${[...validTypes].join(", ")}`,
	);
	process.exit(1);
}
