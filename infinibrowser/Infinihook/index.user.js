// ==UserScript==
//
// @name            Infinihook
// @namespace       Violentmonkey Scripts
// @match           https://infinibrowser.wiki/item/*
// @match           https://infinibrowser.wiki/item?id=*
// @match           https://infinibrowser.wiki/analyzer
// @grant           none
// @version         1.0
// @author          GameRoMan
// @description     Sends recipes to your discord server
// @downloadURL     https://github.com/GameRoMan/InfiniteCraft/raw/refs/heads/main/infinibrowser/Infinihook/index.user.js
//
// ==/UserScript==




(function() {

    // ---------- Webhook setup functions ----------

    function encodeWebhook(webhook) {
        const base64Encoded = btoa(webhook);
        const shift = 3;

        let webhookEncoded = "";

        for (let i = 0; i < base64Encoded.length; i++) {
            const charCode = base64Encoded.charCodeAt(i);
            webhookEncoded += String.fromCharCode(charCode + shift);
        }

        return btoa(webhookEncoded);
    }


    function decodeWebhook(webhookEncoded) {
        const base64Decoded = atob(webhookEncoded)
        const shift = 3;

        let webhook = "";

        for (let i = 0; i < base64Decoded.length; i++) {
            const charCode = base64Decoded.charCodeAt(i);
            webhook += String.fromCharCode(charCode - shift);
        }

        return atob(webhook);
    }


    function newWebhook() {
        const webhook = prompt('Enter webhook url');
        localStorage.setItem('webhookEncoded', encodeWebhook(webhook));
    }


    function getWebhook() {
        const webhook = localStorage.getItem('webhookEncoded');
        return decodeWebhook(webhook)
    }

    // ---------- Webhook setup functions ----------




    // ---------- Discord button setup functions ----------

    function setupDiscordButton() {
        const discordButtonImageUrl = 'https://img.icons8.com/ios7/512/FFFFFF/discord-logo.png';

        const buttonMenu = document.querySelector('.ibuttons');

        const discordButton = document.createElement('button');

        const discordButtonImage = document.createElement('img');
        discordButtonImage.id = 'discord-button-image';
        discordButtonImage.src = discordButtonImageUrl;
        discordButtonImage.draggable = false;

        discordButton.appendChild(discordButtonImage);

        buttonMenu.appendChild(discordButton);

        discordButton.addEventListener('click', handleDiscordButtonClick);
    }


    async function handleDiscordButtonClick() {
        const webhook = getWebhook();
        if (!webhook) {
            newWebhook();
            return;
        }

        const elementUrl = getElementUrl();
        const data = await getLineage(elementUrl);

        if (data) {
            const steps = data['steps'];
            const message = formatLineage(steps);

            if (message.length <= 2000) {
                await sendMessage(webhook, message);
            } else {
                alert(`The lineage is too big\nMax characters allowed: 2000\nLineage: ${message.length} characters`);
                return;
                const sendBigMessage = confirm('Lineage is too long\n\nDo you want to the lineage get sent in separate messages? (Formatting might break)');
                if (sendBigMessage) sendMultipleMessages(webhook, message);
            }
        }
    }

    // ---------- Discord button setup functions ----------




    // ---------- Message handling ----------

    async function sendMessage(webhookUrl, message) {
        try {
            const response = await fetch(
                webhookUrl,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        content: message,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
                alert('Something went wrong, check Console for more information');
            } else {
                alert('Lineage successfully sent to your webhook');
            }

        } catch (error) {
            console.error('Error:', error);
        }
    }


    async function sendMultipleMessages(webhookUrl, originalMessage) {
        console.log(originalMessage.length);

        const messages = splitIntoSeparateStrings(originalMessage, 1900);
        console.log(messages);

        for (const message of messages) {
            await sendMessage(webhookUrl, message);
        }
    }

    function splitIntoSeparateStrings(string, maxLength) {
        if (string.length <= maxLength) return [string];
        return [string.substr(0, maxLength), ...splitIntoSeparateStrings(string.substr(maxLength, string.length), maxLength)]
    }

    // ---------- Message handling ----------




    // ---------- Element handling ----------

    function getElementUrl() {
        const element = (window.location.search) ? (window.location.href.split('=')[1]) : (window.location.href.split('/')[4]);

        const itemFooter = document.getElementById('item_footer');
        const isOfficial = (!itemFooter);

        if (isOfficial) {
            return `https://infinibrowser.wiki/api/recipe?id=${element}`;
        } else {
            return `https://infinibrowser.wiki/api/recipe/custom?id=${element}`;
        }
    }


    async function getLineage(elementUrl) {
        try {
            const response = await fetch(
                elementUrl,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } else {
                const data = await response.json();
                return data;
            }

        } catch (error) {
            console.error('Error:', error);
        }
    }


    function convertToLines(steps) {
        const results = [];

        for (const item of steps) {
            const {
                a,
                b,
                result
            } = item;
            results.push(`${a.id} + ${b.id} = ${result.id}`);
        }

        return results;
    }


    function formatLineage(steps, step=0) {
        const results = convertToLines(steps);

        const lastElementId = steps[steps.length - 1].result.id;
        const elementUrl = `<${window.location.href}>`;

        const message = results.join('\n');
        const formattedMessage = `

ㅤ\n\nRecipe for [\`${lastElementId}\`](${elementUrl})
\`\`\`asciidoc
${message} // ${step + results.length} :: \`\`\`

`;

        return formattedMessage;
    }

    // ---------- Element handling ----------




    // ---------- Main program ----------

    if (window.location.href !== 'https://infinibrowser.wiki/analyzer') setupDiscordButton();

    // ---------- Main program ----------

})();
