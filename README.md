# Sockjs notifier service

Steps to run:

1. `git clone https://github.com/yogesh8177/sockjs-notifier.git`

2. `cd sockjs-notifier`

3. `touch .env` (Note: As this is skeleton, there is nothing inside `.env` yet. So just create this file and leave it as it is.)

    Use `env.example` to fill up `.env` file.

4. `docker-compose up --build`

5. Once server is up and running

    visit `http://localhost:3000`

    Open browser console to see socket messages in action.


- The notify button on web page simulates: a worker finished processing and is sending a notification to our `notification-service`. Look at our server logs in the terminal for infering server activities.
- This demo is using HTML5 browser notifications, we can swap it out with our own notification UI.</li>
- Open a new browser tab for opening a new socket connection.</li>
