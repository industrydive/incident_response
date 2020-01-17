# incident_response

## Background
We wanted to create a Slack bot that could easily facilitate incident response here at Industry Dive. This is our first iteration towards that goal. Our Slack bot currently lives in two separate Google Cloud Functions called `incidentSlashCommand` and `handleIncidentForm`. Making changes to the Slack bot means redeploying the two functions. The `incidentSlashCommand` function verifies the source of the request and presents the user with a form in Slack after they enter the '/incident' command. The `handleIncidentForm` takes the form submission and creates the Slack channel with all relevant parties, sends a brief description message in the new incident channel, and sends private notifications to both the incident commander and incident communications.

#### Basic App Flow
1. Executing the Slash Command provides the incident form as seen below:

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/Incident_Slash_Command.png" alt="slash command" width="600px" height="200px">

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/Incident_Form.png" alt="incident form" width="600px" height="600px">

2. Submitting the incident form results in the following channel being created with your members, communications, and commander. The briefing message is sent in the new channel as seen below:

<img src="https://github.com/industrydive/incident_response/blob/master/demo_images/channel_image.png" alt="channel alert" width="250px" height="75px">

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

2. Clone this repo.

3. Create your Slack app:
   * Navigate to https://api.slack.com/apps and create your new Slack app.
   * In your new app, navigate to `Slash Commands` and create a new Slash Command. You may call this whatever you like. Place `https://placeholder.com` in the Request URL section for now. Remember where this is because you will have to replace this with the HTTP trigger endpoint for the `incidentSlashCommand` function once you have completed step 4.
   * In your new app, navigate to and enable `Interactive Components`. Place `https://placeholder.com` in the Request URL section for now. Remember where this is because you will have to replace this with the HTTP trigger endpoint for the `handleIncidentForm` function once you have completed step 4.
   * In your new app, navigate to `Bots` and add a new bot user. You may call it whatever you would like.
   * Navigate to `OAuth & Permission -> Scopes` and under the Bot Token scopes, add the `channels:manage`, `chat:write`, `im:write`, and `usergroups:read` permissions.

4. You must set your environment variables and deploy your Cloud Functions. 
    * Rename `example.env.yaml` to `.env.yaml` and input your environment variables.
    
      NOTE: When the incident channel gets created, it invites all of the members of the usergroup that is specified in the env.yml file. For more info on usergroups and how to manage them see the [following](https://slack.com/help/articles/212906697-Create-a-user-group) and the example.env.yml file that is included in this repo.

    * Now you can deploy each of your cloud functions by following the instructions in the [deployment section](#deploying-the-cloud-functions)

      NOTE: You may want to save the HTTP trigger endpoint that is part of the output from the deployment command for use in step 5, although you can find this information for each cloud function in the Google Cloud Console later.

5. Now that you have deployed your Cloud Functions, go back and replace the placeholder URLs with the correct Cloud Function HTTP trigger endpoints. If you can't remember where these were/which endpoint belongs where, then reference step 3.

6. In Slack, navigate to OAuth & Permissions and hit the Install to Workspace button. Your Slack app should now function as seen in the [demo](#basic-app-flow)


## Deployment

### Deploying the Cloud Functions
Before deploying, make sure of the following:
  * All files that you don't want to add to Google Cloud have been added to .gcloudignore
  * You have the correct project selected. 
    * You can check the above with this command:

        ```
        gcloud config list
        ```
      If you are on the wrong project then you can use the following commands to find and switch projects.

        ```
        gcloud projects list (to get the desired project ID)
        ```
        ```
        gcloud config set project <project-ID>
        ```

To deploy the Cloud Functions and environment variables you will type and execute the following commands from the main directory of the project.

`gcloud functions deploy incidentSlashCommand --runtime nodejs10 --trigger-http --env-vars-file .env.yaml`

`gcloud functions deploy handleIncidentForm --runtime nodejs10 --trigger-http --env-vars-file .env.yaml`

The deploy should fail if there are any errors.

You can check that the functions have the correct source code/environment variables by visiting them in the console. The only files that are required by the functions are incidentSlackBot.js and package.json.

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
