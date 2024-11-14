#
#   Git Repo Preservation Project (GRPP)
#   Created by Juliana (@julianaheartz.bsky.social)
#   build.sh
#

# Clear screen and display logo
clear
echo -e ""
echo -e "   <=============================================================>"
echo -e "   <=|          Git Repo Preservation Project (GRPP)           |=>"
echo -e "   <=|     Created by Juliana (@julianaheartz.bsky.social)     |=>"
echo -e "   <=============================================================>"
echo -e "   <=|             A classic quote from an old one:            |=>"
echo -e "   <=|                   \"Quem guarda, \033[1;32mt\033[1;33me\033[1;34mm\033[0m!\"                   |=>"
echo -e "   <=============================================================>\n"

# Build webpack
echo -e "INFO - Running webpack..."
webpack --config ./compiler/build-webpack.config.js

# Appending required node string in order to make it executable
echo -e "INFO - Finalizing script..."
node compiler/build-finalize.js

# Create bundle file
echo -e "INFO - Creating bundle file..."
npm pack

# Display process complete
echo -e ""
echo -e "INFO - Process complete!"