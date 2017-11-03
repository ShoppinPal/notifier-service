# Sockjs notifier service

Steps to run:

1. `git clone https://github.com/yogesh8177/sockjs-notifier.git`

2. `cd notifier-service`

3. `touch .env` (Note: As this is skeleton, there is nothing inside `.env` yet. So just create this file and leave it as it is.)

3. `docker-compose up --build`

4. Once server is up and running

    visit `http://localhost:3000`

    Open browser console to see socket messages in action.


- This notify button impersonates a worker finished processing and is sending a notification to our `notification-service`
- This demo is using HTML5 browser notifications, we can swap it out with our own notification ui.</li>
- Open a new browser tab for opening a new socket connection.</li>
