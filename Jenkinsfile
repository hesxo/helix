pipeline {
  agent any

  environment {
    IMAGE_NAME = 'helix/api-gateway'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Read Version') {
      steps {
        script {
          env.APP_VERSION = sh(script: 'cat VERSION', returnStdout: true).trim()
        }
        echo "APP_VERSION=${env.APP_VERSION}"
      }
    }

    stage('Check CI Tools') {
      steps {
        sh 'make ci-check-tools'
      }
    }

    stage('Test API Gateway') {
      steps {
        sh 'make test-api'
      }
    }

    stage('Build API Gateway Image') {
      steps {
        sh 'make build-api'
      }
    }

    stage('Scan API Gateway Filesystem') {
      steps {
        sh 'make scan-api-fs'
      }
    }

    stage('Scan API Gateway Image') {
      steps {
        sh 'trivy image --timeout 15m --severity HIGH,CRITICAL --exit-code 1 ${IMAGE_NAME}:${APP_VERSION}'
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished'
    }
    success {
      echo 'CI pipeline passed'
    }
    failure {
      echo 'CI pipeline failed'
    }
  }
}
