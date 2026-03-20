.PHONY: version check-tools ci-check-tools test-api build-api scan-api-image scan-api-fs k8s-apply k8s-status

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

ci-check-tools:
	@git --version
	@docker version
	@node --version
	@npm --version
	@pnpm --version
	@trivy --version
	@make --version

test-api:
	cd apps/api-gateway && pnpm test

build-api:
	cd apps/api-gateway && docker build -t helix/api-gateway:$(APP_VERSION) .

scan-api-image:
	trivy image --timeout 15m helix/api-gateway:$(APP_VERSION)

scan-api-fs:
	trivy fs --timeout 15m apps/api-gateway

k8s-apply:
	kubectl apply -k infra/k8s/base

k8s-status:
	kubectl get all -n helix
