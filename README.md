# EZPoll
A voting webapp built with full stack javascript(nodejs, jade, scss, jquery, d3.js).

# Usage - How to run the server
node server.js [cookie_secret] [mongodb_path]


The cookie secret is a secret string that is used for cookie encryption. Should not be public.
This app require the mongodb to contain two collections - "ezpoll-login" and "ezpoll-poll".


#Project information

-Currently depolyed on https://ezpoll.herokuapp.com


-Some original project requirement: https://www.freecodecamp.com/challenges/build-a-voting-app
