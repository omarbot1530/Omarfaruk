const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");

/* ===== wrapText (FIXED) ===== */
async function wrapText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width < maxWidth) return [text];

  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

module.exports = {
  config: {
    name: "hack",
    author: "N1SA9",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Fake hacking image with user profile picture",
    },
  },

  onStart: async function ({ api, event }) {
    try {
      const cache = __dirname + "/cache/";
      if (!fs.existsSync(cache)) fs.mkdirSync(cache);

      const bgPath = cache + "bg.png";
      const avtPath = cache + "avt.png";

      const id = Object.keys(event.mentions)[0] || event.senderID;

      /* ===== get user info ===== */
      const userInfo = await api.getUserInfo(id);
      const name = userInfo[id].name;
      const avatarURL = userInfo[id].avatar;

      /* ===== download avatar ===== */
      const avatar = await axios.get(avatarURL, { responseType: "arraybuffer" });
      fs.writeFileSync(avtPath, Buffer.from(avatar.data));

      /* ===== background ===== */
      const bgURL =
        "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ";
      const bg = await axios.get(bgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, Buffer.from(bg.data));

      /* ===== canvas ===== */
      const base = await loadImage(bgPath);
      const avatarImg = await loadImage(avtPath);

      const canvas = createCanvas(base.width, base.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

      ctx.font = "400 23px Arial";
      ctx.fillStyle = "#1878F3";

      const lines = await wrapText(ctx, name, 1160);
      ctx.fillText(lines.join("\n"), 200, 497);

      ctx.drawImage(avatarImg, 83, 437, 100, 100);

      const buffer = canvas.toBuffer();
      fs.writeFileSync(bgPath, buffer);

      return api.sendMessage(
        {
          body: "✅ Successfully hacked 😈",
          attachment: fs.createReadStream(bgPath),
        },
        event.threadID,
        () => {
          fs.unlinkSync(bgPath);
          fs.unlinkSync(avtPath);
        },
        event.messageID
      );
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Error occurred", event.threadID, event.messageID);
    }
  },
};
