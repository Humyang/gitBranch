View merge status between branches.

Git pulls all branches remotely

git branch -r | grep -v '\->' | while read remote; do git branch --track "${remote#origin/}" "$remote"; done

git fetch --all

git pull --all

![](https://raw.githubusercontent.com/Humyang/gitBranch/master/screenshot.jpg)
