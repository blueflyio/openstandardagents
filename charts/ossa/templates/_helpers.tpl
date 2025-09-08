{{/*
Expand the name of the chart.
*/}}
{{- define "ossa.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ossa.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ossa.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "ossa.labels" -}}
helm.sh/chart: {{ include "ossa.chart" . }}
{{ include "ossa.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
ossa.io/phase: {{ .Values.ossa.phase | quote }}
ossa.io/scale: {{ .Values.ossa.scale | quote }}
ossa.io/version: {{ .Values.ossa.version | quote }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ossa.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ossa.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service labels for specific components
*/}}
{{- define "ossa.serviceLabels" -}}
{{ include "ossa.labels" . }}
ossa.io/component: {{ .component | quote }}
{{- if .agentType }}
ossa.io/agent-type: {{ .agentType | quote }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "ossa.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "ossa.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database URL template
*/}}
{{- define "ossa.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s-postgresql:5432/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password .Release.Name .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
Redis URL template
*/}}
{{- define "ossa.redisUrl" -}}
{{- if .Values.redis.enabled }}
{{- printf "redis://%s-redis-master:6379" .Release.Name }}
{{- else }}
{{- .Values.externalRedis.url }}
{{- end }}
{{- end }}

{{/*
Qdrant URL template
*/}}
{{- define "ossa.qdrantUrl" -}}
{{- if .Values.qdrant.enabled }}
{{- printf "http://%s-qdrant:6333" .Release.Name }}
{{- else }}
{{- .Values.externalQdrant.url }}
{{- end }}
{{- end }}

{{/*
Gateway URL template
*/}}
{{- define "ossa.gatewayUrl" -}}
{{- printf "http://%s-gateway:3000" (include "ossa.fullname" .) }}
{{- end }}

{{/*
Anti-affinity rules for high availability
*/}}
{{- define "ossa.antiAffinity" -}}
{{- if .Values.highAvailability.antiAffinity.enabled }}
{{- if eq .Values.highAvailability.antiAffinity.type "hard" }}
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
  - labelSelector:
      matchLabels:
        {{- include "ossa.selectorLabels" . | nindent 8 }}
        ossa.io/component: {{ .component | quote }}
    topologyKey: kubernetes.io/hostname
{{- else }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 100
    podAffinityTerm:
      labelSelector:
        matchLabels:
          {{- include "ossa.selectorLabels" . | nindent 10 }}
          ossa.io/component: {{ .component | quote }}
      topologyKey: kubernetes.io/hostname
{{- end }}
{{- end }}
{{- end }}

{{/*
Multi-zone node affinity
*/}}
{{- define "ossa.multiZoneAffinity" -}}
{{- if .Values.highAvailability.multiZone.enabled }}
nodeAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
  {{- range $index, $zone := .Values.highAvailability.multiZone.zones }}
  - weight: {{ sub 100 (mul $index 10) }}
    preference:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - {{ $zone | quote }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Common environment variables for all OSSA services
*/}}
{{- define "ossa.commonEnv" -}}
- name: NODE_ENV
  value: {{ .Values.global.environment | quote }}
- name: REDIS_URL
  value: {{ include "ossa.redisUrl" . | quote }}
- name: POSTGRES_URL
  value: {{ include "ossa.databaseUrl" . | quote }}
- name: QDRANT_URL
  value: {{ include "ossa.qdrantUrl" . | quote }}
- name: GATEWAY_URL
  value: {{ include "ossa.gatewayUrl" . | quote }}
- name: OSSA_PHASE
  value: {{ .Values.ossa.phase | quote }}
- name: OSSA_SCALE
  value: {{ .Values.ossa.scale | quote }}
- name: OSSA_VERSION
  value: {{ .Values.ossa.version | quote }}
{{- end }}

{{/*
Security context template
*/}}
{{- define "ossa.securityContext" -}}
{{- if .Values.security.securityContext }}
securityContext:
  {{- toYaml .Values.security.securityContext | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Pod security context template
*/}}
{{- define "ossa.podSecurityContext" -}}
{{- if .Values.security.podSecurityContext }}
securityContext:
  {{- toYaml .Values.security.podSecurityContext | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "ossa.imagePullSecrets" -}}
{{- if or .Values.images.pullSecrets .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- range .Values.images.pullSecrets }}
- name: {{ . }}
{{- end }}
{{- range .Values.global.imagePullSecrets }}
- name: {{ . }}
{{- end }}
{{- end }}
{{- end }}