# incident_response

## Background
Our incident slackbot currently lives in two seperate google cloud functions called `incidentSlashCommand` and `handleIncidentForm`. Making changes to the slackbot means redeploying the two functions. The `incidentSlashCommand` function verifies the source of the request and presents the user with a form after they enter the '/incident' command. The `handleIncidentForm` takes the form submission and creates the slack channel with all relevant parties, notifies the commander and comms, and sends a brief description message.

## Deploying the cloud functions
To deploy the cloud function you will type the following command from the main directory of the project.

`gcloud functions deploy FUNCTION_NAME --runtime nodejs10 --trigger-http`

The deploy should fail if there are any errors.

## Deploying environment variables
To deploy the environment variables for the cloud functions you will run the following command after adding your new environment variables to env file.

`gcloud functions deploy FUNCTION_NAME --env-vars-file .env.yaml`

Go to the google cloud console and find the function that you were working with. Check that the environment variables are present.

If you would like to deploy just a single environment variable, you can also successfully do that with the following command.

`gcloud functions deploy FUNCTION_NAME --set-env-vars FOO=bar`

Check to see that the environment variable is present.
