// lib 模式可调用 setApiBaseURL 覆盖；SPA 模式始终为 '/api'
let currentBaseURL = '/api'

export function setApiBaseURL(url: string): void {
  if (url) currentBaseURL = url
}

export function getApiBaseURL(): string {
  return currentBaseURL
}
