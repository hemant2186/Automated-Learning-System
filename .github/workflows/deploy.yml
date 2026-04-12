name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Build Docker Image
        run: docker build -t yourname/backend .

      - name: Push to DockerHub
        run: docker push yourname/backend