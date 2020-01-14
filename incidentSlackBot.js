const axios = require('axios');
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
    url: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(message),
  };
  return axios(postOptions);
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
 * This function sends private messages to the user specified
 */
function sendDirectMessage(channelID, user, role) {
  const responseURL = `${API_URL}/chat.postMessage`;
  const notificationMessagePayload = {
    token: process.env.INCIDENT_BOT_TOKEN,
    channel: user,
    text: `You have been declared the incident ${role} for <#${channelID}>. I've already invited you to the channel, but you should get involved ASAP.`,
  };

  return sendMessageToSlack(responseURL, notificationMessagePayload)
    .then((response) => {
      const chatResponseBody = response.data;
      // if notification message succeeds
      if (chatResponseBody.ok) {
        return `Notification message was successfully delivered to ${chatResponseBody.message.username}`;
      }
      return `Notification message could not be delivered to ${chatResponseBody.message.username}. Reason: ${chatResponseBody.error}`;
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

  return sendMessageToSlack(responseURL, incidentDetailMessage)
    .then((response) => {
      const chatResponseBody = response.data;
      if (chatResponseBody.ok) {
        return 'incident details message sent successfully to the incident channel';
      }
      return `incident details message failed to send. Reason: ${chatResponseBody.error}`;
    });
}

/**
 * Format the list of users to add to the incident channel.
 * We are doing this by getting all the members of the 'Engineering Team' Slack Group.
 */
function getIncidentChannelMembers(commander, comms) {
  const responseURL = `${API_URL}/usergroups.list`;
  const requestMembersBody = {
    token: process.env.INCIDENT_BOT_TOKEN,
    include_disabled: false,
    include_users: true,
  };
  let channelMembers = [];
  sendMessageToSlack(responseURL, requestMembersBody)
    .then((response) => {
      const responseBody = response.data;
      if (responseBody.ok) {
        // eslint-disable-next-line consistent-return
        responseBody.usergroups.forEach((group) => {
          if (group.name === process.env.INCIDENT_GROUP_NAME) {
            channelMembers = group.user_ids;
          }
        });
      } else {
        console.log('Formatting list of users for channel creation failed.');
      }
      // Only add the incident commander and comms to this channel if they are not already in it.
      if (!channelMembers.includes(commander)) {
        channelMembers.push(commander);
      }
      if (comms && !channelMembers.includes(comms)) {
        channelMembers.push(comms);
      }
      return channelMembers;
    });
}

/**
 * Create the new slack channel for the incident
 */
function createIncidentChannel(channelMembers) {
  const responseURL = `${API_URL}/conversations.create`;
  const incidentDate = getCurrentDate();
  // need this random 4 digit string in case multiple incidents are declared in a day.
  const incidentIdentifier = Math.floor(1000 + Math.random() * 9000);

  const channelCreationBody = {
    token: process.env.INCIDENT_BOT_TOKEN,
    name: `Incident-${incidentDate}__${incidentIdentifier}`,
    is_private: false,
    user_ids: channelMembers,
  };
  return sendMessageToSlack(responseURL, channelCreationBody);
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
  const responseURL = `${API_URL}/conversations.setTopic`;
  let topic = `Commander: <@${commander}>`;
  if (comms) {
    topic += ` Comms: <@${comms}>`;
  }
  topic += ` Incident Doc: ${process.env.INCIDENT_DOC_URL}`;
  const channelTopicBody = {
    token: process.env.INCIDENT_BOT_TOKEN,
    channel: channelID,
    topic,
  };
  return sendMessageToSlack(responseURL, channelTopicBody)
    .then((response) => {
      const topicResponseBody = response.data;
      if (topicResponseBody.ok) {
        return `The channel topic was set to ${topicResponseBody.topic}`;
      }
      return `Setting the channel topic failed. Reason: ${topicResponseBody.error}`;
    });
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
    .then((response) => {
      const responseBody = response.data;
      console.log(responseBody);
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

  // get the members that we would like to add to the channel
  const channelMembers = getIncidentChannelMembers(submission.commander, submission.comms);

  // If the channel gets created successfully then we proceed
  createIncidentChannel(channelMembers)
    .then((response) => {
      const body = response.data;
      const channelInfo = body.channel;
      channelID = channelInfo.id;
      channelName = channelInfo.name;
      const setTopicPromise = setChannelTopic(channelID, submission.commander, submission.comms);
      const promiseList = [setTopicPromise];
      // Only want to send message notification if the commander
      // is not the one who declared the incident
      if (submission.commander !== user.id) {
        const commanderPromise = sendDirectMessage(channelID, submission.commander, 'commander');
        promiseList.push(commanderPromise);
      }
      // Only want to send the message notification to comms if comms
      // is not the one who declared the incident.
      if (submission.comms && submission.comms !== user.id) {
        const commsPromise = sendDirectMessage(channelID, submission.comms, 'communications');
        promiseList.push(commsPromise);
      }
      return Promise.all(promiseList);
    })
    .then((responses) => {
      console.log(responses);
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
