# GitLab DevOps & CI/CD Training Module

## GitLab CI/CD Advanced Patterns

### Multi-Project Pipeline Architecture
```yaml
# .gitlab-ci.yml - Parent Pipeline
stages:
  - validate
  - build
  - test
  - security
  - deploy
  - monitor

include:
  - project: 'shared/ci-templates'
    file: '/security-scans.yml'
  - project: 'shared/ci-templates'  
    file: '/deployment-templates.yml'
  - local: 'ci/custom-rules.yml'

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
```

### Component-Based CI/CD
```yaml
# CI Components for reusability
include:
  - component: gitlab.com/components/openapi-validation/openapi-lint@1.0.0
    inputs:
      spec-path: "api/openapi.yaml"
      rules-file: ".spectral.yaml"
  - component: gitlab.com/components/security-scanning/container-scan@2.1.0
    inputs:
      image: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

openapi-validate:
  stage: validate
  extends: .openapi-lint
  artifacts:
    reports:
      junit: spectral-report.xml
    paths:
      - spectral-report.html
    expire_in: 1 week
```

### Container Registry Integration
```yaml
build-image:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker buildx create --use --driver docker-container
      docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        --tag $CI_REGISTRY_IMAGE:latest \
        --push \
        --cache-from type=registry,ref=$CI_REGISTRY_IMAGE:cache \
        --cache-to type=registry,ref=$CI_REGISTRY_IMAGE:cache,mode=max \
        .
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
```

### Advanced Security Scanning
```yaml
# Security pipeline integration
sast:
  stage: security
  include:
    - template: Security/SAST.gitlab-ci.yml
  variables:
    SAST_EXCLUDED_PATHS: "spec,test,tests,tmp,node_modules"
    SAST_EXCLUDED_ANALYZERS: "brakeman,flawfinder"

dast:
  stage: security
  include:
    - template: Security/DAST.gitlab-ci.yml
  variables:
    DAST_WEBSITE: https://$CI_ENVIRONMENT_SLUG.$AUTO_DEVOPS_DOMAIN
    DAST_FULL_SCAN_ENABLED: "true"
  only:
    - branches
  except:
    - main

container-scanning:
  stage: security
  include:
    - template: Security/Container-Scanning.gitlab-ci.yml
  variables:
    CS_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    CS_DOCKERFILE_PATH: Dockerfile
    CS_SEVERITY_THRESHOLD: "high"

dependency-scanning:
  stage: security
  include:
    - template: Security/Dependency-Scanning.gitlab-ci.yml
  variables:
    DS_EXCLUDED_PATHS: "node_modules,vendor"
```

### GitLab ML/MLOps Integration
```yaml
# Machine Learning Operations
train-model:
  stage: build
  image: registry.gitlab.com/gitlab-org/incubation-engineering/mlops/ml-workloads:latest
  script:
    - python -m pip install -r requirements.txt
    - python train.py --config configs/training.yaml
  artifacts:
    paths:
      - models/
      - metrics.json
    reports:
      dotenv: build.env
  rules:
    - changes:
        - src/models/**/*
        - configs/training.yaml

register-model:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/incubation-engineering/mlops/ml-workloads:latest
  script:
    - |
      curl -X POST "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/ml/models" \
        -H "JOB-TOKEN: ${CI_JOB_TOKEN}" \
        -F "name=my-model" \
        -F "version=${CI_PIPELINE_ID}" \
        -F "model_file=@models/model.pkl"
  dependencies:
    - train-model

deploy-model:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/incubation-engineering/mlops/ml-workloads:latest
  script:
    - kubectl apply -f k8s/model-deployment.yaml
    - kubectl set image deployment/model-service model=registry.gitlab.com/${CI_PROJECT_PATH}/model:${CI_PIPELINE_ID}
  environment:
    name: production
    url: https://model-api.example.com
```

### Infrastructure as Code with GitLab
```yaml
# Terraform integration
terraform-plan:
  stage: validate
  image: registry.gitlab.com/gitlab-org/terraform-images/stable:latest
  script:
    - terraform init -backend-config="address=${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/production"
    - terraform validate
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - tfplan
    reports:
      terraform: tfplan.json
  only:
    - merge_requests
    - main

terraform-apply:
  stage: deploy
  image: registry.gitlab.com/gitlab-org/terraform-images/stable:latest
  script:
    - terraform init -backend-config="address=${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/production"
    - terraform apply -auto-approve tfplan
  dependencies:
    - terraform-plan
  environment:
    name: production
    action: start
  only:
    - main
```

