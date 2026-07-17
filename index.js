require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// ==================== 1. Help Command ====================

// 說明選單（指令說明已全數換成英文）
app.command("/bot-help", async ({ ack, respond }) => {
    await ack();
    await respond({
        text: `🤖 *Ryder's Bot Command List* 🤖\n\n` +
              `• \`/bot-help\` - Show this help menu\n` +
              `• \`/bot-ask [question]\` - Chat with Tencent Hy3 AI 🧠\n` +
              `• \`/bot-joke\` - Get a random joke 😆\n` +
              `• \`/bot-fact\` - Get a random useless fact 💡\n` +
              `• \`/bot-dog\` - Get a random cute dog photo 🐶\n` +
              `• \`/bot-bored\` - Get a random activity idea when you are bored 🎯\n` +
              `• \`/bot-anime\` - Get a random anime quote 🎬`
    });
});

// ==================== 2. Fun API Commands ====================

// 英文笑話
app.command("/bot-joke", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
        await respond({
            text: `😆 *Here is a joke for you:*\n\n*${response.data.setup}*\n\n_${response.data.punchline}_`
        });
    } catch (err) {
        await respond({ text: "Sorry, the joke database is currently offline! 😭" });
    }
});

// 新增：趣味冷知識 (Useless Facts API)
app.command("/bot-fact", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
        await respond({
            text: `💡 *Did you know?*\n\n_${response.data.text}_`
        });
    } catch (err) {
        await respond({ text: "Sorry, the fact database is currently offline! 🧠" });
    }
});

// 隨機狗狗圖
app.command("/bot-dog", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://dog.ceo/api/breeds/image/random");
        await respond({
            text: "🐶 Here is a cute dog for you!",
            blocks: [
                {
                    type: "image",
                    title: { type: "plain_text", text: "Cute Dog!" },
                    image_url: response.data.message,
                    alt_text: "A cute dog"
                }
            ]
        });
    } catch (err) {
        await respond({ text: "Oops! The dog ran away. Failed to load image! 🦴" });
    }
});

// 無聊救星
app.command("/bot-bored", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://bored-api.apphost.io/api/activity");
        await respond({
            text: `🎯 *Here is something you can do:*\n\n👉 *${response.data.activity}* \n(Type: ${response.data.type} | Participants: ${response.data.participants})`
        });
    } catch (err) {
        await respond({ text: "No ideas? Just go back to coding! 😅" });
    }
});

// 動漫名言
app.command("/bot-anime", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://animechan.xyz/api/random");
        await respond({
            text: `🎬 *Anime Quote:*\n\n> "${response.data.quote}"\n\n—— *${response.data.character}* (${response.data.anime})`
        });
    } catch (err) {
        await respond({ text: "Failed to load anime quote! ⚔️" });
    }
});

// ==================== 3. Hack Club AI Command ====================

// AI 聊天功能
app.command("/bot-ask", async ({ command, ack, respond }) => {
    await ack();

    const userPrompt = command.text;
    if (!userPrompt) {
        await respond({
            text: "Please provide a question! Example: \`/bot-ask Why is the sky blue?\`"
        });
        return;
    }

    await respond({ text: `Thinking... 🧠` });

    try {
        const response = await axios.post(
            "https://ai.hackclub.com/proxy/v1/chat/completions", {
                model: "tencent/hy3:free",
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.HACK_CLUB_AI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;

        await respond({
            text: `*Question:* ${userPrompt}\n\n*AI Answer:*\n${aiReply}`
        });

    } catch (err) {
        console.error(err);
        await respond({
            text: "An error occurred while contacting AI. Please try again later!"
        });
    }
});

// ==================== 4. Start Bot ====================
(async () => {
    await app.start();
    console.log("bot is running!");
})();