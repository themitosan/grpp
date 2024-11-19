# GRPP Command List

**INFO**: All commands can be called by using `-`, `--` or even `/`.

## Function list

- `help` - Display help menu on screen.
- `updateAll` - Update all imported repos.
- `status` - Display GRPP status from a initialized dir.
- `silent` - Only print errors on screen.
- `saveSettings` - Use this option to update current settings file. Example: `grpp --setConnectionTestURL=1.1.1.1 --saveSettings` will set main connection test to cloudflare dns and save it to settings file.
- `repair` - This option will fix current database, linking any repo that is not present or removing any repo entry that doesn't exists.
- `exportRemotes` - Export all clone urls from previously imported git repos into a file (grpp_urls.txt)

## Settings list

- `init=[PATH]` - Set a location where GRPP will initialize and backup your repos. You can also just use `--init` to initialize where you currently are!
- `import=[GIT_URL]` - Imports a git repository to database.
- `importList=[PATH]` - Import a list of git repositories from a text file.
- `path=[PATH]` - Set GRPP current working directory.
- `update=[PATH]` - Updates a previously imported repo.
- `getReposFrom=[USERNAME]` - Attempts to get all repos from a specified user.
- `getRepoData=[PATH]` - Get information about a previously imported repo.
- `maxReposPerList=[NUMBER]` - Set how many repos a GRPP Batch Update list should have.
- `setStartPage=[NUMBER]` - Set which page GRPP should start fetching user repos from git hosting website.
- `setMaxFetchPages=[NUMBER]` - Set maximum of pages GRPP will fetch from remote on get user repos process.
- `setConnectionTestURL=[URL]` - Set URL which GRPP will use to test internet connection.
- `processBatchFile=[NUMBER]` - Loads and updates all repos from a file created by `updateAll` process.
- `setEditor=[EDITOR]` - Set which text editor GRPP should use to open text files. (Default: nano)