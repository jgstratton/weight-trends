pipeline {
	agent any
	environment {
		DOCKER_REGISTRY_HOST = credentials('jenkins-docker-registry-host')
		DOCKER_REGISTRY_PORT = credentials('jenkins-docker-registry-port')
	}
	stages {
		stage('Build app image') {
			steps {
				script {
					echo "Building weight-trends-app"
					docker.withRegistry("http://${DOCKER_REGISTRY_HOST}:${DOCKER_REGISTRY_PORT}") {
						docker
							.build("jgstratton/weight-trends-app:latest")
							.push()
					}
				}
			}
		}
	}
}