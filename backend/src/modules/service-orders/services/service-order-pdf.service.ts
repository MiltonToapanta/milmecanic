import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ServiceDiagnosticResponse } from '../../service-diagnostics/repositories/service-diagnostics.repository';
import { ServiceDiagnosticsService } from '../../service-diagnostics/services/service-diagnostics.service';
import { QuotationsService } from '../../quotations/services/quotations.service';
import type { QuotationResponse } from '../../quotations/repositories/quotations.repository';
import type { ServiceOrderResponse } from '../repositories/service-orders.repository';
import { ServiceOrdersService } from './service-orders.service';

// ── Color palette ──────────────────────────────────────────────
const primary = '#0d9488';
const primaryDark = '#0f766e';
const primaryLight = '#ccfbf1';
const ink = '#1e293b';
const muted = '#64748b';
const line = '#e2e8f0';
const soft = '#f8fafc';
const white = '#ffffff';
const accent = '#f59e0b';
const danger = '#ef4444';
const success = '#22c55e';

const fontRegular = 'Roboto';
const fontBold = 'Roboto-Bold';

const statusColors: Record<string, string> = {
  RECEIVED: '#64748b', DIAGNOSIS: '#0891b2', WAITING_APPROVAL: '#d97706',
  APPROVED: '#4f46e5', IN_REPAIR: '#0284c7', QUALITY_CONTROL: '#52525b',
  READY_FOR_DELIVERY: '#059669', DELIVERED: '#16a34a', CANCELLED: '#dc2626'
};

const statusLabels: Record<string, string> = {
  RECEIVED: 'Recibido', DIAGNOSIS: 'Diagnóstico', WAITING_APPROVAL: 'Esperando aprobación',
  APPROVED: 'Aprobado', IN_REPAIR: 'En reparación', QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Listo', DELIVERED: 'Entregado', CANCELLED: 'Cancelado'
};

const fuelLabels: Record<string, string> = {
  EMPTY: 'Vacío', QUARTER: '1/4', HALF: '1/2', THREE_QUARTERS: '3/4', FULL: 'Lleno'
};

const categoryLabels: Record<string, string> = {
  ENGINE: 'Motor', BRAKES: 'Frenos', SUSPENSION: 'Suspensión', STEERING: 'Dirección',
  TRANSMISSION: 'Transmisión', ELECTRICAL: 'Sist. Eléctrico', BATTERY: 'Batería',
  TIRES: 'Neumáticos', COOLING: 'Refrigeración', EXHAUST: 'Escape',
  BODY: 'Carrocería', LIGHTS: 'Luces', FLUIDS: 'Fluidos', OTHER: 'Otros'
};

const diagnosticStatusLabels: Record<string, string> = {
  GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo', NOT_CHECKED: 'No revisado'
};

const severityLabels: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica'
};

