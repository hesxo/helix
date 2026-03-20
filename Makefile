APP_VERSION := $(shell cat VERSION)

version:
	@echo $(APP_VERSION)

check-tools:
	@git --version
	@docker --version
	@kubectl version --client
	@kind --version
	@helm version
	@node --version
	@npm --version
	@trivy --version
