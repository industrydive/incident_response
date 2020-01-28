const {
  verifyWebhook,
  sendMessageToSlack,
  getCurrentDate,
  API_URL,
} = require('./slackHelperMethods');

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
        return 'Notification message was successfully delivered.';
      }
      return 'Notification message could not be delivered.';
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
  const responseURL = `${API_URL}/usergroups.users.list`;
  const requestMembersBody = {
    token: process.env.INCIDENT_BOT_TOKEN,
    usergroup: process.env.INCIDENT_GROUP_ID,
    include_disabled: false,
  };
  return sendMessageToSlack(responseURL, requestMembersBody)
    .then((response) => {
      let channelMembers = [];
      const responseBody = response.data;
      if (responseBody.ok) {
        channelMembers = responseBody.users;
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
      // We need to convert this to a string because the Slack API
      // is stupid and doesn't work with a list.
      return channelMembers.join();
    });
}

/**
 * Invite the channel members that we want to the incident channel
 */
function inviteUsersToChannel(channel, commander, comms) {
  console.log('inviting users to channel');
  const responseURL = `${API_URL}/conversations.invite`;
  return getIncidentChannelMembers(commander, comms)
    .then((channelMembers) => {
      console.log(channelMembers);
      const invitiationBody = {
        token: process.env.INCIDENT_BOT_TOKEN,
        channel,
        users: channelMembers,
      };
      console.log(invitiationBody);
      return sendMessageToSlack(responseURL, invitiationBody);
    })
    .then((response) => {
      const responseBody = response.data;
      if (responseBody.ok) {
        return 'Users were successfully invited to the channel';
      }
      console.log(responseBody.error);
      return 'There was an error when inviting the Users to the channel';
    });
}

/**
 * Create the new slack channel for the incident
 */
function createIncidentChannel() {
  const responseURL = `${API_URL}/conversations.create`;
  const incidentDate = getCurrentDate();
  // need this random 4 digit string in case multiple incidents are declared in a day.
  const incidentIdentifier = Math.floor(1000 + Math.random() * 9000);

  const channelCreationBody = {
    token: process.env.INCIDENT_BOT_TOKEN,
    name: `incident-${incidentDate}__${incidentIdentifier}`,
    is_private: false,
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
        return 'The channel topic was set successfully';
      }
      return 'Setting the channel topic failed.';
    });
}


/* * * * * * * * * * * * * * * * * */
/*         CLOUD FUNCTION          */
/* * * * * * * * * * * * * * * * * */

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

  // attempt to create the new incident channel
  createIncidentChannel()
    // If the channel gets created successfully then we proceed
    .then((response) => {
      const body = response.data;
      if (body.ok) {
        const channelInfo = body.channel;
        channelID = channelInfo.id;
        channelName = channelInfo.name;
        const inviteUsersPromise = inviteUsersToChannel(channelID, submission.commander, submission.comms);
        const setTopicPromise = setChannelTopic(channelID, submission.commander, submission.comms);
        const promiseList = [inviteUsersPromise, setTopicPromise];
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
      }
      return Promise.reject(body.error);
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
