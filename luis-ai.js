const request = require("request-promise");
const striptags = require("striptags");

let luisResults; // Luis.ai analysis results are stored here.
let internalConfig = { endpoint: "" }; // populated with config method.

/**
 * Configure LUIS
 * @param {object} config Configuration object
 * @param {string} config.url http endpoint of published LUIS service
 */
exports.luisConfig = luisConfig;
function luisConfig(instanceConfig) {
  internalConfig.endpoint = instanceConfig.endpoint;
}

/**
 * Analyze the subject and body of the email with Luis.ai and store results in the
 * "luisResults" var above.
 * @param {object} bot The normal MailBots "bot" object
 */
exports.luisAnalyze = luisAnalyze;
async function luisAnalyze(bot) {
  const emailBody = striptags(bot.webhook.get("source.text"));
  const emailSubject = striptags(bot.webhook.get("source.subject"));

  // Endpoint is set by the user on the Luis.ai skill settings page. (See Settings handler below)
  // prettier-ignore
  const luisEndpoint = bot.get("mailbot.stored_data.natural_language_middleware.luis_endpoint", internalConfig.endpoint);

  try {
    luisResults = await request({
      uri: luisEndpoint + emailSubject + "%20" + emailBody,
      json: true
    });
    return luisResults;
  } catch (e) {
    console.log("LUIS API call failed", e.message);
    return e;
  }
}

/**
 * Get the user's most likely intent
 * @param {object} bot The MailBots "bot" object
 */
exports.getTopIntent = async function(bot) {
  if (!luisResults) {
    await luisAnalyze(bot);
  }
  const topScoringIntent = luisResults.topScoringIntent.intent;
  return topScoringIntent;
};

/**
 * Retrieve all possible intents
 * @param {object} bot The MailBots "bot" object
 */
exports.getIntents = async function(bot) {
  if (!luisResults) {
    await luisAnalyze(bot);
  }
  const allIntents = luisResults.intents;
  return allIntents;
};

/**
 * Luis "Key Phrase" extraction is a built in utility that can be
 * enabled in Luis.ai under Build > Entities.
 * @param {object} bot The MailBots "bot" object
 */
exports.getKeyPhrases = async function(bot) {
  if (!luisResults) {
    await luisAnalyze(bot);
  }
  if (!luisResults.entities) {
    // prettier-ignore
    throw Error("No enties found. Have you enabled Key Phrase entities in Luis.ai under Build > Entities?");
  }
  const keyPhrases = luisResults.entities.filter(
    entity => entity.type === "builtin.keyPhrase"
  );

  return keyPhrases;
};

/**
 * LUIS middleware – runs every request through LUIS, adding results
 * to bot.skills.luis
 * @param {object} config
 * @param {string} config.endpoint - LUIA API Endpoint
 */
exports.luisMiddleware = function(config) {
  return async function(req, res, next) {
    luisConfig(config);
    const bot = res.locals.bot;
    bot.skills = bot.skills || {};
    try {
      bot.skills.luis = await luisAnalyze(bot);

      next();
    } catch (e) {
      console.error(e);
      bot.skills.luis = { status: "error", message: e.message };
      next();
    }
  };
};

/**
 * Add setting page where user can save their Luis.ai information
 * https://www.npmjs.com/package/mailbots#onsettingsviewed
 */
exports.createLuisAiSettingsPage = function(bot) {
  const nlpSettings = bot.webhook.settingsPage({
    namespace: "natural_language_middleware",
    title: "LUIS Settings", // Page title
    menuTitle: "LUIS settings" // Name of menu item
  });
  nlpSettings.text(`
Email content will be sent to Luis.ai to parse and extract meaning. A simple example is provided in this demo, but as you\
will see, Luis.ai has a number of knowledge domains it can understand and entities it can extract. Here are setup instructions\
for this demo:

1. Go to [Luis.ai](https://www.luis.ai) and create an account. 
1. Under \`Build > Intents > Add prebuilt domain intent\` add the **Shopping.FindItem** intent
1. Under \`Build > Entities > Add prebuilt entity \` add the **keyPhase** entity
1. Click "Train", then "Publish" in the top right (you muse do this with each change)
1. Under \`Manage > Application Settings > Keys and Endpoints\`. Copy your Endpoint. It should look something like this:

*https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<appID>?subscription-key=<YOUR-KEY>&q=*`);

  nlpSettings.input({ name: "luis_endpoint", title: "Endpoint URL" });
  nlpSettings.submitButton();

  // Populate form values
  nlpSettings.populate(
    bot.get("mailbot.stored_data.natural_language_middleware")
  );
};
