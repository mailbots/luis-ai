# LUIS Natural Language Processing MailBot Skill

Teach your [MailBot](https://www.mailbots.com) to parse natural language using Microsoft [LUIS](https://luis.ai) APIs.

## How to Use:

Create a [MailBot](https://www.mailbots.com/) (if you haven't already).

Set up a LUIS account and train a natural language model (See LUIS setup below).

Install the LUIS MailBot Skill

`npm install @mailbots/luis-ai`

```javascript
const mbLuis = require("@mailbots/luis-ai");
```

Configure your LUIS endpoint (See LUIS setup)

```javascript
mbLuis.config({
  endpoint:
    "https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<appID>?subscription-key=<YOUR-KEY>&q="
});
```

Use it wihin a [MailBot handler](https://github.com/mailbots/mailbots#handlers) to parse natural language:

```javascript
// someone emails help@your-bot.eml.bot
onCommand("help", bot => {
  const topIntent = mbLuis.getTopIntent(bot);

  // do different things based on user intent!

  bot.webhook.respond();
});
```

## Refernece

### `getTopIntent(bot)`

Get the most likely intent from the email

### `getIntents(bot)`

Retrieve all intents with their probabilities

### `getKeyPhrases(bot)`

Extract key phrases (people, places, search phrases, etc)

### `luisAnalyze(bot)`

Get raw output from LUIS's parsing of the email subject and body

### `configure(config)`

Pass configuration options (as shown above)

### `createLuisAiSettingsPage(bot)`

Add this to your `onSettingsViewed` handler to create a settings page where the LUIS.ai endpoint can be placed. (Mainly for development / demonstration purposes) For example:

```javascript
mailbot.onSettingsViewed(mb.createLuisAiSettingsPage(bot));
```

## LUIS Setup

LUIS is a powerful, flexible system by Microsoft to parse natural language. To keep things simple, here is are instructions for setting up a specific example (a shopping assistant) as described in [this article](#). LUIS has dozens of pre-built knowledge areas and can also be trained on custom knowledge areas.

1. Go to [Luis.ai](https://www.luis.ai) and create an account.
1. Under \`Build > Intents > Add prebuilt domain intent\` add the **Shopping.FindItem** intent
1. Under \`Build > Entities > Add prebuilt entity \` add the **keyPhase** entity
1. Click "Train", then "Publish" in the top right (you must do this with each change)
1. Under \`Manage > Application Settings > Keys and Endpoints\`. Copy your Endpoint. It should look something like this: `https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<appID>?subscription-key=<YOUR-KEY>&q=`

Add this endpoint either the config option of this object, or to the developer settings panel.
