const { Client, IntentsBitField, EmbedBuilder, WebhookClient } = require('discord.js');
const dotenv = require('dotenv');
const accounts = require('./accounts.json');
const userList = require('./blaze-users.json');

dotenv.config();

const token = process.env.TOKEN;

const blazeFree = new WebhookClient({ id: process.env.BLAZE_FREE_ID, token: process.env.BLAZE_FREE_TOKEN });
const blazePaid = new WebhookClient({ id: process.env.BLAZE_PAID_ID, token: process.env.BLAZE_PAID_TOKEN });
const happy = new WebhookClient({ id: process.env.HAPPY_ID, token: process.env.HAPPY_TOKEN });
const pia = new WebhookClient({ id: process.env.PIA_ID, token: process.env.PIA_TOKEN });
const error = new WebhookClient({ id: process.env.ERROR_ID, token: process.env.ERROR_TOKEN });


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}, ready to use!`);

    client.user.setPresence({
        status: "online",  // You can show online, idle... Do not disturb is dnd
        activity: {
            name: "with Freebies!",  // The message shown
            type: "PLAYING"
        }
    })
});

client.on('messageCreate', (message) => {
    if (message.webhookId) {
        for (let i = 0; i < message.embeds.length; i++) {
            try {
                const returnEmbed = message.embeds[i];
                if (returnEmbed.author.name === 'Enven - Successful Checkout! 🎉') { // Enven Checkout
                    var checkoutEmail = (returnEmbed.fields[4].value.replaceAll('|', '')).trim();
                    var orderInfo = sortOrder(checkoutEmail);
                    if (orderInfo[0] === 1) {
                        sendEmbed('blaze', returnEmbed.fields[1].value, returnEmbed, orderInfo[1], 'enven');
                    }
                    else if (orderInfo[0] === 2) {
                        sendEmbed('personal', returnEmbed.fields[1].value, returnEmbed, orderInfo[1], 'enven');
                    }
                }
                else { // Refract Checkout

                    var checkoutEmail = (returnEmbed.fields[9].value.replaceAll('|', '')).trim();
                    var orderInfo = sortOrder(checkoutEmail);
                    if (orderInfo[0] === 1) {
                        sendEmbed('blaze', returnEmbed.fields[6].value, returnEmbed, orderInfo[1], 'refract');
                    }
                    else if (orderInfo[0] === 2) {
                        sendEmbed('personal', returnEmbed.fields[6].value, returnEmbed, orderInfo[1], 'refract');
                    }
                }
            } catch (e) {
                console.log(`Error while scraping: ${e.message}`);
                error.send({
                    username: 'Error!',
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Error!')
                            .setColor(0xFF0000)
                            .setDescription(`There was an error scraping the checkout! \n \`\`${e.message}\`\``)
                    ],
                })
            }
        }
    }
})

// sortOrder - Checks Blaze and Personal account lists to see who the order belongs to.
function sortOrder(email) {
    let foundUser = false;
    for (let i = 0; i < userList.user.length; i++) {
        if (userList.user[i].email.toLowerCase() === email.toLowerCase()) {
            foundUser = true;
            return [1, `<@${userList.user[i].discord}>`];
        }
    }
    if (!foundUser) {
        for (let i = 0; i < accounts.user.length; i++) {
            if (accounts.user[i].email.toLowerCase() === email.toLowerCase()) {
                return [2, `<@${accounts.user[i].discord}>`];
            }
        }
    }
}


//General embed to send.

function sendEmbed(client, discount, returnEmbed, discord, bot) {
    if (bot === 'enven') {
        const priceGroup = returnEmbed.fields[2].value.split("~~");
        const oldPrice = priceGroup[1];
        const newPrice = priceGroup[2];

        var filterEmbed = new EmbedBuilder()
            .setFields([
                {
                    "name": "Product",
                    "value": `[${returnEmbed.title}](${returnEmbed.url})`,
                    "inline": false
                },
                {
                    "name": "New Price",
                    "value": newPrice,
                    "inline": true
                },
                {
                    "name": "Discount %",
                    "value": discount,
                    "inline": true
                },
                {
                    "name": "Original Price",
                    "value": oldPrice,
                    "inline": true
                }
            ])
    } else if (bot === 'refract') {
        var filterEmbed = new EmbedBuilder()
            .setFields([
                {
                    "name": "Product",
                    "value": returnEmbed.fields[0].value,
                    "inline": false
                },
                {
                    "name": "New Price",
                    "value": returnEmbed.fields[1].value,
                    "inline": true
                },
                {
                    "name": "Discount %",
                    "value": discount,
                    "inline": true
                },
                {
                    "name": "Original Price",
                    "value": returnEmbed.fields[7].value,
                    "inline": true
                }
            ])
    }
    filterEmbed.setImage(returnEmbed.thumbnail.url)
    filterEmbed.setTimestamp()
    if (client === 'blaze') {
        if (discount === '100.00%' || discount === '100%') {
            filterEmbed.setColor(8454016);
            console.log(`Blaze Free Checkout!`);
            blazeFree.send({
                username: 'Blaze Checkouts',
                avatarURL: 'https://cdn.discordapp.com/attachments/917447932750495774/1137940430625980486/blaze_logo1.jpg',
                content: `|| ${discord} ||`,
                embeds: [filterEmbed.setTitle(`Free Checkout! :partying_face:`)],
            })
        }
        else {
            filterEmbed.setColor(0xFFA500);
            console.log(`Blaze Paid Checkout!`);
            blazePaid.send({
                username: 'Blaze Checkouts',
                avatarURL: 'https://cdn.discordapp.com/attachments/917447932750495774/1137940430625980486/blaze_logo1.jpg',
                content: `|| ${discord} ||`,
                embeds: [filterEmbed.setTitle(`Paid Checkout! :tada:`)],
            })
        }
    } else if (client === 'personal') {
        if (discount === '100.00%' || discount === '100%') {
            filterEmbed.setColor(8454016);
            blazeFree.send({
                username: 'Blaze Checkouts',
                avatarURL: 'https://cdn.discordapp.com/attachments/917447932750495774/1137940430625980486/blaze_logo1.jpg',
                content: `|| User Not Found ||`,
                embeds: [filterEmbed.setTitle(`Free Checkout! :partying_face:`)],
            })
        }
        else {
            filterEmbed.setColor(0xFFA500);
            blazePaid.send({
                username: 'Blaze Checkouts',
                avatarURL: 'https://cdn.discordapp.com/attachments/917447932750495774/1137940430625980486/blaze_logo1.jpg',
                content: `|| User Not Found ||`,
                embeds: [filterEmbed.setTitle(`Paid Checkout! :tada:`)],
            })
        }

        if (discord === `<@1072349423297908756>`) {
            console.log('Checkout for Happy!');
            happy.send({
                username: 'Checkout',
                embeds: [filterEmbed.setTitle(`Checkout for Happy! :tada:`)],
            })
        } else {
            console.log('Checkout for Pia!');
            pia.send({
                username: 'Checkout',
                embeds: [filterEmbed.setTitle(`Checkout for Pia! :partying_face:`)],
            });
            happy.send({
                username: 'Checkout',
                embeds: [filterEmbed.setTitle(`Checkout for Pia! :cry:`)],
            });
        }
    }

}

client.login(token)