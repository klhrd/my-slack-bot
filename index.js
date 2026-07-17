require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// Helper function to format word list for Slack Markdown
const formatWordList = (res) => {
    return (res && res.data && res.data.length > 0) 
        ? res.data.map(w => `\`${w.word}\``).join(", ") 
        : "None";
};

// ==================== 1. Help Command ====================

app.command("/bot-help", async ({ ack, respond }) => {
    await ack();
    await respond({
        text: `*Advanced Lexicon Explorer*\n\n` +
              `This bot is dedicated to deep English word analysis.\n\n` +
              `*Available Commands:*\n` +
              `• \`/bot-word [word]\` - Query definition, phonetic pronunciation, and examples.\n` +
              `• \`/bot-thesaurus [word]\` - Deep dive into synonyms, antonyms, and derived words.\n` +
              `• \`/bot-etymology [word]\` - Trace historical roots and word origins.\n` +
              `• \`/bot-help\` - Show this help menu.`
    });
});

// ==================== 2. Dictionary Command (/bot-word) ====================

app.command("/bot-word", async ({ command, ack, respond }) => {
    await ack();

    const targetWord = command.text ? command.text.trim().toLowerCase() : "";
    if (!targetWord) {
        await respond({
            text: "Please provide a word! Example: \`/bot-word ephemeral\`"
        });
        return;
    }

    await respond({ text: `Looking up definition for *"${targetWord}"*... 🔍` });

    try {
        const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`).catch(() => null);

        let phonetic = "";
        let definitionText = "_No definitions found._";
        let exampleText = "_No examples found._";

        if (dictRes && dictRes.data && dictRes.data[0]) {
            const wordData = dictRes.data[0];
            phonetic = wordData.phonetic ? ` \`[${wordData.phonetic}]\`` : "";
            
            const meaningsList = [];
            const examplesList = [];
            
            wordData.meanings.forEach(m => {
                const defObj = m.definitions[0];
                if (defObj) {
                    meaningsList.push(`• *(${m.partOfSpeech})* ${defObj.definition}`);
                    if (defObj.example) {
                        examplesList.push(`• *(${m.partOfSpeech})* "${defObj.example}"`);
                    }
                }
            });

            if (meaningsList.length > 0) definitionText = meaningsList.slice(0, 3).join("\n");
            if (examplesList.length > 0) exampleText = examplesList.slice(0, 3).join("\n");
        }

        await respond({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `📖 *Word Explorer:* *"${targetWord}"*${phonetic}`
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Definitions:*\n${definitionText}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Examples:*\n${exampleText}`
                    }
                }
            ]
        });

    } catch (err) {
        await respond({
            text: `Failed to fetch linguistic data for *"${targetWord}"*. Please verify your spelling.`
        });
    }
});

// ==================== 3. Thesaurus Command (/bot-thesaurus) ====================

app.command("/bot-thesaurus", async ({ command, ack, respond }) => {
    await ack();

    const targetWord = command.text ? command.text.trim().toLowerCase() : "";
    if (!targetWord) {
        await respond({
            text: "Please provide a word! Example: \`/bot-thesaurus persistent\`"
        });
        return;
    }

    await respond({ text: `Analyzing synonyms and relations for *"${targetWord}"*... 🔍` });

    try {
        const synPromise = axios.get(`https://api.datamuse.com/words?rel_syn=${targetWord}&max=8`).catch(() => ({ data: [] }));
        const antPromise = axios.get(`https://api.datamuse.com/words?rel_ant=${targetWord}&max=8`).catch(() => ({ data: [] }));
        const relPromise = axios.get(`https://api.datamuse.com/words?rel_trg=${targetWord}&max=8`).catch(() => ({ data: [] }));
        const derivedPromise = axios.get(`https://api.datamuse.com/words?rel_cns=${targetWord}&max=8`).catch(() => ({ data: [] }));

        const [synRes, antRes, relRes, derivedRes] = await Promise.all([
            synPromise, antPromise, relPromise, derivedPromise
        ]);

        const synonyms = formatWordList(synRes);
        const antonyms = formatWordList(antRes);
        const relatedWords = formatWordList(relRes);
        const derivedWords = formatWordList(derivedRes);

        await respond({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `🔄 *Thesaurus: "${targetWord}"*`
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "section",
                    fields: [
                        { type: "mrkdwn", text: `*Synonyms:*\n${synonyms}` },
                        { type: "mrkdwn", text: `*Antonyms:*\n${antonyms}` }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Derived / Consonant Words:*\n${derivedWords}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Related Association Words:*\n${relatedWords}`
                    }
                }
            ]
        });

    } catch (err) {
        await respond({
            text: `An error occurred while fetching thesaurus data for *"${targetWord}"*.`
        });
    }
});

// ==================== 4. Etymology Command (/bot-etymology) ====================

app.command("/bot-etymology", async ({ command, ack, respond }) => {
    await ack();

    const targetWord = command.text ? command.text.trim().toLowerCase() : "";
    if (!targetWord) {
        await respond({
            text: "Please provide a word! Example: \`/bot-etymology sympathy\`"
        });
        return;
    }

    await respond({ text: `Tracing origin roots for *"${targetWord}"*... 🔍` });

    try {
        const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`).catch(() => null);
        const relRes = await axios.get(`https://api.datamuse.com/words?rel_trg=${targetWord}&max=8`).catch(() => ({ data: [] }));

        let etymologyText = "No direct etymology info found in Wiktionary database.";
        if (dictRes && dictRes.data && dictRes.data[0]) {
            const wordData = dictRes.data[0];
            if (wordData.etymology) {
                etymologyText = wordData.etymology;
            } else if (wordData.origin) {
                etymologyText = wordData.origin;
            }
        }

        const relatedWords = formatWordList(relRes);

        await respond({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `🌱 *Etymology & Roots: "${targetWord}"*`
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Origin Story:*\n\n> ${etymologyText}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Morphologically Related Words (Roots):*\n${relatedWords}`
                    }
                }
            ]
        });

    } catch (err) {
        await respond({
            text: `An error occurred while tracing etymology for *"${targetWord}"*.`
        });
    }
});

// ==================== 5. Start Bot ====================
(async () => {
    await app.start();
    console.log("bot is running!");
})();