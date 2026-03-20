.PHONY: version check-tools test-api test-user test-order test build-api build-user build-order build scan-api-image scan-api-fs scan-user-fs scan-order-fs k8s-apply k8s-status

APP_VERSION := $(shell cat VERSION)

version:
	@echo $(APP_VERSION)

check-tools:
	@git --version
	@docker version
	@kubectl version --client
	@kind --version
	@helm version
	@node --version
	@npm --version
	@pnpm --version
	@trivy --version

test-api:
	cd apps/api-gateway && pnpm test

test-user:
	cd apps/user-service && pnpm test

test-order:
	cd apps/order-service && pnpm test

test: test-api test-user test-order

build-api:
	cd apps/api-gateway && docker build -t helix/api-gateway:$(APP_VERSION) .

build-user:
	cd apps/user-service && docker build -t helix/user-service:$(APP_VERSION) .

build-order:
	cd apps/order-service && docker build -t helix/order-service:$(APP_VERSION) .

build: build-api build-user build-order

scan-api-image:
	trivy image --timeout 15m helix/api-gateway:$(APP_VERSION)

scan-api-fs:
	trivy fs --timeout 15m apps/api-gateway

scan-user-fs:
	trivy fs --timeout 15m apps/user-service

scan-order-fs:
	trivy fs --timeout 15m apps/order-service

k8s-apply:
	kubectl apply -k infra/k8s/base

k8s-status:
	kubectl get all -n helix
