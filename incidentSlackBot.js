const rp = require('request-promise-native');
const qs = require('querystring');

const apiUrl = 'https://www.slack.com/api';

/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} body The body of the request.
 * @param {string} body.token The Slack token to be verified.
 */
function verifyWebhook(body) {
  if (!body || body.token !== process.env.SLACK_TOKEN) {
    const error = new Error('Invalid credentials');
    error.code = 401;
    throw error;
  }
}

/**
 * Send a response to slack.
 *
 * @param {string} responseURL The url to send response to.
 * @param {object} JSONmessage The payload that we are sending to the url.
 */
// eslint-disable-next-line consistent-return
function sendMessageToSlack(responseURL, message) {
  const postOptions = {
    uri: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    form: qs.stringify(message),
  };
  return rp(postOptions);
}

/**
 * Get the current date for use in the new channel name
 */
function getCurrentDate() {
  const dateObject = new Date();
  // adjust 0 before single digit date
  const day = `0${dateObject.getDate()}`.slice(-2);

  // current month
  const month = `0${dateObject.getMonth() + 1}`.slice(-2);

  // current year
  const year = dateObject.getFullYear();

  return `${year}-${month}-${day}`;
}

/**
 * Invite Product, Incident Commander, and Incident Communications to the channel
 * @param {String} commander - incident commanders user ID
 * @param {String} comms - incident communications user ID
 * @param {String} channel - channel ID for the channel we want to add the users to
 */
function inviteUsersToChannel(creatorID, commanderID, commsID, channelID) {
  // Add all users to the channel
  const responseURL = `${apiUrl}/channels.invite`;
  const addToChannel = [];
  addToChannel.push(process.env.ELI_USER_ID);
  addToChannel.push(process.env.TONY_USER_ID);
  addToChannel.push(process.env.CHRIS_USER_ID);
  addToChannel.push(commsID);
  // Whoever creates the incident is automatically added to the channel. If you attempt
  // to invite yourself an error is thrown.
  if (creatorID !== commanderID) {
    addToChannel.push(commanderID);
  }

  const inviteUserPayload = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
  };

  const promiseList = [];

  addToChannel.forEach((user) => {
    inviteUserPayload.user = user;
    console.log(inviteUserPayload);
    promiseList.push(sendMessageToSlack(responseURL, inviteUserPayload));
  });
  return Promise.all(promiseList);
}

/**
 * Set the topic for the new incident channel to be the jira instructions for an incident
 * @param {String} channelID - id for the channel which we would like to modify
 */
function setChannelTopic(channelID) {
  // Set the topic for the channel
  const responseURL = `${apiUrl}/channels.setTopic`;
  const channelTopicBody = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
    topic: 'https://industrydive.atlassian.net/wiki/spaces/TECH/pages/788529291/Incident+Management+at+Industry+Dive?search_id=29f5a871-a3ff-42aa-a9ca-12e683cd7ce6',
  };
  return sendMessageToSlack(responseURL, channelTopicBody);
}

/**
 * Create the new slack channel for the incident
 */
function createIncidentChannel() {
  const responseURL = `${apiUrl}/channels.create`;
  const incidentNumber = getCurrentDate();
  console.log(incidentNumber);

  const channelCreationBody = {
    token: process.env.USER_SLACK_TOKEN,
    name: 'incident-testing-1000',
    validate: false,
  };
  return sendMessageToSlack(responseURL, channelCreationBody);
}

/**
 * Handle the incoming slash command. In this case the command is '/incident'.
 *
 * @param {object} req the request object.
 * @param {object} res the response object.
 * @param {string} req.body.token the slack token that we will use the validate request
 */
exports.incidentSlashCommand = (req, res) => {
  res.status(200).send(); // best practice to respond with empty 200 status code
  const reqBody = req.body;
  const responseURL = `${apiUrl}/dialog.open`;
  verifyWebhook(reqBody); // Make sure that the request is coming from Slack

  const dialog = {
    token: process.env.INCIDENT_BOT_TOKEN,
    trigger_id: reqBody.trigger_id,
    dialog: JSON.stringify({
      title: 'Create an Incident',
      callback_id: 'submit-incident',
      submit_label: 'Create',
      elements: [
        {
          label: 'Incident Title',
          type: 'text',
          name: 'title',
          placeholder: 'Enter a title for this incident',
        },
        {
          label: 'Description',
          type: 'textarea',
          name: 'description',
          optional: true,
        },
        {
          label: 'Incident Commander',
          name: 'commander',
          type: 'select',
          value: reqBody.user_id,
          data_source: 'users',
        },
        {
          label: 'Incident Communications',
          name: 'comms',
          type: 'select',
          optional: true,
          data_source: 'users',
        },
      ],
    }),
  };
  // Create a dialog with the user that executed the slash command
  sendMessageToSlack(responseURL, dialog)
    .then((response) => {
      const body = JSON.parse(response);
      if (body.error) {
        console.error(body.error);
      } else {
        console.log(body);
      }
    });
};

/**
 * Handle the response from the form submission.
 *
 * @param {object} req the request object.
 * @param {object} res the response object.
 * @param {string} req.body.token the slack token that we will use the validate request
 */
exports.handleIncidentForm = (req, res) => {
  res.status(200).send(); // best practice to respond with empty 200 status code
  const payload = JSON.parse(req.body.payload);
  const { user, submission } = payload;
  console.log(payload);
  verifyWebhook(payload); // Make sure that the request is coming from Slack

  // If the channel gets created successfully then we proceed
  createIncidentChannel()
    .then((body) => {
      const channelID = JSON.parse(body).channel.id;
      const setTopicPromise = setChannelTopic(channelID);
      const inviteUsersPromise = inviteUsersToChannel(user.id, submission.commander, submission.comms, channelID);
      return Promise.all([setTopicPromise, inviteUsersPromise]);
    })
    .then((args) => {
      console.log('setTopic and inviteUsers promises returned');
      console.log(args);
    })
    .catch((err) => {
      const error = JSON.parser(err);
      console.error(error.error);
    });
};
