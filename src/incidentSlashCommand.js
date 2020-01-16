const {
  verifyWebhook,
  sendMessageToSlack,
  API_URL,
} = require('./slackHelperMethods');

/* * * * * * * * * * * * * * * * * */
/*         CLOUD FUNCTION          */
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
      if (responseBody.error) {
        console.error(responseBody.error);
      } else {
        console.log(responseBody);
      }
    });
};