@Injectable()
export class ServiceOrderPdfService {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly serviceDiagnosticsService: ServiceDiagnosticsService,
    private readonly quotationsService: QuotationsService
  ) {}

  async generate(serviceOrderId: string): Promise<Buffer> {
    const order = await this.serviceOrdersService.findById(serviceOrderId);
    const diagnostic = await this.serviceDiagnosticsService.findByServiceOrderId(serviceOrderId);
    let quotations: QuotationResponse[] = [];
    try {
      const result = await this.quotationsService.findByServiceOrderId(serviceOrderId, { page: 1, limit: 20 });
      quotations = result.items.filter((q) => q.status === 'APPROVED');
    } catch {
      // graceful degradation if quotations module not available
    }

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      this.registerFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      this.drawDocument(doc, order, diagnostic, quotations);
      doc.end();
    });
  }

  private registerFonts(doc: PDFKit.PDFDocument): void {
    const fontsDir = join(process.cwd(), 'node_modules', 'typeface-roboto', 'files');
    doc.registerFont(fontRegular, join(fontsDir, 'roboto-latin-400.woff'));
    doc.registerFont(fontBold, join(fontsDir, 'roboto-latin-700.woff'));
  }

  private drawDocument(doc: PDFKit.PDFDocument, order: ServiceOrderResponse, diagnostic: ServiceDiagnosticResponse | null, quotations: QuotationResponse[]): void {
    this.drawBanner(doc, order);
    this.drawStatusBar(doc, order);
    this.drawCustomerVehicleCards(doc, order);
    this.drawRequestDiagnosis(doc, order);
    this.drawReception(doc, order);
    if (diagnostic) this.drawDiagnostic(doc, diagnostic);
    if (quotations.length > 0) this.drawQuotations(doc, quotations);
    this.drawPhotos(doc, order);
    this.drawTerms(doc);
    this.drawSignatures(doc, order);
    this.drawFooter(doc);
  }

  // ═════════════════════════════════════════════════════════════
  // BANNER
  // ═════════════════════════════════════════════════════════════

  private drawBanner(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    const top = doc.y;
    doc.rect(0, top, doc.page.width, 120).fill(primaryDark);
    doc.rect(0, top + 120, doc.page.width, 3).fill(primary);

    doc.circle(66, top + 60, 28).fill(primary);
    doc.fillColor(white).font(fontBold).fontSize(24).text('MM', 42, top + 44, { width: 48, align: 'center' });

    doc.fillColor(white).font(fontBold).fontSize(11).text('MILMECANIC TALLER', 110, top + 22, { characterSpacing: 1.8 });
    doc.fillColor(primaryLight).font(fontRegular).fontSize(8).text('Gestión inteligente para talleres', 110, top + 38);
    doc.fillColor(white).font(fontBold).fontSize(28).text('Orden de Servicio', 110, top + 56);

    doc.roundedRect(400, top + 28, 155, 64, 8).fill(white);
    doc.fillColor(muted).font(fontBold).fontSize(7).text('ORDEN N°', 418, top + 36, { characterSpacing: 1.5 });
    doc.fillColor(ink).font(fontBold).fontSize(20).text(order.orderNumber, 418, top + 48);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(formatShort(order.createdAt), 418, top + 72);

    doc.y = top + 140;
  }

  // ═════════════════════════════════════════════════════════════
  // STATUS BAR
  // ═════════════════════════════════════════════════════════════

  private drawStatusBar(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    const y = doc.y + 8;
    const items: Array<{ label: string; value: string }> = [
      { label: 'Estado', value: statusLabels[order.status] },
      { label: 'Asesor', value: order.assignedAdvisor?.displayName ?? '—' },
      { label: 'Mecánico', value: order.assignedMechanic?.displayName ?? '—' },
      { label: 'Entrega est.', value: formatShort(order.estimatedDeliveryAt) }
    ];

    const cardW = 123;
    items.forEach((item, i) => {
      const x = 40 + i * (cardW + 8);
      doc.roundedRect(x, y, cardW, 56, 6).fillAndStroke(soft, line);
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(item.label.toUpperCase(), x + 10, y + 8);
      if (i === 0) {
        doc.circle(x + 10, y + 34, 4).fill(statusColors[order.status] || muted);
        doc.fillColor(ink).font(fontBold).fontSize(11).text(item.value, x + 20, y + 26);
      } else {
        doc.fillColor(ink).font(fontBold).fontSize(11).text(item.value, x + 10, y + 26);
      }
    });

    doc.y = y + 72;
  }

  // ═════════════════════════════════════════════════════════════
  // CUSTOMER & VEHICLE
  // ═════════════════════════════════════════════════════════════

  private drawCustomerVehicleCards(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.sectionTitle(doc, 'Cliente y Vehículo');
    const y = doc.y;
    const cardH = 80;

    doc.roundedRect(40, y, 250, cardH, 8).fillAndStroke(white, line);
    doc.rect(40, y, 4, cardH).fill(primary);
    doc.fillColor(primary).font(fontBold).fontSize(8).text('CLIENTE', 56, y + 12);
    doc.fillColor(ink).font(fontBold).fontSize(12).text(order.customer.displayName, 56, y + 26, { width: 220 });
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(`ID: ${order.customer.identification}`, 56, y + 46);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(`Firma: ${order.customerSignatureName || order.customer.displayName}`, 56, y + 60);

    doc.roundedRect(305, y, 250, cardH, 8).fillAndStroke(white, line);
    doc.rect(305, y, 4, cardH).fill(primary);
    doc.fillColor(primary).font(fontBold).fontSize(8).text('VEHÍCULO', 321, y + 12);
    doc.fillColor(ink).font(fontBold).fontSize(12).text(`${order.vehicle.plate} · ${order.vehicle.displayName}`, 321, y + 26, { width: 220 });
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(`Km: ${order.reportedMileage.toLocaleString('es-EC')} · ${fuelLabels[order.fuelLevel]}`, 321, y + 46);
    doc.fillColor(muted).font(fontRegular).fontSize(8).text(`Notas: ${order.internalNotes || 'Sin notas'}`, 321, y + 60);

    doc.y = y + cardH + 24;
  }

  // ═════════════════════════════════════════════════════════════
  // REQUEST & DIAGNOSIS
  // ═════════════════════════════════════════════════════════════

  private drawRequestDiagnosis(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.sectionTitle(doc, 'Solicitud y Diagnóstico Inicial');
    const y = doc.y;

    doc.roundedRect(40, y, 250, 90, 8).fillAndStroke(soft, line);
    doc.fillColor(ink).font(fontBold).fontSize(9).text('SOLICITUD DEL CLIENTE', 52, y + 12);
    doc.fillColor(muted).font(fontRegular).fontSize(9).text(order.customerRequest || 'Sin registrar', 52, y + 28, { width: 226, height: 52 });

    doc.roundedRect(305, y, 250, 90, 8).fillAndStroke(soft, line);
    doc.fillColor(ink).font(fontBold).fontSize(9).text('DIAGNÓSTICO INICIAL', 317, y + 12);
    doc.fillColor(muted).font(fontRegular).fontSize(9).text(order.initialDiagnosis || 'Pendiente', 317, y + 28, { width: 226, height: 52 });

    doc.y = y + 106;
  }

  // ═════════════════════════════════════════════════════════════
  // RECEPTION
  // ═════════════════════════════════════════════════════════════

  private drawReception(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.sectionTitle(doc, 'Condición de Recepción');
    const y = doc.y;
    const cardW = 166;

    const items: Array<{ title: string; value: string | null }> = [
      { title: 'EXTERIOR', value: order.exteriorCondition },
      { title: 'INTERIOR', value: order.interiorCondition },
      { title: 'ACCESORIOS', value: order.receivedAccessories }
    ];

    items.forEach((item, i) => {
      const x = 40 + i * (cardW + 10);
      doc.roundedRect(x, y, cardW, 70, 8).fillAndStroke(white, line);
      doc.fillColor(primary).font(fontBold).fontSize(7).text(item.title, x + 10, y + 10);
      doc.fillColor(muted).font(fontRegular).fontSize(8).text(item.value || 'Sin registrar', x + 10, y + 24, { width: cardW - 20, height: 38 });
    });

    doc.y = y + 86;
  }

  // ═════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ═════════════════════════════════════════════════════════════

  private drawDiagnostic(doc: PDFKit.PDFDocument, diagnostic: ServiceDiagnosticResponse): void {
    this.sectionTitle(doc, 'Diagnóstico Técnico');
    const items = diagnostic.items;

    const y = doc.y;
    const bad = items.filter((i) => i.status === 'BAD').length;
    const critical = items.filter((i) => i.severity === 'CRITICAL').length;
    const chips: Array<{ label: string; value: string; color: string }> = [
      { label: 'Estado', value: diagnostic.completedAt ? 'Completado' : 'Edición', color: diagnostic.completedAt ? success : accent },
      { label: 'Ítems', value: String(items.length), color: primary },
      { label: 'Fallas', value: String(bad), color: bad > 0 ? danger : muted },
      { label: 'Críticos', value: String(critical), color: critical > 0 ? danger : muted }
    ];
    chips.forEach((chip, i) => {
      const x = 40 + i * 131;
      doc.roundedRect(x, y, 123, 40, 6).fillAndStroke(white, line);
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(chip.label.toUpperCase(), x + 10, y + 8);
      doc.fillColor(chip.color).font(fontBold).fontSize(14).text(chip.value, x + 10, y + 20);
    });
    doc.y = y + 52;

    if (diagnostic.generalObservation || diagnostic.recommendation) {
      const oY = doc.y + 4;
      doc.roundedRect(40, oY, 250, 70, 8).fillAndStroke(soft, line);
      doc.fillColor(ink).font(fontBold).fontSize(8).text('OBSERVACIÓN', 52, oY + 10);
      doc.fillColor(muted).font(fontRegular).fontSize(8).text(diagnostic.generalObservation || '—', 52, oY + 24, { width: 226, height: 38 });

      doc.roundedRect(305, oY, 250, 70, 8).fillAndStroke(soft, line);
      doc.fillColor(ink).font(fontBold).fontSize(8).text('RECOMENDACIÓN', 317, oY + 10);
      doc.fillColor(muted).font(fontRegular).fontSize(8).text(diagnostic.recommendation || '—', 317, oY + 24, { width: 226, height: 38 });
      doc.y = oY + 82;
    }

    this.ensureSpace(doc, 60);
    const tableTop = doc.y + 4;
    const colW = [80, 130, 65, 58, 190];
    this.tableHeader(doc, tableTop, ['Categoría', 'Elemento', 'Estado', 'Severidad', 'Observación'], colW);
    let rowY = tableTop + 22;
    for (const item of items) {
      const rowH = Math.max(24, doc.font(fontRegular).fontSize(7).heightOfString(item.observation || 'Sin observación', { width: colW[4] - 10 }) + 14);
      if (rowY + rowH > doc.page.height - 80) { doc.addPage(); rowY = 42; this.tableHeader(doc, rowY, ['Categoría', 'Elemento', 'Estado', 'Severidad', 'Observación'], colW); rowY += 22; }
      const bgColor = item.severity === 'CRITICAL' ? '#fef2f2' : item.status === 'BAD' ? '#fffbeb' : white;
      doc.rect(40, rowY, 515, rowH).fill(bgColor);
      this.tableRow(doc, rowY, [categoryLabels[item.category] || item.category, item.itemName, diagnosticStatusLabels[item.status] || item.status, item.severity ? severityLabels[item.severity] : '—', item.observation || 'Sin observación'], colW, rowH);
      rowY += rowH;
    }
    doc.y = rowY + 16;
  }

  // ═════════════════════════════════════════════════════════════
  // QUOTATIONS
  // ═════════════════════════════════════════════════════════════

  private drawQuotations(doc: PDFKit.PDFDocument, quotations: QuotationResponse[]): void {
    this.sectionTitle(doc, 'Cotizaciones Aprobadas');

    quotations.forEach((q, qi) => {
      const qY = qi === 0 ? doc.y : doc.y + 8;
      this.ensureSpace(doc, 80);

      doc.roundedRect(40, qY, 515, 30, 6).fillAndStroke(primaryDark, primaryDark);
      doc.fillColor(white).font(fontBold).fontSize(10).text(q.quotationNumber, 56, qY + 9);
      doc.fillColor(primaryLight).font(fontRegular).fontSize(8).text(`Aprobada: ${formatShort(q.approvedAt)}`, 200, qY + 10);
      doc.fillColor(white).font(fontBold).fontSize(14).text(`$ ${q.total.toFixed(2)}`, 430, qY + 8, { width: 115, align: 'right' });

      const iY = qY + 34;
      const colW = [100, 155, 60, 65, 55, 80];
      doc.rect(40, iY, 515, 18).fill(primaryLight);
      ['Tipo', 'Descripción', 'Cant.', 'P. Unit.', 'Desc.', 'Total'].forEach((h, hi) => {
        let x = 40;
        for (let j = 0; j < hi; j++) x += colW[j];
        doc.fillColor(primaryDark).font(fontBold).fontSize(7).text(h, x + 5, iY + 5, { width: colW[hi] - 10 });
      });

      let itemY = iY + 18;
      q.items.forEach((item, ii) => {
        const bg = ii % 2 === 0 ? white : soft;
        doc.rect(40, itemY, 515, 18).fill(bg);
        const cells = [itemTypeLabel(item.itemType), item.description, String(item.quantity), `$ ${item.unitPrice.toFixed(2)}`, `$ ${item.discount.toFixed(2)}`, `$ ${item.total.toFixed(2)}`];
        let cx = 40;
        cells.forEach((cell, ci) => {
          doc.fillColor(ci === 0 ? ink : muted).font(ci === 0 ? fontBold : fontRegular).fontSize(7).text(cell, cx + 5, itemY + 5, { width: colW[ci] - 10 });
          cx += colW[ci];
        });
        itemY += 18;
      });

      doc.rect(40, itemY, 515, 1).fill(line);
      itemY += 4;
      const totals: Array<{ label: string; value: string; bold?: boolean; color?: string }> = [
        { label: 'Subtotal', value: `$ ${q.subtotal.toFixed(2)}` },
        { label: 'Descuento', value: `- $ ${q.discount.toFixed(2)}`, color: danger },
        { label: 'IVA', value: `$ ${q.tax.toFixed(2)}` },
        { label: 'TOTAL', value: `$ ${q.total.toFixed(2)}`, bold: true }
      ];
      totals.forEach((t) => {
        doc.fillColor(t.color || ink).font(t.bold ? fontBold : fontRegular).fontSize(8).text(t.label, 300, itemY, { width: 80, align: 'right' });
        doc.font(t.bold ? fontBold : fontRegular).fontSize(t.bold ? 11 : 8).text(t.value, 385, itemY - (t.bold ? 1 : 0), { width: 160, align: 'right' });
        itemY += 14;
      });

      doc.y = itemY + 4;
    });

    doc.y += 8;
  }

  // ═════════════════════════════════════════════════════════════
  // PHOTOS
  // ═════════════════════════════════════════════════════════════

  private drawPhotos(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    if (order.photos.length === 0) return;
    this.ensureSpace(doc, 110);
    this.sectionTitle(doc, 'Evidencia Fotográfica');
    let x = 40;
    let y = doc.y;
    const width = 120;
    const height = 90;

    order.photos.slice(0, 8).forEach((photo, index) => {
      if (x + width > 555) { x = 40; y += 120; }
      if (y + 110 > doc.page.height - 74) { doc.addPage(); x = 40; y = 42; }

      doc.roundedRect(x, y, width, height, 8).fillAndStroke(soft, line);
      const filePath = join(process.cwd(), 'uploads', 'service-orders', order.id, photo.fileName);
      if (existsSync(filePath)) {
        doc.image(filePath, x + 5, y + 5, { width: width - 10, height: 55, fit: [width - 10, 55], align: 'center', valign: 'center' });
      } else {
        doc.fillColor(muted).font(fontRegular).fontSize(8).text('Sin imagen', x + 8, y + 28, { width: width - 16, align: 'center' });
      }
      doc.fillColor(ink).font(fontBold).fontSize(7).text(`Foto ${index + 1}`, x + 8, y + 64);
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(photo.caption || photo.originalName, x + 8, y + 74, { width: width - 16 });

      x += width + 10;
    });
    doc.y = y + 110;
  }

  // ═════════════════════════════════════════════════════════════
  // TERMS
  // ═════════════════════════════════════════════════════════════

  private drawTerms(doc: PDFKit.PDFDocument): void {
    this.ensureSpace(doc, 110);
    const clauses = [
      'El cliente autoriza la recepción del vehículo para inspección, diagnóstico inicial y pruebas necesarias.',
      'Ninguna reparación, repuesto o trabajo adicional debe ejecutarse sin aprobación previa del cliente.',
      'La condición exterior, interior, accesorios y adjuntos se registran según inspección visual al momento de recepción.',
      'El cliente declara haber retirado objetos personales de valor o haberlos informado expresamente al asesor.',
      'Las fechas de entrega son estimadas y pueden variar por diagnóstico, disponibilidad de repuestos o aprobación.',
      'Las fotografías y observaciones forman parte del respaldo de recepción, diagnóstico y seguimiento de la orden.'
    ];

    const y = doc.y;
    const text = clauses.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const textH = doc.font(fontRegular).fontSize(7.5).heightOfString(text, { width: 495, lineGap: 2 });
    const boxH = Math.max(100, textH + 40);

    doc.roundedRect(40, y, 515, boxH, 8).fillAndStroke('#f0fdfa', primary);
    doc.rect(40, y, 515, 28).fill(primary);
    doc.fillColor(white).font(fontBold).fontSize(9).text('TÉRMINOS Y AUTORIZACIÓN', 56, y + 8);
    doc.fillColor(ink).font(fontRegular).fontSize(8).text(text, 56, y + 36, { width: 483, lineGap: 2 });
    doc.y = y + boxH + 16;
  }

  // ═════════════════════════════════════════════════════════════
  // SIGNATURES
  // ═════════════════════════════════════════════════════════════

  private drawSignatures(doc: PDFKit.PDFDocument, order: ServiceOrderResponse): void {
    this.ensureSpace(doc, 90);
    const y = doc.y + 30;

    doc.moveTo(80, y).lineTo(284, y).strokeColor(ink).lineWidth(1.2).stroke();
    doc.fillColor(ink).font(fontBold).fontSize(10).text(order.customerSignatureName || order.customer.displayName, 80, y + 10, { width: 204, align: 'center' });
    doc.fillColor(muted).font(fontRegular).fontSize(8).text('Firma del Cliente', 80, y + 24, { width: 204, align: 'center' });

    doc.roundedRect(304, y - 8, 80, 60, 8).stroke(primary);
    doc.fillColor(primary).font(fontBold).fontSize(7).text('DOCUMENTO', 310, y + 4, { width: 68, align: 'center' });
    doc.fontSize(7).text('GENERADO POR', 310, y + 14, { width: 68, align: 'center' });
    doc.fontSize(9).text('MILMECANIC', 310, y + 24, { width: 68, align: 'center' });
    doc.fillColor(muted).font(fontRegular).fontSize(6).text(formatShort(new Date()), 310, y + 36, { width: 68, align: 'center' });

    doc.moveTo(410, y).lineTo(555, y).strokeColor(ink).lineWidth(1.2).stroke();
    doc.fillColor(ink).font(fontBold).fontSize(10).text(order.workshopSignatureName || order.assignedAdvisor?.displayName || 'MilMecanic Taller', 410, y + 10, { width: 145, align: 'center' });
    doc.fillColor(muted).font(fontRegular).fontSize(8).text('Firma del Taller', 410, y + 24, { width: 145, align: 'center' });

    doc.y = y + 56;
  }

  // ═════════════════════════════════════════════════════════════
  // FOOTER
  // ═════════════════════════════════════════════════════════════

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.moveTo(40, 778).lineTo(555, 778).strokeColor(line).lineWidth(0.5).stroke();
      doc.fillColor(muted).font(fontRegular).fontSize(7).text(`MilMecanic ERP · ${formatShort(new Date())}`, 40, 784, { width: 250 });
      doc.text(`Pág. ${i + 1} / ${pageCount}`, 460, 784, { width: 95, align: 'right' });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ═════════════════════════════════════════════════════════════

  private sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.ensureSpace(doc, 28);
    doc.fillColor(primary).font(fontBold).fontSize(9).text(title.toUpperCase(), 40, doc.y, { characterSpacing: 0.8 });
    doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).strokeColor(primary).lineWidth(0.8).stroke();
    doc.rect(40, doc.y + 4, 80, 2).fill(primary);
    doc.moveDown(0.6);
  }

  private tableHeader(doc: PDFKit.PDFDocument, y: number, headers: string[], widths: number[]): void {
    let x = 40;
    doc.rect(40, y, 515, 22).fill(primaryDark);
    headers.forEach((h, i) => {
      doc.fillColor(white).font(fontBold).fontSize(7).text(h, x + 6, y + 7, { width: widths[i] - 12 });
      x += widths[i];
    });
  }

  private tableRow(doc: PDFKit.PDFDocument, y: number, values: string[], widths: number[], height: number): void {
    let x = 40;
    values.forEach((v, i) => {
      doc.fillColor(i === 0 ? ink : muted).font(i === 0 ? fontBold : fontRegular).fontSize(7).text(v, x + 6, y + 6, { width: widths[i] - 12, height: height - 10 });
      x += widths[i];
    });
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
    if (doc.y + height > doc.page.height - 80) doc.addPage();
  }
}

function itemTypeLabel(type: string): string {
  const map: Record<string, string> = { LABOR: 'Mano de obra', PART: 'Repuesto', SUPPLY: 'Insumo', OTHER: 'Otro' };
  return map[type] || type;
}

function formatShort(value?: Date | string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(new Date(value));
}
