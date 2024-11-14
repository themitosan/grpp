#
#   Git Repo Preservation Project (GRPP)
#   Created by TheMitoSan (@themitosan.bsky.social)
#
#   build.sh
#

# Clear screen and display logo
clear
printf "\n   <=============================================================>\n"
printf "   <=|          Git Repo Preservation Project (GRPP)           |=>\n"
printf "   <=|     Created by TheMitoSan (@themitosan.bsky.social)     |=>\n"
printf "   <=============================================================>\n"
printf "   <=|             A classic quote from an old one:            |=>\n"
printf "   <=|                   \"Quem guarda, \033[1;32mt\033[1;33me\033[1;34mm\033[0m!\"                   |=>\n"
printf "   <=============================================================>\n\n"

# Build webpack
echo "INFO - Running webpack..."
webpack --config ./compiler/build-webpack.config.js

# Appending required node string in order to make it executable
echo "INFO - Finalizing script..."
node compiler/build-finalize.js

# Create bundle file
echo "INFO - Creating bundle file..."
npm pack

# Display process complete
echo "INFO - Process complete!"