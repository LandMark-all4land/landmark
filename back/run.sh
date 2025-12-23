#!/bin/bash

# .env 파일 로드
export $(cat .env | grep -v '^#' | xargs)

# Spring Boot 실행
./gradlew bootRun
