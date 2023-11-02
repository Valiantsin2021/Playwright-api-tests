import { test, expect } from '@playwright/test'
import { isValidDate } from '@myhelper/date'
import { addWarning, createRandomBookingBody } from '@myhelper/helper'
import schema from '@myhelper/schema.json' assert { type: 'json' }
import playwrightApiMatchers from 'odottaa'
expect.extend(playwrightApiMatchers)
import chai from 'chai'
import { expect as chaiExpect } from 'chai'
import chaiJsonSchema from 'chai-json-schema'
import { z } from 'zod'
chai.use(chaiJsonSchema)
let bookingId
test(`log errors from console`, async ({ page }) => {
  const messages = []
  page.on('pageerror', exception => {
    console.log(`Uncaught exception: "${exception}"`)
  })
  page.on('console', async m => {
    messages.push({ [m.type()]: m.text() })
    await expect.soft(m.type()).not.toEqual('error')
  })
  await page.goto('https://academybugs.com/')
  console.table(messages)
})
test('get booking summary with specific room ID', async ({ request }, testInfo) => {
  console.log(testInfo.config)
  const response = await request.get('/booking/summary?roomid=1')

  expect(response).toHaveStatusCode(200)

  const body = await response.json()
  expect(body.bookings.length).toBeGreaterThanOrEqual(1)
  expect(isValidDate(body.bookings[0].bookingDates.checkin)).toBeTruthy()
  expect(isValidDate(body.bookings[0].bookingDates.checkout)).toBeTruthy()
  // method with chaiJsonSchema is easier to use
  chaiExpect(body).to.be.jsonSchema(schema)

  // method with use of zod is not so convinient
  const schemaX = z.object({
    bookings: z.string()
  })
  await expect.soft(schemaX.parse(body)).toThrow()
  console.log(JSON.stringify(body))
})
test("GET booking summary with specific room id that doesn't exist", async ({ request }) => {
  const response = await request.get('booking/summary?roomid=999999')

  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.bookings.length).toBe(0)
})

test('GET booking summary with specific room id that is empty', async ({ request }) => {
  const response = await request.get('booking/summary?roomid=')

  expect(response.status()).toBe(500)

  const body = await response.json()
  expect(isValidDate(body.timestamp)).toBe(true)
  expect(body.status).toBe(500)
  expect(body.error).toBe('Internal Server Error')
  expect(body.path).toBe('/booking/summary')
})
test('GET all bookings with details', async ({ request }) => {
  const response = await request.get('booking/')

  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.bookings.length).toBeGreaterThanOrEqual(1)
  expect(body.bookings[0].bookingid).toBe(1)
  expect(body.bookings[0].roomid).toBe(1)
  expect(body.bookings[0].firstname).toBe('James')
  expect(body.bookings[0].lastname).toBe('Dean')
  expect(body.bookings[0].depositpaid).toBe(true)
  expect(isValidDate(body.bookings[0].bookingdates.checkin)).toBe(true)
  expect(isValidDate(body.bookings[0].bookingdates.checkout)).toBe(true)
})
test('GET booking by id with details', async ({ request }) => {
  const response = await request.get('booking/1')

  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.bookingid).toBe(1)
  expect(body.roomid).toBe(1)
  expect(body.firstname).toBe('James')
  expect(body.lastname).toBe('Dean')
  expect(body.depositpaid).toBe(true)
  expect(isValidDate(body.bookingdates.checkin)).toBe(true)
  expect(isValidDate(body.bookingdates.checkout)).toBe(true)
})
test('GET all bookings with details with no authentication', async ({ request }) => {
  const response = await request.get('booking/', {
    headers: { cookie: 'test' }
  })

  expect(response).toBeForbidden()

  const body = await response.text()
  expect(body).toBe('')
})
test(`create the booking reservation`, async ({ request }) => {
  const reqBody = await createRandomBookingBody(10, '2023-08-24', '2023-09-24')
  const response = await request.post('booking/', {
    data: reqBody
  })
  expect(response).toBeCreated()

  const body = await response.json()
  expect(body.booking.firstname).toBe(reqBody.firstname)
  expect(body.booking.lastname).toBe(reqBody.lastname)
  expect(body.booking.bookingdates).toStrictEqual(reqBody.bookingdates)
  bookingId = body.bookingid
})
test("DELETE booking with an id that doesn't exist", async ({ request }) => {
  const response = await request.delete(`booking/${bookingId}`)

  expect(response).toHaveStatusCode(202)

  const body = await response.text()
  expect(body).toBe('')
})
