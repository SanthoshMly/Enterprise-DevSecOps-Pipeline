{{/*
Chart name, truncated and DNS-1123-safe.
*/}}
{{- define "enterprise-devsecops.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified app name.
*/}}
{{- define "enterprise-devsecops.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "enterprise-devsecops.labels" -}}
app.kubernetes.io/name: {{ include "enterprise-devsecops.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app: {{ include "enterprise-devsecops.fullname" . }}
{{- end -}}

{{/*
Selector labels (must be stable across releases -- no version/managed-by here).
*/}}
{{- define "enterprise-devsecops.selectorLabels" -}}
app: {{ include "enterprise-devsecops.fullname" . }}
{{- end -}}
