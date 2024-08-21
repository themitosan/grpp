<h1 align="center">
    <img src="src/GRPP.png" alt="logo" width="150">
    <br>Git Repo Preservation Project (GRPP)
</h1>

Created by [JulianaHeartz](https://mastodon.social/@julianaheartz) <sup>*(aka. themitosan)*</sup>, this is a simple project created using shell / node scripts that helps preserving git repos.

## Requirements
- Latest `node` version installed

## Setup
In order to initialize, you must set init as an executable and them, run it. It will mark all other required shell scripts as executables and will create required folders / files. You can do this by running the following command:

```
chmod +x init && ./init
```

## How to use
- To import a git repo, run the following command:

```
./import YOUR_GIT_REPO_PATH_OR_URL
```

- To start updating, run this command:

```
./update
```

## How to update grpp itself
- Run the following command:
```
chmod +x grpp_update && ./grpp_update
```

## External tools used on this project
- Photopea: https://www.photopea.com
- Vscodium: https://vscodium.com