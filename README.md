# 📖 Lexicon Explorer (Slack Bot)

![screenshot](./public/screenshot.png)

A high-performance, 24/7 Slack bot deployed on **Hack Club Nest** that acts as a deep English word analysis tool. No fluff, no basic toy commands—just pure linguistic data for developers, writers, and language learners.

It aggregates data from **Free Dictionary API (Wiktionary)** and **Datamuse API** to give you dictionary definitions, pronunciation, synonyms, antonyms, rhyming words, and etymology.

---

## ⚡ Features & Modes

Query any word using `/bot-word [word] [mode]`. There are 3 modes designed for different needs:

### 1️⃣ `all` (Default Mode)
* **Command:** `/bot-word <word>`
* **What it does:** Shows phonetic pronunciations, part-of-speech definitions, real-world examples, and basic synonyms/antonyms.
* *Example:* `/bot-word ephemeral`

### 2️⃣ `thesaurus` (Thesaurus Mode)
* **Command:** `/bot-word <word> thesaurus`
* **What it does:** Perfect for writing or naming variables. It fetches deep synonyms, antonyms, consonant (derived) words, and related association words.
* *Example:* `/bot-word persistent thesaurus`

### 3️⃣ `etymology` (Etymology Mode)
* **Command:** `/bot-word <word> etymology`
* **What it does:** Digs into the history of the word. Shows Wiktionary-sourced word origins (e.g., Latin/Greek roots) and morphologically related words.
* *Example:* `/bot-word sympathy etymology`

---

## 🛠️ How It's Built

* **Runtime:** Node.js (v24.x)
* **Framework:** Slack Bolt SDK (`@slack/bolt` using Socket Mode)
* **Hosting:** Running 24/7 as a systemd service inside a **Hack Club Nest** container.
* **API Integration:** Leverages asynchronous `Promise.all` requests to fetch multiple data sources simultaneously for maximum speed.

---

## ⚙️ Setup & Installation

If you want to host this yourself:

1. **Clone the repo:**
```bash
git clone [https://github.com/YOUR_USERNAME/my-slack-bot.git](https://github.com/YOUR_USERNAME/my-slack-bot.git)
cd my-slack-bot

```

2. **Install dependencies:**
```bash
npm install

```


3. **Configure environment variables:**
Create a `.env` file in the root directory:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

```


4. **Run the bot:**
```bash
node index.js

```



---

## 🛡️ Running 24/7 on Nest (via systemd)

To make sure the bot stays alive even after closing your terminal:

```bash
# Start and enable the service on your Nest container
systemctl daemon-reload
systemctl enable --now slackbot.service

# Check logs
journalctl -u slackbot.service -f

```



