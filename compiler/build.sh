#
#   Git Repo Preservation Project (GRPP)
#   Created by TheMitoSan (@themitosan.bsky.social)
#
#   build.sh
#

# Clear screen and display logo
clear
printf "\n    <=====================================================>\n"
printf "    <=|       Git Repo Preservation Project (GRPP)      |=>\n"
printf "    <=| Created by TheMitoSan (@themitosan.bsky.social) |=>\n"
printf "    <=|=================================================|=>\n"
printf "    <=|         A classic quote from an old one:        |=>\n"
printf "    <=|               \"Quem guarda, \033[1;32mt\033[1;33me\033[1;34mm\033[0m!\"               |=>\n"
printf "    <=====================================================>\n\n"

# Check if needs to remove previous Build dir
if [ -d "Build" ]; then
    echo "INFO - Removing previous build dir..."
    rm -rf Build
fi
mkdir Build

# Build webpack
echo "INFO - Running webpack..."
webpack --config ./compiler/build-webpack.config.js

# Appending required node string in order to make it executable
printf "\nINFO - Finalizing JS module..."
node compiler/build-finalize.js --sha=$GITHUB_SHA

# Move to Build dir, install dependencies and prune
printf "\nINFO - Installing dependencies...\n"
cd Build
npm i
npm prune

# Create bundle file
printf "\nINFO - Running npm pack...\n"
npm pack

# Get GRPP version and rename tgz file
GRPP_VERSION=$(node -p -e "require('./package.json').version")
mv grpp-$GRPP_VERSION.tgz grpp.tgz

# Display process complete
printf "\nINFO - Process complete!\n"
cd ..