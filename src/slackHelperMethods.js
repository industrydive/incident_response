const axios = require('axios');
const qs = require('querystring');

exports.API_URL = 'https://www.slack.com/api';

/* * * * * * * * * * * * * * * * * */
/*         HELPER FUNCTIONS        */
/* * * * * * * * * * * * * * * * * */

/**
 * Get the current date for use in the new channel name
 */
exports.getCurrentDate = () => {
  const dateObject = new Date();
  // adjust 0 before single digit date
  const day = `0${dateObject.getDate()}`.slice(-2);

  // current month
  const month = `0${dateObject.getMonth() + 1}`.slice(-2);

  // current year
  const year = dateObject.getFullYear();

  return `${year}-${month}-${day}`;
};

/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} body The body of the request.
 */
exports.verifyWebhook = (body) => {
  if (!body || body.token !== process.env.SLACK_TOKEN) {
    const error = new Error('Invalid credentials');
    error.code = 401;
    throw error;
  }
};

/**
 * Send a response to slack.
 *
 * @param {string} responseURL The url to send response to.
 * @param {object} message The payload that we are sending to the url.
 */
exports.sendMessageToSlack = (responseURL, message) => {
  const postOptions = {
    url: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(message),
  };
  return axios(postOptions);
};
