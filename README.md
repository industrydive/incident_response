# incident_response

## Background
Our incident slackbot currently lives in two seperate google cloud functions called `incidentSlashCommand` and `handleIncidentForm`. Making changes to the slackbot means redeploying the two functions. The `incidentSlashCommand` function verifies the source of the request and presents the user with a form after they enter the '/incident' command. The `handleIncidentForm` takes the form submission and creates the slack channel with all relevant parties, notifies the commander and comms, and sends a brief description message.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

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

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