### Drupal Integration Patterns
```yaml
# Drupal-specific CI/CD
drupal-validate:
  stage: validate
  image: drupal:10-php8.2-fpm
  services:
    - mysql:8.0
  variables:
    MYSQL_ROOT_PASSWORD: drupal
    MYSQL_DATABASE: drupal
    MYSQL_USER: drupal
    MYSQL_PASSWORD: drupal
  before_script:
    - apt-get update && apt-get install -y git
    - composer install --no-interaction --prefer-dist --optimize-autoloader
  script:
    - vendor/bin/phpcs --config-set installed_paths vendor/drupal/coder/coder_sniffer
    - vendor/bin/phpcs --standard=Drupal,DrupalPractice web/modules/custom
    - vendor/bin/phpstan analyze web/modules/custom
    - vendor/bin/phpunit --configuration web/core --testsuite unit

drupal-deploy:
  stage: deploy
  image: drupal:10-php8.2-fpm  
  script:
    - drush deploy -y
    - drush cache:rebuild
    - drush config:import -y
    - drush updatedb -y
  environment:
    name: $CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.drupal.example.com
  only:
    - main
    - develop
```

### Advanced Monitoring & Observability
```yaml
# Performance monitoring integration
monitor-performance:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - |
      # Lighthouse CI integration
      curl -X POST "https://lhci.example.com/api/projects/${LHCI_PROJECT_ID}/builds" \
        -H "Authorization: Bearer ${LHCI_TOKEN}" \
        -d '{"url":"'${CI_ENVIRONMENT_URL}'","branch":"'${CI_COMMIT_BRANCH}'"}'
      
      # Synthetic monitoring
      curl -X POST "${SYNTHETIC_MONITORING_URL}/tests" \
        -H "Authorization: Bearer ${SYNTHETIC_TOKEN}" \
        -d '{"url":"'${CI_ENVIRONMENT_URL}'","checks":["availability","performance","security"]}'
  environment:
    name: production
  only:
    - main

setup-monitoring:
  stage: deploy
  image: alpine/helm:latest
  script:
    - |
      helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
      helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set grafana.adminPassword=$GRAFANA_PASSWORD
```

### API Contract Testing
```yaml
# Contract testing with OpenAPI
api-contract-test:
  stage: test
  image: node:18-alpine
  services:
    - name: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
      alias: api-server
  before_script:
    - npm install -g @apidevtools/swagger-parser newman
  script:
    - swagger-parser validate api/openapi.yaml
    - |
      # Generate Postman collection from OpenAPI spec
      npx openapi-to-postman -s api/openapi.yaml -o collection.json
      
      # Run contract tests
      newman run collection.json \
        --environment environments/ci.json \
        --reporters cli,junit \
        --reporter-junit-export newman-report.xml
        
      # Dredd for additional contract validation  
      npm install -g dredd
      dredd api/openapi.yaml http://api-server:3000 \
        --reporter junit --output dredd-report.xml
  artifacts:
    reports:
      junit:
        - newman-report.xml
        - dredd-report.xml
    paths:
      - collection.json
    expire_in: 1 week

# API documentation deployment
deploy-api-docs:
  stage: deploy
  image: node:18-alpine
  script:
    - npm install -g redoc-cli
    - redoc-cli build api/openapi.yaml --output public/index.html
    - |
      # Upload to GitLab Pages
      mkdir -p public/swagger-ui
      curl -L https://github.com/swagger-api/swagger-ui/archive/refs/heads/master.zip -o swagger-ui.zip
      unzip swagger-ui.zip
      cp -r swagger-ui-master/dist/* public/swagger-ui/
      cp api/openapi.yaml public/swagger-ui/
  artifacts:
    paths:
      - public
  environment:
    name: api-docs
    url: https://$CI_PROJECT_NAMESPACE.gitlab.io/$CI_PROJECT_NAME
  only:
    - main
```

### Multi-Environment Deployment Strategy
```yaml
# Environment-specific deployments
.deploy_template: &deploy_template
  image: alpine/helm:latest
  before_script:
    - kubectl config use-context $KUBE_CONTEXT
  script:
    - |
      helm upgrade --install $CI_PROJECT_NAME ./helm \
        --namespace $KUBE_NAMESPACE \
        --create-namespace \
        --set image.repository=$CI_REGISTRY_IMAGE \
        --set image.tag=$CI_COMMIT_SHA \
        --set ingress.hosts[0].host=$CI_ENVIRONMENT_URL \
        --values helm/values-$CI_ENVIRONMENT_SLUG.yaml

deploy-staging:
  <<: *deploy_template
  stage: deploy
  variables:
    KUBE_CONTEXT: staging
    KUBE_NAMESPACE: $CI_PROJECT_NAME-staging
  environment:
    name: staging
    url: https://staging-$CI_PROJECT_NAME.example.com
    deployment_tier: staging
  only:
    - develop

deploy-production:
  <<: *deploy_template
  stage: deploy
  variables:
    KUBE_CONTEXT: production
    KUBE_NAMESPACE: $CI_PROJECT_NAME-prod
  environment:
    name: production
    url: https://$CI_PROJECT_NAME.example.com
    deployment_tier: production
  when: manual
  only:
    - main
```