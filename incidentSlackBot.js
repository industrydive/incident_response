const rp = require('request-promise-native');
const qs = require('querystring');

const API_URL = 'https://www.slack.com/api';

/* * * * * * * * * * * * * * * * * */
/*         HELPER FUNCTIONS        */
/* * * * * * * * * * * * * * * * * */

/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} body The body of the request.
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
 * @param {object} message The payload that we are sending to the url.
 */
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
 * Invite Product to the channel
 *
 * @param {String} channelID - channel ID for the channel we want to add the users to
 */
function inviteProductToChannel(channelID) {
  // Add all product members to the channel
  const responseURL = `${API_URL}/channels.invite`;
  const addToChannel = [];
  addToChannel.push(process.env.USER_ID_1);
  addToChannel.push(process.env.USER_ID_2);
  addToChannel.push(process.env.USER_ID_3);

  const inviteUserPayload = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
  };

  const promiseList = [];

  addToChannel.forEach((user) => {
    inviteUserPayload.user = user;
    promiseList.push(sendMessageToSlack(responseURL, inviteUserPayload));
  });
  return Promise.all(promiseList).then((data) => {
    data.forEach(() => {
      console.log('Product member added to channel');
    });
    return 'function adding product members has completed.';
  });
}

/**
 * Invite the commander to the channel and notify them in a private message
 *
 * @param {string} channelID - channel to add the commander to
 * @param {string} commander - user id for the user that was designated as commander
 */
function inviteCommanderToChannel(channelID, commander) {
  let responseURL = `${API_URL}/channels.invite`;
  const inviteCommanderPayload = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
    user: commander,
  };
  return sendMessageToSlack(responseURL, inviteCommanderPayload).then((invitationBody) => {
    const invitationResponseBody = JSON.parse(invitationBody);
    responseURL = `${API_URL}/chat.postMessage`;
    // if commander is successfully invited to the channel then we send notification message
    if (invitationResponseBody.ok) {
      const notificationMessage = {
        token: process.env.INCIDENT_BOT_TOKEN,
        channel: commander,
        text: `You have been declared the incident commander for <#${invitationResponseBody.channel.id}>. I've already invited you to the channel, but you should get involved ASAP.`,
      };
      return sendMessageToSlack(responseURL, notificationMessage).then((chatBody) => {
        const chatResponseBody = JSON.parse(chatBody);
        // if notification message succeeds
        if (chatResponseBody.ok) {
          return `incident commander: ${chatResponseBody.message.username} was successfully added and notification message was delivered.`;
        }
        return `incident commander was added to channel but notification message could not be delivered. Reason: ${chatResponseBody.error}`;
      });
    }
    return `failed to invite incident commander to channel. Reason: ${invitationResponseBody.error}`;
  });
}

/**
 * Invite the communications to the channel and notify them in a private message
 *
 * @param {string} channelID - channel to add the comms to
 * @param {string} comms - user id that was designated as incident comms
 */
function inviteCommsToChannel(channelID, comms) {
  let responseURL = `${API_URL}/channels.invite`;
  const inviteCommanderPayload = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
    user: comms,
  };
  return sendMessageToSlack(responseURL, inviteCommanderPayload).then((invitationBody) => {
    const invitationResponseBody = JSON.parse(invitationBody);
    responseURL = `${API_URL}/chat.postMessage`;
    // if comms is successfully invited to the channel then we send notification message
    if (invitationResponseBody.ok) {
      const notificationMessage = {
        token: process.env.INCIDENT_BOT_TOKEN,
        channel: comms,
        text: `You have been declared the incident communications for <#${invitationResponseBody.channel.id}>. I've already invited you to the channel, but you should get involved ASAP.`,
      };
      return sendMessageToSlack(responseURL, notificationMessage).then((chatBody) => {
        const chatResponseBody = JSON.parse(chatBody);
        // if notification message succeeds
        if (chatResponseBody.ok) {
          return `incident communications: ${chatResponseBody.message.username} was successfully added and notification message was delivered.`;
        }
        return `incident communications was added to channel but notification message could not be delivered. Reason: ${chatResponseBody.error}`;
      });
    }
    return `failed to invite incident communications to channel. Reason: ${invitationResponseBody.error}`;
  });
}

/**
 * Set the topic for the new incident channel to be the jira instructions for an incident
 *
 * @param {string} channelID - id for the channel which we would like to modify
 * @param {string} commander - user id that was designated as incident commander
 * @param {string} comms - user id that was designated as incident communications
 */
function setChannelTopic(channelID, commander, comms) {
  // Set the topic for the channel
  const responseURL = `${API_URL}/channels.setTopic`;
  let topic = `Commander: <@${commander}>`;
  if (comms) {
    topic += ` Comms: <@${comms}>`;
  }
  topic += ` Incident Doc: ${process.env.INCIDENT_DOC_URL}`;
  const channelTopicBody = {
    token: process.env.USER_SLACK_TOKEN,
    channel: channelID,
    topic,
  };
  return sendMessageToSlack(responseURL, channelTopicBody).then((topicBody) => {
    const topicResponseBody = JSON.parse(topicBody);
    if (topicResponseBody.ok) {
      return `The channel topic was set to ${topicResponseBody.topic}`;
    }
    return `Setting the channel topic failed. Reason: ${topicResponseBody.error}`;
  });
}

