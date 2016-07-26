# EZPoll
An voting webapp built with full stack javascript(node js, jade, scss, jquery, d3.js)

# Usage - How to start the server
node server.js [cookie_secret] [mongodb_path]


The cookie secret is a secret string that is used for cookie encryption. Should not be public.
This app require the mongodb to contain two collections - "ezpoll-login" and "ezpoll-poll".
