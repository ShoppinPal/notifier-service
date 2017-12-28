import redis from 'redis';

let publisher = null;

let publishToRedis = (payload) => {
    return new Promise((resolve, reject) => {
        if(!publisher) {
            console.log('connecting to redis');
            publisher = redis.createClient({host: 'redis', port: 6379});
            console.log('Connected to redis as publisher');
        }
        publisher.publish('notification', JSON.stringify(payload), (err) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            console.log('published to redis');
            return resolve();
        });
    });  
}


export {publishToRedis};