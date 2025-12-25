read -p "Deploy to PROD? (y/N) " confirm
[[ $confirm == "y" ]] || exit 1
set -e
set -a
source .env
set +a
printf "\n\n\n\n\n\n========== DEPLOY %s ==========\n" "$(date)" | tee -a logs/deploy.log
ssh -i "unreliable-server-key.pem" "$AWS_EC2_HOST" "
  cd unreliable-server &&
  git checkout master &&
  git pull origin master &&
  docker compose up -d --build
" | tee -a logs/deploy.log