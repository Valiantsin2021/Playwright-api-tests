/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk'
import { Page, request } from '@playwright/test'
import prettyjson from 'prettyjson'
const color = {
  success: chalk.bold.hex('#0EF15D'),
  error: chalk.bold.hex('#E4271B'),
  warning: chalk.bold.hex('#FFA500'),
  info: chalk.hex('#A020F0'),
  outgoingRequest: chalk.hex('#0560fc'),
  incomingRequest: chalk.hex('#fcf805'),
  request: chalk.hex('#0560fc'),
  response: chalk.hex('#fcf805')
} /**
 * Documentation
 * https://playwright.dev/docs/api/class-apirequestcontext
 */

export class RequestService {
  async logRequest(url: string, data?: any) {
    console.log(color.request(`\n<<<<<<<<<<<<<<<<< SENDING REQUEST <<<<<<<<<<<<<<<<<`))
    console.log(color.request(`\nRequest URL: \n`, prettyjson.render(url)))
    console.log(color.request(`\nRequest data: \n`, prettyjson.render(data) ?? ''))
  }

  async logResponse(status: any, data: any) {
    console.log(color.response(`\n>>>>>>>>>>>>>>>>> RECEIVING RESPONSE >>>>>>>>>>>>>>>>>`))
    console.log(color.response(`\nResponse status code: ${status}`))
    console.log(color.response('\nResponse data: \n', prettyjson.render(data)))
  }

  async requestGet(url, headers = {}) {
    const api = await request.newContext()
    this.logRequest(url)
    const response = await api.get(url, { headers })
    const status = response.status()
    const respJson = await response.json()
    this.logResponse(status, respJson)
    return [respJson, status]
  }

  async requestPost(url, data, headers = { 'Content-Type': 'application/json' }) {
    const api = await request.newContext()
    this.logRequest(url, data)
    const response = await api.post(url, { headers, data })
    const status = response.status()
    const respJson = await response.json()
    this.logResponse(status, respJson)
    return [respJson, status]
  }

  async requestGetByParam(url, params) {
    const api = await request.newContext()
    this.logRequest(url, params)
    const response = await api.get(url, { params })
    const status = response.status()
    const respJson = await response.json()
    this.logResponse(status, respJson)
    return [respJson, status]
  }

  async requestDelete(url, headers = { 'Content-Type': 'application/json' }) {
    const api = await request.newContext()
    this.logRequest(url)
    const response = await api.delete(url, { headers })
    const status = response.status()
    const resptext = await response.text()
    this.logResponse(status, resptext)
    return [resptext, status]
  }
}

export async function assertLog(assertionName: any, expectedData: any, actualData: any) {
  console.log(
    color.success(
      `\n+++++++ ASSERTION PASSED [${assertionName}]: response data contains [${actualData}] & equals [${expectedData}] +++++++`
    )
  )
}

export async function logger(page: Page) {
  page.on('request', request => console.log(color.outgoingRequest('>>', request.method(), request.url())))
  page.on('response', response => console.log(color.incomingRequest('<<', response.status(), response.url())))
  page.on('console', msg => {
    if (msg.type() == 'error') {
      console.log(color.error(msg.text))
    }
  })
}
