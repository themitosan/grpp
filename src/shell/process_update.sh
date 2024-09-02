#
#   Git Repo Preservation Project (GRPP)
#   Created by Juliana (@themitosan)
#   process_update.sh
#

# Declare main vars
i=1
error=0
sucess=0
skipRepos=$2
git_entries=`ls "$1"`
max_repos=`ls "$1" | wc -l`

# Create lock file
echo "### GRPP LOCK FILE ###" > lock_grpp

# Display info before process
echo -e "\033[0m==="
echo -e "\033[0m=== Starting update process (\033[1;32m$max_repos repos listed\033[0m)"
echo -e "\033[0m=== Clone path: \033[1;33m$1"
echo -e "\033[0m==="
echo 

# Move to git clone folder and start main process
cd "$1"
for entry in $git_entries
do

	# Log current dir and check if the same exists
	echo -e "=== Updating \033[1;33m$entry\033[0m [$i of $max_repos]"
	if [ -d $entry ]; then

		# Move to current repo and mark as a safe directory
		cd $entry
		git config --global --add safe.directory $(pwd)

		# Force current repo to be a mirror and fetch all branches
		git config remote.origin.fetch "+refs/*:refs/*"
		git config remote.origin.mirror true
		git fetch --all

		# Return to main repo dir and bump success counter
		cd ..
		sucess=$(( sucess + 1 ))

	else

		# Report repo not found
		echo -e "\033[0;31mWARN: $entry was not found!\033[0m"
		error=$(( error + 1 ))

	fi

	echo 
	i=$(( i + 1 ))

done
cd ..

# Check if lock file exists. If so, remove it
if [ -f lock_grpp ]; then
	rm lock_grpp
fi

# Output final message
echo -e "=== INFO - Process was completed successfully processing \033[1;32m$sucess repos\033[0m with \033[1;31m$error errors\033[0m. ==="