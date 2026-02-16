export function generateAirbnbEmail(
  guestName: string,
  code: string,
  price: number,
  checkIn: string,
  checkOut: string
) {
  return `
    <div style="font-family: Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif; color: #484848; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 1px solid #dbdbdb; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #FF5A5F;">Reservation confirmed</h2>
        <p>You have a new reservation from ${guestName}.</p>
      </div>

      <div style="display: flex; margin-bottom: 20px;">
        <div style="flex: 1;">
          <strong>Check-in</strong><br/>
          ${checkIn}<br/>
          3:00 PM
        </div>
        <div style="flex: 1;">
          <strong>Check-out</strong><br/>
          ${checkOut}<br/>
          11:00 AM
        </div>
      </div>

      <div style="background-color: #f7f7f7; padding: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">Payment</h3>
        <table style="width: 100%;">
          <tr>
            <td>Cleaning fee</td>
            <td style="text-align: right;">$50.00</td>
          </tr>
          <tr>
            <td>Service fee</td>
            <td style="text-align: right;">$25.00</td>
          </tr>
          <tr style="font-weight: bold; border-top: 1px solid #dbdbdb;">
            <td style="padding-top: 10px;">Total Payout</td>
            <td style="text-align: right; padding-top: 10px;">$${price.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; font-size: 12px; color: #767676;">
        Confirmation code: <strong>${code}</strong>
      </div>
    </div>
  `;
}

export function generateBookingComEmail(
  guestName: string,
  code: string,
  price: number,
  checkIn: string,
  checkOut: string
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e6e6e6;">
      <div style="background-color: #003580; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Booking.com</h2>
      </div>
      
      <div style="padding: 20px;">
        <h3 style="color: #003580;">New booking for ${guestName}</h3>
        <p>Confirm reservation number: <strong>${code}</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f2f6fa;">
            <td style="padding: 10px; border: 1px solid #e6e6e6;"><strong>Arrival</strong></td>
            <td style="padding: 10px; border: 1px solid #e6e6e6;">${checkIn}</td>
          </tr>
          <tr style="background-color: #f2f6fa;">
            <td style="padding: 10px; border: 1px solid #e6e6e6;"><strong>Departure</strong></td>
            <td style="padding: 10px; border: 1px solid #e6e6e6;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e6e6e6;"><strong>Total Price</strong></td>
            <td style="padding: 10px; border: 1px solid #e6e6e6; font-weight: bold; font-size: 16px;">€${price.toFixed(2)}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; background-color: #ebf3ff; padding: 15px;">
          <p style="margin: 0;"><strong>Commission:</strong> 15%</p>
          <p style="margin: 0;"><strong>You get:</strong> €${(price * 0.85).toFixed(2)}</p>
        </div>
      </div>
    </div>
  `;
}

export function generateVrboEmail(
  guestName: string,
  code: string,
  price: number,
  checkIn: string,
  checkOut: string
) {
  return `
    <div style="font-family: Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 4px solid #2a6ebb; padding-bottom: 15px;">
        <h2 style="color: #2a6ebb;">New Booking Request</h2>
        <p style="font-size: 18px;">Reservation ID: <strong>${code}</strong></p>
      </div>

      <div style="margin-top: 20px;">
        <p><strong>Traveler:</strong> ${guestName}</p>
        <p><strong>Dates:</strong> ${checkIn} - ${checkOut}</p>
      </div>

      <div style="background-color: #f4f4f4; padding: 15px; margin-top: 20px; border: 1px solid #ddd;">
        <h3 style="margin-top: 0;">Financials</h3>
        <table style="width: 100%;">
          <tr>
            <td>Rental Amount</td>
            <td style="text-align: right;">$${(price * 0.9).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Taxes</td>
            <td style="text-align: right;">$${(price * 0.1).toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 16px;">
            <td style="padding-top: 10px;">Total Payment</td>
            <td style="text-align: right; padding-top: 10px;">$${price.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
}
