import { test, expect } from '@playwright/test'
import { isValidDate } from '@myhelper/date'
import { addWarning, createRandomBookingBody } from '@myhelper/helper'
import schema from '@myhelper/schema.json'
import playwrightApiMatchers from 'odottaa'
expect.extend(playwrightApiMatchers)
import chai from 'chai'
import { expect as chaiExpect } from 'chai'
import chaiJsonSchema from 'chai-json-schema'
import { z } from 'zod'
import { RequestService } from '@myhelper/logger'
import Ajv from 'ajv'

const ajv = new Ajv()

chai.use(chaiJsonSchema)
let bookingId
test.describe(`API test with logger class`, async () => {
  const requestSerice = new RequestService()
  test('get booking summary with specific room ID', async () => {
    await addWarning(`WARNING: test ${test.info().title} use double way of schema validation`)
    const [body, status] = await requestSerice.requestGet('booking/summary?roomid=1')
    expect(status).toBe(200)
    expect(body.bookings.length).toBeGreaterThanOrEqual(1)
    expect(isValidDate(body.bookings[0].bookingDates.checkin)).toBeTruthy()
    expect(isValidDate(body.bookings[0].bookingDates.checkout)).toBeTruthy()
    // method with chaiJsonSchema is easier to use
    chaiExpect(body).to.be.jsonSchema(schema)
    // method with ajv library
    const valid = ajv.validate(schema, body)
    expect(valid, `AJV Validation Errors:', ${ajv.errorsText()}`).toBe(true)
    // method with use of zod is not so convinient
    const schemaX = z.object({
      bookings: z.string()
    })
    await expect.soft(schemaX.parse(body)).toThrow()
    console.log(JSON.stringify(body))
  })
  test("GET booking summary with specific room id that doesn't exist", async () => {
    const [body, status] = await requestSerice.requestGet('booking/summary?roomid=999999')
    expect(status).toBe(200)
    expect(body.bookings.length).toBe(0)
  })

  test('GET booking summary with specific room id that is empty', async () => {
    const [body, status] = await requestSerice.requestGet('booking/summary?roomid=')
    expect(status).toBe(500)
    expect(isValidDate(body.timestamp)).toBe(true)
    expect(body.status).toBe(500)
    expect(body.error).toBe('Internal Server Error')
    expect(body.path).toBe('/booking/summary')
  })
  test('GET all bookings with details', async () => {
    const [body, status] = await requestSerice.requestGet('booking/')
    expect(status).toBe(200)
    expect(body.bookings.length).toBeGreaterThanOrEqual(1)
    expect(body.bookings[0].bookingid).toBe(1)
    expect(body.bookings[0].roomid).toBe(1)
    expect(body.bookings[0].firstname).toBe('James')
    expect(body.bookings[0].lastname).toBe('Dean')
    expect(body.bookings[0].depositpaid).toBe(true)
    expect(isValidDate(body.bookings[0].bookingdates.checkin)).toBe(true)
    expect(isValidDate(body.bookings[0].bookingdates.checkout)).toBe(true)
  })
  test('GET booking by id with details', async () => {
    const [body, status] = await requestSerice.requestGet('booking/1')
    expect(status).toBe(200)
    expect(body.bookingid).toBe(1)
    expect(body.roomid).toBe(1)
    expect(body.firstname).toBe('James')
    expect(body.lastname).toBe('Dean')
    expect(body.depositpaid).toBe(true)
    expect(isValidDate(body.bookingdates.checkin)).toBe(true)
    expect(isValidDate(body.bookingdates.checkout)).toBe(true)
  })
  test('GET all bookings with details with no authentication', async () => {
    const headers = { cookie: 'test' }
    const [body, status] = await requestSerice.requestGet('booking/', headers)
    expect(status).toEqual(403)
    expect(body).toBe('')
  })
  test(`create the booking reservation`, async () => {
    const data = await createRandomBookingBody(10, '2023-08-24', '2023-09-24')
    const [body, status] = await requestSerice.requestPost('booking/', data)
    expect(status).toEqual(201)
    expect(body.booking.firstname).toBe(data.firstname)
    expect(body.booking.lastname).toBe(data.lastname)
    expect(body.booking.bookingdates).toStrictEqual(data.bookingdates)
    bookingId = body.bookingid
    console.log(bookingId)
  })
  test("DELETE booking with an id that doesn't exist", async () => {
    const body = await requestSerice.requestDelete(`booking/${bookingId}`)
    expect(body).toBe('')
  })
})
