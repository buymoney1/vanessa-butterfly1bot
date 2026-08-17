// src/lib/shipment.ts
import { prisma } from './prisma'
import * as XLSX from 'xlsx'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function downloadFile(fileId: string): Promise<Buffer> {
  try {
    const fileResponse = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`)
    const fileData = await fileResponse.json()
    
    if (!fileData.ok) {
      throw new Error('Failed to get file info')
    }
    
    const filePath = fileData.result.file_path
    const downloadResponse = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`)
    const arrayBuffer = await downloadResponse.arrayBuffer()
    
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

export async function processExcelFile(fileId: string, fileName: string) {
  try {
    console.log('📄 Processing Excel file:', fileName)
    
    const fileBuffer = await downloadFile(fileId)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
    console.log(`📊 Total rows (including header): ${rows.length}`)
    
    let savedCount = 0
    let errorCount = 0
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[]
      
      if (!row || row.length === 0) continue
      
      try {
        const receiver = (row[30] || '').toString().trim()
        const { customerName, phoneNumber } = parseReceiver(receiver)
        
        const shipmentData = {
          trackingCode: (row[14] || '').toString().trim() || null,
          secondaryCode: (row[15] || '').toString().trim() || null,
          barcode: (row[11] || '').toString().trim() || null,
          customerName,
          phoneNumber,
          postalCode: (row[28] || '').toString().trim() || null,
          destinationCity: (row[29] || '').toString().trim() || null,
          destinationProvince: (row[27] || '').toString().trim() || null,
          status: (row[13] || '').toString().trim() || null,
          orderNumber: (row[9] || '').toString().trim() || null,
          contractNumber: (row[10] || '').toString().trim() || null,
        }
        
        console.log(`📦 Row ${i}: ${customerName} - ${phoneNumber} - ${shipmentData.contractNumber}`)
        
        await prisma.shipment.create({
          data: shipmentData,
        })
        
        savedCount++
      } catch (rowError) {
        errorCount++
        console.error(`❌ Error at row ${i}:`, rowError)
      }
    }
    
    console.log(`📊 Final Result - Saved: ${savedCount}, Errors: ${errorCount}`)
    
    return {
      totalRows: rows.length - 1,
      savedCount,
      skippedCount: errorCount,
    }
  } catch (error) {
    console.error('Error processing Excel:', error)
    throw error
  }
}

function parseReceiver(receiver: string): { customerName: string; phoneNumber: string } {
  if (!receiver || receiver === 'undefined' || receiver === '') {
    return { customerName: '', phoneNumber: '' }
  }
  
  const parts = receiver.split('_')
  
  const customerName = (parts[0] || '').trim()
  const phoneNumber = (parts[1] || '').trim()
  
  return { customerName, phoneNumber }
}

export async function searchShipment(field: string, value: string) {
  try {
    const cleanValue = value.trim()
    console.log(`🔍 Searching by ${field}: "${cleanValue}"`)
    
    let shipments: any[] = []
    
    switch (field) {
      case 'name':
        shipments = await prisma.shipment.findMany({
          where: {
            customerName: {
              contains: cleanValue,
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'phone':
        shipments = await prisma.shipment.findMany({
          where: {
            phoneNumber: {
              contains: cleanValue,
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'postal':
        shipments = await prisma.shipment.findMany({
          where: {
            postalCode: {
              contains: cleanValue,
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'tracking':
        shipments = await prisma.shipment.findMany({
          where: {
            OR: [
              { trackingCode: { contains: cleanValue } },
              { secondaryCode: { contains: cleanValue } },
              { barcode: { contains: cleanValue } },
              { contractNumber: { contains: cleanValue } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
        break
    }
    
    console.log(`📦 Found ${shipments.length} shipments`)
    
    return shipments
  } catch (error) {
    console.error('Error searching shipment:', error)
    return []
  }
}

// ============ لینک صحیح تیپاکس ============
export function buildTrackingLink(contractNumber: string): string {
  // لینک مستقیم با id - تست شده و کار می‌کند
  return `https://tipaxco.com/tracking?id=${contractNumber}`
}

export function formatShipmentMessage(shipment: any): string {
  const contractNumber = shipment.contractNumber || shipment.trackingCode || 'نامشخص'
  const trackingLink = buildTrackingLink(contractNumber)
  
  return `📦 اطلاعات مرسوله شما\n\n` +
    `👤 نام گیرنده: ${shipment.customerName || 'نامشخص'}\n` +
    `📱 شماره تماس: ${shipment.phoneNumber || 'نامشخص'}\n` +
    `🏙️ شهر مقصد: ${shipment.destinationCity || 'نامشخص'}\n` +
    `📍 استان: ${shipment.destinationProvince || 'نامشخص'}\n` +
    `📊 وضعیت: ارسال شده ✅\n` +
    `🔖 کد مرسوله: ${contractNumber}\n\n` +
    `🔗 لینک پیگیری:\n${trackingLink}\n\n` +
    `📌 توجه: ارسال شده و از کنترل ما خارج شده است. برای پیگیری بیشتر و اطلاع از زمان رسیدن، با کد مرسوله در سایت تیپاکس پیگیری کنید.`
}