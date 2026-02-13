#\!/bin/bash
cd /home/projects/solanahacker/agent
export COLOSSEUM_API_KEY=$(grep "^COLOSSEUM_API_KEY=" .env | cut -d= -f2)
export ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env | cut -d= -f2)
node heartbeat-auto.js loop
