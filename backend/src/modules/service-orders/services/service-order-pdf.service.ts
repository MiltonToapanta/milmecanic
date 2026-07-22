import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ServiceDiagnosticResponse } from '../../service-diagnostics/repositories/service-diagnostics.repository';
import { ServiceDiagnosticsService } from '../../service-diagnostics/services/service-diagnostics.service';
import type { ServiceOrderResponse } from '../repositories/service-orders.repository';
import { ServiceOrdersService } from './service-orders.service';

const teal = '#0f8a96';
const ink = '#172033';
const muted = '#64748b';
const line = '#d9e2ec';
const soft = '#f4f7fb';
const fontRegular = 'Roboto';
const fontBold = 'Roboto-Bold';

const statusLabels = {
  RECEIVED: 'Recibido',
  DIAGNOSIS: 'Diagnóstico',
  WAITING_APPROVAL: 'Esperando aprobación',
  APPROVED: 'Aprobado',
  IN_REPAIR: 'En reparación',
  QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Listo para entregar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
} as const;

const fuelLabels = {
  EMPTY: 'Vacío',
  QUARTER: '1/4',
  HALF: '1/2',
  THREE_QUARTERS: '3/4',
  FULL: 'Lleno'
} as const;

const categoryLabels = {
  ENGINE: 'Motor',
  BRAKES: 'Frenos',
  SUSPENSION: 'Suspensión',
  STEERING: 'Dirección',
  TRANSMISSION: 'Transmisión',
  ELECTRICAL: 'Sistema eléctrico',
  BATTERY: 'Batería',
  TIRES: 'Neumáticos',
  COOLING: 'Refrigeración',
  EXHAUST: 'Escape',
  BODY: 'Carrocería',
  LIGHTS: 'Luces',
  FLUIDS: 'Fluidos',
  OTHER: 'Otros'
} as const;

const diagnosticStatusLabels = {
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  BAD: 'Malo',
  NOT_CHECKED: 'No revisado'
} as const;

const severityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
} as const;

