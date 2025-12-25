echo "1) run command in container"
echo "2) see logs"
echo "3) tail logs"
echo "4) psql"
echo "5) cd into container"
read -rp "run: " choice
case "$choice" in
  1)
    read -rp "command: " command
    docker compose exec app $command
    ;;
  2)
    read -rp "service: " service
    docker compose logs -f $service
    ;;
  3)
    docker compose exec app tail -f logs/app.json
    ;;
  4)
    docker compose exec pg psql -U postgres -d postgres-db
    ;;
  5)
    docker exec -it unreliable-server-app-1 sh
    ;;
  *)
    exit 1
    ;;
esac