{{- define "valorecon.fullname" -}}
{{- printf "%s-%s" .Release.Name "valorecon" | trunc 63 | trimSuffix "-" -}}
{{- end -}}
