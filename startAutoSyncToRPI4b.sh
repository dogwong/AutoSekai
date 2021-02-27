echo ===================================
echo "Start sync folder @" `date +'%H:%M:%S'`
echo

fswatch -ro /Users/marco/Dropbox/nodejs/AutoSekai/ | 
while read f
do 
    echo "{$f} files changes"
    rsync -av --filter=':- .gitignore' --delete /Users/marco/Dropbox/nodejs/AutoSekai/ pi@192.168.1.181:/usr/src/AutoSekai/
    echo "rsync completed, start curl @" `date +'%H:%M:%S'`
    # curl 127.0.0.1:9000/admin/ && echo "curl done @" `date +'%H:%M:%S'` &
    # echo "waiting for changes..."
    echo
done




