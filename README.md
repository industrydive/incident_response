# incident_response

## Background
We wanted to create a slackbot that could easily facilitate incident response here at Industry Dive. This is our first iteration towards that goal. Our slackbot currently lives in two seperate google cloud functions called `incidentSlashCommand` and `handleIncidentForm`. Making changes to the slackbot means redeploying the two functions. The `incidentSlashCommand` function verifies the source of the request and presents the user with a form in slack after they enter the '/incident' command. The `handleIncidentForm` takes the form submission and creates the slack channel with all relevant parties, notifies the commander and comms, and sends a brief description message.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* You will need to install the Google Cloud Platform SDK for development. Follow these [instructions](https://cloud.google.com/sdk/install) if you do not already have it installed.

* You will need to have node installed. You can check with:

```
node -v
```

Follow these [instructions](https://nodejs.org/en/download/) if you do not already have node installed

* Make sure thate you have npm installed (it should be installed with node). You can check with:

```
npm -v
```


### Installing

Below is a step by step series of examples that tell you how to get a development env running

1. You must have (or create) a Google Cloud project that will be home to these cloud functions
  * You can follow the instructions [here]() to set up a google cloud project if you do not already have one.
  * In the Google Cloud Console navigate to APIs & Services -> Dashboard and enable the Cloud Functions API if you havent already
  
2. You must clone this repo.

3. Install dependencies

```
npm install
```

3. You must deploy each of the cloud functions to your Google Cloud project. See the `Deploying the cloud functions` section below.

4. You must set and deploy your environment variables. See the `Deploying evnironment variables` section below

5. You connect the appropriate endpoints/ give the proper permissions (this is going to be a much bigger section when it is done) to your slackbot.

## Deployment

### Deploying the cloud functions
To deploy the cloud function you will type the following command from the main directory of the project.

`gcloud functions deploy FUNCTION_NAME --runtime nodejs10 --trigger-http`

The deploy should fail if there are any errors.

### Deploying environment variables
To deploy the environment variables for the cloud functions you will run the following command after adding your new environment variables to env file.

`gcloud functions deploy FUNCTION_NAME --env-vars-file .env.yaml`

Go to the google cloud console and find the function that you were working with. Check that the environment variables are present.

If you would like to deploy just a single environment variable, you can also successfully do that with the following command.

`gcloud functions deploy FUNCTION_NAME --set-env-vars FOO=bar`

Check to see that the environment variable is present.

## Built With

* [Google Cloud Functions](https://cloud.google.com/functions/docs/) 

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Willie Brown** - *Initial work* - [Wbrown22](https://github.com/wbrown22)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
