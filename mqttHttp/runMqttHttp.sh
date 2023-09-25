#!env bash
for counter in {21..100}
do
node piMQTThttp.js 2>&1 | tee serverLog${counter}.txt
sleep 5
done
