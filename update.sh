#!/bin/bash
git pull origin production --ff-only

# Use a separate script so the update immediatly benefits from the new update script
if [ $? -eq 0 ];
then
  ./post-update.sh
else
  echo "The update failed."
fi
