build:
	docker-compose build 

run:
	docker-compose up

up:
	docker-compose up -d
down:
	docker-compose down

bash:
	docker exec -it bc bash

redis-cli:
	docker exec -it redis redis-cli

deploy:
	git pull
	make build
	make down
	make up

remote-deploy:
	ssh ubuntu@129.154.238.56 "cd bakchody && make deploy"
