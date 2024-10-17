// ==UserScript==
//
// @name            Infinihook
// @namespace       Violentmonkey Scripts
// @match           https://infinibrowser.wiki/item/*
// @match           https://infinibrowser.wiki/item?id=*
// @match           https://infinibrowser.wiki/analyzer
// @grant           none
// @version         Beta 1.1
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
        const base64Decoded = atob(webhookEncoded);
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
        return decodeWebhook(webhook);
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
            const stepsJson = data['steps'];

            const steps = convertToSteps(stepsJson);
            const message = convertToMessage(steps);

            const messageWithLengthCount = addStepCount(message, steps);
            const wrappedMessage = wrapMessage(messageWithLengthCount);
            const formattedMessage = addHeader(wrappedMessage, stepsJson);

            if (formattedMessage.length <= 2000) {
                await sendMessage(webhook, formattedMessage);
            } else {
                const sendBigMessage = confirm(`Lineage is too big\nMax: 2000 characters\nLineage: ${formattedMessage.length} characters\n\nDo you want the lineage to get sent in separate messages?`);
                if (sendBigMessage) handleBigLineage(webhook, steps);
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


    async function handleBigLineage(webhookUrl, steps) {
        return alert('Sending big lineage is not implemented yet, sorry');
    }

    /*
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
    */

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


    function convertToSteps(stepsJson) {
        const steps = [];

        for (const item of stepsJson) {
            const { a, b, result } = item;
            steps.push(`${a.id} + ${b.id} = ${result.id}`);
        }

        return steps;
    }


    function convertToMessage(steps) {
        return steps.join('\n');
    }


    function addStepCount(message, steps) {
        return `${message} // ${steps.length} :: `;
    }


    function addHeader(message, stepsJson) {
        const elementUrl = `<${window.location.href}>`;
        const lastElementId = stepsJson[stepsJson.length - 1].result.id;

        return `Recipe for [\`${lastElementId}\`](${elementUrl})\n${message}`;
    }


    function wrapMessage(message) {
       return `
\`\`\`asciidoc
${message}
\`\`\`
`;
    }

    // ---------- Element handling ----------




    // ---------- Main program ----------

    if (window.location.href !== 'https://infinibrowser.wiki/analyzer') setupDiscordButton();

    // ---------- Main program ----------

})();
