<h1 align="center">
    <img src="GRPP.png" alt="grpp_logo" width="150">
    <br>Git Repo Preservation Project (GRPP)
</h1>

Created by [JulianaHeartz](https://bsky.app/profile/julianaheartz.bsky.social) <sup>*(aka. themitosan)*</sup>, this is a simple project written in ts that aims to gelp importing and preserving git repos.

## Requirements
- `git`, `npm` and latest `node` version installed

## How to compile (development mode)
In order to compile, run the following commands:

```shell
npm ci
npm run buildWebpack
```
The final script will be on `Build` dir.

## How to compile (production mode)
In order to compile, run the following commands:
```shell
npm ci
npm run build
```

This will generate a `.tgz` file. In order to install, run the following command

To install it globally, run the following command:
```shell
sudo npm i -g grpp-[VERSION].tgz
```

> [!IMPORTANT]\
> You MUST run this command as `sudo`, since it will install grpp as a global package.

If everything is fine, you will be able to call `grpp` system-wide.

### How to uninstall

It's simple! Just run the following command:

```shell
sudo npm remove grpp
```

## How to use

The first thing you need to do is initialize a folder, where it will store it's settings file and all repos.

To do this, run the following command:

```shell
grpp --init
```

Then you will be able to start importing git repos.

## How to import git repos

There is some ways you can perform this operation - by importing them one at time, a list or even all repos from a specific user.

### Single repo

To do that, you can use the `--import=` command with your desired git url:

```shell
grpp --import=http://github.com/themitosan/themitosan.git
```

If everything is fine, you will be able to import this git repo to your current location organized by host/user/repo.

_(On this case, `themitosan.git` will be located on `YOUR_CURRENT_PATH/repos/github.com/themitosan/themitosan.git`)_

> [!IMPORTANT]\
> All repos always will be imported as bare format!

Since the scope of this project is preserve git repos, you will need to clone them on another place in order to interact with it's files.

### Multiple repos

You can import a list of repos from a text file! In order to do this, you can use the following command:

```shell
grpp --importList=YOUR_GIT_REPOS_LIST.txt
```

Doing that, all repos on `YOUR_GIT_REPOS_LIST.txt` will be imported to your current path.

> [!IMPORTANT]\
> Make sure to leave one `git` url per line!

### Getting all repos from a specifc user

Since common git hosting websites _(like github or gitlab)_ API's allows fetching user data, GRPP is capable to get all repos from a selected list of users and importing them!

In order to do that, you can use the following command:

```shell
grpp --getUserRepos=USERNAME
```

You will be prompted asking where GRPP should seek `USERNAME` repos.

After selecting one of selected options, it will display all repos from the provided user and asking if you want to import. 

> [!IMPORTANT]\
> Since some git hosting websites limits each ip that fetches data very often, GRPP is configured to fetch only 500 repos per user (100 repos per fetch).

If you want to start fetching data from a specific page or fetch a specific number of pages, you can use these commands below:

```shell
# Fetch 10 repo pages (Default: 5)
grpp --setMaxFetchPages=10 --getUserRepos=themitosan

# Set start fetch page to 4 (Default: 1)
grpp --setStartPage=4 --getUserRepos=themitosan
```

## External tools used on this project
- Webpack: https://webpack.js.org
- Photopea: https://www.photopea.com
- INI Parser: https://www.npmjs.com/package/ini

<sup><i>

Some parts of this software derivates from TMS Engine.

</i></sup>