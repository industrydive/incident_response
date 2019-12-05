# incident_response

## Background
We wanted to create a Slack bot that could easily facilitate incident response here at Industry Dive. This is our first iteration towards that goal. Our Slack bot currently lives in two separate Google Cloud Functions called `incidentSlashCommand` and `handleIncidentForm`. Making changes to the Slack bot means redeploying the two functions. The `incidentSlashCommand` function verifies the source of the request and presents the user with a form in Slack after they enter the '/incident' command. The `handleIncidentForm` takes the form submission and creates the Slack channel with all relevant parties, sends a brief description message in the new incident channel, and sends private notifications to both the incident commander and incident communications.

#### Basic App Flow
1. Executing the Slash Command provides the incident form as seen below:

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/Incident_Slash_Command.png" alt="slash command" width="600px" height="200px">

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/Incident_Form.png" alt="incident form" width="600px" height="600px">

2. Submitting the incident form results in the following channel being created with your members, communications, and commander. The briefing message is sent in the new channel as seen below:

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/channel_image.png" alt="channel alert" width="150px" height="75px">

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/channel_message.png" alt="channel message" width="600px" height="300px">

## Getting Started

These instructions will get you a copy of the project up and running on a live system.

### Prerequisites

* You will need to install the Google Cloud Platform SDK for development. Follow these [instructions](https://cloud.google.com/sdk/install) if you do not already have it installed.

### Installing

Below is a step by step series of examples that tell you how to get a development env running

1. You must have (or create) a Google Cloud project that will be home to these cloud functions.
    * You can follow the instructions [here](https://cloud.google.com/resource-manager/docs/creating-managing-projects) to set up a Google Cloud project if you do not already have one.
    * In the Google Cloud Console navigate to APIs & Services -> Dashboard and enable the Cloud Functions API if you haven't already done so.

2. You must clone this repo.

3. Make sure that you are on the correct Google Cloud project using:

    ```
    gcloud config list
    ```

    Then deploy each of the Cloud Functions to your Google Cloud project. See the `Deploying the Cloud Functions` section below. NOTE: When you deploy the function, the success output includes the HTTP trigger endpoint as `httpsTrigger`. Make sure to save this somewhere as you will need them in the next step. You can also find this info in the Google Cloud Console later on if you need.

4. Create your Slack app:
   * Navigate to https://api.slack.com/apps and hit the create new app button
   * In your new app, navigate to `Slash Commands` and create a new Slash Command. You may call this whatever you like, and input the HTTP trigger endpoint for the `incidentSlashCommand` function in the Request URL section.
   * In your new app, navigate to and enable `Interactive Components`. In the Request URL section here you must enter the HTTP trigger endpoint for the `handleIncidentForm` function.
   * In your new app, navigate to `Bots` and add a new bot user. You may call it whatever you would like.
   * Navigate to `OAuth & Permission -> Scopes` and add the `channels:write` and the `chat:write:bot` permissions.
   * Now you can navigate to `OAuth & Permissions` and hit the `Install to Workspace` button.

5. You must set and deploy your environment variables. Rename `example.env.yaml` to `.env.yaml` and input your environment variables.

    NOTE: For us, the three users that are always added to the incident channel upon creation are the members of our product
    team. You can follow this [link](https://help.workast.com/hc/en-us/articles/360027461274-How-to-find-a-Slack-user-ID) to
    easily find the user IDs for the members of your team that you would like to include.

    For instructions on how to deploy these environment variables, see the `Deploying environment variables` section below.



## Deployment

### Deploying the Cloud Functions
Before deploying your Cloud Functions, make sure that you have created a file called `.gcloudignore` containing all of the files you would like to keep from getting uploaded to Google Cloud. See [documentation](https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore) on how to create this file.

To deploy the Cloud Function you will type the following command from the main directory of the project.

`gcloud functions deploy FUNCTION_NAME --runtime nodejs10 --trigger-http`

The deploy should fail if there are any errors.

### Deploying environment variables
To deploy the environment variables for the Cloud Functions you will run the following command after adding your new environment variables to env file.

`gcloud functions deploy FUNCTION_NAME --env-vars-file .env.yaml`

Go to the Google Cloud Console and find the function that you were working with. Check that the environment variables are present.

If you would like to deploy just a single environment variable, you can also successfully do that with the following command.

`gcloud functions deploy FUNCTION_NAME --set-env-vars FOO=bar`

Check to see that the environment variable is present. You can do this by viewing your function in the Google Cloud Console.


## Built With

* [Google Cloud Functions](https://cloud.google.com/functions/docs/) - Built and run completely in Cloud Functions.


## Contributing

Please read [CONTRIBUTING.md](https://github.com/industrydive/incident_response/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.


## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/industrydive/incident_response/tags).


## Authors

* **Willie Brown** - *Initial work* - [wbrown22](https://github.com/wbrown22)

See also the list of [contributors](https://github.com/industrydive/incident_response/graphs/contributors) who participated in this project.


## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/industrydive/incident_response/blob/master/LICENSE) file for details.


## Acknowledgments

Our initial inspiration and model for this Slack bot can be found [here](https://github.com/slackapi/template-incident-management).