/**
 * Send the incident details message to the newly created channel
 *
 * @param {*} payload - info from the form submission
 * @param {string} channelName - name of the incident channel that has been created
 * @param {string} channelID - id of the incident channel that has been created
 */
function sendIncidentDetailsMessage(payload, channelName, channelID) {
  const responseURL = `${API_URL}/chat.postMessage`;
  const text = ':rotating_light: An Incident has been declared!';
  let comms = 'unassigned';
  if (payload.submission.comms) {
    comms = `<@${payload.submission.comms}>`;
  }
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        // tslint:disable-next-line:max-line-length
        text: `*[${channelName}] An Incident has been opened by <@${payload.user.id}>*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':bangbang: *Remember to Update the StatusPage* :bangbang:',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Commander*\n<@${payload.submission.commander}>\n`,
        },
        {
          type: 'mrkdwn',
          text: `*Communications*\n${comms}\n`,
        },
      ],
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Channel*\n<#${channelID}>\n`,
        },
        {
          type: 'mrkdwn',
          text: `*Title*\n${payload.submission.title}\n`,
        },
      ],
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          // tslint:disable-next-line:max-line-length
          text: `*Incident started*\n<!date^${Math.round(Date.now() / 1000)}^{date_short} at {time_secs}|${Math.round(Date.now() / 1000)}>`,
        },
      ],
    },
  ];

  // only want to add description section if description was filled out on form
  if (payload.submission.description) {
    const description = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description*\n${payload.submission.description}`,
      },
    };
    blocks.push(description);
  }

  // format incident message
  const incidentDetailMessage = {
    token: process.env.INCIDENT_BOT_TOKEN,
    channel: channelID,
    blocks: JSON.stringify(blocks),
    text,
  };

  return sendMessageToSlack(responseURL, incidentDetailMessage).then((chatBody) => {
    const chatResponseBody = JSON.parse(chatBody);
    if (chatResponseBody.ok) {
      return 'incident details message sent successfully to the incident channel';
    }
    return `incident details message failed to send. Reason: ${chatResponseBody.error}`;
  });
}

/**
 * Create the new slack channel for the incident
 */
function createIncidentChannel() {
  const responseURL = `${API_URL}/channels.create`;
  const incidentDate = getCurrentDate();
  // need this random 4 digit string in case multiple incidents are declared in a day.
  const incidentIdentifier = Math.floor(1000 + Math.random() * 9000);

  const channelCreationBody = {
    token: process.env.USER_SLACK_TOKEN,
    name: `Incident-${incidentDate}__${incidentIdentifier}`,
    validate: false,
  };
  return sendMessageToSlack(responseURL, channelCreationBody);
}


/* * * * * * * * * * * * * * * * * */
/*        CLOUD FUNCTIONS          */
/* * * * * * * * * * * * * * * * * */

/**
 * Handle the incoming slash command. In this case the command is '/incident'.
 *
 * @param {object} req the request object.
 * @param {object} res the response object.
 */
exports.incidentSlashCommand = (req, res) => {
  res.status(200).send(); // best practice to respond with empty 200 status code
  const reqBody = req.body;
  const responseURL = `${API_URL}/dialog.open`;
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
    .then((body) => {
      const responseBody = JSON.parse(body);
      if (responseBody.error) {
        console.error(responseBody.error);
      } else {
        console.log(responseBody);
      }
    });
};

/**
 * Handle the response from the form submission.
 *
 * @param {object} req the request object.
 * @param {object} res the response object.
 */
exports.handleIncidentForm = (req, res) => {
  res.status(200).send(); // best practice to respond with empty 200 status code
  const payload = JSON.parse(req.body.payload);
  const { user, submission } = payload;
  let channelName = '';
  let channelID = '';
  verifyWebhook(payload); // Make sure that the request is coming from Slack

  // If the channel gets created successfully then we proceed
  createIncidentChannel()
    .then((body) => {
      const channelInfo = JSON.parse(body).channel;
      channelID = channelInfo.id;
      channelName = channelInfo.name;
      const setTopicPromise = setChannelTopic(channelID, submission.commander, submission.comms);
      const inviteUsersPromise = inviteProductToChannel(channelID);
      const promiseList = [setTopicPromise, inviteUsersPromise];
      // Only want to invite commander and send message notification if the commander
      // is not the one who declared the incident
      if (submission.commander !== user.id) {
        const commanderPromise = inviteCommanderToChannel(channelID, submission.commander);
        promiseList.push(commanderPromise);
      }
      // Only want to invite and send the message notification to comms if comms
      // was assigned during incident creation and is not the one who declared the incident.
      if (submission.comms && submission.comms !== user.id) {
        const commsPromise = inviteCommsToChannel(channelID, submission.comms);
        promiseList.push(commsPromise);
      }
      return Promise.all(promiseList);
    })
    .then((responseLogs) => {
      console.log(responseLogs);
      console.log('Channel Creation Phase Completed');
      return sendIncidentDetailsMessage(payload, channelName, channelID);
    })
    .then((finalLogs) => {
      console.log(finalLogs);
      console.log('Incident Channel is set up and ready for use');
    })
    .catch((err) => {
      console.error(err);
    });
};
