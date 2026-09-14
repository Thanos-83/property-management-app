'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { create } from 'xmlbuilder2';

const getAadeVatCategory = (rate: number) => {
  switch (rate) {
    case 24:
      return 1;
    case 13:
      return 2;
    case 0:
      return 7;
    default:
      return 7;
  }
};

export async function transmitInvoiceAction(invoiceId: string) {
  const supabase = await createClient();

  try {
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        bookings!inner (
          id,
          start_date,
          guest_name,
          properties!inner (
            id,
            tax_profile_id,
            tax_profiles (*),
            owner_id
          )
        )
      `,
      )
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) throw new Error('Invoice not found');

    const taxProfile = invoice.bookings?.properties?.tax_profiles;
    if (!taxProfile) throw new Error('No tax profile linked to this property');

    const grossAmount = Number(invoice.total_gross_amount);
    const vatRate = Number(taxProfile.vat_rate || 0);

    const netAmount = grossAmount / (1 + vatRate / 100);
    const vatAmount = grossAmount - netAmount;

    const format = (num: number) => num.toFixed(2);
    const issueDate = new Date().toISOString().split('T')[0];
    const numericAa = Math.floor(Date.now() / 1000)
      .toString()
      .slice(-6);

    const doc = create({ version: '1.0', encoding: 'utf-8' })
      .ele('InvoicesDoc', {
        xmlns: 'http://www.aade.gr/myDATA/invoice/v1.0',
        'xmlns:icls': 'https://www.aade.gr/myDATA/incomeClassificaton/v1.0',
      })
      .ele('invoice')
      .ele('issuer')
      .ele('vatNumber')
      .txt(taxProfile.afm)
      .up()
      .ele('country')
      .txt('GR')
      .up()
      .ele('branch')
      .txt('0')
      .up()
      .up()
      .ele('invoiceHeader')
      .ele('series')
      .txt('A')
      .up()
      .ele('aa')
      .txt(numericAa)
      .up()
      .ele('issueDate')
      .txt(issueDate)
      .up()
      .ele('invoiceType')
      .txt('11.2')
      .up()
      .ele('currency')
      .txt('EUR')
      .up()
      .up()
      .ele('paymentMethods')
      .ele('paymentMethodDetails')
      .ele('type')
      .txt('3')
      .up()
      .ele('amount')
      .txt(format(grossAmount))
      .up()
      .up()
      .up()
      .ele('invoiceDetails')
      .ele('lineNumber')
      .txt('1')
      .up()
      .ele('netValue')
      .txt(format(netAmount))
      .up()
      .ele('vatCategory')
      .txt(getAadeVatCategory(vatRate).toString())
      .up()
      .ele('vatAmount')
      .txt(format(vatAmount))
      .up()
      .ele('incomeClassification')
      // FIX: Changed E3_561_001 to E3_561_003 (Retail)
      .ele('icls:classificationType')
      .txt('E3_561_003')
      .up()
      .ele('icls:classificationCategory')
      .txt('category1_3')
      .up()
      .ele('icls:amount')
      .txt(format(netAmount))
      .up()
      .up()
      .up()
      .ele('invoiceSummary')
      .ele('totalNetValue')
      .txt(format(netAmount))
      .up()
      .ele('totalVatAmount')
      .txt(format(vatAmount))
      .up()
      .ele('totalWithheldAmount')
      .txt('0.00')
      .up()
      .ele('totalFeesAmount')
      .txt('0.00')
      .up()
      .ele('totalStampDutyAmount')
      .txt('0.00')
      .up()
      .ele('totalOtherTaxesAmount')
      .txt('0.00')
      .up()
      .ele('totalDeductionsAmount')
      .txt('0.00')
      .up()
      .ele('totalGrossValue')
      .txt(format(grossAmount))
      .up()
      .ele('incomeClassification')
      // FIX: Changed E3_561_001 to E3_561_003 (Retail)
      .ele('icls:classificationType')
      .txt('E3_561_003')
      .up()
      .ele('icls:classificationCategory')
      .txt('category1_3')
      .up()
      .ele('icls:amount')
      .txt(format(netAmount))
      .up()
      .up()
      .up()
      .up()
      .up();

    const xmlPayload = doc.end({ prettyPrint: false });

    const response = await fetch('https://mydataapidev.aade.gr/SendInvoices', {
      method: 'POST',
      headers: {
        'aade-user-id': taxProfile.aade_username,
        'Ocp-Apim-Subscription-Key': taxProfile.aade_subscription_key,
        'Content-Type': 'application/xml',
      },
      body: xmlPayload,
    });

    const responseText = await response.text();

    console.log('AADE RESPONSE TEXT', responseText);
    if (responseText.includes('<error>')) {
      const errorMatches = [
        ...responseText.matchAll(/<message>(.*?)<\/message>/g),
      ];
      const errorMsgs = errorMatches.map((m) => m[1]).join(' | ');
      throw new Error(errorMsgs || 'Unknown AADE error');
    }

    // AADE uses <invoiceMark> and <invoiceUid> for successful submissions
    const mark = responseText.match(/<invoiceMark>(.*?)<\/invoiceMark>/)?.[1];
    const uid = responseText.match(/<invoiceUid>(.*?)<\/invoiceUid>/)?.[1];
    const qrUrl = responseText.match(/<qrUrl>(.*?)<\/qrUrl>/)?.[1];

    if (!mark) throw new Error('Did not receive MARK from AADE');

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'transmitted',
        aade_mark: mark,
        aade_uid: uid,
        aade_qr_url: qrUrl,
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    return { success: true, mark };
  } catch (error: unknown) {
    console.error('⚠️ AADE Transmission Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