@Injectable()
export class ServiceOrderPdfService {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly serviceDiagnosticsService: ServiceDiagnosticsService
  ) {}

  async generate(serviceOrderId: string): Promise<Buffer> {
    const order = await this.serviceOrdersService.findById(serviceOrderId);
    const diagnostic = await this.serviceDiagnosticsService.findByServiceOrderId(serviceOrderId);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
      this.registerFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      this.drawDocument(doc, order, diagnostic);
      doc.end();
    });
  }

  private registerFonts(doc: PDFKit.PDFDocument): void {
    const fontsDir = join(process.cwd(), 'node_modules', 'typeface-roboto', 'files');
    doc.registerFont(fontRegular, join(fontsDir, 'roboto-latin-400.woff'));
    doc.registerFont(fontBold, join(fontsDir, 'roboto-latin-700.woff'));
  }

  private drawDocument(doc: PDFKit.PDFDocument, order: ServiceOrderResponse, diagnostic: ServiceDiagnosticResponse | null): void {
    this.drawHeader(doc, order);
    this.drawSummary(doc, order);
    this.drawCustomerAndVehicle(doc, order);
    this.drawTextColumns(doc, 'Solicitud del cliente', order.customerRequest, 'Diagnóstico inicial', order.initialDiagnosis);
    this.drawReception(doc, order);
    if (diagnostic) this.drawDiagnostic(doc, diagnostic);
    this.drawPhotos(doc, order);
    this.drawAuthorization(doc);
    this.drawSignatures(doc, order);
    this.drawFooter(doc);
  }

  private drawHeader(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    const top = doc.y;
    doc.roundedRect(36, top, 72, 54, 8).fill(teal);
    doc.fillColor('white').font(fontBold).fontSize(18).text('MM', 36, top + 17, { width: 72, align: 'center' });

    doc.fillColor(teal).font(fontBold).fontSize(8).text('MILMECANIC TALLER', 124, top + 2, { characterSpacing: 1.4 });
    doc.fillColor(ink).fontSize(22).text('Orden de servicio', 124, top + 15);
    doc.fillColor(muted).font(fontRegular).fontSize(9).text('Acta de recepción y constancia de ingreso del vehículo', 124, top + 42);

    doc.roundedRect(410, top, 149, 54, 8).stroke(line);
    doc.fillColor(muted).font(fontBold).fontSize(7).text('ORDEN NO.', 422, top + 10, { characterSpacing: 1.4 });
    doc.fillColor(ink).fontSize(18).text(order.orderNumber, 422, top + 22);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(formatDate(order.createdAt), 422, top + 43);

    doc.moveTo(36, top + 70).lineTo(559, top + 70).strokeColor(teal).lineWidth(2).stroke();
    doc.y = top + 82;
  }

  private drawSummary(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.sectionTitle(doc, 'Resumen operativo');
    const values: Array<[string, string]> = [
      ['Estado', statusLabels[order.status]],
      ['Asesor', order.assignedAdvisor?.displayName ?? 'Sin asesor'],
      ['Mecánico', order.assignedMechanic?.displayName ?? 'Sin mecánico'],
      ['Entrega estimada', formatDate(order.estimatedDeliveryAt)]
    ];
    this.infoGrid(doc, values, 4);
  }

  private drawCustomerAndVehicle(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.ensureSpace(doc, 120);
    const startY = doc.y;
    const colWidth = 252;
    this.card(doc, 36, startY, colWidth, 112, 'Datos del cliente');
    this.keyValue(doc, 50, startY + 30, 'Cliente', order.customer.displayName);
    this.keyValue(doc, 50, startY + 48, 'Identificación', order.customer.identification);
    this.keyValue(doc, 50, startY + 66, 'Firma sugerida', order.customerSignatureName || order.customer.displayName);

    this.card(doc, 306, startY, colWidth, 112, 'Datos del vehículo');
    this.keyValue(doc, 320, startY + 30, 'Placa', order.vehicle.plate);
    this.keyValue(doc, 320, startY + 48, 'Vehículo', order.vehicle.displayName);
    this.keyValue(doc, 320, startY + 66, 'Kilometraje', `${order.reportedMileage.toLocaleString('es-EC')} km`);
    this.keyValue(doc, 320, startY + 84, 'Combustible', fuelLabels[order.fuelLevel]);
    doc.y = startY + 128;
  }

  private drawTextColumns(doc: PDFKit.PDFDocument, leftTitle: string, leftValue: string | null, rightTitle: string, rightValue?: string | null): void {
    this.ensureSpace(doc, 105);
    const startY = doc.y;
    this.textBox(doc, 36, startY, 252, leftTitle, leftValue);
    this.textBox(doc, 306, startY, 252, rightTitle, rightValue);
    doc.y = startY + 104;
  }

  private drawReception(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.ensureSpace(doc, 106);
    this.sectionTitle(doc, 'Condición de recepción');
    const startY = doc.y;
    this.miniText(doc, 36, startY, 167, 'Exterior', order.exteriorCondition);
    this.miniText(doc, 214, startY, 167, 'Interior', order.interiorCondition);
    this.miniText(doc, 392, startY, 167, 'Accesorios', order.receivedAccessories);
    doc.y = startY + 76;
  }

  private drawDiagnostic(doc: PDFKit.PDFDocument, diagnostic: ServiceDiagnosticResponse): void {
    this.ensureSpace(doc, 160);
    this.sectionTitle(doc, 'Diagnóstico técnico realizado');
    const items = diagnostic.items;
    const bad = items.filter((item) => item.status === 'BAD').length;
    const critical = items.filter((item) => item.severity === 'CRITICAL').length;
    this.infoGrid(doc, [
      ['Estado', diagnostic.completedAt ? 'Completado' : 'En edición'],
      ['Ítems', String(items.length)],
      ['Fallas', String(bad)],
      ['Críticos', String(critical)]
    ], 4);

    if (diagnostic.generalObservation || diagnostic.recommendation) {
      this.drawTextColumns(doc, 'Observación general', diagnostic.generalObservation, 'Recomendación', diagnostic.recommendation);
    }

    this.ensureSpace(doc, 72);
    const tableTop = doc.y;
    this.tableHeader(doc, tableTop, ['Categoría', 'Elemento', 'Estado', 'Severidad', 'Observación'], [86, 118, 66, 62, 191]);
    let y = tableTop + 20;
    for (const item of items) {
      const rowHeight = Math.max(23, doc.heightOfString(item.observation || 'Sin observación', { width: 184 }) + 10);
      if (y + rowHeight > doc.page.height - 74) {
        doc.addPage();
        y = 42;
        this.tableHeader(doc, y, ['Categoría', 'Elemento', 'Estado', 'Severidad', 'Observación'], [86, 118, 66, 62, 191]);
        y += 20;
      }
      this.tableRow(doc, y, [
        categoryLabels[item.category],
        item.itemName,
        diagnosticStatusLabels[item.status],
        item.severity ? severityLabels[item.severity] : 'Sin severidad',
        item.observation || 'Sin observación'
      ], [86, 118, 66, 62, 191], rowHeight);
      y += rowHeight;
    }
    doc.y = y + 12;
  }

  private drawPhotos(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    if (order.photos.length === 0) return;
    this.ensureSpace(doc, 130);
    this.sectionTitle(doc, 'Adjuntos fotográficos');
    let x = 36;
    let y = doc.y;
    const width = 124;
    const height = 92;
    order.photos.slice(0, 8).forEach((photo, index) => {
      if (x + width > 559) {
        x = 36;
        y += 124;
      }
      if (y + 120 > doc.page.height - 74) {
        doc.addPage();
        x = 36;
        y = 42;
      }
      doc.roundedRect(x, y, width, height, 6).stroke(line);
      const filePath = join(process.cwd(), 'uploads', 'service-orders', order.id, photo.fileName);
      if (existsSync(filePath)) {
        doc.image(filePath, x + 5, y + 5, { width: width - 10, height: 62, fit: [width - 10, 62], align: 'center', valign: 'center' });
      } else {
        doc.fillColor(muted).font(fontRegular).fontSize(8).text('Imagen no disponible', x + 8, y + 32, { width: width - 16, align: 'center' });
      }
      doc.fillColor(ink).font(fontBold).fontSize(7).text(`Adjunto ${index + 1}`, x + 7, y + 70, { width: width - 14 });
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(photo.caption || photo.originalName, x + 7, y + 80, { width: width - 14, height: 20 });
      x += width + 9;
    });
    doc.y = y + 116;
  }

  private drawAuthorization(doc: PDFKit.PDFDocument): void {
    this.ensureSpace(doc, 72);
    const text =
      'El cliente autoriza la recepción del vehículo para inspección y diagnóstico inicial. Cualquier reparación, repuesto o trabajo adicional deberá ser informado y aprobado antes de su ejecución. El taller registra las condiciones visibles indicadas en esta orden.';
    const y = doc.y;
    const textHeight = doc.font(fontRegular).fontSize(8).heightOfString(text, { width: 495, lineGap: 2 });
    const height = Math.max(64, textHeight + 38);
    doc.roundedRect(36, y, 523, height, 7).fillAndStroke(soft, line);
    doc.fillColor(ink).font(fontBold).fontSize(8).text('CONSTANCIA Y AUTORIZACIÓN', 50, y + 10);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(
      text,
      50,
      y + 27,
      { width: 495, lineGap: 2 }
    );
    doc.y = y + height + 16;
  }

  private drawSignatures(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.ensureSpace(doc, 92);
    const y = doc.y + 34;
    doc.moveTo(60, y).lineTo(248, y).strokeColor(ink).lineWidth(1).stroke();
    doc.moveTo(348, y).lineTo(536, y).strokeColor(ink).lineWidth(1).stroke();
    doc.fillColor(ink).font(fontBold).fontSize(9).text(order.customerSignatureName || order.customer.displayName, 60, y + 8, { width: 188, align: 'center' });
    doc.fillColor(muted).font(fontRegular).fontSize(7).text('FIRMA CLIENTE', 60, y + 22, { width: 188, align: 'center' });
    doc.fillColor(ink).font(fontBold).fontSize(9).text(order.workshopSignatureName || order.assignedAdvisor?.displayName || 'MilMecanic Taller', 348, y + 8, { width: 188, align: 'center' });
    doc.fillColor(muted).font(fontRegular).fontSize(7).text('FIRMA TALLER', 348, y + 22, { width: 188, align: 'center' });
    doc.y = y + 42;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let index = 0; index < pageCount; index += 1) {
      doc.switchToPage(index);
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(`MilMecanic ERP · Documento generado ${formatDate(new Date())}`, 36, 792, {
        width: 260,
        lineBreak: false
      });
      doc.text(`Página ${index + 1} de ${pageCount}`, 470, 792, { width: 89, align: 'right', lineBreak: false });
    }
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.ensureSpace(doc, 24);
    doc.fillColor(teal).font(fontBold).fontSize(9).text(title.toUpperCase(), 36, doc.y, { characterSpacing: 0.6 });
    doc.moveTo(36, doc.y + 3).lineTo(559, doc.y + 3).strokeColor(line).lineWidth(0.7).stroke();
    doc.moveDown(0.8);
  }

  private infoGrid(doc: PDFKit.PDFDocument, values: Array<[string, string]>, columns: number): void {
    const gap = 8;
    const width = (523 - gap * (columns - 1)) / columns;
    const y = doc.y;
    values.forEach(([label, value], index) => {
      const x = 36 + (width + gap) * index;
      this.card(doc, x, y, width, 44);
      doc.fillColor(muted).font(fontBold).fontSize(6.5).text(label.toUpperCase(), x + 9, y + 9);
      doc.fillColor(ink).font(fontBold).fontSize(9).text(value, x + 9, y + 23, { width: width - 18, height: 12 });
    });
    doc.y = y + 56;
  }

  private card(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, title?: string): void {
    doc.roundedRect(x, y, width, height, 7).fillAndStroke('white', line);
    if (title) {
      doc.fillColor(ink).font(fontBold).fontSize(8).text(title.toUpperCase(), x + 14, y + 12, { width: width - 28 });
      doc.moveTo(x + 14, y + 25).lineTo(x + width - 14, y + 25).strokeColor(line).lineWidth(0.5).stroke();
    }
  }

  private keyValue(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value?: string | null): void {
    doc.fillColor(muted).font(fontRegular).fontSize(7).text(label, x, y, { width: 72 });
    doc.fillColor(ink).font(fontBold).fontSize(8).text(value || 'Sin registrar', x + 78, y, { width: 154 });
  }

  private textBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, title: string, value?: string | null): void {
    this.card(doc, x, y, width, 88);
    doc.fillColor(ink).font(fontBold).fontSize(8).text(title.toUpperCase(), x + 12, y + 11);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(value || 'Sin registrar', x + 12, y + 29, { width: width - 24, height: 48, lineGap: 2 });
  }

  private miniText(doc: PDFKit.PDFDocument, x: number, y: number, width: number, title: string, value?: string | null): void {
    this.card(doc, x, y, width, 58);
    doc.fillColor(ink).font(fontBold).fontSize(7).text(title.toUpperCase(), x + 10, y + 10);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(value || 'Sin registrar', x + 10, y + 25, { width: width - 20, height: 24 });
  }

  private tableHeader(doc: PDFKit.PDFDocument, y: number, headers: string[], widths: number[]): void {
    let x = 36;
    doc.rect(36, y, 523, 20).fill(teal);
    headers.forEach((header, index) => {
      doc.fillColor('white').font(fontBold).fontSize(7).text(header, x + 5, y + 7, { width: widths[index] - 10 });
      x += widths[index];
    });
  }

  private tableRow(doc: PDFKit.PDFDocument, y: number, values: string[], widths: number[], height: number): void {
    let x = 36;
    doc.rect(36, y, 523, height).strokeColor(line).lineWidth(0.5).stroke();
    values.forEach((value, index) => {
      doc.fillColor(index === 0 ? ink : muted).font(index === 0 ? fontBold : fontRegular).fontSize(7).text(value, x + 5, y + 7, {
        width: widths[index] - 10,
        height: height - 10
      });
      x += widths[index];
    });
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
    if (doc.y + height > doc.page.height - 74) doc.addPage();
  }
}

function formatDate(value?: Date | string | null): string {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
