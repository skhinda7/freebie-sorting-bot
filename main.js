const { Client, IntentsBitField, EmbedBuilder, WebhookClient } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const csvFilePath = 'accounts.csv'; // Replace with your CSV file path
var userSheet; // Array to store the parsed data

dotenv.config();

const token = process.env.TOKEN;

const blazeFree = new WebhookClient({ id: process.env.BLAZE_FREE_ID, token: process.env.BLAZE_FREE_TOKEN });
const blazePaid = new WebhookClient({ id: process.env.BLAZE_PAID_ID, token: process.env.BLAZE_PAID_TOKEN });
const happy = new WebhookClient({ id: process.env.HAPPY_ID, token: process.env.HAPPY_TOKEN });
const pia = new WebhookClient({ id: process.env.PIA_ID, token: process.env.PIA_TOKEN });
const jagdeep = new WebhookClient({ id: process.env.JAGDEEP_ID, token: process.env.JAGDEEP_TOKEN });
const freebieHub = new WebhookClient({ id: process.env.HUB_ID, token: process.env.HUB_TOKEN });
const error = new WebhookClient({ id: process.env.ERROR_ID, token: process.env.ERROR_TOKEN });
const personal = new WebhookClient({ id: process.env.PERSONAL_ID, token: process.env.PERSONAL_TOKEN });
const skhindaId = process.env.SKHINDA_ID;

function parseCSV() {
    userSheet = [];
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            // Push each row (record) into the array as an object
            userSheet.push(row);
        })
        .on('end', () => {
            // CSV parsing is complete
            console.log('Accounts parsed and ready to use!');
            personal.send({
                username: 'Freebie Sorter',
                content: `Accounts parsed and ready to use!`,
            });
        })
        .on('error', (error) => {
            // Handle any errors that may occur during parsing
            console.error('Error parsing CSV:', error);
        });
}

parseCSV();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
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
                    else if (orderInfo[0] === 3) {
                        sendEmbed('freebiehub', returnEmbed.fields[1].value, returnEmbed, orderInfo[1], 'enven');
                    }
                }
                else { // Refract Checkout */
                    var checkoutEmail = (returnEmbed.fields[9].value.replaceAll('|', '')).trim();
                    var orderInfo = sortOrder(checkoutEmail);
                    if (orderInfo[0] === 1) {
                        sendEmbed('blaze', returnEmbed.fields[6].value, returnEmbed, orderInfo[1], 'refract');
                    }
                    else if (orderInfo[0] === 2) {
                        sendEmbed('personal', returnEmbed.fields[6].value, returnEmbed, orderInfo[1], 'refract');
                    }
                    else if (orderInfo[0] === 3) {
                        sendEmbed('freebiehub', returnEmbed.fields[6].value, returnEmbed, orderInfo[1], 'refract');
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

client.on('messageCreate', (message) => {
    if (message.channel.id === '1150503181072207903') {
        try {
            const args = message.content.split(' ');
            if (args[0] === '!e') {
                var result = sortOrder(args[1]);
                personal.send({
                    username: 'Freebie Sorter',
                    content: `Linked Discord: ${result[1]}`,
                });

            } else if (args[0] === '!d') {
                var result = sortOrder(args[1]);
                personal.send({
                    username: 'Freebie Sorter',
                    content: `Linked Email: ${result[1]}`,
                });
            } else if (args[0] === '!add') {
                personal.send({
                    username: 'Freebie Sorter',
                    content: `\`\`\`Account information\`\`\`\nEmail: \`\`${args[1]}\`\`\nDiscord: <@!${args[2]}>\nGroup: \`\`${args[3]}\`\``,
                });
                addRowToCSV(args[3], args[1], args[2]);
            } else if (args[0] === `!count`) {
                personal.send({
                    username: 'Freebie Sorter',
                    content: `${args[1]} total accounts: \`\`${totalAccounts(args[1])}\`\``,
                });
            } else if (args[0] === `!list`) {
                var userList = listAccounts(args[1]);
                personal.send({
                    username: 'Freebie Sorter',
                    content: `${args[1]} list:\n\`\`${userList.join('\n').trim()}\`\`\n\nTotal Accounts: \`\`${userList.length}\`\``,
                });
            }
        } catch (e) {
            personal.send({
                username: 'Freebie Sorter',
                content: `${e.message}`,
            });
        }
    }
})

// sortOrder - Checks Blaze and Personal account lists to see who the order belongs to.
function sortOrder(args) {
    var group = 0;
    if (args.includes('@')) {
        for (let i = 0; i < userSheet.length; i++) {
            if (userSheet[i].email === args.toLowerCase()) {
                if (userSheet[i].group === 'blaze') {
                    group = 1;
                }
                else if (userSheet[i].group === 'freebiehub') {
                    group = 3;
                }
                else {
                    group = 2;
                }
                return [group, `<@${userSheet[i].discord}>`];
            }
        }
    } else {
        for (let i = 0; i < userSheet.length; i++) {
            if (userSheet[i].discord === args.trim()) {
                return [i, `${userSheet[i].email}`];
            }
        }
    }
    return [0, 'User not found'];
}

function totalAccounts(group) {
    var count = 0;
    for (let i = 0; i < userSheet.length; i++) {
        if (userSheet[i].group === group) {
            count++;
        }
    }
    return count;
}

function listAccounts(group) {
    var list = [];
    var count = 0;
    if (group === 'all') {
        for (let i = 0; i < userSheet.length; i++) {
            list[i] = userSheet[i].email;
        }
    } else {
        for (let i = 0; i < userSheet.length; i++) {
            if (userSheet[i].group === group) {
                count++;
                list[count] = userSheet[i].email;
            }
        }
    }
    return list;
}


function addRowToCSV(group, email, discordId) {
    // Create a new row with the provided data
    const newRow = `${group},${email},${discordId}\n`;

    // Append the new row to the CSV file
    fs.appendFile(csvFilePath, newRow, 'utf8', (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('New account has been added.');
            parseCSV();
        }
    });
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
    if (client === 'blaze') {
        filterEmbed.setTimestamp()
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
        filterEmbed.setTimestamp()
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
        } else if (discord === '<@1>') {
            console.log('Checkout for Pia!');
            pia.send({
                username: 'Checkout',
                embeds: [filterEmbed.setTitle(`Checkout for Pia! :partying_face:`)],
            });
        }
        else {
            jagdeep.send({
                username: 'Checkout',
                embeds: [filterEmbed.setTitle(`Checkout for Jagdeep! :partying_face:`)],
            });
        }
    } else if (client === 'freebiehub') {
        filterEmbed.setColor(8454016);
        console.log('Freebie Hub Checkout!');
        freebieHub.send({
            username: 'Freebie Hub Checkout',
            content: `|| ${discord} ||`,
            embeds: [filterEmbed
                .setTitle(`Checkout! :partying_face:`)
                .setFooter({ text: `Twitter: @TheFreebieHub | Powered by Skhinda`, iconURL: 'https://assets.whop.com/cdn-cgi/image/width=64/https://assets.whop.com/bots/images/6256.original.png?1693661080' })]
        })
    }

}

client.login(token)