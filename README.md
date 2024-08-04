# Federal AI Hackathon

This repository serves as a template for your team to create your own repository that you can use to submit your hackathon solution. You are not required to use this repository or GitHub to submit your solution, but you are required to submit all of your materials to us.

## How to use this repository as a template

### Creating a repository

To use this repository, use the "Use this template" button to create a new repository ([see instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)).

When creating a new repository, keep in mind:

* Your repository name must include your team name and your two-digit team ID (example: `my-awesome-team-99`)
* You must create your team's repository under your own GitHub account or GitHub organization
* Your repository must be set to public
* Your repository must allow forking (this is the default when creating a new repository)
* Your repository must not be deleted until instructed otherwise by hackathon staff

### Submitting your repository

After you create you repository from this template, submit your repository's URL to the hackathon staff on Slack. Please submit the full URL, such as [https://github.com/octocat/Spoon-Knife](https://github.com/octocat/Spoon-Knife). We will then fork your repository and keep our fork updated.

### Using the repository

* The `slides` directory is for your team's final presentations. Please ensure your slides are in this directory at the time of judging.
* You may place any and all files you wish to submit in this repository, using any project structure.
* Please consider keeping this README file, but delete all of this template text and customize it with helpful information about your solution. There is no specific format you should follow, but you can refer to the example sections below for some ideas.

## Introduction

In this section, you can briefly introduce the solution. Overall, what does it do? What problem does it solve?

## Features

In this section, you can describe the features your solution has.

## Installation

First, clone the repository and install dependencies:

```bash
git clone https://github.com/OctoConsulting/olabs-tech-titans-02.git

cd olab-tech-titans-02
```

Install dependencies in the `frontend` and `backend` directories:

```bash
cd ./frontend

yarn install
```

```bash
cd ../backend

poetry install
```

### Secrets

Next, if you plan on using the existing pre-built UI components, you'll need to set a few environment variables:

Copy the [`.env.example`](./backend/.env.example) file to `.env` inside the `backend` directory.

LangSmith keys are optional, but highly recommended if you plan on developing this application further.

The `OPENAI_API_KEY` is required. Get your OpenAI API key from the [OpenAI dashboard](https://platform.openai.com/login?launch).

[Sign up/in to LangSmith](https://smith.langchain.com/) and get your API key.

Create a new [GitHub PAT (Personal Access Token)](https://github.com/settings/tokens/new) with the `repo` scope.

[Create a free Geocode account](https://geocode.xyz/api).

```bash
# ------------------LangSmith tracing------------------
LANGCHAIN_API_KEY=...
LANGCHAIN_CALLBACKS_BACKGROUND=true
LANGCHAIN_TRACING_V2=true
# -----------------------------------------------------

GITHUB_TOKEN=...
OPENAI_API_KEY=...
GEOCODE_API_KEY=...
```

## Usage

```bash
cd ./frontend

yarn dev
```

This will start a development server on [`http://localhost:3000`](http://localhost:3000).

Then, in a new terminal window:

```bash
cd ../backend

poetry run start
```

## Examples

navigate to localhost:3000/charts
